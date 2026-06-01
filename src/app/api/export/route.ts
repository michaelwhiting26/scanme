import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { exportSchema, instagramUrl } from "@/lib/validation";
import { exportQr } from "@/lib/qr/export";
import { analyzeContrast } from "@/lib/qr/contrast";
import { rateLimit, LIMITS } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { absoluteUrl } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 30;

const FORMAT_ENUM = { png: "PNG", svg: "SVG", pdf: "PDF" } as const;

// POST /api/export — returns the binary asset as a download.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const session = await auth();
  const rl = await rateLimit(session?.user?.id ?? ip, LIMITS.export);
  if (!rl.ok)
    return NextResponse.json({ error: "Too many exports." }, { status: 429 });

  const parsed = exportSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  const { handle, design, format, size, qrCodeId } = parsed.data;

  const contrast = analyzeContrast(design);
  if (!contrast.safe)
    return NextResponse.json({ error: contrast.message }, { status: 422 });

  // Saved codes encode the tracked redirect (enables analytics); anonymous
  // exports encode the Instagram URL directly.
  let data = instagramUrl(handle);
  if (qrCodeId) {
    const qr = await prisma.qrCode.findUnique({
      where: { id: qrCodeId },
      select: { slug: true, userId: true },
    });
    if (qr) data = absoluteUrl(`/r/${qr.slug}`);
  }

  const result = await exportQr({ data, config: design, format, size });

  // Best-effort download log (don't fail the export if logging fails).
  if (qrCodeId) {
    prisma.download
      .create({
        data: {
          qrCodeId,
          userId: session?.user?.id ?? null,
          format: FORMAT_ENUM[format],
          size,
          bytes: result.bytes,
        },
      })
      .catch(() => {});
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Content-Length": String(result.bytes),
      "Cache-Control": "no-store",
    },
  });
}
