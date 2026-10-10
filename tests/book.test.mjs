import test from 'node:test';
import assert from 'node:assert/strict';
import { createBook, validateBook, migrateLegacy } from '../src/book.mjs';

test('new book is valid A5, Korean, without ISBN', () => {
  const book = createBook();
  assert.equal(validateBook(book).id, book.id);
  assert.equal(book.print.width, 148);
  assert.equal(book.print.height, 210);
  assert.equal(book.print.bleed, 3);
  assert.equal(book.metadata.language, 'ko');
  assert.equal(book.chapters.length, 1);
});
test('rejects unknown versions, invalid sizes, duplicate IDs and active content', () => {
  const book = createBook();
  assert.throws(() => validateBook({ ...book, version: 99 }));
  assert.throws(() => validateBook({ ...book, print: { ...book.print, width: -1 } }));
  assert.throws(() => validateBook({ ...book, chapters: [book.chapters[0], book.chapters[0]] }));
  book.chapters[0].html = '<img src="https://evil.test/tracker"><script>bad()</script>';
  assert.throws(() => validateBook(book));
});
test('legacy migration preserves page text without changing original draft', () => {
  const draft = { title: '나의 책', manuscript: [{ title: '봄', pages: [{ content: '첫 문단' }, { content: '<p>둘째 문단</p>' }] }] };
  const before = JSON.stringify(draft);
  const result = migrateLegacy(draft);
  assert.equal(result.metadata.title, '나의 책');
  assert.match(result.chapters[0].html, /첫 문단/);
  assert.match(result.chapters[0].html, /둘째 문단/);
  assert.equal(JSON.stringify(draft), before);
});
