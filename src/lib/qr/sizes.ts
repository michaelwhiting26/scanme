// Physical sticker sizes. All print exports target 300 DPI.

export const DPI = 300;
export const MM_PER_INCH = 25.4;

export type StickerSizeId = "S50" | "S75" | "S100";

export interface StickerSpec {
  id: StickerSizeId;
  label: string;
  mm: number; // square side in millimetres
  px: number; // pixel side at 300 DPI
  pt: number; // PDF points (72 pt per inch)
}

function mmToPx(mm: number) {
  return Math.round((mm / MM_PER_INCH) * DPI);
}
function mmToPt(mm: number) {
  return (mm / MM_PER_INCH) * 72;
}

export const STICKER_SIZES: Record<StickerSizeId, StickerSpec> = {
  S50: { id: "S50", label: "50 × 50 mm", mm: 50, px: mmToPx(50), pt: mmToPt(50) },
  S75: { id: "S75", label: "75 × 75 mm", mm: 75, px: mmToPx(75), pt: mmToPt(75) },
  S100: { id: "S100", label: "100 × 100 mm", mm: 100, px: mmToPx(100), pt: mmToPt(100) },
};

// Screen preview default (not print).
export const PREVIEW_PX = 512;
