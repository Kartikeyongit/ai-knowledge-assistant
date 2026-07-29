"use client";

import { motion } from "framer-motion";
import { Upload, Brain, MessageSquareText } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Upload,
    title: "Upload Documents",
    description: "Drag and drop PDFs, text files, or markdown. Your data stays private and secure.",
  },
  {
    number: 2,
    icon: Brain,
    title: "AI Processes Content",
    description: "Documents are chunked, embedded, and indexed using vector search for instant retrieval.",
  },
  {
    number: 3,
    icon: MessageSquareText,
    title: "Ask & Get Answers",
    description: "Ask natural language questions and receive precise answers with source citations.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 relative">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            How It Works
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
            Three simple steps to turn your documents into an intelligent knowledge base.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
          {/* Connecting line — visible only on md+ */}
          <div className="hidden md:block absolute top-12 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-indigo-300/40 via-neutral-300/60 to-teal-300/40 dark:from-indigo-500/20 dark:via-neutral-600/40 dark:to-teal-500/20" />

          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="flex flex-col items-center text-center relative"
            >
              <div className="size-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-5 relative z-10 ring-4 ring-white dark:ring-neutral-950 shadow-sm">
                <step.icon className="size-5 text-neutral-600 dark:text-neutral-400" />
              </div>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 size-6 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold flex items-center justify-center z-20 ring-4 ring-white dark:ring-neutral-950">
                {step.number}
              </div>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
