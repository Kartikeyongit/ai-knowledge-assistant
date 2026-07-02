"use client";

import { SignIn } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import { useEffect } from "react";

export default function SignInPage() {
  useEffect(() => { document.title = "Sign In - AI Knowledge Assistant"; }, []);
  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 size-96 rounded-full bg-neutral-500/10 dark:bg-neutral-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 size-96 rounded-full bg-neutral-400/10 dark:bg-neutral-400/5 blur-3xl" />
      </div>
      <div className="flex flex-col items-center gap-8 relative">
        <div className="flex items-center gap-2.5">
          <div className="size-10 rounded-xl bg-neutral-800 dark:bg-neutral-200 flex items-center justify-center shadow-sm">
            <Sparkles className="size-5 text-white dark:text-neutral-800" />
          </div>
          <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            AI Knowledge Assistant
          </span>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl rounded-2xl border border-neutral-200/70 dark:border-neutral-800/50",
              headerTitle: "text-xl font-bold",
              headerSubtitle: "text-neutral-500",
              socialButtonsBlockButton:
                "rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors",
              socialButtonsBlockButtonText:
                "text-sm font-medium text-neutral-700 dark:text-neutral-300",
              dividerLine: "bg-neutral-200 dark:bg-neutral-800",
              dividerText: "text-neutral-400 text-xs",
              formButtonPrimary:
                "rounded-xl bg-neutral-800 hover:bg-neutral-700 dark:bg-neutral-200 dark:hover:bg-neutral-300 dark:text-neutral-900 text-white text-sm font-medium transition-colors",
              formFieldInput:
                "rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-neutral-400/50 dark:focus:ring-neutral-500/50",
              formFieldLabel: "text-sm font-medium text-neutral-700 dark:text-neutral-300",
              footerActionLink:
                "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200",
            },
          }}
        />
      </div>
    </div>
  );
}
