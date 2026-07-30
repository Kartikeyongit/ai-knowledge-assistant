"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  rightContent?: React.ReactNode;
}

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#faq", label: "FAQ" },
];

export function Header({ rightContent }: HeaderProps) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/70 dark:border-neutral-800/50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="size-8 rounded-xl bg-neutral-800 dark:bg-neutral-200 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <Sparkles className="size-4 text-white dark:text-neutral-800" />
          </div>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            AI Knowledge Assistant
          </span>
        </Link>
        {isLanding && (
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2">
          {rightContent}
          <ThemeToggle />
          <UserButton
            // @ts-expect-error - Clerk SDK prop type mismatch
            afterSignOutUrl="/"
          />
        </div>
      </div>
    </header>
  );
}
