"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 size-80 rounded-full bg-neutral-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-80 rounded-full bg-neutral-400/10 blur-3xl" />
      </div>
      <div className="relative space-y-6">
        <h2 className="text-7xl font-bold text-neutral-900 dark:text-neutral-100">
          404
        </h2>
        <div className="max-w-md mx-auto space-y-2">
          <p className="text-lg font-medium">Page not found</p>
          <p className="text-sm text-neutral-500">This page doesn&apos;t exist or has been moved.</p>
        </div>
        <Link href="/">
          <Button variant="default" className="gap-2">
            <Home className="size-4" />
            Go home
          </Button>
        </Link>
      </div>
    </div>
  );
}
