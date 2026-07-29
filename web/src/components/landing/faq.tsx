"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, Search, Sparkles } from "lucide-react";
import { FloatingBackground } from "./floating-background";

const faqs = [
  {
    question: "What file formats are supported?",
    answer: "We currently support PDF (.pdf), plain text (.txt), and Markdown (.md) files. More formats like DOCX and CSV are on the roadmap.",
  },
  {
    question: "Is my data private and secure?",
    answer: "Yes. Your documents are stored securely and are only accessible to you. We do not share or train on your data. All embeddings and document chunks are stored in your private database.",
  },
  {
    question: "How accurate are the AI answers?",
    answer: "The AI answers are generated based on the content of your uploaded documents using vector search. The system cites sources so you can verify every answer. Accuracy depends on the quality and completeness of your documents.",
  },
  {
    question: "What technology powers this app?",
    answer: "The backend uses FastAPI (Python) with LangChain and Groq API (Llama 3). The frontend is built with Next.js (Web) and React Native (Mobile). Data is stored in PostgreSQL with pgvector for vector similarity search.",
  },
  {
    question: "How do I get started?",
    answer: "Sign in with your account, upload documents via the Documents page, then head to Chat to start asking questions. It takes less than a minute to get started.",
  },
];

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-neutral-200/70 dark:border-neutral-800/50 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-4 text-left text-sm font-medium text-neutral-900 dark:text-neutral-100 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
      >
        {question}
        <ChevronDown
          className={`size-4 shrink-0 text-neutral-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 relative">
      <FloatingBackground
        icons={[
          { icon: HelpCircle, className: "text-indigo-300/30 dark:text-indigo-400/20", position: "top-20 left-[10%]" },
          { icon: Search, className: "text-teal-300/30 dark:text-teal-400/20", position: "top-32 right-[12%]" },
          { icon: Sparkles, className: "text-amber-300/30 dark:text-amber-400/20", position: "bottom-24 left-[15%]" },
        ]}
      />
      <div className="max-w-6xl mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
            Everything you need to know about the AI Knowledge Assistant.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-2xl mx-auto rounded-xl border border-neutral-200/70 dark:border-neutral-800/50 bg-white/60 dark:bg-neutral-900/50 backdrop-blur-xl px-6"
        >
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
