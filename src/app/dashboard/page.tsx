import Link from "next/link";
import { Plus, QrCode } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/utils";
import { AnalyticsPanel } from "@/components/dashboard/analytics-panel";
import { CodeCard, type CodeCardData } from "@/components/dashboard/code-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { QrDesignConfig } from "@/lib/qr/types";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  const codes = await prisma.qrCode.findMany({
    where: { userId: session!.user!.id, archived: false },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, slug: true, handle: true, title: true, design: true,
      _count: { select: { scanEvents: true } },
    },
  });

  const cards: CodeCardData[] = codes.map((c) => ({
    id: c.id,
    slug: c.slug,
    handle: c.handle,
    title: c.title,
    trackedUrl: absoluteUrl(`/r/${c.slug}`),
    design: c.design as unknown as QrDesignConfig,
    scans: c._count.scanEvents,
  }));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Welcome{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground">Your QR codes and real-world scan performance.</p>
      </div>

      <AnalyticsPanel />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Your QR codes</h2>
          <Button asChild size="sm" variant="gradient">
            <Link href="/generator"><Plus /> New</Link>
          </Button>
        </div>

        {cards.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <QrCode className="size-6" />
            </div>
            <div>
              <p className="font-medium">No saved codes yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first tracked Instagram QR sticker.
              </p>
            </div>
            <Button asChild variant="gradient">
              <Link href="/generator">Create a QR code</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {cards.map((c) => (
              <CodeCard key={c.id} code={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
