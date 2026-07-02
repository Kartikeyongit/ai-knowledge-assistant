"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 size-80 rounded-full bg-neutral-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-neutral-400/10 blur-3xl" />
      </div>
      <div className="relative space-y-6">
        <div className="size-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto">
          <AlertCircle className="size-7 text-neutral-600 dark:text-neutral-400" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h2 className="text-2xl font-bold">Something went wrong</h2>
          <p className="text-neutral-500 text-sm">{error.message || "An unexpected error occurred"}</p>
        </div>
        <Button variant="default" onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
