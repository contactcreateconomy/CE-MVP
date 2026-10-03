export function LoadingState() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="card-surface p-4">
          <div className="mb-3 h-4 w-1/4 animate-pulse rounded bg-[var(--bg-overlay)]" />
          <div className="mb-2 h-6 w-4/5 animate-pulse rounded bg-[var(--bg-overlay)]" />
          <div className="h-4 w-full animate-pulse rounded bg-[var(--bg-overlay)]" />
        </div>
      ))}
    </div>
  );
}
