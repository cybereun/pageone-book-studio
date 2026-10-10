import {_electron as electron} from '@playwright/test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {createBook,uid} from '../src/book.mjs';
import {packProject} from '../src/export.mjs';
const out=resolve('test-results/thumbnails');await mkdir(out,{recursive:true});
const app=await electron.launch({executablePath:process.env.PAGEONE_EXE||undefined,args:process.env.PAGEONE_EXE?[]:['.'],env:{...process.env,PAGEONE_DISABLE_UPDATES:'1',PAGEONE_TEST_DATA:resolve(out,`profile-${Date.now()}`)}});
try{
 const page=await app.firstWindow();await page.getByRole('button',{name:'1쪽 미리보기로 이동'}).waitFor({timeout:60000});assert.ok(await page.locator('.page-thumbnail').count()<=7);
 const miniature=page.frames().find(frame=>frame.name()===''&&frame.url()==='about:srcdoc');assert.ok(miniature);await miniature.locator('.pagedjs_page').waitFor();assert.ok((await miniature.locator('body').textContent()).includes('작은 날들의 기록'));
 await page.getByRole('button',{name:'3쪽 미리보기로 이동'}).click();await page.waitForFunction(()=>document.querySelector('[aria-label="3쪽 미리보기로 이동"]')?.getAttribute('aria-current')==='page');
 const preview=page.frames().find(frame=>frame.url().includes('preview.html'));await preview.waitForFunction(()=>Math.abs(document.querySelectorAll('.pagedjs_page')[2].getBoundingClientRect().top)<40);
 await page.screenshot({path:resolve(out,'pages.png')});
 await page.getByRole('button',{name:'장 목록',exact:true}).click();await page.getByRole('button',{name:'＋ 새 장 추가'}).waitFor();await page.getByRole('button',{name:'목차 넣기 · 편집',exact:true}).click();await page.getByRole('textbox',{name:'목차 페이지 제목'}).waitFor();
 console.log('THUMBNAILS real page content, bounded iframe count, page navigation and retained TOC shortcut passed');
 if(process.env.PAGEONE_THUMBNAIL_SCALE){
  for(const total of [100,300]){const book=createBook();book.print.toc=false;book.print.rightStart=false;book.chapters=Array.from({length:total-2},(_,i)=>({id:uid(),title:`썸네일 검사 ${i+1}`,html:`<p>문단 ${i+1}</p>`}));const file=resolve(out,`book-${total}.pageone`);await writeFile(file,await packProject(book));const start=Date.now();await page.locator('input[accept=".pageone,.json"]').setInputFiles(file);await page.getByRole('button',{name:'페이지',exact:true}).click();await page.waitForFunction(total=>document.querySelector('.thumbnail-status')?.textContent.includes(`/ ${total}쪽`),total,{timeout:90000});assert.ok(await page.locator('.page-thumbnail').count()<=7);await page.locator('.page-thumbnail-list').evaluate(el=>{el.scrollTop=el.scrollHeight;});await page.getByRole('button',{name:`${total}쪽 미리보기로 이동`,exact:true}).click();console.log('THUMBNAIL SCALE',total,'pages',Date.now()-start,'ms');}
 }
}finally{await app.close();}
