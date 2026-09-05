export default function SearchLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded-lg bg-(--bg-overlay)" />
      <div className="h-4 w-64 rounded bg-(--bg-overlay)" />
      <div className="h-32 rounded-2xl bg-(--bg-overlay)" />
      <div className="h-32 rounded-2xl bg-(--bg-overlay)" />
    </div>
  );
}
