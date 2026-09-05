export default function DiscussionLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-3/4 rounded-lg bg-(--bg-overlay)" />
      <div className="h-4 w-1/2 rounded bg-(--bg-overlay)" />
      <div className="h-64 rounded-2xl bg-(--bg-overlay)" />
      <div className="h-32 rounded-2xl bg-(--bg-overlay)" />
    </div>
  );
}
