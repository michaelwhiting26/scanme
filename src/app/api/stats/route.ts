import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStats, type Range } from "@/lib/analytics";

export const runtime = "nodejs";

// GET /api/stats?range=7d&qr=<id>  — stats for one code or the whole account.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const range = (url.searchParams.get("range") ?? "7d") as Range;
  const qrId = url.searchParams.get("qr");

  const codes = await prisma.qrCode.findMany({
    where: { userId: session.user.id, ...(qrId ? { id: qrId } : {}) },
    select: { id: true },
  });
  const ids = codes.map((c) => c.id);

  const stats = await getStats(ids, range);
  return NextResponse.json({ range, stats });
}
