import type { Metadata, Viewport } from "next";
import { Inter, Sora, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Sora({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "ScanMe — Instagram QR Code Generator & Sticker Maker",
    template: "%s · ScanMe",
  },
  description:
    "Create a stunning, scannable Instagram QR code in seconds. Download print-ready sticker QR codes (PNG, SVG, PDF) at 300 DPI and track every scan. The premium QR code for Instagram.",
  keywords: [
    "Instagram QR Code Generator",
    "Instagram Sticker QR Code",
    "QR Code For Instagram",
    "Creator QR Stickers",
    "Instagram QR maker",
    "QR code sticker printing",
  ],
  applicationName: "ScanMe",
  authors: [{ name: "ScanMe" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "ScanMe",
    title: "ScanMe — Instagram QR Code Generator & Sticker Maker",
    description:
      "Design a premium, highly-scannable Instagram QR sticker and track real-world scans.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "ScanMe" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ScanMe — Instagram QR Code Generator",
    description:
      "Premium Instagram QR stickers with scan analytics. Print-ready at 300 DPI.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${sans.variable} ${display.variable} ${mono.variable} font-sans`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
