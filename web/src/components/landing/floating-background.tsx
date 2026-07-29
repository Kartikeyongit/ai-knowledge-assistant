"use client";

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
