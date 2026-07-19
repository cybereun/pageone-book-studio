import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const moduleUrl = new URL("../app/lib/cover-spec.mjs", import.meta.url);

test("cover specification module exists", () => {
  assert.equal(existsSync(moduleUrl), true, "cover-spec.mjs must define the print contract");
});

test("calculates the requested spine-width examples", async () => {
  const { calculateSpineWidth } = await import(moduleUrl.href);
  assert.equal(calculateSpineWidth(50), 4.35);
  assert.equal(calculateSpineWidth(100), 7.1);
  assert.equal(calculateSpineWidth(200), 12.6);
  assert.equal(calculateSpineWidth(300), 18.1);
});

test("calculates an exact 300 DPI spread with bleed and flaps", async () => {
  const { calculateCoverSpec } = await import(moduleUrl.href);
  const spec = calculateCoverSpec({ trimWidth: 148, trimHeight: 210, pageCount: 100, hasFlaps: false, flapWidth: 90 });
  assert.deepEqual(spec, { spineWidth: 7.1, bleed: 3, spreadWidth: 309.1, spreadHeight: 216, pixelWidth: 3651, pixelHeight: 2551 });
  const flapSpec = calculateCoverSpec({ trimWidth: 148, trimHeight: 210, pageCount: 100, hasFlaps: true, flapWidth: 90 });
  assert.equal(flapSpec.spreadWidth, 489.1);
  assert.equal(flapSpec.pixelWidth, 5777);
});

test("clamps cover zoom to useful bounds", async () => {
  const { clampZoom } = await import(moduleUrl.href);
  assert.equal(clampZoom(20), 50);
  assert.equal(clampZoom(90), 90);
  assert.equal(clampZoom(200), 140);
});

test("calculates preview width and height from the same zoom factor", async () => {
  const { calculatePreviewDimensions } = await import(moduleUrl.href);
  assert.deepEqual(calculatePreviewDimensions({ zoom: 140, spreadWidth: 267.1, spreadHeight: 194, baseWidth: 960 }), { width: 1344, height: 976.17 });
  const dimensions = calculatePreviewDimensions({ zoom: 80, spreadWidth: 309.1, spreadHeight: 216, baseWidth: 960 });
  assert.ok(Math.abs(dimensions.width / dimensions.height - 309.1 / 216) < 0.00001);
});

test("validates ratio and resolution independently", async () => {
  const { validateImportedImage } = await import(moduleUrl.href);
  assert.deepEqual(validateImportedImage({ width: 3651, height: 2551, targetWidth: 3651, targetHeight: 2551 }), { ratioOk: true, resolutionOk: true });
  assert.deepEqual(validateImportedImage({ width: 1200, height: 1200, targetWidth: 3651, targetHeight: 2551 }), { ratioOk: false, resolutionOk: false });
});

test("accepts Canva image downloads even when the browser omits their MIME type", async () => {
  const { isSupportedCoverImageFile } = await import(moduleUrl.href);
  assert.equal(isSupportedCoverImageFile({ name: "canva-cover.PNG", type: "" }), true);
  assert.equal(isSupportedCoverImageFile({ name: "canva-cover.jpg", type: "application/octet-stream" }), true);
  assert.equal(isSupportedCoverImageFile({ name: "cover.pdf", type: "application/pdf" }), false);
});

test("places an imported image without stretching it", async () => {
  const { calculateCoverImagePlacement } = await import(moduleUrl.href);
  const placement = calculateCoverImagePlacement({ sourceWidth: 2000, sourceHeight: 1000, targetWidth: 1000, targetHeight: 1000, scale: 1, positionX: 50, positionY: 50 });
  assert.deepEqual(placement, { x: -500, y: 0, width: 2000, height: 1000 });
});

test("builds a one-page PDF with an exact media box", async () => {
  const { buildSinglePageJpegPdf } = await import(moduleUrl.href);
  const pdf = buildSinglePageJpegPdf(new Uint8Array([255, 216, 255, 217]), { pixelWidth: 10, pixelHeight: 20, pageWidth: 100, pageHeight: 200 });
  const text = new TextDecoder().decode(pdf);
  assert.match(text, /^%PDF-1\.4/);
  assert.match(text, /\/MediaBox \[0 0 100\.000 200\.000\]/);
  assert.match(text, /\/Subtype \/Image/);
  assert.match(text, /%%EOF$/);
});

test("moves added text while keeping it inside the front cover", async () => {
  const { moveCustomTextPosition } = await import(moduleUrl.href);
  assert.deepEqual(moveCustomTextPosition({ x: 50, y: 35 }, 10, -5), { x: 60, y: 30 });
  assert.deepEqual(moveCustomTextPosition({ x: 98, y: 2 }, 10, -10), { x: 95, y: 5 });
});

test("deletes only the requested added text", async () => {
  const { removeCustomTextById } = await import(moduleUrl.href);
  assert.deepEqual(removeCustomTextById([{ id: 1, text: "A" }, { id: 2, text: "B" }], 1), [{ id: 2, text: "B" }]);
});
