import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { designConfigSchema } from "@/lib/validation";
import { analyzeContrast } from "@/lib/qr/contrast";

export const runtime = "nodejs";

const patchSchema = z.object({
  title: z.string().max(80).optional(),
  themeId: z.string().max(40).optional(),
  design: designConfigSchema.optional(),
  archived: z.boolean().optional(),
});

async function owned(id: string, userId: string) {
  const qr = await prisma.qrCode.findUnique({ where: { id }, select: { userId: true } });
  return qr?.userId === userId;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const qr = await prisma.qrCode.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!qr) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ qr });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await owned(id, session.user.id)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = patchSchema.safeParse(await req.json().catch(() => null));
  if (!body.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  if (body.data.design) {
    const contrast = analyzeContrast(body.data.design);
    if (!contrast.safe)
      return NextResponse.json({ error: contrast.message }, { status: 422 });
  }

  const qr = await prisma.qrCode.update({ where: { id }, data: body.data });
  return NextResponse.json({ qr });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await owned(id, session.user.id)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.qrCode.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
