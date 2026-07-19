export const PRINT_DPI: number;
export const BLEED_MM: number;
export function calculateSpineWidth(pageCount: number): number;
export function calculateCoverSpec(options: { trimWidth: number; trimHeight: number; pageCount: number; hasFlaps: boolean; flapWidth: number }): { spineWidth: number; bleed: number; spreadWidth: number; spreadHeight: number; pixelWidth: number; pixelHeight: number };
export function clampZoom(value: number): number;
export function validateImportedImage(input: { width: number; height: number; targetWidth: number; targetHeight: number }): { ratioOk: boolean; resolutionOk: boolean };
export function buildSinglePageJpegPdf(jpegBytes: Uint8Array, options: { pixelWidth: number; pixelHeight: number; pageWidth: number; pageHeight: number }): Uint8Array;
export function moveCustomTextPosition(position: { x: number; y: number }, deltaX: number, deltaY: number): { x: number; y: number };
export function removeCustomTextById<T extends { id: number }>(items: T[], id: number): T[];
