import "server-only";
import type { PrinterProvider, PrinterVendor } from "./provider";
import {
  BrotherQlProvider,
  DymoProvider,
  GenericPdfProvider,
  ZebraProvider,
} from "./providers";

// Central registry. Adding hardware support = register one provider here.
const REGISTRY: Record<PrinterVendor, PrinterProvider> = {
  GENERIC_PDF: new GenericPdfProvider(),
  BROTHER_QL: new BrotherQlProvider(),
  DYMO: new DymoProvider(),
  ZEBRA: new ZebraProvider(),
};

export function getPrinterProvider(vendor: PrinterVendor): PrinterProvider {
  return REGISTRY[vendor] ?? REGISTRY.GENERIC_PDF;
}

export function listPrinterProviders() {
  return Object.values(REGISTRY).map((p) => ({
    vendor: p.vendor,
    displayName: p.displayName,
    capabilities: p.capabilities(),
  }));
}
