import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createQrSchema, instagramUrl } from "@/lib/validation";
import { analyzeContrast } from "@/lib/qr/contrast";
import { rateLimit, LIMITS } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

export const runtime = "nodejs";

// POST /api/qr — create (or upsert) a tracked QR code.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const session = await auth();
  const rl = await rateLimit(session?.user?.id ?? ip, LIMITS.qrCreate);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Slow down." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = createQrSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const { handle, themeId, design, title } = parsed.data;

  // Refuse to persist designs that won't scan reliably.
  const contrast = analyzeContrast(design);
  if (!contrast.safe) {
    return NextResponse.json(
      { error: contrast.message, contrast },
      { status: 422 },
    );
  }

  const qr = await prisma.qrCode.create({
    data: {
      userId: session?.user?.id ?? null,
      handle,
      targetUrl: instagramUrl(handle),
      themeId,
      design,
      title: title ?? `@${handle}`,
    },
    select: { id: true, slug: true, handle: true, targetUrl: true, themeId: true },
  });

  return NextResponse.json({ qr, contrast }, { status: 201 });
}

// GET /api/qr — list the signed-in user's codes.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const codes = await prisma.qrCode.findMany({
    where: { userId: session.user.id, archived: false },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      handle: true,
      title: true,
      themeId: true,
      createdAt: true,
      _count: { select: { scanEvents: true } },
    },
  });
  return NextResponse.json({ codes });
}
