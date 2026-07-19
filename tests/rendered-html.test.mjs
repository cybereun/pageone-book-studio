import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the PAGEONE authoring studio", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /PAGEONE/);
  assert.match(html, /표지 디자인/);
  assert.match(html, /본문 편집/);
  assert.match(html, /검토 · 출판/);
});

test("bundles the four BOOKK fonts in the manuscript font picker", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  for (const font of ["Bookk Gothic Light", "Bookk Gothic Bold", "Bookk Myungjo Light", "Bookk Myungjo Bold"]) {
    assert.match(page, new RegExp(font));
    assert.match(css, new RegExp(`font-family:\\s*"${font}"`));
  }
  for (const file of ["BookkGothic_Light.ttf", "BookkGothic_Bold.ttf", "BookkMyungjo_Light.ttf", "BookkMyungjo_Bold.ttf"]) {
    assert.equal(existsSync(new URL(`../public/fonts/${file}`, import.meta.url)), true);
    assert.match(css, new RegExp(`/fonts/${file.replace(".", "\\.")}`));
  }
});

test("cover controls expose real editing and export actions", async () => {
  const [page, css, coverRoute] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/api/ai/cover/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(page, /aria-label="축소"/);
  assert.match(page, /aria-label="확대"/);
  assert.match(page, /텍스트 추가/);
  assert.match(page, /300 DPI PNG/);
  assert.match(page, /인쇄용 PDF/);
  assert.match(page, /aria-label="추가 텍스트 이동"/);
  assert.match(page, /aria-label="추가 텍스트 삭제"/);
  assert.match(page, /transform: `scale\(\$\{backgroundScale \/ 100\}\)`/);
  assert.match(page, /사용자 색상/);
  assert.match(page, /aria-label="사용자 색상 선택"/);
  assert.match(page, /custom-color-panel/);
  assert.match(page, /currentTarget\.value = ""/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /className="cover-background-image"/);
  assert.match(page, /width: `\$\{previewSize\.width\}px`/);
  assert.match(page, /height: `\$\{previewSize\.height\}px`/);
  assert.doesNotMatch(page, /new Image\(\)/);
  assert.equal((page.match(/new window\.Image\(\)/g) || []).length, 2);
  assert.doesNotMatch(page, /normalizeCoverImage/);
  assert.match(page, /deleteStoredCoverImage/);
  assert.equal((page.match(/첨부 이미지 삭제/g) || []).length, 2);
  assert.match(page, /className="artboard-controls"/);
  assert.match(page, /className="control-panel cover-controls"/);
  assert.match(page, /className="cover-stage compact-cover-stage"/);
  assert.match(page, /"--stage-content-height": `\$\{previewSize\.height\}px`/);
  assert.match(css, /editor-popover/);
  assert.match(css, /custom-color-grid/);
  assert.match(css, /\.cover-stage\{[^}]*overflow:auto/);
  assert.match(css, /\.cover-workspace\{[^}]*height:calc\(100vh - 124px\)[^}]*overflow:hidden/);
  assert.match(css, /\.artboard-shell\{[^}]*margin:0 auto/);
  assert.match(css, /\.cover-background-image/);
  assert.match(css, /\.artboard-shell \.cover-spread\{[^}]*max-height:none/);
  assert.match(css, /\.artboard-shell \.artboard-controls\{[^}]*left:calc\(100% \+ 14px\)/);
  assert.match(css, /\.artboard-controls \.cover-tools\{[^}]*position:static/);
  assert.match(css, /\.cover-controls\{[^}]*height:calc\(100vh - 124px\)[^}]*overflow-y:auto[^}]*scrollbar-gutter:stable/);
  assert.match(css, /\.compact-cover-stage\{[^}]*height:min\(calc\(100vh - 208px\),calc\(var\(--stage-content-height\) \+ 76px\)\)/);
  assert.match(coverRoute, /gpt-image-1/);
  assert.match(coverRoute, /gemini-3\.1-flash-image/);
  assert.match(coverRoute, /claude-sonnet-4-20250514/);
  assert.doesNotMatch(coverRoute, /gpt-image-2|claude-sonnet-5/);
});

test("manuscript editor exposes chapter, page, contents, and working AI actions", async () => {
  const [page, css, writeRoute] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/api/ai/write/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(page, /목차 만들기/);
  assert.match(page, /본문 페이지 추가/);
  assert.match(page, /현재 페이지 삭제/);
  assert.match(page, /장 순서 위로/);
  assert.match(page, /장 삭제/);
  assert.match(page, /AI 제안으로 교체/);
  assert.match(page, /AI 제안을 뒤에 추가/);
  assert.match(page, /contentEditable/);
  assert.match(page, /applyParagraphStyle/);
  assert.match(page, /applyInlineStyle/);
  assert.match(page, /applyFontFamily/);
  assert.match(page, /applyFontSize/);
  assert.match(page, /ensureEditorSelection/);
  assert.match(page, /syncEditorToolbar/);
  assert.match(page, /window\.getComputedStyle/);
  assert.match(page, /closestEditorFontSize/);
  assert.match(page, /aria-label="글꼴"/);
  assert.match(page, /aria-label="글자 크기"/);
  assert.match(page, /onMouseUp=\{syncEditorToolbar\}/);
  assert.match(page, /pageLayout/);
  assert.match(page, /getNextManuscriptPage/);
  assert.match(page, /두 면/);
  assert.match(page, /<article className="manuscript-page facing-page"/);
  assert.match(page, /facing-page-action/);
  assert.match(page, /facing-chapter-title/);
  assert.match(page, /rich-manuscript-preview/);
  assert.doesNotMatch(page, /<button type="button" className="manuscript-page facing-page"/);
  assert.match(page, /document\.execCommand/);
  assert.match(page, /suppressContentEditableWarning/);
  assert.match(page, /setManuscript/);
  assert.match(page, /buildTableOfContents/);
  assert.match(css, /\.toc-page/);
  assert.match(css, /\.page-navigation/);
  assert.match(css, /\.chapter-actions/);
  assert.match(css, /\.rich-manuscript-editor/);
  assert.match(css, /\.rich-manuscript-editor h2/);
  assert.match(css, /\.rich-manuscript-editor blockquote/);
  assert.match(css, /\.font-family-select/);
  assert.match(css, /\.font-size-select/);
  assert.match(css, /\.manuscript-spread/);
  assert.match(css, /\.facing-page/);
  assert.match(css, /\.facing-page-action/);
  assert.match(css, /\.facing-chapter-title/);
  assert.match(css, /\.rich-manuscript-preview/);
  assert.match(writeRoute, /gpt-5\.4-mini/);
  assert.match(writeRoute, /gemini-3\.5-flash/);
  assert.match(writeRoute, /providerLabel/);
  assert.match(writeRoute, /AI 요청에 실패했습니다/);
});
