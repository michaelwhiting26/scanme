"use client";

import { useEffect } from "react";

// Root-level error boundary (replaces the layout when the app tree throws).
// Its main job is to make post-deploy "ChunkLoadError" self-healing: after a
// new deploy the chunk hashes change, so a browser holding stale HTML fails to
// load a chunk. We detect that and reload once (guarded against loops) to pull
// the fresh HTML + assets — the user never sees a dead screen.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isChunkError =
    /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|importing a module script failed/i.test(
      `${error?.name} ${error?.message}`,
    );

  useEffect(() => {
    if (!isChunkError || typeof window === "undefined") return;
    const KEY = "scanme:chunk-reloaded";
    if (!sessionStorage.getItem(KEY)) {
      sessionStorage.setItem(KEY, "1");
      // Reload bypassing cache to fetch the current build.
      window.location.reload();
    }
  }, [isChunkError]);

  return (
    <html lang="en" className="dark">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#09090b",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {isChunkError ? "Updating to the latest version…" : "Something went wrong"}
          </h1>
          <p style={{ color: "#a1a1aa", fontSize: 14, marginBottom: 20 }}>
            {isChunkError
              ? "We just shipped an update. Reloading to get the newest version."
              : "An unexpected error occurred. Try again."}
          </p>
          <button
            onClick={() => (isChunkError ? window.location.reload() : reset())}
            style={{
              background: "linear-gradient(90deg,#8b5cf6,#d946ef,#fb7185)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
