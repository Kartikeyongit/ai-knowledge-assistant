"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingBackground } from "./floating-background";

export function HeroSection() {
  const { isSignedIn } = useAuth();

  return (
    <section id="hero" className="relative pt-32 pb-20 text-center">
      <FloatingBackground
        icons={[
          { icon: FileText, className: "text-indigo-300/40 dark:text-indigo-400/30", position: "top-24 left-[15%]" },
          { icon: Search, className: "text-teal-300/40 dark:text-teal-400/30", position: "top-32 right-[18%]" },
          { icon: Sparkles, className: "text-amber-300/40 dark:text-amber-400/30", position: "bottom-40 left-[20%]" },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200/60 dark:border-neutral-700/60 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm px-4 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 mb-8">
            <Sparkles className="size-3.5 text-indigo-500" />
            <span>Now with Multi-Document Support &mdash; Ask across all your files at once</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="max-w-3xl mx-auto space-y-6"
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
            <span className="bg-gradient-to-r from-neutral-900 via-indigo-600 to-neutral-900 dark:from-neutral-100 dark:via-indigo-400 dark:to-neutral-100 bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
              Chat with Your Documents
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Upload PDFs, text files, or markdown. Ask questions and get precise answers with AI-powered semantic search and source citations.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
        >
          {isSignedIn ? (
            <>
              <Link href="/chat">
                <Button variant="default" size="lg" className="text-base px-8 group shadow-lg shadow-neutral-900/10 dark:shadow-black/20">
                  Start Chatting
                  <ArrowRight className="size-4 ml-1 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link href="/documents">
                <Button variant="outline" size="lg" className="text-base px-8">
                  View Documents
                </Button>
              </Link>
            </>
          ) : (
            <SignInButton mode="modal">
              <Button variant="default" size="lg" className="text-base px-8 group shadow-lg shadow-neutral-900/10 dark:shadow-black/20">
                Sign In to Get Started
                <ArrowRight className="size-4 ml-1 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </SignInButton>
          )}
        </motion.div>
      </div>
    </section>
  );
}
