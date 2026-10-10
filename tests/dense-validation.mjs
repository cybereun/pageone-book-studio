import {_electron as electron} from '@playwright/test';
import {createBook} from '../src/book.mjs';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {writeFile} from 'node:fs/promises';
const app=await electron.launch({executablePath:process.env.PAGEONE_EXE||undefined,args:process.env.PAGEONE_EXE?[]:['.'],env:{...process.env,PAGEONE_TEST_DATA:resolve('test-results/dense-profile')}});
try{
 const page=await app.firstWindow();await page.goto('pageone://studio/preview.html');
 const results=[];
 for(const count of [500,1500]){
  await page.reload();const book=createBook();book.print.toc=false;book.print.rightStart=false;
  book.chapters[0].html=Array.from({length:count},(_,i)=>`<p>문단${i}시작 ${'작은 기록은 한 권의 책이 됩니다. 긴 원고를 편집해도 문장과 문단이 빠지지 않아야 합니다. '.repeat(8)} 문단${i}끝</p>`).join('');
  const start=Date.now();await page.evaluate(book=>window.postMessage({type:'pageone-render',book,revision:1},'*'),book);await page.waitForFunction(()=>window.__pageoneResult,undefined,{timeout:120000});
  const state=await page.evaluate(()=>({result:window.__pageoneResult,text:document.getElementById('pages').textContent,overflow:[...document.querySelectorAll('.pagedjs_page_content')].filter(n=>n.scrollHeight>n.clientHeight+4||n.scrollWidth>n.clientWidth+4).length}));
  assert.ok(!state.result.error);for(let i=0;i<count;i++){assert.ok(state.text.includes(`문단${i}시작`));assert.ok(state.text.includes(`문단${i}끝`));}assert.equal(state.overflow,0);
  const result={paragraphs:count,pages:state.result.pageCount,elapsedMs:Date.now()-start,overflow:state.overflow};results.push(result);console.log(result);
 }
 await writeFile('test-results/dense-validation.json',JSON.stringify(results,null,2));
}finally{await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().forEach(win=>win.destroy()));await app.close().catch(()=>{});}
