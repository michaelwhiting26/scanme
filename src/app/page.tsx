import Link from "next/link";
import {
  Sparkles, Zap, Shield, BarChart3, Printer, Palette,
  ArrowRight, Check,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Generator } from "@/components/qr/generator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth";

const FEATURES = [
  { icon: Palette, title: "6 premium design families", body: "Gradient, neon, chrome, cyberpunk, luxury & creator themes — never a generic black-and-white code." },
  { icon: Shield, title: "Scan-reliable by design", body: "Live contrast checks, enforced quiet zones and auto error-correction keep every code readable in the wild." },
  { icon: Printer, title: "Print-ready exports", body: "PNG, SVG and PDF at 300 DPI in 50/75/100mm sticker sizes — straight to the print shop." },
  { icon: BarChart3, title: "Real-world scan analytics", body: "Every scan tracked: total, unique, device, location and time across today / 7d / 30d / all-time." },
  { icon: Zap, title: "Instant generation", body: "Type your @handle and watch the design render live. No sign-up needed to start." },
  { icon: Sparkles, title: "Mockup previews", body: "See your sticker on a laptop, phone, bar counter, street pole, car window or festival band before you print." },
];

const FAQ = [
  { q: "How do I make an Instagram QR code?", a: "Enter your Instagram @handle, pick a premium theme, and ScanMe instantly generates a branded, scannable QR code linking to your profile. Download it as PNG, SVG or print-ready PDF." },
  { q: "Are the QR codes free to download?", a: "Yes. You can generate and download high-resolution Instagram QR codes for free. A free account unlocks saved codes and scan analytics." },
  { q: "Will the QR code still scan with custom colors and a logo?", a: "Yes. ScanMe runs a live contrast check, preserves the quiet zone and automatically raises error correction when you add a logo, so your code stays reliable." },
  { q: "What size should I print my QR sticker?", a: "We export at 50×50mm, 75×75mm and 100×100mm at 300 DPI. 75mm is ideal for bars, poles and laptops; 100mm for windows and posters." },
];

export default async function HomePage() {
  const session = await auth();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "ScanMe — Instagram QR Code Generator",
        applicationCategory: "DesignApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", ratingCount: "1280" },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="relative min-h-screen">
        <div className="pointer-events-none absolute inset-0 -z-10 aurora-bg" />
        <div className="pointer-events-none absolute inset-0 -z-10 grid-bg" />
        <SiteHeader />

        {/* Hero */}
        <section className="container pb-12 pt-16 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="glass" className="mx-auto mb-5 gap-1.5">
              <Sparkles className="size-3 text-brand-400" />
              The premium Instagram QR code generator
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              <span className="text-gradient">Turn your Instagram into</span>
              <br />
              <span className="text-brand-gradient">scannable street art.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
              Generate a stunning, highly-scannable <strong className="text-foreground">Instagram QR sticker</strong> in
              seconds. Print it, stick it anywhere, and track every scan that turns into a follower.
            </p>
            <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" variant="gradient">
                <Link href="/generator">Create your QR <ArrowRight /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#features">Explore features</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              No sign-up to start · PNG / SVG / PDF · 300 DPI print-ready
            </p>
          </div>

          {/* Inline generator */}
          <div className="mx-auto mt-14 max-w-5xl">
            <Card className="glass p-5 sm:p-8">
              <Generator canSave={!!session?.user} />
            </Card>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Everything a creator needs to get scanned
            </h2>
            <p className="mt-3 text-muted-foreground">
              Built for nightclubs, bars, festivals, campuses and street marketing.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card key={f.title} className="group p-6 transition-colors hover:border-primary/40">
                <div className="mb-4 grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </div>
                <h3 className="font-medium">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="container py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center font-display text-3xl font-bold tracking-tight">
              Frequently asked
            </h2>
            <div className="mt-10 space-y-4">
              {FAQ.map((f) => (
                <Card key={f.q} className="p-6">
                  <h3 className="flex items-start gap-2 font-medium">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {f.q}
                  </h3>
                  <p className="mt-2 pl-6 text-sm text-muted-foreground">{f.a}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container pb-24">
          <Card className="glass relative overflow-hidden p-10 text-center">
            <div className="pointer-events-none absolute inset-0 aurora-bg opacity-60" />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold tracking-tight">
                Ready to get scanned?
              </h2>
              <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                Design your Instagram QR sticker now — free, no sign-up to start.
              </p>
              <Button asChild size="lg" variant="gradient" className="mt-6">
                <Link href="/generator">Open the generator <ArrowRight /></Link>
              </Button>
            </div>
          </Card>
        </section>

        <SiteFooter />
      </div>
    </>
  );
}
