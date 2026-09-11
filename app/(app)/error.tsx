"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/error-messages";

interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * App-shell error boundary — catches errors inside the authenticated layout.
 * Renders within the normal page wrapper (no sidebar) to avoid infinite loops.
 */
export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error("[AppError]", error);
  }, [error]);

  const message = errorMessage(error);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-7 text-destructive" aria-hidden />
      </div>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
        {error.digest ? (
          <p className="text-xs text-muted-foreground">
            Error ID: <code className="font-mono">{error.digest}</code>
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={reset} size="sm">
          <RefreshCw className="size-4" />
          Try again
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href="/home">Go to Home</a>
        </Button>
      </div>
    </div>
  );
}
