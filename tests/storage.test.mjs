import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,readFile,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { atomicSave } from '../desktop/storage.cjs';
test('atomic save preserves previous file as recovery backup',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'pageone-storage-'));
  try {const path=join(dir,'한글.pageone');await writeFile(path,'old');await atomicSave(path,Buffer.from('new'));assert.equal(await readFile(path,'utf8'),'new');assert.equal(await readFile(path+'.bak','utf8'),'old');}finally{await rm(dir,{recursive:true,force:true});}
});
