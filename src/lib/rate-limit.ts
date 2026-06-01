import "server-only";
import { prisma } from "./db";

// Pluggable rate limiter. Uses Upstash Redis when configured (best for
// multi-instance Render deploys); otherwise falls back to a Postgres bucket.
// Fixed-window counter — cheap and good enough for abuse prevention.

export interface RateResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

const hasRedis =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateResult> {
  const base = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const headers = { Authorization: `Bearer ${token}` };
  // INCR then set EXPIRE on first hit (NX) via pipeline.
  const res = await fetch(`${base}/pipeline`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, windowSec, "NX"],
      ["PTTL", key],
    ]),
    cache: "no-store",
  });
  const [incr, , pttl] = (await res.json()) as { result: number }[];
  const count = incr.result;
  const ttl = pttl.result;
  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt: Date.now() + (ttl > 0 ? ttl : windowSec * 1000),
  };
}

async function pgLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateResult> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowSec * 1000);
  // Atomic upsert: reset the window if expired, else increment.
  const bucket = await prisma.$transaction(async (tx) => {
    const existing = await tx.rateBucket.findUnique({ where: { key } });
    if (!existing || existing.expiresAt < now) {
      return tx.rateBucket.upsert({
        where: { key },
        create: { key, count: 1, expiresAt },
        update: { count: 1, expiresAt },
      });
    }
    return tx.rateBucket.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
  });
  return {
    ok: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.expiresAt.getTime(),
  };
}

export async function rateLimit(
  identifier: string,
  opts: { limit: number; windowSec: number; namespace: string },
): Promise<RateResult> {
  const key = `rl:${opts.namespace}:${identifier}`;
  try {
    return hasRedis
      ? await redisLimit(key, opts.limit, opts.windowSec)
      : await pgLimit(key, opts.limit, opts.windowSec);
  } catch {
    // Fail open on limiter errors — never block legitimate traffic on infra hiccups.
    return { ok: true, remaining: opts.limit, resetAt: Date.now() + opts.windowSec * 1000 };
  }
}

// Common presets.
export const LIMITS = {
  qrCreate: { limit: 30, windowSec: 60, namespace: "qr:create" },
  export: { limit: 60, windowSec: 60, namespace: "qr:export" },
  scan: { limit: 120, windowSec: 60, namespace: "scan" },
} as const;
