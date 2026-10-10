import {_electron as electron} from '@playwright/test';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import electronExecutable from 'electron';
const profile=resolve('test-results',`single-instance-${Date.now()}`);
const env={...process.env,PAGEONE_TEST_DATA:profile};
const app=await electron.launch({executablePath:process.env.PAGEONE_EXE||undefined,args:process.env.PAGEONE_EXE?[]:['.'],env});
try {
  const page=await app.firstWindow();await page.getByText('이 기기에 저장됨',{exact:true}).waitFor();
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].hide());
  const child=spawn(process.env.PAGEONE_EXE||electronExecutable,process.env.PAGEONE_EXE?[]:['.'],{env,stdio:'pipe'});
  const exit=await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{child.kill();reject(new Error('Duplicate app did not exit'));},15000);
    child.on('error',reject);child.on('exit',code=>{clearTimeout(timeout);resolve(code);});
  });
  assert.equal(exit,0);
  assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().length),1);
  assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].isVisible()),true);
  await page.getByRole('textbox',{name:'장 제목',exact:true}).fill('중복 실행 뒤 저장 검증');
  await page.getByText('이 기기에 저장됨',{exact:true}).waitFor();
  const saved=await page.evaluate(async()=>{
    const request=indexedDB.open('pageone-studio-v2',1);const db=await new Promise((r,j)=>{request.onsuccess=()=>r(request.result);request.onerror=()=>j(request.error);});
    try{return await new Promise((r,j)=>{const q=db.transaction('books').objectStore('books').getAll();q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error);});}finally{db.close();}
  });
  assert.ok(saved.some(book=>book.chapters.some(c=>c.title==='중복 실행 뒤 저장 검증')));
  console.log('SINGLE INSTANCE: duplicate exits, existing window restored, autosave persisted');
}finally{await app.close();}
