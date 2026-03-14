"use client";

import { Button } from "@/components/ui/button";

export default function RootErrorPage({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-caveat text-2xl">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        An unexpected error occurred. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
