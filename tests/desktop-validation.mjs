import {_electron as electron} from '@playwright/test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createBook,uid} from '../src/book.mjs';
import JSZip from 'jszip';
const out=resolve('test-results');await mkdir(out,{recursive:true});
const profile=resolve(out,`validation-${Date.now()}`);
let app=await electron.launch({executablePath:process.env.PAGEONE_EXE||undefined,args:process.env.PAGEONE_EXE?[]:['.'],env:{...process.env,PAGEONE_TEST_DATA:profile}});
try{
  let page=await app.firstWindow();page.on('console',m=>{if(m.type()==='error')console.log(m.text())});page.on('pageerror',e=>console.log(e.message));await page.getByText('최신 원고 반영됨').waitFor({timeout:60000});
  await page.getByRole('button',{name:/전자책 미리보기/}).click();
  await page.getByText('실제 EPUB 파일로 미리보는 중').waitFor({timeout:120000}).catch(async e=>{console.log(await page.locator('.ebook-note').allTextContents());throw e;});
  await page.screenshot({path:resolve(out,'epub-reader.png')});console.log('EPUBJS reader rendered');
  await page.getByRole('button',{name:/원고 · 조판/}).click();
  await page.getByRole('textbox',{name:'장 제목',exact:true}).fill('재실행 보존 검증');
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].close());
  await new Promise(resolve=>setTimeout(resolve,700));
  await app.close().catch(()=>{});
  app=await electron.launch({executablePath:process.env.PAGEONE_EXE||undefined,args:process.env.PAGEONE_EXE?[]:['.'],env:{...process.env,PAGEONE_TEST_DATA:profile}});
  page=await app.firstWindow();await page.getByRole('textbox',{name:'장 제목',exact:true}).waitFor();
  await page.waitForFunction(()=>document.querySelector('[aria-label="장 제목"]')?.value==='재실행 보존 검증');console.log('RESTART immediate-close persistence passed');
  await page.getByText('최신 원고 반영됨').waitFor({timeout:60000});
  const restoredFrame=page.frames().find(f=>f.url().includes('preview.html'));
  assert.ok((await restoredFrame.locator('#pages').textContent()).includes('재실행 보존 검증'));
  console.log('RESTART preview matches saved manuscript');
  const zip=new JSZip();
  zip.file('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>워드 원고 실제 가져오기 검증</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>표의 첫 칸</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>');
  await writeFile(resolve(out,'검증원고.docx'),await zip.generateAsync({type:'uint8array'}));
  await page.locator('input[accept=".docx,.hwpx,.hwp,.idml,.indd,.txt"]').setInputFiles(resolve(out,'검증원고.docx'));
  await page.getByText('원고를 확인해 주세요').waitFor();await page.getByRole('button',{name:'새 책으로 가져오기'}).click();
  await page.getByRole('textbox',{name:'본문 원고'}).getByText('워드 원고 실제 가져오기 검증').waitFor();
  assert.equal(await page.getByRole('textbox',{name:'본문 원고'}).locator('table').count(),1);console.log('DOCX import UI passed');
  // Independent preview window exercises the same production pagination module at large sizes.
  const previewWindow=await app.evaluateHandle(({BrowserWindow})=>{const win=new BrowserWindow({show:false,webPreferences:{backgroundThrottling:false,contextIsolation:true,nodeIntegration:false,sandbox:true}});win.loadURL('pageone://studio/preview.html');return win;});
  const preview=await app.waitForEvent('window');await preview.waitForLoadState();
  const results=[];
  for(const target of [10,100,300]){
    await preview.reload();const book=createBook();book.print.toc=false;book.print.rightStart=false;
    book.chapters=Array.from({length:target-2},(_,i)=>({id:uid(),title:`검증 ${i+1}`,html:`<p>검증문단-${i+1} 한글 문장이 빠짐없이 보여야 합니다.</p>`}));
    const start=Date.now();
    await preview.evaluate(book=>window.postMessage({type:'pageone-render',book,revision:1},'*'),book);
    await preview.waitForFunction(()=>window.__pageoneResult,undefined,{timeout:120000});
    const result=await preview.evaluate(()=>({result:window.__pageoneResult,text:document.querySelector('#pages').textContent}));
    assert.equal(result.result.error,undefined);assert.equal(result.result.pageCount,target);
    for(let i=1;i<=target-2;i++)assert.ok(result.text.includes(`검증문단-${i} `));
    results.push({pages:target,elapsedMs:Date.now()-start});console.log('LAYOUT SCALE',results.at(-1));
    if(target===300){const pdf=await previewWindow.evaluate(win=>win.webContents.printToPDF({printBackground:true,preferCSSPageSize:true}));await writeFile(resolve(out,'long-300.pdf'),Buffer.from(pdf));}
  }
  await previewWindow.evaluate(win=>win.destroy());
  await writeFile(resolve(out,'validation.json'),JSON.stringify({restart:true,docx:true,epubReader:true,scale:results},null,2));
}finally{await app.close();}
