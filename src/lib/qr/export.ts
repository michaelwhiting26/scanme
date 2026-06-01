import "server-only";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { renderQrSvg } from "./engine";
import type { QrDesignConfig } from "./types";
import { STICKER_SIZES, type StickerSizeId, DPI } from "./sizes";

export type ExportFormat = "png" | "svg" | "pdf";

export interface ExportRequest {
  data: string;
  config: QrDesignConfig;
  format: ExportFormat;
  size: StickerSizeId; // physical sticker size
}

export interface ExportResult {
  buffer: Buffer;
  contentType: string;
  filename: string;
  bytes: number;
}

// SVG is resolution-independent; we still bake the physical pixel side so that
// a viewer placing it at 300 DPI gets the exact mm size.
export async function exportQr(req: ExportRequest): Promise<ExportResult> {
  const spec = STICKER_SIZES[req.size];
  const svg = renderQrSvg({ data: req.data, config: req.config, size: spec.px });
  const base = `scanme-${req.config.themeId}-${spec.mm}mm`;

  if (req.format === "svg") {
    const buffer = Buffer.from(svg, "utf8");
    return {
      buffer,
      contentType: "image/svg+xml",
      filename: `${base}.svg`,
      bytes: buffer.byteLength,
    };
  }

  // Rasterize at the exact print pixel dimensions, embedding the 300 DPI tag.
  const png = await sharp(Buffer.from(svg), { density: DPI })
    .resize(spec.px, spec.px, { fit: "fill" })
    .png({ compressionLevel: 9 })
    .withMetadata({ density: DPI })
    .toBuffer();

  if (req.format === "png") {
    return {
      buffer: png,
      contentType: "image/png",
      filename: `${base}.png`,
      bytes: png.byteLength,
    };
  }

  // PDF: place the PNG at the exact physical size (in points) on a same-size page.
  const pdf = await PDFDocument.create();
  pdf.setTitle(`ScanMe sticker — ${req.config.themeId} ${spec.mm}mm`);
  pdf.setProducer("ScanMe");
  const page = pdf.addPage([spec.pt, spec.pt]);
  const img = await pdf.embedPng(png);
  page.drawImage(img, { x: 0, y: 0, width: spec.pt, height: spec.pt });
  const pdfBytes = await pdf.save();
  const buffer = Buffer.from(pdfBytes);
  return {
    buffer,
    contentType: "application/pdf",
    filename: `${base}.pdf`,
    bytes: buffer.byteLength,
  };
}
