"use client";

import { motion } from "framer-motion";
import {
  Globe,
  Server,
  Database,
  Cpu,
  GitBranch,
  Palette,
} from "lucide-react";

const techs = [
  { name: "Next.js", icon: Globe },
  { name: "FastAPI", icon: Server },
  { name: "PostgreSQL", icon: Database },
  { name: "Groq", icon: Cpu },
  { name: "LangChain", icon: GitBranch },
  { name: "Tailwind CSS", icon: Palette },
];

export function TechStackSection() {
  return (
    <section className="py-16 relative">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Powered By
          </p>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {techs.map((tech, index) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
              className="inline-flex items-center gap-2.5 rounded-full border border-neutral-200/70 dark:border-neutral-800/50 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:border-neutral-300/70 dark:hover:border-neutral-700/50 transition-colors"
            >
              <tech.icon className="size-4" />
              <span className="font-medium">{tech.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
