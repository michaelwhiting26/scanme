"use client";
import * as React from "react";
import { renderQrSvg } from "@/lib/qr/engine";
import type { QrDesignConfig } from "@/lib/qr/types";
import { cn } from "@/lib/utils";

interface Props {
  data: string;
  config: QrDesignConfig;
  size?: number;
  className?: string;
}

// Renders the exact same engine output used for exports, so what the user sees
// is byte-identical to the downloaded asset. Memoized on data+config.
export function QrPreview({ data, config, size = 360, className }: Props) {
  const svg = React.useMemo(() => {
    try {
      return renderQrSvg({ data, config, size });
    } catch {
      return "";
    }
  }, [data, config, size]);

  return (
    <div
      className={cn(
        // SVG fills the box; box is square and never wider than its parent,
        // so the same component is crisp on a 4K monitor and a 320px phone.
        "overflow-hidden rounded-2xl [&>svg]:block [&>svg]:h-full [&>svg]:w-full",
        className,
      )}
      style={{ width: size, maxWidth: "100%", aspectRatio: "1 / 1" }}
      // The SVG is generated from sanitized config; data is a validated URL.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
