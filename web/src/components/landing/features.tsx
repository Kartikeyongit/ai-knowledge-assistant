"use client";

import { useRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import { FileText, Search, MessageSquare, Files, Quote, Sparkles } from "lucide-react";
import { FloatingBackground } from "./floating-background";

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
  accent: string;
  darkAccent: string;
}

const features: Feature[] = [
  {
    icon: <FileText className="size-5" />,
    title: "Upload Documents",
    description: "Support for PDF, TXT, and Markdown files. Your data stays private and secure.",
    accent: "bg-indigo-100 text-indigo-600",
    darkAccent: "dark:bg-indigo-900/40 dark:text-indigo-300",
  },
  {
    icon: <Search className="size-5" />,
    title: "Semantic Search",
    description: "Vector embeddings find the most relevant content across all your documents instantly.",
    accent: "bg-teal-100 text-teal-600",
    darkAccent: "dark:bg-teal-900/40 dark:text-teal-300",
  },
  {
    icon: <MessageSquare className="size-5" />,
    title: "AI-Powered Answers",
    description: "Get precise answers with source citations powered by Llama 3 via Groq.",
    accent: "bg-amber-100 text-amber-600",
    darkAccent: "dark:bg-amber-900/40 dark:text-amber-300",
  },
  {
    icon: <Files className="size-5" />,
    title: "Multi-Format Support",
    description: "Upload PDFs, TXT, and Markdown files — all processed and indexed for search.",
    accent: "bg-rose-100 text-rose-600",
    darkAccent: "dark:bg-rose-900/40 dark:text-rose-300",
  },
  {
    icon: <Quote className="size-5" />,
    title: "Source Citations",
    description: "Every answer includes references to the original documents so you can verify.",
    accent: "bg-violet-100 text-violet-600",
    darkAccent: "dark:bg-violet-900/40 dark:text-violet-300",
  },
];

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const tiltX = (py - 0.5) * -12;
    const tiltY = (px - 0.5) * 12;
    el.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  };

  const handleMouseLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="group rounded-xl border border-neutral-200/70 dark:border-neutral-800/50 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl p-6 text-left hover:shadow-lg hover:shadow-neutral-500/5 hover:border-neutral-300/50 dark:hover:border-neutral-700/50 transition-shadow duration-300 h-full"
        style={{ transition: "transform 0.15s ease-out" }}
      >
        <div className={`size-10 rounded-xl ${feature.accent} ${feature.darkAccent} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
          {feature.icon}
        </div>
        <h3 className="font-semibold mb-2">{feature.title}</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{feature.description}</p>
      </div>
    </motion.div>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 relative">
      <FloatingBackground
        icons={[
          { icon: FileText, className: "text-indigo-300/30 dark:text-indigo-400/20", position: "top-20 left-[10%]" },
          { icon: Search, className: "text-teal-300/30 dark:text-teal-400/20", position: "top-40 right-[12%]" },
          { icon: Sparkles, className: "text-amber-300/30 dark:text-amber-400/20", position: "bottom-32 left-[15%]" },
        ]}
      />
      <div className="max-w-6xl mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Everything You Need
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
            A complete toolkit for turning your documents into a searchable knowledge base.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-6">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
