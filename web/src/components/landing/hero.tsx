"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const { isSignedIn } = useAuth();

  return (
    <section id="hero" className="relative pt-16 pb-20 text-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute -top-48 -right-48 size-96 rounded-full bg-indigo-400/15 dark:bg-indigo-500/10 blur-3xl animate-gradient-1" />
        <div className="absolute -bottom-48 -left-48 size-96 rounded-full bg-teal-400/15 dark:bg-teal-500/10 blur-3xl animate-gradient-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] rounded-full bg-neutral-400/5 dark:bg-neutral-500/5 blur-3xl animate-gradient-3" />

        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-24 left-[15%] hidden lg:block"
        >
          <FileText className="size-6 text-indigo-300/40 dark:text-indigo-400/30" />
        </motion.div>
        <motion.div
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-32 right-[18%] hidden lg:block"
        >
          <Search className="size-6 text-teal-300/40 dark:text-teal-400/30" />
        </motion.div>
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-40 left-[20%] hidden lg:block"
        >
          <Sparkles className="size-5 text-amber-300/40 dark:text-amber-400/30" />
        </motion.div>
      </div>

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
