"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface FloatingIcon {
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  position: string;
}

interface FloatingBackgroundProps {
  icons: FloatingIcon[];
}

export function FloatingBackground({ icons }: FloatingBackgroundProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute -top-48 -right-48 size-96 rounded-full bg-indigo-400/10 dark:bg-indigo-500/5 blur-3xl animate-gradient-1" />
      <div className="absolute -bottom-48 -left-48 size-96 rounded-full bg-teal-400/10 dark:bg-teal-500/5 blur-3xl animate-gradient-2" />
      <div className="absolute top-1/2 left-1/4 size-[400px] rounded-full bg-neutral-400/5 dark:bg-neutral-500/5 blur-3xl animate-gradient-3" />
      {icons.map((item, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -14, 0] }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1.5,
          }}
          className={`absolute hidden lg:block ${item.position}`}
        >
          <item.icon className={`size-6 ${item.className}`} />
        </motion.div>
      ))}
    </div>
  );
}
