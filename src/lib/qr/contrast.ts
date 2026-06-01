import type { ContrastReport, Gradient, QrDesignConfig } from "./types";

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// The most fragile pairing is the lightest foreground stop against the
// lightest background stop. Scanners need that worst case to stay readable.
function lightestStop(grad: Gradient | undefined, fallback: string): string {
  if (!grad?.stops?.length) return fallback;
  return grad.stops.reduce((light, s) =>
    relLuminance(s.color) > relLuminance(light.color) ? s : light,
  ).color;
}

function darkestStop(grad: Gradient | undefined, fallback: string): string {
  if (!grad?.stops?.length) return fallback;
  return grad.stops.reduce((dark, s) =>
    relLuminance(s.color) < relLuminance(dark.color) ? s : dark,
  ).color;
}

const MIN_SAFE_RATIO = 3.5; // empirically reliable for phone cameras at angle

export function analyzeContrast(config: QrDesignConfig): ContrastReport {
  const bgLight = lightestStop(config.backgroundGradient, config.background);
  const bgDark = darkestStop(config.backgroundGradient, config.background);
  const fgLight = lightestStop(config.foregroundGradient, config.foreground);
  const fgDark = darkestStop(config.foregroundGradient, config.foreground);

  // Determine polarity: are modules darker or lighter than background?
  const fgIsDarker = relLuminance(fgDark) < relLuminance(bgDark);
  const worst = fgIsDarker
    ? contrastRatio(fgLight, bgDark) // light module vs dark bg edge
    : contrastRatio(fgDark, bgLight);

  const safe = worst >= MIN_SAFE_RATIO;
  return {
    ratio: Math.round(worst * 100) / 100,
    safe,
    message: safe
      ? undefined
      : `Contrast ${worst.toFixed(1)}:1 is below the ${MIN_SAFE_RATIO}:1 scan-safety threshold. Darken the modules or lighten the background.`,
  };
}
