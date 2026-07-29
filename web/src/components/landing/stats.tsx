"use client";

import { motion, useMotionValue, animate, useMotionValueEvent } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Files, Users, Clock, FileText } from "lucide-react";

const stats = [
  { icon: Files, value: 10000, suffix: "+", label: "Documents Processed", prefix: "" },
  { icon: Users, value: 500, suffix: "+", label: "Active Users", prefix: "" },
  { icon: Clock, value: 99.9, suffix: "%", label: "Uptime", prefix: "", decimals: 1 },
  { icon: FileText, value: 3, suffix: "", label: "Supported Formats", prefix: "" },
];

function AnimatedCounter({
  value,
  suffix,
  prefix,
  decimals = 0,
}: {
  value: number;
  suffix: string;
  prefix: string;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);
  const count = useMotionValue(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useMotionValueEvent(count, "change", (v) => {
    setDisplay(`${prefix}${v.toFixed(decimals)}${suffix}`);
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animate(count, value, { duration: 2, ease: "easeOut" });
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, count]);

  return <span ref={ref}>{display}</span>;
}

export function StatsSection() {
  return (
    <section className="py-16 relative">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/50 bg-white/60 dark:bg-neutral-900/50 backdrop-blur-xl p-6 text-center"
            >
              <div className="size-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3">
                <stat.icon className="size-5 text-neutral-600 dark:text-neutral-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} prefix={stat.prefix} decimals={stat.decimals} />
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
