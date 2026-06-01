import Link from "next/link";
import { redirect } from "next/navigation";
import { QrCode, LayoutDashboard, LogOut } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/" className="flex items-center gap-2 font-display font-semibold">
              <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-rose-500 text-white">
                <QrCode className="size-4" />
              </span>
              ScanMe
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <LayoutDashboard className="size-4" />
                <span className="hidden sm:inline">Overview</span>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button asChild size="sm" variant="gradient">
              <Link href="/generator">New QR</Link>
            </Button>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.user.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" size="icon" variant="ghost" aria-label="Sign out">
                <LogOut className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
}
