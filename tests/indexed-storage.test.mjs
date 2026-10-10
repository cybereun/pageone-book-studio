import test from 'node:test';
import assert from 'node:assert/strict';
import {saveLocal,listLocal} from '../src/storage.mjs';
function database(tx){let closed=0;globalThis.indexedDB={open(){const request={};queueMicrotask(()=>{request.result={transaction(){return tx;},close(){closed++;}};request.onsuccess();});return request;}};return()=>closed;}
test('failed synchronous put closes database and preserves error',async()=>{
  const error=new Error('clone failed');const closed=database({objectStore:()=>({put(){throw error;}})});
  try{await assert.rejects(saveLocal({id:'book'}),e=>e===error);assert.equal(closed(),1);}finally{delete globalThis.indexedDB;}
});
test('aborted save rejects instead of leaving autosave pending',async()=>{
  const tx={error:new Error('transaction aborted'),objectStore:()=>({put(){queueMicrotask(()=>tx.onabort());}})};const closed=database(tx);
  try{await assert.rejects(saveLocal({id:'book'}),/transaction aborted/);assert.equal(closed(),1);}finally{delete globalThis.indexedDB;}
});
test('failed bookshelf read closes database',async()=>{
  const error=new Error('read failed');const closed=database({objectStore:()=>({getAll(){const request={error};queueMicrotask(()=>request.onerror());return request;}})});
  try{await assert.rejects(listLocal(),e=>e===error);assert.equal(closed(),1);}finally{delete globalThis.indexedDB;}
});
