import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordScan } from "@/lib/analytics";
import { rateLimit, LIMITS } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /r/:slug — the URL physically printed on every sticker.
// Records the scan, then 302-redirects to the Instagram profile. We redirect
// FIRST-class fast: tracking is awaited but capped, and we always redirect.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const qr = await prisma.qrCode.findUnique({
    where: { slug },
    select: { id: true, targetUrl: true },
  });

  // Unknown slug → send to Instagram home rather than a dead end.
  if (!qr) return NextResponse.redirect("https://instagram.com", 302);

  // Abuse guard: cap scans per-IP so a bot can't inflate counts.
  const ip = getClientIp(req.headers);
  const rl = await rateLimit(`${ip}:${qr.id}`, LIMITS.scan);

  if (rl.ok) {
    try {
      await recordScan(qr.id, req.headers);
    } catch {
      // Never let analytics failure block the redirect.
    }
  }

  const res = NextResponse.redirect(qr.targetUrl, 302);
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}
