"use client";
import * as React from "react";
import { QrPreview } from "@/components/qr/qr-preview";
import type { QrDesignConfig } from "@/lib/qr/types";
import { cn } from "@/lib/utils";

export type MockupScene =
  | "laptop"
  | "phone"
  | "bar"
  | "pole"
  | "car"
  | "wristband";

export const SCENES: { id: MockupScene; label: string }[] = [
  { id: "laptop", label: "Laptop" },
  { id: "phone", label: "Phone case" },
  { id: "bar", label: "Bar counter" },
  { id: "pole", label: "Street pole" },
  { id: "car", label: "Car window" },
  { id: "wristband", label: "Festival band" },
];

// Each scene is a CSS-composed environment with a perspective-transformed
// sticker. Lightweight, instant, and resolution-independent — no image assets.
const SCENE_STYLE: Record<
  MockupScene,
  { wrap: string; surface: string; sticker: React.CSSProperties; stickerSize: number }
> = {
  laptop: {
    wrap: "bg-gradient-to-br from-zinc-800 to-zinc-950",
    surface:
      "absolute inset-x-[12%] top-[14%] bottom-[26%] rounded-t-xl bg-gradient-to-b from-zinc-700/60 to-zinc-900 border border-white/5",
    sticker: { transform: "rotate(-4deg)", top: "30%", left: "22%" },
    stickerSize: 92,
  },
  phone: {
    wrap: "bg-gradient-to-br from-fuchsia-950 to-zinc-950",
    surface:
      "absolute inset-x-[30%] inset-y-[8%] rounded-[2rem] bg-gradient-to-b from-zinc-800 to-black border-4 border-zinc-700",
    sticker: { transform: "rotate(2deg)", top: "40%", left: "38%" },
    stickerSize: 84,
  },
  bar: {
    wrap: "bg-gradient-to-b from-amber-950/80 to-zinc-950",
    surface:
      "absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-b from-amber-900/40 to-amber-950 [clip-path:polygon(0_18%,100%_0,100%_100%,0%_100%)]",
    sticker: { transform: "perspective(600px) rotateX(38deg) rotate(-3deg)", bottom: "16%", left: "34%" },
    stickerSize: 104,
  },
  pole: {
    wrap: "bg-gradient-to-b from-sky-950 to-zinc-950",
    surface:
      "absolute left-1/2 top-0 h-full w-[18%] -translate-x-1/2 bg-gradient-to-r from-zinc-500 via-zinc-300 to-zinc-600 rounded-full",
    sticker: { transform: "perspective(500px) rotateY(28deg)", top: "30%", left: "42%" },
    stickerSize: 86,
  },
  car: {
    wrap: "bg-gradient-to-br from-slate-800 to-slate-950",
    surface:
      "absolute inset-[10%] rounded-2xl bg-gradient-to-br from-sky-200/20 to-slate-900/40 border border-white/10 backdrop-blur",
    sticker: { transform: "perspective(700px) rotateY(-18deg) rotate(2deg)", top: "34%", right: "26%" },
    stickerSize: 90,
  },
  wristband: {
    wrap: "bg-gradient-to-br from-violet-950 to-zinc-950",
    surface:
      "absolute inset-x-[8%] top-[40%] h-[20%] rounded-full bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 shadow-lg",
    sticker: { transform: "perspective(500px) rotateX(20deg) rotate(-2deg)", top: "34%", left: "42%" },
    stickerSize: 70,
  },
};

export function MockupStage({
  scene,
  data,
  config,
  className,
}: {
  scene: MockupScene;
  data: string;
  config: QrDesignConfig;
  className?: string;
}) {
  const s = SCENE_STYLE[scene];
  return (
    <div
      className={cn(
        "relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border",
        s.wrap,
        className,
      )}
    >
      <div className={s.surface} />
      <div className="absolute" style={{ ...s.sticker }}>
        <div className="rounded-lg shadow-2xl ring-1 ring-black/20">
          <QrPreview data={data} config={config} size={s.stickerSize} />
        </div>
      </div>
    </div>
  );
}
