"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning-soft text-warning">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h1 className="font-display text-lg font-extrabold text-foreground">
        Algo no salió bien
      </h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        Estamos revisando el problema. Intenta de nuevo en un momento.
      </p>
      <button
        onClick={reset}
        className="mt-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        Reintentar
      </button>
    </div>
  );
}
