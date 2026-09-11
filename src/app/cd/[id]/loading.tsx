function Bar({ className }: { className: string }) {
  return (
    <div
      className={`rounded bg-black/10 dark:bg-white/10 animate-pulse ${className}`}
    />
  );
}

export default function Loading() {
  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10">
      <Bar className="h-4 w-36" />

      <div className="flex flex-col sm:flex-row gap-6 mt-4">
        <div className="w-full sm:w-56 shrink-0">
          <div className="aspect-square w-full rounded-lg bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>

        <div className="flex flex-col gap-3 pt-1 flex-1">
          <Bar className="h-7 w-3/4" />
          <Bar className="h-5 w-1/2" />
          <Bar className="h-4 w-1/3 mt-1" />
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Bar className="h-6 w-16 rounded-full" />
            <Bar className="h-6 w-20 rounded-full" />
            <Bar className="h-6 w-14 rounded-full" />
          </div>
        </div>
      </div>

      <div className="mt-10">
        <Bar className="h-4 w-28 mb-4" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Bar key={i} className="h-5 w-full" />
          ))}
        </div>
      </div>
    </main>
  );
}
