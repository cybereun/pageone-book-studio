import assert from "node:assert/strict";
import test from "node:test";

import {
  addManuscriptChapter,
  addManuscriptPage,
  buildTableOfContents,
  moveManuscriptChapter,
  removeManuscriptChapter,
  removeManuscriptPage,
  sanitizeEditorHtml,
  toEditorHtml,
  plainTextFromEditorHtml,
  updateManuscriptPage,
} from "../app/lib/manuscript.mjs";

const starter = [
  { id: 1, kicker: "프롤로그", title: "시작", pages: [{ id: 11, content: "첫 페이지" }] },
  { id: 2, kicker: "1장", title: "기록", pages: [{ id: 21, content: "둘째 페이지" }, { id: 22, content: "셋째 페이지" }] },
];

test("adds a real page after the selected manuscript page", () => {
  const chapters = addManuscriptPage(starter, 2, 21);
  assert.equal(chapters[1].pages.length, 3);
  assert.equal(chapters[1].pages[1].content, "");
  assert.notEqual(chapters[1].pages[1].id, 21);
});

test("updates and removes manuscript pages while keeping one page per chapter", () => {
  const updated = updateManuscriptPage(starter, 1, 11, "고친 원고");
  assert.equal(updated[0].pages[0].content, "고친 원고");
  const kept = removeManuscriptPage(updated, 1, 11);
  assert.equal(kept[0].pages.length, 1);
  assert.equal(kept[0].pages[0].content, "");
});

test("adds, reorders, and removes chapters", () => {
  const added = addManuscriptChapter(starter);
  assert.equal(added.length, 3);
  assert.equal(added[2].title, "새 장 제목");
  const moved = moveManuscriptChapter(added, added[2].id, -1);
  assert.equal(moved[1].id, added[2].id);
  const removed = removeManuscriptChapter(moved, added[2].id);
  assert.equal(removed.length, 2);
});

test("builds a live table of contents from chapter and page order", () => {
  assert.deepEqual(buildTableOfContents(starter, 3), [
    { chapterId: 1, kicker: "프롤로그", title: "시작", startPage: 3, pageCount: 1 },
    { chapterId: 2, kicker: "1장", title: "기록", startPage: 4, pageCount: 2 },
  ]);
});

test("converts plain manuscript text into safe rich editor paragraphs", () => {
  assert.equal(toEditorHtml("첫 문단\n\n둘째 문단"), "<p>첫 문단</p><p>둘째 문단</p>");
  assert.equal(sanitizeEditorHtml('<h2 onclick="bad()">제목</h2><script>alert(1)</script><blockquote>인용</blockquote>'), "<h2>제목</h2><blockquote>인용</blockquote>");
  assert.equal(plainTextFromEditorHtml("<h2>제목</h2><p>본문<br>다음 줄</p>"), "제목\n본문\n다음 줄");
});

test("keeps safe font family and size styles while removing unsafe styles", () => {
  assert.equal(
    sanitizeEditorHtml('<span style="font-family: Pretendard; font-size: 18px; color: red; position: fixed">글꼴</span>'),
    '<span style="font-family: Pretendard; font-size: 18px">글꼴</span>',
  );
  assert.equal(
    sanitizeEditorHtml('<font face="Noto Serif KR" size="5">제목</font>'),
    '<span style="font-family: Noto Serif KR; font-size: 24px">제목</span>',
  );
});
