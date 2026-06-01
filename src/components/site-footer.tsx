import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} ScanMe. Built for creators.</p>
        <nav className="flex gap-6">
          <Link href="/generator" className="hover:text-foreground">Generator</Link>
          <Link href="/login" className="hover:text-foreground">Sign in</Link>
          <Link href="/#features" className="hover:text-foreground">Features</Link>
        </nav>
      </div>
    </footer>
  );
}
