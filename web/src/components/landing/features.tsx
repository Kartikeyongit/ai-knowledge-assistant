"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { FileText, Search, MessageSquare, Files, Quote } from "lucide-react";

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
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(x, { stiffness: 300, damping: 20 });
  const rotateY = useSpring(y, { stiffness: 300, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    x.set(px - 0.5);
    y.set(py - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: 800,
        transformStyle: "preserve-3d",
      }}
    >
      <motion.div
        style={{
          rotateX: rotateX as any,
          rotateY: rotateY as any,
        }}
        className="group rounded-xl border border-neutral-200/70 dark:border-neutral-800/50 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl p-6 text-left hover:shadow-lg hover:shadow-neutral-500/5 hover:border-neutral-300/50 dark:hover:border-neutral-700/50 transition-all duration-300 hover:-translate-y-0.5 h-full"
      >
        <div className={`size-10 rounded-xl ${feature.accent} ${feature.darkAccent} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
          {feature.icon}
        </div>
        <h3 className="font-semibold mb-2">{feature.title}</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{feature.description}</p>
      </motion.div>
    </motion.div>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 relative">
      <div className="max-w-6xl mx-auto px-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.slice(0, 3).map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
          <div className="sm:col-span-2 lg:col-span-1 lg:col-start-2">
            {features.slice(3).map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i + 3} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
