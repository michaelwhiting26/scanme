// PrinterProvider — the abstraction every printing backend implements.
// Application code only ever talks to this interface, so new hardware vendors
// plug in by adding a provider + registering it. Nothing upstream changes.

import type { QrDesignConfig } from "@/lib/qr/types";
import type { StickerSizeId } from "@/lib/qr/sizes";

export type PrinterVendor = "BROTHER_QL" | "DYMO" | "ZEBRA" | "GENERIC_PDF";

export interface MediaCapability {
  // Supported label dimensions in mm this provider can physically print.
  sizesMm: number[];
  colorMode: "mono" | "color";
  maxDpi: number;
}

export interface PrintJobInput {
  data: string; // encoded URL
  config: QrDesignConfig;
  size: StickerSizeId;
  copies: number;
  // Free-form vendor options (label media id, cut behaviour, dither, …)
  spec?: Record<string, unknown>;
}

export interface PrintArtifact {
  // The print-ready payload. For GENERIC_PDF this is a PDF buffer; for hardware
  // providers it is the vendor raster/command stream (e.g. ZPL, ESC/P-raster).
  buffer: Buffer;
  contentType: string;
  filename: string;
  // True when this artifact can be sent straight to the device; false when it
  // is only a downloadable file (current MVP behaviour for all providers).
  deviceReady: boolean;
}

export interface PrinterProvider {
  readonly vendor: PrinterVendor;
  readonly displayName: string;
  capabilities(): MediaCapability;
  // Validate that this provider can fulfil the job (size/color/etc).
  supports(input: PrintJobInput): { ok: boolean; reason?: string };
  // Produce the print-ready artifact. Heavy work; called from a worker in V2.
  render(input: PrintJobInput): Promise<PrintArtifact>;
}
