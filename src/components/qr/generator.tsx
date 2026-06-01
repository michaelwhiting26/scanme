"use client";
import * as React from "react";
import { Download, Loader2, Save, Check, AlertTriangle, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { QrPreview } from "./qr-preview";
import { ThemePicker } from "./theme-picker";
import { MockupStage, SCENES, type MockupScene } from "@/components/mockups/mockup-stage";
import { getThemeConfig } from "@/lib/qr/themes";
import { analyzeContrast } from "@/lib/qr/contrast";
import { normalizeHandle, instagramUrl } from "@/lib/validation";
import type { ModuleShape, EyeShape, QrDesignConfig } from "@/lib/qr/types";
import { STICKER_SIZES, type StickerSizeId } from "@/lib/qr/sizes";
import { cn } from "@/lib/utils";

const HANDLE_RE = /^(?!.*\.\.)(?!\.)(?!.*\.$)[a-z0-9._]{1,30}$/;
const MODULE_SHAPES: ModuleShape[] = ["rounded", "square", "dots", "classy"];
const EYE_SHAPES: EyeShape[] = ["rounded", "square", "circle", "leaf"];

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function Generator({ canSave = false }: { canSave?: boolean }) {
  const [rawHandle, setRawHandle] = React.useState("");
  const [themeId, setThemeId] = React.useState("aurora");
  const [config, setConfig] = React.useState<QrDesignConfig>(() =>
    getThemeConfig("aurora"),
  );
  const [size, setSize] = React.useState<StickerSizeId>("S75");
  const [scene, setScene] = React.useState<MockupScene>("laptop");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const handle = normalizeHandle(rawHandle);
  const valid = HANDLE_RE.test(handle);
  // Preview encodes the live Instagram URL; saved codes swap to a tracked URL.
  const previewData = valid ? instagramUrl(handle) : "https://instagram.com";

  // Switching theme resets the design but keeps the chosen handle.
  function pickTheme(id: string) {
    setThemeId(id);
    setConfig(getThemeConfig(id));
    setSaved(false);
  }

  function patch(p: Partial<QrDesignConfig>) {
    setConfig((c) => ({ ...c, ...p }));
    setSaved(false);
  }

  const contrast = analyzeContrast(config);

  async function handleExport(format: "png" | "svg" | "pdf") {
    if (!valid) return;
    setBusy(format);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, design: config, format, size }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        alert(e.error ?? "Export failed");
        return;
      }
      const blob = await res.blob();
      download(blob, `scanme-${handle}-${STICKER_SIZES[size].mm}mm.${format}`);
    } finally {
      setBusy(null);
    }
  }

  async function handleSave() {
    if (!valid) return;
    setBusy("save");
    try {
      const res = await fetch("/api/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, themeId, design: config, title: `@${handle}` }),
      });
      if (res.ok) setSaved(true);
      else {
        const e = await res.json().catch(() => ({}));
        alert(e.error ?? "Could not save");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(360px,440px)]">
      {/* ── Controls ─────────────────────────────────────────────── */}
      <div className="order-2 space-y-6 lg:order-1">
        <div className="space-y-2">
          <Label htmlFor="handle">Instagram handle</Label>
          <div className="relative">
            <Instagram className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <span className="pointer-events-none absolute left-9 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              @
            </span>
            <Input
              id="handle"
              value={rawHandle}
              onChange={(e) => {
                setRawHandle(e.target.value);
                setSaved(false);
              }}
              placeholder="johnsmith"
              className="pl-12"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={31}
            />
          </div>
          {rawHandle && !valid && (
            <p className="text-xs text-destructive">
              Enter a valid handle — letters, numbers, “.” and “_”.
            </p>
          )}
          {valid && (
            <p className="font-mono text-xs text-muted-foreground">
              → {instagramUrl(handle)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Theme</Label>
          <ThemePicker value={themeId} onChange={pickTheme} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Module style</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {MODULE_SHAPES.map((m) => (
                <button
                  key={m}
                  onClick={() => patch({ moduleShape: m })}
                  className={cn(
                    "rounded-lg border px-2 py-1.5 text-xs capitalize transition-colors",
                    config.moduleShape === m
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-accent",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Eye style</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {EYE_SHAPES.map((e) => (
                <button
                  key={e}
                  onClick={() => patch({ eyeShape: e })}
                  className={cn(
                    "rounded-lg border px-2 py-1.5 text-xs capitalize transition-colors",
                    config.eyeShape === e
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-accent",
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Embed logo</p>
            <p className="text-xs text-muted-foreground">
              Center mark. Error correction auto-upgrades to stay scannable.
            </p>
          </div>
          <button
            role="switch"
            aria-checked={config.logo.enabled}
            onClick={() => patch({ logo: { ...config.logo, enabled: !config.logo.enabled } })}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              config.logo.enabled ? "bg-primary" : "bg-secondary",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-5 rounded-full bg-white transition-transform",
                config.logo.enabled ? "translate-x-[22px]" : "translate-x-0.5",
              )}
            />
          </button>
        </div>
      </div>

      {/* ── Preview + export ─────────────────────────────────────── */}
      <div className="order-1 space-y-4 lg:order-2">
        <Card className="glass overflow-hidden p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-[300px] rounded-2xl bg-white p-3 shadow-2xl">
              <QrPreview data={previewData} config={config} size={300} className="rounded-lg" />
            </div>

            <div className="flex w-full items-center justify-between">
              <Badge variant={contrast.safe ? "success" : "warn"} className="gap-1.5">
                {contrast.safe ? <Check className="size-3" /> : <AlertTriangle className="size-3" />}
                Scan safety {contrast.ratio}:1
              </Badge>
              <span className="font-mono text-xs text-muted-foreground">
                ECC {config.errorCorrection}
                {config.autoOptimizeEcc ? "·auto" : ""}
              </span>
            </div>
            {!contrast.safe && (
              <p className="text-xs text-amber-400">{contrast.message}</p>
            )}
          </div>
        </Card>

        <Tabs value={scene} onValueChange={(v) => setScene(v as MockupScene)}>
          <div className="flex items-center justify-between">
            <Label>Real-world preview</Label>
          </div>
          <TabsList className="mt-2 flex h-auto flex-wrap">
            {SCENES.map((s) => (
              <TabsTrigger key={s.id} value={s.id} className="text-xs">
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {SCENES.map((s) => (
            <TabsContent key={s.id} value={s.id}>
              <MockupStage scene={s.id} data={previewData} config={config} />
            </TabsContent>
          ))}
        </Tabs>

        {/* Size + export */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(STICKER_SIZES) as StickerSizeId[]).map((id) => (
              <button
                key={id}
                onClick={() => setSize(id)}
                className={cn(
                  "rounded-xl border px-2 py-2 text-center transition-colors",
                  size === id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-accent",
                )}
              >
                <div className="text-sm font-medium">{STICKER_SIZES[id].mm}mm</div>
                <div className="text-[10px] text-muted-foreground">
                  {STICKER_SIZES[id].px}px · 300dpi
                </div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(["png", "svg", "pdf"] as const).map((f) => (
              <Button
                key={f}
                variant="secondary"
                disabled={!valid || busy !== null}
                onClick={() => handleExport(f)}
              >
                {busy === f ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Download />
                )}
                {f.toUpperCase()}
              </Button>
            ))}
          </div>

          {canSave && (
            <Button
              variant="gradient"
              className="w-full"
              disabled={!valid || busy !== null}
              onClick={handleSave}
            >
              {busy === "save" ? (
                <Loader2 className="animate-spin" />
              ) : saved ? (
                <Check />
              ) : (
                <Save />
              )}
              {saved ? "Saved to dashboard" : "Save & enable scan analytics"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
