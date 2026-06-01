import "server-only";
import { exportQr } from "@/lib/qr/export";
import { STICKER_SIZES } from "@/lib/qr/sizes";
import type {
  MediaCapability,
  PrintArtifact,
  PrinterProvider,
  PrintJobInput,
} from "./provider";

// Shared helper: every provider can fall back to producing a print-ready PDF.
async function pdfArtifact(input: PrintJobInput): Promise<PrintArtifact> {
  const out = await exportQr({
    data: input.data,
    config: input.config,
    format: "pdf",
    size: input.size,
  });
  return {
    buffer: out.buffer,
    contentType: out.contentType,
    filename: out.filename,
    deviceReady: false,
  };
}

// ── GENERIC PDF (fully implemented; the MVP default) ────────────────────────
export class GenericPdfProvider implements PrinterProvider {
  readonly vendor = "GENERIC_PDF" as const;
  readonly displayName = "Print-ready PDF";
  capabilities(): MediaCapability {
    return { sizesMm: [50, 75, 100], colorMode: "color", maxDpi: 300 };
  }
  supports() {
    return { ok: true };
  }
  render(input: PrintJobInput) {
    return pdfArtifact(input);
  }
}

// ── BROTHER QL (architecture stub) ──────────────────────────────────────────
// Brother QL series prints mono raster at 300 DPI on continuous/die-cut labels.
// A real implementation emits Brother raster command mode (ESC/P-raster).
export class BrotherQlProvider implements PrinterProvider {
  readonly vendor = "BROTHER_QL" as const;
  readonly displayName = "Brother QL series";
  capabilities(): MediaCapability {
    return { sizesMm: [50, 62], colorMode: "mono", maxDpi: 300 };
  }
  supports(input: PrintJobInput) {
    const mm = STICKER_SIZES[input.size].mm;
    if (mm > 62)
      return { ok: false, reason: "Brother QL max label width is 62mm." };
    return { ok: true };
  }
  async render(input: PrintJobInput): Promise<PrintArtifact> {
    // TODO(V2): produce ESC/P-raster. For now emit a mono-friendly PDF.
    return pdfArtifact(input);
  }
}

// ── DYMO (architecture stub) ────────────────────────────────────────────────
export class DymoProvider implements PrinterProvider {
  readonly vendor = "DYMO" as const;
  readonly displayName = "DYMO LabelWriter";
  capabilities(): MediaCapability {
    return { sizesMm: [50, 54], colorMode: "mono", maxDpi: 300 };
  }
  supports(input: PrintJobInput) {
    const mm = STICKER_SIZES[input.size].mm;
    if (mm > 54) return { ok: false, reason: "DYMO max label is ~54mm." };
    return { ok: true };
  }
  async render(input: PrintJobInput): Promise<PrintArtifact> {
    // TODO(V2): emit DYMO label XML + PNG for the DYMO Web Service / SDK.
    return pdfArtifact(input);
  }
}

// ── ZEBRA (architecture stub) ───────────────────────────────────────────────
export class ZebraProvider implements PrinterProvider {
  readonly vendor = "ZEBRA" as const;
  readonly displayName = "Zebra (ZPL)";
  capabilities(): MediaCapability {
    return { sizesMm: [50, 75, 100], colorMode: "mono", maxDpi: 300 };
  }
  supports() {
    return { ok: true };
  }
  async render(input: PrintJobInput): Promise<PrintArtifact> {
    // TODO(V2): generate ZPL with a ^GFA graphic field from the rasterized QR.
    return pdfArtifact(input);
  }
}
