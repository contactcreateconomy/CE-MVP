"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="max-w-md space-y-4 text-center">
        <h2 className="text-xl font-semibold text-(--text-primary)">Something went wrong</h2>
        <p className="text-sm text-(--text-secondary)">
          An unexpected error occurred. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-(--border-default) bg-(--bg-surface) px-6 py-2 text-sm font-medium text-(--text-primary) transition-colors hover:border-(--border-active) hover:bg-(--bg-overlay)"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
