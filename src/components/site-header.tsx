import Link from "next/link";
import { QrCode } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const session = await auth();
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
          <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-rose-500 text-white">
            <QrCode className="size-4" />
          </span>
          ScanMe
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="/#features" className="hover:text-foreground">Features</Link>
          <Link href="/#themes" className="hover:text-foreground">Themes</Link>
          <Link href="/generator" className="hover:text-foreground">Generator</Link>
          <Link href="/#pricing" className="hover:text-foreground">Pricing</Link>
        </nav>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <Button asChild size="sm" variant="gradient">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" variant="gradient">
                <Link href="/generator">Create QR</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
