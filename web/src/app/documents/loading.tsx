export default function DocumentsLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-neutral-200/70 dark:border-neutral-800/50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
            <div className="h-5 w-40 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
          </div>
          <div className="h-9 w-24 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <div className="h-8 w-40 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
            <div className="h-4 w-56 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
          </div>
          <div className="h-9 w-36 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
                <div className="space-y-2">
                  <div className="h-4 w-48 rounded bg-neutral-200 dark:bg-neutral-700" />
                  <div className="h-3 w-32 rounded bg-neutral-200 dark:bg-neutral-700" />
                </div>
              </div>
              <div className="h-8 w-16 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
