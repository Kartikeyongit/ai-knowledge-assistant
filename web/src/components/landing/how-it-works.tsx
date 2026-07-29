"use client";

import { motion } from "framer-motion";
import { Upload, Brain, MessageSquareText, FileText, Search, Sparkles } from "lucide-react";
import { FloatingBackground } from "./floating-background";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload Documents",
    description: "Drag and drop PDFs, text files, or markdown. Your data stays private and secure.",
  },
  {
    number: "02",
    icon: Brain,
    title: "AI Processes Content",
    description: "Documents are chunked, embedded, and indexed using vector search for instant retrieval.",
  },
  {
    number: "03",
    icon: MessageSquareText,
    title: "Ask & Get Answers",
    description: "Ask natural language questions and receive precise answers with source citations.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 relative overflow-hidden">
      <FloatingBackground
        icons={[
          { icon: FileText, className: "text-indigo-300/30 dark:text-indigo-400/20", position: "top-16 left-[8%]" },
          { icon: Search, className: "text-teal-300/30 dark:text-teal-400/20", position: "top-32 right-[10%]" },
          { icon: Sparkles, className: "text-amber-300/30 dark:text-amber-400/20", position: "bottom-24 left-[12%]" },
        ]}
      />
      <div className="max-w-6xl mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            How It Works
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
            Three simple steps to turn your documents into an intelligent knowledge base.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
          <div className="hidden md:block absolute top-8 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-indigo-300/40 via-neutral-300/60 to-teal-300/40 dark:from-indigo-500/20 dark:via-neutral-600/40 dark:to-teal-500/20" />

          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="flex flex-col items-center text-center relative"
            >
              <div className="relative mb-5">
                <div className="size-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shadow-sm ring-4 ring-white dark:ring-neutral-950">
                  <step.icon className="size-6 text-neutral-600 dark:text-neutral-400" />
                </div>
                <div className="absolute -top-2.5 -right-2.5 size-7 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[11px] font-bold flex items-center justify-center ring-4 ring-white dark:ring-neutral-950 shadow-sm">
                  {step.number}
                </div>
              </div>
              <h3 className="font-semibold mb-2 text-base">{step.title}</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
