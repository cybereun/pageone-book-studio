import test from 'node:test';
import assert from 'node:assert/strict';
import CFB from 'cfb';
import {deflateRaw} from 'pako';
import {importHwp} from '../src/hwp.mjs';
function sample(flags=1){const cfb=CFB.utils.cfb_new();const header=Buffer.alloc(256);header.write('HWP Document File');header.writeUInt32LE(0x05000000,32);header.writeUInt32LE(flags,36);CFB.utils.cfb_add(cfb,'FileHeader',header);const text=Buffer.from('한글 본문\r','utf16le');const record=Buffer.alloc(4+text.length);record.writeUInt32LE((text.length<<20)|67);text.copy(record,4);CFB.utils.cfb_add(cfb,'BodyText/Section0',flags&1?Buffer.from(deflateRaw(record)):record);return CFB.write(cfb,{type:'buffer'});}
test('compressed HWP5 manuscript text is extracted',()=>{assert.match(importHwp(sample(),'테스트.hwp').chapters[0].html,/한글 본문/);});
test('encrypted HWP is rejected without reading body',()=>{assert.throws(()=>importHwp(sample(3),'보안.hwp'),/암호/);});

test('HWP accepts plain byte arrays returned by the browser CFB bundle',()=>{
 const original=CFB.read;
 CFB.read=(...args)=>{const parsed=original(...args);for(const entry of parsed.FileIndex)if(entry.content)entry.content=Array.from(entry.content);return parsed;};
 try{for(const flags of [1,0])assert.match(importHwp(sample(flags),'브라우저.hwp').chapters[0].html,/한글 본문/);assert.throws(()=>importHwp(sample(3),'보안.hwp'),/암호/);}finally{CFB.read=original;}
});
