"use client";

export function PageBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute -top-48 -right-48 size-96 rounded-full bg-indigo-400/10 dark:bg-indigo-500/5 blur-3xl" />
      <div className="absolute -bottom-48 -left-48 size-96 rounded-full bg-teal-400/10 dark:bg-teal-500/5 blur-3xl" />
      <div className="absolute top-1/2 left-1/4 size-[400px] rounded-full bg-neutral-400/5 dark:bg-neutral-500/5 blur-3xl" />
    </div>
  );
}
