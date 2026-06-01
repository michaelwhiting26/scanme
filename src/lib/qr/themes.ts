import type { QrDesignConfig } from "./types";

export interface ThemePreset {
  id: string;
  name: string;
  category: "gradient" | "neon" | "chrome" | "cyberpunk" | "luxury" | "creator";
  description: string;
  // A small swatch used for the picker UI.
  swatch: string[];
  config: Omit<QrDesignConfig, "themeId">;
}

const baseLogo = {
  enabled: true,
  kind: "instagram" as const,
  scale: 0.22,
  padding: 10,
  background: "#ffffff",
  borderRadius: 16,
};

// Six premium families. Each is tuned so the dark-module color keeps a
// >= 3.5:1 contrast against the lightest part of the background gradient.
export const THEMES: ThemePreset[] = [
  // ── GRADIENT ──────────────────────────────────────────────────────────────
  {
    id: "aurora",
    name: "Aurora",
    category: "gradient",
    description: "Electric violet → magenta. The default ScanMe look.",
    swatch: ["#7c3aed", "#db2777", "#fb7185"],
    config: {
      foreground: "#7c3aed",
      foregroundGradient: {
        type: "linear",
        rotation: 45,
        stops: [
          { offset: 0, color: "#7c3aed" },
          { offset: 0.5, color: "#c026d3" },
          { offset: 1, color: "#fb7185" },
        ],
      },
      background: "#ffffff",
      eyeColor: "#6d28d9",
      eyeColorInner: "#db2777",
      moduleShape: "rounded",
      eyeShape: "rounded",
      errorCorrection: "Q",
      autoOptimizeEcc: true,
      quietZone: 4,
      logo: { ...baseLogo },
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    category: "gradient",
    description: "Warm amber to coral — high energy for festivals.",
    swatch: ["#f59e0b", "#ef4444", "#db2777"],
    config: {
      foreground: "#ea580c",
      foregroundGradient: {
        type: "radial",
        stops: [
          { offset: 0, color: "#f59e0b" },
          { offset: 1, color: "#db2777" },
        ],
      },
      background: "#fffbeb",
      eyeColor: "#c2410c",
      moduleShape: "dots",
      eyeShape: "circle",
      errorCorrection: "Q",
      autoOptimizeEcc: true,
      quietZone: 4,
      logo: { ...baseLogo, background: "#fffbeb" },
    },
  },
  // ── NEON ────────────────────────────────────────────────────────────────
  {
    id: "neon-pulse",
    name: "Neon Pulse",
    category: "neon",
    description: "Glowing cyan on near-black — built for dark bars.",
    swatch: ["#22d3ee", "#0ea5e9", "#06070d"],
    config: {
      foreground: "#22d3ee",
      foregroundGradient: {
        type: "linear",
        rotation: 90,
        stops: [
          { offset: 0, color: "#5eead4" },
          { offset: 1, color: "#22d3ee" },
        ],
      },
      background: "#06070d",
      eyeColor: "#67e8f9",
      eyeColorInner: "#a5f3fc",
      moduleShape: "rounded",
      eyeShape: "rounded",
      errorCorrection: "H",
      autoOptimizeEcc: true,
      quietZone: 4,
      logo: { ...baseLogo, background: "#06070d", kind: "instagram" },
      glow: { enabled: true, color: "#22d3ee", blur: 2.2 },
    },
  },
  {
    id: "neon-magenta",
    name: "Neon Magenta",
    category: "neon",
    description: "Hot pink glow on charcoal — nightclub energy.",
    swatch: ["#f472b6", "#db2777", "#0a0a0f"],
    config: {
      foreground: "#f472b6",
      background: "#0a0a0f",
      eyeColor: "#f9a8d4",
      moduleShape: "dots",
      eyeShape: "circle",
      errorCorrection: "H",
      autoOptimizeEcc: true,
      quietZone: 4,
      logo: { ...baseLogo, background: "#0a0a0f" },
      glow: { enabled: true, color: "#ec4899", blur: 2.4 },
    },
  },
  // ── CHROME / METALLIC ─────────────────────────────────────────────────────
  {
    id: "chrome-silver",
    name: "Liquid Chrome",
    category: "chrome",
    description: "Brushed metallic gradient with crisp eyes.",
    swatch: ["#94a3b8", "#475569", "#e2e8f0"],
    config: {
      foreground: "#334155",
      foregroundGradient: {
        type: "linear",
        rotation: 135,
        stops: [
          { offset: 0, color: "#1e293b" },
          { offset: 0.45, color: "#64748b" },
          { offset: 0.55, color: "#cbd5e1" },
          { offset: 1, color: "#334155" },
        ],
      },
      background: "#f8fafc",
      eyeColor: "#0f172a",
      moduleShape: "classy",
      eyeShape: "square",
      errorCorrection: "Q",
      autoOptimizeEcc: true,
      quietZone: 4,
      logo: { ...baseLogo, background: "#f8fafc" },
    },
  },
  // ── CYBERPUNK ──────────────────────────────────────────────────────────────
  {
    id: "cyberpunk",
    name: "Cyberpunk 2099",
    category: "cyberpunk",
    description: "Yellow-cyan split on black with glitch eyes.",
    swatch: ["#fde047", "#22d3ee", "#0d0208"],
    config: {
      foreground: "#fde047",
      foregroundGradient: {
        type: "linear",
        rotation: 25,
        stops: [
          { offset: 0, color: "#fde047" },
          { offset: 0.5, color: "#f0abfc" },
          { offset: 1, color: "#22d3ee" },
        ],
      },
      background: "#0d0208",
      eyeColor: "#22d3ee",
      eyeColorInner: "#fde047",
      moduleShape: "square",
      eyeShape: "square",
      errorCorrection: "H",
      autoOptimizeEcc: true,
      quietZone: 4,
      logo: { ...baseLogo, background: "#0d0208" },
      glow: { enabled: true, color: "#22d3ee", blur: 1.6 },
    },
  },
  // ── MINIMAL LUXURY ──────────────────────────────────────────────────────────
  {
    id: "noir",
    name: "Noir Luxe",
    category: "luxury",
    description: "Matte black on bone-white. Understated, expensive.",
    swatch: ["#0a0a0a", "#171717", "#fafaf9"],
    config: {
      foreground: "#0a0a0a",
      background: "#fafaf9",
      eyeColor: "#0a0a0a",
      moduleShape: "rounded",
      eyeShape: "leaf",
      errorCorrection: "M",
      autoOptimizeEcc: true,
      quietZone: 5,
      logo: { ...baseLogo, background: "#fafaf9", scale: 0.18 },
    },
  },
  {
    id: "champagne",
    name: "Champagne Gold",
    category: "luxury",
    description: "Soft gold foil on cream — premium creator brand.",
    swatch: ["#b45309", "#d4af37", "#fffbeb"],
    config: {
      foreground: "#b45309",
      foregroundGradient: {
        type: "linear",
        rotation: 120,
        stops: [
          { offset: 0, color: "#92400e" },
          { offset: 0.5, color: "#d4af37" },
          { offset: 1, color: "#a16207" },
        ],
      },
      background: "#fffdf5",
      eyeColor: "#92400e",
      moduleShape: "classy",
      eyeShape: "rounded",
      errorCorrection: "Q",
      autoOptimizeEcc: true,
      quietZone: 4,
      logo: { ...baseLogo, background: "#fffdf5" },
    },
  },
  // ── CREATOR / INFLUENCER ─────────────────────────────────────────────────────
  {
    id: "creator-gram",
    name: "Creator Gram",
    category: "creator",
    description: "Instagram-style sunset gradient with avatar slot.",
    swatch: ["#feda75", "#d62976", "#4f5bd5"],
    config: {
      foreground: "#d62976",
      foregroundGradient: {
        type: "linear",
        rotation: 45,
        stops: [
          { offset: 0, color: "#feda75" },
          { offset: 0.35, color: "#fa7e1e" },
          { offset: 0.65, color: "#d62976" },
          { offset: 1, color: "#4f5bd5" },
        ],
      },
      background: "#ffffff",
      eyeColor: "#962fbf",
      eyeColorInner: "#d62976",
      moduleShape: "rounded",
      eyeShape: "rounded",
      errorCorrection: "H",
      autoOptimizeEcc: true,
      quietZone: 4,
      logo: { ...baseLogo, kind: "profile", scale: 0.24 },
    },
  },
];

export const THEME_MAP: Record<string, ThemePreset> = Object.fromEntries(
  THEMES.map((t) => [t.id, t]),
);

export const DEFAULT_THEME_ID = "aurora";

export function getThemeConfig(themeId: string): QrDesignConfig {
  const preset = THEME_MAP[themeId] ?? THEME_MAP[DEFAULT_THEME_ID];
  return { themeId: preset.id, ...structuredClone(preset.config) };
}
