import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-6xl font-bold text-(--brand-primary)">404</h1>
        <h2 className="text-xl font-semibold text-(--text-primary)">Page not found</h2>
        <p className="text-sm text-(--text-secondary)">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/feed"
          className="inline-block rounded-full border border-(--border-default) bg-(--bg-surface) px-6 py-2 text-sm font-medium text-(--text-primary) transition-colors hover:border-(--border-active) hover:bg-(--bg-overlay)"
        >
          Back to Feed
        </Link>
      </div>
    </div>
  );
}
