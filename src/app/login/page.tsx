import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { QrCode } from "lucide-react";
import { auth, signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to ScanMe to save QR codes and view scan analytics.",
  robots: { index: false, follow: false },
};

const hasGoogle = !!process.env.AUTH_GOOGLE_ID;
const hasEmail = !!process.env.EMAIL_SERVER;

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="relative grid min-h-screen place-items-center px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 aurora-bg" />
      <Card className="glass w-full max-w-sm p-8">
        <Link href="/" className="mb-6 flex items-center gap-2 font-display text-lg font-semibold">
          <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-rose-500 text-white">
            <QrCode className="size-4" />
          </span>
          ScanMe
        </Link>
        <h1 className="font-display text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to save codes and track scans.
        </p>

        <div className="mt-6 space-y-3">
          {hasGoogle && (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
            >
              <Button type="submit" variant="secondary" className="w-full">
                Continue with Google
              </Button>
            </form>
          )}

          {hasEmail && (
            <>
              {hasGoogle && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
                </div>
              )}
              <form
                action={async (formData: FormData) => {
                  "use server";
                  await signIn("nodemailer", {
                    email: String(formData.get("email")),
                    redirectTo: "/dashboard",
                  });
                }}
                className="space-y-3"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                </div>
                <Button type="submit" variant="gradient" className="w-full">
                  Send magic link
                </Button>
              </form>
            </>
          )}

          {!hasGoogle && !hasEmail && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
              No auth provider configured. Set <code>AUTH_GOOGLE_ID</code> or{" "}
              <code>EMAIL_SERVER</code> in your environment.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
