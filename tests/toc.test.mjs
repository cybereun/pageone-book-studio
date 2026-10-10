import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {createBook,uid,validateBook} from '../src/book.mjs';
import {bodyHtml} from '../src/layout.mjs';
import {buildEpub,packProject,unpackProject} from '../src/export.mjs';
test('editable TOC preserves excluded manuscript, order, links and escaped title in PDF and EPUB',async()=>{
  const book=createBook();book.print.tocTitle='차례 <우리 책>';
  book.chapters=[{id:uid(),title:'마지막에서 앞으로',html:'<p>첫 본문</p>'},{id:uid(),title:'숨긴 항목',html:'<p>남는 본문</p>',tocHidden:true},{id:uid(),title:'다음 장',html:'<p>둘째 본문</p>'}];
  const html=bodyHtml(book);const toc=html.match(/<section class="toc">(.*?)<\/section>/s)[1];
  assert.match(toc,/차례 &lt;우리 책&gt;/);assert.match(toc,/#chapter-0/);assert.match(toc,/#chapter-2/);assert.doesNotMatch(toc,/숨긴 항목/);assert.match(html,/남는 본문/);
  const zip=await JSZip.loadAsync(await buildEpub(book));const nav=await zip.file('EPUB/nav.xhtml').async('string');assert.match(nav,/차례 &lt;우리 책&gt;/);assert.match(nav,/chapter-3.xhtml/);assert.doesNotMatch(nav,/숨긴 항목/);assert.ok(zip.file('EPUB/chapter-2.xhtml'));
  assert.deepEqual(await unpackProject(await packProject(book)),book);
});
test('empty EPUB selection still has valid cover navigation; old projects keep default TOC',async()=>{
  const book=createBook();assert.match(bodyHtml(book),/<h1>목차<\/h1>/);book.chapters[0].tocHidden=true;
  const zip=await JSZip.loadAsync(await buildEpub(book));assert.match(await zip.file('EPUB/nav.xhtml').async('string'),/cover.xhtml/);
  book.chapters[0].tocHidden='yes';assert.throws(()=>validateBook(book),/목차 포함/);
});
