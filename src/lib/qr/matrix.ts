import QRCode from "qrcode";
import type { ErrorCorrection, QrDesignConfig } from "./types";

export interface QrMatrix {
  size: number; // module count per side (incl. data, excl. quiet zone)
  bits: Uint8Array; // size*size, 1 = dark module
  ecc: ErrorCorrection;
}

// Higher ECC tolerates more occlusion (logo) and dirt/wear on printed stickers,
// at the cost of denser codes. We pick the *minimum* level that safely covers
// the logo footprint so the code stays as open/scannable as possible.
function eccForLogo(scale: number, requested: ErrorCorrection): ErrorCorrection {
  // Logo occludes ~ scale^2 of the area. H corrects ~30%, Q ~25%, M ~15%, L ~7%.
  const occlusion = scale * scale;
  let needed: ErrorCorrection = "M";
  if (occlusion > 0.06) needed = "Q";
  if (occlusion > 0.1) needed = "H";

  const rank: Record<ErrorCorrection, number> = { L: 0, M: 1, Q: 2, H: 3 };
  return rank[needed] > rank[requested] ? needed : requested;
}

export function resolveEcc(config: QrDesignConfig): ErrorCorrection {
  if (!config.autoOptimizeEcc) return config.errorCorrection;
  if (config.logo.enabled) {
    return eccForLogo(config.logo.scale, config.errorCorrection);
  }
  return config.errorCorrection;
}

export function generateMatrix(data: string, config: QrDesignConfig): QrMatrix {
  const ecc = resolveEcc(config);
  // `qrcode` handles version selection + masking + ECC encoding.
  const qr = QRCode.create(data, { errorCorrectionLevel: ecc });
  const size = qr.modules.size;
  const src = qr.modules.data; // Uint8Array of 0/1 already
  const bits = new Uint8Array(size * size);
  for (let i = 0; i < bits.length; i++) bits[i] = src[i] ? 1 : 0;
  return { size, bits, ecc };
}

export function isDark(m: QrMatrix, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= m.size || y >= m.size) return false;
  return m.bits[y * m.size + x] === 1;
}

// The three finder patterns ("eyes") occupy a 7x7 block at three corners.
export function isFinderRegion(m: QrMatrix, x: number, y: number): boolean {
  const s = m.size;
  const inBox = (bx: number, by: number) =>
    x >= bx && x < bx + 7 && y >= by && y < by + 7;
  return inBox(0, 0) || inBox(s - 7, 0) || inBox(0, s - 7);
}
