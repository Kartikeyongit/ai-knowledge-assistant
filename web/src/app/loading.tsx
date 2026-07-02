export default function RootLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-neutral-200/70 dark:border-neutral-800/50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
            <div className="h-5 w-40 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-20 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
            <div className="h-9 w-20 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center">
        <div className="size-8 rounded-full border-2 border-neutral-300 border-t-neutral-600 dark:border-t-neutral-400 animate-spin" />
      </main>
    </div>
  );
}
