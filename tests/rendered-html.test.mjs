import assert from "node:assert/strict";
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
  assert.match(css, /editor-popover/);
  assert.match(css, /custom-color-grid/);
  assert.match(css, /\.cover-stage\{[^}]*overflow:auto/);
  assert.match(css, /\.cover-workspace\{[^}]*height:calc\(100vh - 124px\)[^}]*overflow:hidden/);
  assert.match(css, /\.artboard-shell\{[^}]*margin:0 auto/);
  assert.match(css, /\.cover-background-image/);
  assert.match(css, /\.artboard-shell \.cover-spread\{[^}]*max-height:none/);
  assert.match(css, /\.artboard-shell \.artboard-controls\{[^}]*left:calc\(100% \+ 14px\)/);
  assert.match(css, /\.artboard-controls \.cover-tools\{[^}]*position:static/);
  assert.match(coverRoute, /gpt-image-1/);
  assert.match(coverRoute, /gemini-3\.1-flash-image/);
  assert.match(coverRoute, /claude-sonnet-4-20250514/);
  assert.doesNotMatch(coverRoute, /gpt-image-2|claude-sonnet-5/);
});
