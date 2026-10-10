import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { createBook } from '../src/book.mjs';
import { buildEpub, packProject, unpackProject } from '../src/export.mjs';
test('project archive round trip preserves all manuscript content', async () => {
  const book = createBook();
  assert.deepEqual(await unpackProject(await packProject(book)), book);
});
test('EPUB contains stored mimetype, OPF, navigation and Korean XHTML', async () => {
  const book = createBook(); book.metadata.title = '나의 & 책';
  const bytes = await buildEpub(book);
  assert.equal(new DataView(bytes.buffer, bytes.byteOffset).getUint16(8, true), 0);
  const zip = await JSZip.loadAsync(bytes);
  assert.equal(await zip.file('mimetype').async('string'), 'application/epub+zip');
  assert.match(await zip.file('EPUB/package.opf').async('string'), /나의 &amp; 책/);
  assert.match(await zip.file('EPUB/nav.xhtml').async('string'), /chapter-1.xhtml/);
  assert.match(await zip.file('EPUB/chapter-1.xhtml').async('string'), /첫 문장/);
});
test('EPUB fixes footnote links across imported chapters',async()=>{
  const book=createBook();
  book.chapters=[{id:'c1',title:'본문',html:'<p>각주<a href="#note-1" id="ref-1">1</a></p>'},{id:'c2',title:'주석',html:'<p id="note-1">설명 <a href="#ref-1">돌아가기</a></p>'}];
  const zip=await JSZip.loadAsync(await buildEpub(book));
  assert.match(await zip.file('EPUB/chapter-1.xhtml').async('string'),/href="chapter-2.xhtml#note-1"/);
  assert.match(await zip.file('EPUB/chapter-2.xhtml').async('string'),/href="chapter-1.xhtml#ref-1"/);
});

test('EPUB omits empty optional description and publisher metadata',async()=>{
 const book=createBook();
 const zip=await JSZip.loadAsync(await buildEpub(book));
 const opf=await zip.file('EPUB/package.opf').async('string');
 assert.doesNotMatch(opf,/<dc:(description|publisher)>\s*<\/dc:\1>/);
});
