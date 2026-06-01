import "server-only";
import { createHash } from "node:crypto";
import { UAParser } from "ua-parser-js";

export function getClientIp(headers: Headers): string {
  // Render/Cloudflare forwarded headers, in priority order.
  const candidates = [
    headers.get("cf-connecting-ip"),
    headers.get("x-real-ip"),
    headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
  ];
  return candidates.find(Boolean) ?? "0.0.0.0";
}

// Privacy-preserving visitor fingerprint. We never persist the raw IP — only a
// salted hash scoped per-day so the same device counts once per day.
export function visitorHash(headers: Headers, qrCodeId: string): string {
  const ip = getClientIp(headers);
  const ua = headers.get("user-agent") ?? "";
  const salt = process.env.SCAN_HASH_SALT ?? "dev-salt";
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256")
    .update(`${ip}|${ua}|${qrCodeId}|${day}|${salt}`)
    .digest("hex")
    .slice(0, 32);
}

const BOT_RE =
  /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|headless|curl|wget|python-requests|axios|go-http/i;

export interface ParsedAgent {
  device: "mobile" | "tablet" | "desktop";
  os?: string;
  browser?: string;
  isBot: boolean;
}

export function parseAgent(ua: string): ParsedAgent {
  if (!ua || BOT_RE.test(ua)) {
    return { device: "desktop", isBot: true };
  }
  const parsed = UAParser(ua);
  const type = parsed.device.type;
  const device =
    type === "mobile" ? "mobile" : type === "tablet" ? "tablet" : "desktop";
  return {
    device,
    os: parsed.os.name,
    browser: parsed.browser.name,
    isBot: false,
  };
}

// Render forwards approximate geo via Cloudflare-style headers if proxied.
export function getGeo(headers: Headers) {
  return {
    country: headers.get("cf-ipcountry")?.slice(0, 2) ?? undefined,
    region: headers.get("x-vercel-ip-country-region") ?? undefined,
    city: headers.get("x-vercel-ip-city") ?? undefined,
  };
}
