import { _electron as electron } from '@playwright/test';
import {mkdir,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {PDFDocument} from 'pdf-lib';
const out=resolve(process.env.PAGEONE_TEST_OUT||'test-results');await mkdir(out,{recursive:true});
async function waitForFile(name){for(let i=0;i<800;i++){try{const bytes=await readFile(resolve(out,name));if(bytes.length>0)return bytes;}catch{}await new Promise(resolve=>setTimeout(resolve,150));}throw new Error('Missing export: '+name);}
const app=await electron.launch({executablePath:process.env.PAGEONE_EXE||undefined,args:process.env.PAGEONE_EXE?[]:['.'],env:{...process.env,PAGEONE_TEST_DATA:resolve(`test-results/smoke-${Date.now()}`)}});
try{
  const page=await app.firstWindow();
  page.on('pageerror',error=>console.log('PAGE ERROR',error.message));
  page.on('console',msg=>{if(msg.type()==='error')console.log('CONSOLE',msg.text());});
  await page.getByText('한 문장씩, 한 권의 책으로.').waitFor();
  await page.getByText('최신 원고 반영됨').waitFor({timeout:60000});
  const frame=page.frames().find(f=>f.url().includes('preview.html'));
  console.log('LAYOUT',await frame.evaluate(()=>window.__pageoneResult));
  await page.screenshot({path:resolve(out,'studio.png'),fullPage:true});
  await page.getByRole('textbox',{name:'장 제목',exact:true}).fill('검증한 첫 번째 장');
  await page.getByText('최신 원고 반영됨').waitFor({timeout:60000});
  await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},resolve(out,'body.pdf'));
  await page.getByRole('button',{name:'출판 파일 만들기 ↗'}).click();
  await page.getByRole('button',{name:/종이책 본문/}).click();
  await page.getByText(/쪽 PDF를 저장했습니다/).waitFor({timeout:120000});
  const pdf=await PDFDocument.load(await readFile(resolve(out,'body.pdf')));
  console.log('PDF',pdf.getPageCount(),pdf.getPages()[0].getSize());
  await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},resolve(out,'cover.pdf'));
  await page.getByRole('button',{name:/표지 전개도/}).click();
  await page.getByText('1쪽 PDF를 저장했습니다.').waitFor({timeout:120000});
  console.log('COVER PDF', (await PDFDocument.load(await readFile(resolve(out,'cover.pdf')))).getPageCount());
  await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},resolve(out,'book.epub'));
  await page.getByRole('button',{name:/EPUB 전자책/}).click();
  await page.getByText(/EPUB 파일을 생성했습니다/).waitFor({timeout:120000}).catch(async e=>{console.log(await page.locator('.toast').allTextContents());throw e;});
  await page.screenshot({path:resolve(out,'export.png'),fullPage:true});
  console.log('EPUB bytes',(await readFile(resolve(out,'book.epub'))).length);
  await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},resolve(out,'ebook.pdf'));
  await page.getByRole('button',{name:/전자책 PDF/}).click();await waitForFile('ebook.pdf');
  await page.getByRole('button',{name:/원고 · 조판/}).click();
  await page.locator('.field').filter({has:page.getByText('제목 · 소제목 글꼴',{exact:true})}).locator('select').selectOption('nanumSans');
  await page.locator('.field').filter({has:page.getByText('본문 글꼴',{exact:true})}).locator('select').selectOption('nanumSerif');
  await page.waitForTimeout(1000);await page.getByText('최신 원고 반영됨').waitFor({timeout:60000});
  await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},resolve(out,'nanum.pdf'));
  await page.getByRole('button',{name:'출판 파일 만들기 ↗'}).click();await page.getByRole('button',{name:/종이책 본문/}).click();await waitForFile('nanum.pdf');
  await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},resolve(out,'nanum.epub'));
  await page.getByRole('button',{name:/EPUB 전자책/}).click();await waitForFile('nanum.epub');
  await app.evaluate(({dialog},filePath)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath});},resolve(out,'sample.pageone'));
  await page.getByRole('button',{name:'프로젝트 저장',exact:true}).click();await page.getByText('프로젝트 파일을 저장했습니다.').waitFor({timeout:60000});
  await waitForFile('sample.pageone');console.log('EBOOK PDF, NANUM PDF/EPUB, PROJECT exports passed');

}finally{await app.close();}
