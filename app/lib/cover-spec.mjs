export const PRINT_DPI = 300;
export const BLEED_MM = 3;

export function calculateSpineWidth(pageCount) {
  const pages = Math.min(300, Math.max(50, Number(pageCount) || 50));
  return Number((pages * 0.055 + 1.6).toFixed(2));
}

export function calculateCoverSpec({ trimWidth, trimHeight, pageCount, hasFlaps, flapWidth }) {
  const spineWidth = calculateSpineWidth(pageCount);
  const spreadWidth = Number((Number(trimWidth) * 2 + spineWidth + BLEED_MM * 2 + (hasFlaps ? Number(flapWidth) * 2 : 0)).toFixed(2));
  const spreadHeight = Number(trimHeight) + BLEED_MM * 2;
  return {
    spineWidth,
    bleed: BLEED_MM,
    spreadWidth,
    spreadHeight,
    pixelWidth: Math.round((spreadWidth / 25.4) * PRINT_DPI),
    pixelHeight: Math.round((spreadHeight / 25.4) * PRINT_DPI),
  };
}

export function clampZoom(value) {
  return Math.min(140, Math.max(50, Number(value) || 80));
}

export function calculatePreviewDimensions({ zoom, spreadWidth, spreadHeight, baseWidth = 960 }) {
  const width = Number((Number(baseWidth) * clampZoom(zoom) / 100).toFixed(2));
  const height = Number((width * Number(spreadHeight) / Number(spreadWidth)).toFixed(2));
  return { width, height };
}

export function validateImportedImage({ width, height, targetWidth, targetHeight }) {
  const expectedRatio = targetWidth / targetHeight;
  const actualRatio = width / height;
  return {
    ratioOk: Math.abs(actualRatio - expectedRatio) / expectedRatio <= 0.02,
    resolutionOk: width >= targetWidth && height >= targetHeight,
  };
}

export function isSupportedCoverImageFile(file) {
  const mimeType = String(file?.type || "").toLowerCase();
  const fileName = String(file?.name || "").toLowerCase();
  return /^image\/(png|jpe?g|webp)$/.test(mimeType) || /\.(png|jpe?g|webp)$/.test(fileName);
}

export function calculateCoverImagePlacement({ sourceWidth, sourceHeight, targetWidth, targetHeight, scale = 1, positionX = 50, positionY = 50 }) {
  const coverScale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight) * Math.max(1, Number(scale) || 1);
  const width = sourceWidth * coverScale;
  const height = sourceHeight * coverScale;
  return {
    x: (targetWidth - width) * Number(positionX) / 100,
    y: (targetHeight - height) * Number(positionY) / 100,
    width,
    height,
  };
}

export function buildSinglePageJpegPdf(jpegBytes, { pixelWidth, pixelHeight, pageWidth, pageHeight }) {
  const encoder = new TextEncoder();
  const chunks = [];
  const offsets = [0];
  let length = 0;
  const push = (value) => {
    const bytes = typeof value === "string" ? encoder.encode(value) : value;
    chunks.push(bytes);
    length += bytes.length;
  };
  const object = (id, body) => {
    offsets[id] = length;
    push(`${id} 0 obj\n${body}\nendobj\n`);
  };
  push("%PDF-1.4\n%PAGEONE\n");
  object(1, "<< /Type /Catalog /Pages 2 0 R >>");
  object(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  object(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(3)} ${pageHeight.toFixed(3)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  offsets[4] = length;
  push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pixelWidth} /Height ${pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
  push(jpegBytes);
  push("\nendstream\nendobj\n");
  const commands = `q\n${pageWidth.toFixed(3)} 0 0 ${pageHeight.toFixed(3)} 0 0 cm\n/Im0 Do\nQ`;
  object(5, `<< /Length ${encoder.encode(commands).length} >>\nstream\n${commands}\nendstream`);
  const xref = length;
  push("xref\n0 6\n0000000000 65535 f \n");
  for (let id = 1; id <= 5; id += 1) push(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  const output = new Uint8Array(length);
  let cursor = 0;
  for (const chunk of chunks) { output.set(chunk, cursor); cursor += chunk.length; }
  return output;
}

export function moveCustomTextPosition(position, deltaX, deltaY) {
  return {
    x: Math.min(95, Math.max(5, Number(position.x) + Number(deltaX))),
    y: Math.min(95, Math.max(5, Number(position.y) + Number(deltaY))),
  };
}

export function removeCustomTextById(items, id) {
  return items.filter((item) => item.id !== id);
}
