"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

// Per-segment error boundary. Same chunk-error self-heal as global-error, but
// keeps the surrounding layout intact for non-chunk runtime errors.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isChunkError =
    /ChunkLoadError|Loading chunk|dynamically imported module|module script failed/i.test(
      `${error?.name} ${error?.message}`,
    );

  useEffect(() => {
    if (!isChunkError || typeof window === "undefined") return;
    const KEY = "scanme:chunk-reloaded";
    if (!sessionStorage.getItem(KEY)) {
      sessionStorage.setItem(KEY, "1");
      window.location.reload();
    }
  }, [isChunkError]);

  return (
    <div className="grid min-h-[60vh] place-items-center px-6 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="font-display text-2xl font-bold">
          {isChunkError ? "Updating to the latest version…" : "Something went wrong"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isChunkError
            ? "A new version was just deployed — reloading to fetch it."
            : "An unexpected error occurred. Please try again."}
        </p>
        <Button variant="gradient" onClick={() => (isChunkError ? window.location.reload() : reset())}>
          Reload
        </Button>
      </div>
    </div>
  );
}
