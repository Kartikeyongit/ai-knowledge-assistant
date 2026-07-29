import { Sparkles } from "lucide-react";
import Link from "next/link";

export function FooterSection() {
  return (
    <footer className="border-t border-neutral-200/70 dark:border-neutral-800/50 bg-white/60 dark:bg-neutral-950/60 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-3">
              <div className="size-8 rounded-xl bg-neutral-800 dark:bg-neutral-200 flex items-center justify-center shadow-sm">
                <Sparkles className="size-4 text-white dark:text-neutral-800" />
              </div>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                AI Knowledge Assistant
              </span>
            </Link>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs">
              Turn your documents into an intelligent knowledge base. Ask questions, get answers with citations.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              Product
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="#features" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#faq" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
              Legal
            </h3>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  Terms of Service
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-200/70 dark:border-neutral-800/50 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            &copy; {new Date().getFullYear()} AI Knowledge Assistant. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
