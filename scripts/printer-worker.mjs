// Placeholder print worker (V2).
//
// In V2 this long-running worker polls PrinterJob rows in QUEUED state, renders
// the vendor-specific payload via the PrinterProvider registry, uploads the
// artifact to storage, and transitions the job to READY/SENT/PRINTED. For now
// the synchronous /api/print route handles rendering, so this worker idles.
//
// Render runs it as a separate `worker` service (see render.yaml, autoDeploy:false).

console.log("[printer-worker] idle — enable in V2 once the job queue is wired.");

// Keep the process alive so the Render worker stays healthy when enabled.
setInterval(() => {}, 1 << 30);
