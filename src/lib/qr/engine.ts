import type { Gradient, QrDesignConfig, RenderOptions } from "./types";
import { generateMatrix, isDark, isFinderRegion, type QrMatrix } from "./matrix";

// ─────────────────────────────────────────────────────────────────────────────
// The render engine turns a QR matrix + design config into a standalone SVG
// string. It is dependency-free and runs identically on server and client, so
// the live preview and the exported asset are pixel-identical.
// ─────────────────────────────────────────────────────────────────────────────

const INSTAGRAM_GLYPH = (cx: number, cy: number, r: number, color: string) => {
  // A clean, recognizable Instagram mark centered at (cx, cy) within radius r.
  const s = r * 1.55; // glyph box side
  const x = cx - s / 2;
  const y = cy - s / 2;
  const corner = s * 0.28;
  const lens = s * 0.26;
  const dot = s * 0.06;
  return `
    <g>
      <rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${corner}"
            fill="none" stroke="${color}" stroke-width="${s * 0.09}"/>
      <circle cx="${cx}" cy="${cy}" r="${lens}"
              fill="none" stroke="${color}" stroke-width="${s * 0.09}"/>
      <circle cx="${cx + s * 0.27}" cy="${cy - s * 0.27}" r="${dot}" fill="${color}"/>
    </g>`;
};

function gradientDef(id: string, grad: Gradient, span: number): string {
  const stops = grad.stops
    .map(
      (s) =>
        `<stop offset="${(s.offset * 100).toFixed(1)}%" stop-color="${s.color}"/>`,
    )
    .join("");
  if (grad.type === "radial") {
    return `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${
      span / 2
    }" cy="${span / 2}" r="${span * 0.62}">${stops}</radialGradient>`;
  }
  const angle = ((grad.rotation ?? 0) * Math.PI) / 180;
  const x1 = span / 2 - (Math.cos(angle) * span) / 2;
  const y1 = span / 2 - (Math.sin(angle) * span) / 2;
  const x2 = span / 2 + (Math.cos(angle) * span) / 2;
  const y2 = span / 2 + (Math.sin(angle) * span) / 2;
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1.toFixed(
    2,
  )}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(
    2,
  )}">${stops}</linearGradient>`;
}

function moduleCell(
  shape: QrDesignConfig["moduleShape"],
  x: number,
  y: number,
  fill: string,
): string {
  switch (shape) {
    case "dots":
      return `<circle cx="${x + 0.5}" cy="${y + 0.5}" r="0.42" fill="${fill}"/>`;
    case "rounded":
      return `<rect x="${x + 0.06}" y="${y + 0.06}" width="0.88" height="0.88" rx="0.34" fill="${fill}"/>`;
    case "classy":
      return `<rect x="${x + 0.04}" y="${y + 0.04}" width="0.92" height="0.92" rx="0.2" fill="${fill}"/>`;
    case "square":
    default:
      return `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${fill}"/>`;
  }
}

function renderEye(
  ox: number,
  oy: number,
  shape: QrDesignConfig["eyeShape"],
  frameFill: string,
  pupilFill: string,
  bgFill: string,
): string {
  // Layered approach (renders identically in browsers AND sharp/resvg):
  //   outer 7x7 frame → 5x5 background "hole" → 3x3 pupil.
  // The hole uses the page background fill (incl. gradient) so it matches exactly.
  if (shape === "circle") {
    return `
      <circle cx="${ox + 3.5}" cy="${oy + 3.5}" r="3.5" fill="${frameFill}"/>
      <circle cx="${ox + 3.5}" cy="${oy + 3.5}" r="2.5" fill="${bgFill}"/>
      <circle cx="${ox + 3.5}" cy="${oy + 3.5}" r="1.5" fill="${pupilFill}"/>`;
  }
  // outerRx / pupilRx tune the personality of the eye.
  const outerRx = shape === "rounded" ? 2.2 : shape === "leaf" ? 3.5 : 0.9;
  const pupilRx = shape === "rounded" ? 1.1 : shape === "leaf" ? 1.5 : 0.4;
  // "leaf" breaks one corner of each rounded rect for an organic teardrop.
  const leafRy = shape === "leaf" ? ` ry="1.2"` : "";
  return `
    <rect x="${ox}" y="${oy}" width="7" height="7" rx="${outerRx}"${leafRy} fill="${frameFill}"/>
    <rect x="${ox + 1}" y="${oy + 1}" width="5" height="5" rx="${outerRx - 0.8}"${leafRy} fill="${bgFill}"/>
    <rect x="${ox + 2}" y="${oy + 2}" width="3" height="3" rx="${pupilRx}"${leafRy} fill="${pupilFill}"/>`;
}

function logoSvg(
  config: QrDesignConfig,
  span: number,
  quiet: number,
): string {
  if (!config.logo.enabled) return "";
  const scale = Math.min(0.28, Math.max(0.12, config.logo.scale));
  const dataSpan = span - 2 * quiet;
  const box = dataSpan * scale;
  const cx = span / 2;
  const cy = span / 2;
  const pad = config.logo.padding / 20; // px → module units approx
  const haloR = box / 2 + pad;
  const halo = `<rect x="${cx - haloR}" y="${cy - haloR}" width="${
    haloR * 2
  }" height="${haloR * 2}" rx="${config.logo.borderRadius / 12}" fill="${
    config.logo.background
  }"/>`;

  if (config.logo.kind === "instagram" || !config.logo.src) {
    return `${halo}${INSTAGRAM_GLYPH(cx, cy, box / 2.4, config.eyeColor ?? config.foreground)}`;
  }
  // profile / custom: clip the image into the halo box.
  const clipId = "logoClip";
  return `
    <defs><clipPath id="${clipId}"><rect x="${cx - box / 2}" y="${
      cy - box / 2
    }" width="${box}" height="${box}" rx="${box / 2}"/></clipPath></defs>
    ${halo}
    <image href="${config.logo.src}" x="${cx - box / 2}" y="${
      cy - box / 2
    }" width="${box}" height="${box}" clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice"/>`;
}

export function renderQrSvg(opts: RenderOptions): string {
  const { config } = opts;
  const matrix: QrMatrix = generateMatrix(opts.data, config);
  const quiet = Math.max(4, config.quietZone); // enforce min quiet zone
  const span = matrix.size + quiet * 2;

  const fgId = "fgGrad";
  const bgId = "bgGrad";
  const fgFill = config.foregroundGradient ? `url(#${fgId})` : config.foreground;
  const bgFill = config.backgroundGradient ? `url(#${bgId})` : config.background;
  const eyeFrame = config.eyeColor ?? config.foreground;
  const eyePupil = config.eyeColorInner ?? eyeFrame;

  const defs: string[] = [];
  if (config.foregroundGradient)
    defs.push(gradientDef(fgId, config.foregroundGradient, span));
  if (config.backgroundGradient)
    defs.push(gradientDef(bgId, config.backgroundGradient, span));

  let glowAttr = "";
  if (config.glow?.enabled) {
    defs.push(
      `<filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
         <feGaussianBlur stdDeviation="${config.glow.blur}" result="b"/>
         <feFlood flood-color="${config.glow.color}" flood-opacity="0.9"/>
         <feComposite in2="b" operator="in" result="g"/>
         <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
       </filter>`,
    );
    glowAttr = ` filter="url(#glow)"`;
  }

  // Data modules (skip finder regions — eyes are drawn separately).
  const cells: string[] = [];
  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      if (!isDark(matrix, x, y)) continue;
      if (isFinderRegion(matrix, x, y)) continue;
      cells.push(moduleCell(config.moduleShape, x + quiet, y + quiet, fgFill));
    }
  }

  // Three eyes.
  const s = matrix.size;
  const eyes = [
    renderEye(quiet, quiet, config.eyeShape, eyeFrame, eyePupil, bgFill),
    renderEye(quiet + s - 7, quiet, config.eyeShape, eyeFrame, eyePupil, bgFill),
    renderEye(quiet, quiet + s - 7, config.eyeShape, eyeFrame, eyePupil, bgFill),
  ].join("");

  const logo = logoSvg(config, span, quiet);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${opts.size}" height="${opts.size}" viewBox="0 0 ${span} ${span}" shape-rendering="geometricPrecision">
  <defs>${defs.join("")}</defs>
  <rect width="${span}" height="${span}" fill="${bgFill}"/>
  <g${glowAttr}>
    ${cells.join("")}
    ${eyes}
  </g>
  ${logo}
</svg>`;
}
