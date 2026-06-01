// Type system for the QR design engine.
// A QrDesignConfig is fully serializable (stored as JSON on QrCode.design).

export type ModuleShape = "square" | "rounded" | "dots" | "classy";
export type EyeShape = "square" | "rounded" | "circle" | "leaf";
export type ErrorCorrection = "L" | "M" | "Q" | "H";

export interface GradientStop {
  offset: number; // 0..1
  color: string; // hex
}

export interface Gradient {
  type: "linear" | "radial";
  rotation?: number; // degrees, linear only
  stops: GradientStop[];
}

export interface LogoConfig {
  enabled: boolean;
  // "instagram" = built-in glyph; "profile" = fetched avatar; "custom" = uploaded
  kind: "instagram" | "profile" | "custom";
  src?: string; // data URI or remote URL for profile/custom
  // Fraction of QR width the logo occupies (0.12–0.28). Engine clamps for safety.
  scale: number;
  padding: number; // px of background halo around the logo
  background: string; // halo color (usually theme background)
  borderRadius: number;
}

export interface QrDesignConfig {
  themeId: string;

  // Color system — either a solid foreground or a gradient.
  foreground: string;
  foregroundGradient?: Gradient;
  background: string;
  backgroundGradient?: Gradient;

  // Independent eye (finder pattern) coloring for premium contrast.
  eyeColor?: string;
  eyeColorInner?: string;

  moduleShape: ModuleShape;
  eyeShape: EyeShape;

  // Error correction. Engine may auto-upgrade when a logo is present.
  errorCorrection: ErrorCorrection;
  autoOptimizeEcc: boolean;

  quietZone: number; // modules of margin (min enforced to 4 for scan safety)
  logo: LogoConfig;

  // Optional drop shadow / glow for neon themes (SVG filter).
  glow?: { enabled: boolean; color: string; blur: number };
}

export interface RenderOptions {
  size: number; // px (raster target / svg viewbox basis)
  data: string; // the URL to encode
  config: QrDesignConfig;
}

export interface ContrastReport {
  ratio: number; // WCAG-style luminance contrast
  safe: boolean; // >= 3:1 minimum for reliable camera scanning (we enforce ~3.5)
  message?: string;
}
