"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-5 bg-section px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-red/10">
        <AlertTriangle className="h-10 w-10 text-brand-red" />
      </div>
      <h1 className="text-3xl font-bold text-foreground">Something went wrong</h1>
      <p className="max-w-md text-muted-foreground">
        An unexpected error occurred while loading this page. Please try again.
      </p>
      {error?.digest && (
        <p className="text-xs text-muted-foreground/70">
          Error ID: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <RotateCcw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}
