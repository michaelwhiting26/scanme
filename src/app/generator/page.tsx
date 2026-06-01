import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Generator } from "@/components/qr/generator";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Instagram QR Code Generator — Create a Scannable Sticker",
  description:
    "Free Instagram QR code generator. Design a premium, branded, highly-scannable QR sticker for your @handle and download print-ready PNG, SVG or PDF at 300 DPI.",
  alternates: { canonical: "/generator" },
};

export default async function GeneratorPage() {
  const session = await auth();
  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 -z-10 grid-bg" />
      <SiteHeader />
      <main className="container py-10">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Instagram QR Code Generator
          </h1>
          <p className="mt-2 text-muted-foreground">
            Enter your @handle, choose a premium theme, and export a print-ready sticker.
          </p>
        </div>
        <Card className="glass mx-auto mt-8 max-w-5xl p-5 sm:p-8">
          <Generator canSave={!!session?.user} />
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
