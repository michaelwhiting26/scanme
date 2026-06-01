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
      className={cn("overflow-hidden rounded-2xl", className)}
      style={{ width: size, height: size, maxWidth: "100%" }}
      // The SVG is generated from sanitized config; data is a validated URL.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
