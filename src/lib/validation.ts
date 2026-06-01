import { z } from "zod";

// ─── Instagram handle ────────────────────────────────────────────────────────
// Instagram rules: 1–30 chars, letters/numbers/period/underscore, no leading/
// trailing period, no consecutive periods. We strip a leading '@' and lowercase.
const HANDLE_RE = /^(?!.*\.\.)(?!\.)(?!.*\.$)[a-zA-Z0-9._]{1,30}$/;

const RESERVED = new Set([
  "instagram", "about", "explore", "accounts", "directory", "developer",
  "p", "reels", "stories", "admin", "support", "legal", "privacy",
]);

export function normalizeHandle(input: string): string {
  return input.trim().replace(/^@+/, "").toLowerCase();
}

export const handleSchema = z
  .string()
  .transform(normalizeHandle)
  .refine((h) => HANDLE_RE.test(h), {
    message:
      "Enter a valid Instagram handle (letters, numbers, periods, underscores).",
  })
  .refine((h) => !RESERVED.has(h), {
    message: "That handle is reserved by Instagram.",
  });

export function instagramUrl(handle: string): string {
  return `https://instagram.com/${normalizeHandle(handle)}`;
}

// ─── Design config (mirrors src/lib/qr/types.ts; stored as JSON) ─────────────
const gradientStop = z.object({
  offset: z.number().min(0).max(1),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/),
});

const gradient = z.object({
  type: z.enum(["linear", "radial"]),
  rotation: z.number().optional(),
  stops: z.array(gradientStop).min(2).max(6),
});

const logo = z.object({
  enabled: z.boolean(),
  kind: z.enum(["instagram", "profile", "custom"]),
  src: z.string().url().or(z.string().startsWith("data:")).optional(),
  scale: z.number().min(0.1).max(0.3),
  padding: z.number().min(0).max(40),
  background: z.string(),
  borderRadius: z.number().min(0).max(64),
});

export const designConfigSchema = z.object({
  themeId: z.string().max(40),
  foreground: z.string(),
  foregroundGradient: gradient.optional(),
  background: z.string(),
  backgroundGradient: gradient.optional(),
  eyeColor: z.string().optional(),
  eyeColorInner: z.string().optional(),
  moduleShape: z.enum(["square", "rounded", "dots", "classy"]),
  eyeShape: z.enum(["square", "rounded", "circle", "leaf"]),
  errorCorrection: z.enum(["L", "M", "Q", "H"]),
  autoOptimizeEcc: z.boolean(),
  quietZone: z.number().min(0).max(12),
  logo,
  glow: z
    .object({ enabled: z.boolean(), color: z.string(), blur: z.number().min(0).max(8) })
    .optional(),
});

export const createQrSchema = z.object({
  handle: handleSchema,
  themeId: z.string().max(40).default("aurora"),
  design: designConfigSchema,
  title: z.string().max(80).optional(),
});

export const exportSchema = z.object({
  handle: handleSchema,
  design: designConfigSchema,
  format: z.enum(["png", "svg", "pdf"]),
  size: z.enum(["S50", "S75", "S100"]),
  qrCodeId: z.string().cuid().optional(),
});

export type CreateQrInput = z.infer<typeof createQrSchema>;
export type ExportInput = z.infer<typeof exportSchema>;
