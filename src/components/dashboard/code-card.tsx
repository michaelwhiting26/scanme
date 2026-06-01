"use client";
import * as React from "react";
import Link from "next/link";
import { Download, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { QrPreview } from "@/components/qr/qr-preview";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { QrDesignConfig } from "@/lib/qr/types";

export interface CodeCardData {
  id: string;
  slug: string;
  handle: string;
  title: string | null;
  trackedUrl: string;
  design: QrDesignConfig;
  scans: number;
}

export function CodeCard({ code }: { code: CodeCardData }) {
  const [busy, setBusy] = React.useState(false);
  const [removed, setRemoved] = React.useState(false);

  async function exportPng() {
    setBusy(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: code.handle,
          design: code.design,
          format: "pdf",
          size: "S75",
          qrCodeId: code.id,
        }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scanme-${code.handle}-75mm.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete the QR code for @${code.handle}? Scan history will be lost.`)) return;
    setBusy(true);
    const res = await fetch(`/api/qr/${code.id}`, { method: "DELETE" });
    if (res.ok) setRemoved(true);
    setBusy(false);
  }

  if (removed) return null;

  return (
    <Card className="group overflow-hidden p-4">
      <div className="mb-3 flex items-center justify-center rounded-xl bg-white p-3">
        <QrPreview data={code.trackedUrl} config={code.design} size={150} />
      </div>
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">@{code.handle}</p>
          <p className="text-xs text-muted-foreground">{code.scans} scans</p>
        </div>
        <Link
          href={`https://instagram.com/${code.handle}`}
          target="_blank"
          className="text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="size-4" />
        </Link>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="secondary" className="flex-1" onClick={exportPng} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Download />} PDF
        </Button>
        <Button size="sm" variant="ghost" onClick={remove} disabled={busy} aria-label="Delete">
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </Card>
  );
}
