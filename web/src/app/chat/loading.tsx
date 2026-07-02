export default function ChatLoading() {
  return (
    <div className="flex flex-col h-screen">
      <header className="border-b border-neutral-200/70 dark:border-neutral-800/50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
            <div className="h-5 w-40 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-12 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
            <div className="h-7 w-12 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
            <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-9 w-20 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
            <div className="h-9 w-20 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
            <div className="size-9 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
            <div className="size-8 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
          </div>
        </div>
      </header>
      <div className="flex flex-1 min-h-0">
        <aside className="w-72 border-r border-neutral-200/70 dark:border-neutral-800/50 hidden md:flex flex-col p-3">
          <div className="h-6 w-20 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse mb-3" />
          <div className="space-y-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 rounded-lg bg-neutral-200/50 dark:bg-neutral-800/50 animate-pulse" />
            ))}
          </div>
        </aside>
        <div className="flex-1 flex items-center justify-center">
          <div className="size-8 rounded-full border-2 border-neutral-300 border-t-neutral-600 dark:border-t-neutral-400 animate-spin" />
        </div>
      </div>
    </div>
  );
}
