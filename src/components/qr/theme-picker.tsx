"use client";
import * as React from "react";
import { THEMES, type ThemePreset } from "@/lib/qr/themes";
import { cn } from "@/lib/utils";

const CATEGORIES: { id: ThemePreset["category"]; label: string }[] = [
  { id: "gradient", label: "Gradient" },
  { id: "neon", label: "Neon" },
  { id: "chrome", label: "Chrome" },
  { id: "cyberpunk", label: "Cyberpunk" },
  { id: "luxury", label: "Luxury" },
  { id: "creator", label: "Creator" },
];

export function ThemePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (themeId: string) => void;
}) {
  const [cat, setCat] = React.useState<ThemePreset["category"]>("gradient");
  const themes = THEMES.filter((t) => t.category === cat);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              cat === c.id
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              "group relative overflow-hidden rounded-xl border p-3 text-left transition-all",
              value === t.id
                ? "border-primary ring-2 ring-primary/40"
                : "border-border hover:border-primary/40",
            )}
          >
            <div
              className="mb-2 h-12 w-full rounded-lg"
              style={{
                background: `linear-gradient(120deg, ${t.swatch.join(", ")})`,
              }}
            />
            <div className="text-sm font-medium">{t.name}</div>
            <div className="line-clamp-1 text-xs text-muted-foreground">
              {t.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
