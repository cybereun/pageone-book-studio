import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import JSZip from 'jszip';
import {createBook} from '../src/book.mjs';
import {fonts,bookFonts} from '../src/fonts.mjs';
import {buildEpub} from '../src/export.mjs';
test('every selectable typeface has bundled original font data',async()=>{
 for(const [,regular,bold] of Object.values(fonts))for(const file of new Set([regular,bold]))assert.ok((await readFile(new URL(`../public/fonts/${file}`,import.meta.url))).length>1000);
});
test('EPUB includes selected Nanum fonts once even when both roles match',async()=>{
 const book=createBook();book.print.font='nanumSans';book.print.headingFont='nanumSans';
 assert.equal(bookFonts(book)[0][0],'NanumGothic-Regular.ttf');
 const zip=await JSZip.loadAsync(await buildEpub(book,{fontLoader:async name=>new Uint8Array(await readFile(new URL(`../public/fonts/${name}`,import.meta.url)))}));
 const opf=await zip.file('EPUB/package.opf').async('string');
 assert.equal((opf.match(/href="fonts\/NanumGothic-Regular.ttf"/g)||[]).length,1);
 assert.equal((opf.match(/href="fonts\/NanumGothic-Bold.ttf"/g)||[]).length,1);
});
