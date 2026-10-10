import {_electron as electron} from '@playwright/test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const out=resolve('test-results/update');await mkdir(out,{recursive:true});
const profile=resolve(out,`profile-${Date.now()}`);await writeFile(resolve(out,'profile-path.txt'),profile);
const app=await electron.launch({executablePath:process.env.PAGEONE_EXE,args:[],env:{...process.env,PAGEONE_TEST_DATA:profile,PAGEONE_DISABLE_UPDATES:''}});
let closed=false;
try{
  const page=await app.firstWindow();console.log('UPDATE FROM',await app.evaluate(({app})=>app.getVersion()));
  await page.getByRole('textbox',{name:'장 제목',exact:true}).fill('업데이트 후 보존할 원고');
  await page.getByRole('dialog',{name:'앱 업데이트'}).waitFor({timeout:60000});
  await page.getByText('새 버전이 준비되었습니다').waitFor();
  await page.screenshot({path:resolve(out,'available.png')});
  const close=app.waitForEvent('close',{timeout:180000});
  await page.getByRole('button',{name:'업데이트 설치',exact:true}).click();
  await close;closed=true;console.log('UPDATE download completed, manuscript saved, installer started');
  const log=await readFile(resolve(profile,'update.log'),'utf8');assert.match(log,/Update has already been downloaded|downloaded|install|quitAndInstall/i);
}finally{if(!closed)await app.close();}
