import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getPrinterProvider, listPrinterProviders } from "@/server/printer/registry";
import { absoluteUrl } from "@/lib/utils";

export const runtime = "nodejs";

// GET /api/print — discoverable provider catalogue (capabilities).
export async function GET() {
  return NextResponse.json({ providers: listPrinterProviders() });
}

const schema = z.object({
  qrCodeId: z.string().cuid(),
  vendor: z.enum(["BROTHER_QL", "DYMO", "ZEBRA", "GENERIC_PDF"]).default("GENERIC_PDF"),
  size: z.enum(["S50", "S75", "S100"]).default("S75"),
  copies: z.number().int().min(1).max(500).default(1),
  spec: z.record(z.unknown()).optional(),
});

// POST /api/print — create a print job and return the print-ready artifact.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 422 });
  const { qrCodeId, vendor, size, copies, spec } = parsed.data;

  const qr = await prisma.qrCode.findFirst({
    where: { id: qrCodeId, userId: session.user.id },
  });
  if (!qr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const provider = getPrinterProvider(vendor);
  const data = absoluteUrl(`/r/${qr.slug}`);
  const input = {
    data,
    config: qr.design as never,
    size,
    copies,
    spec,
  };

  const can = provider.supports(input);
  if (!can.ok)
    return NextResponse.json({ error: can.reason }, { status: 422 });

  const job = await prisma.printerJob.create({
    data: {
      qrCodeId,
      userId: session.user.id,
      vendor,
      size,
      copies,
      spec: (spec ?? {}) as Prisma.InputJsonValue,
      status: "RENDERING",
    },
  });

  try {
    const artifact = await provider.render(input);
    await prisma.printerJob.update({
      where: { id: job.id },
      data: { status: "READY" },
    });
    return new NextResponse(new Uint8Array(artifact.buffer), {
      headers: {
        "Content-Type": artifact.contentType,
        "Content-Disposition": `attachment; filename="${artifact.filename}"`,
        "X-Print-Job-Id": job.id,
        "X-Device-Ready": String(artifact.deviceReady),
      },
    });
  } catch (e) {
    await prisma.printerJob.update({
      where: { id: job.id },
      data: { status: "FAILED", error: String(e) },
    });
    return NextResponse.json({ error: "Print render failed" }, { status: 500 });
  }
}
