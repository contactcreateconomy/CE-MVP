"use client";

interface BriefToastProps {
  message: string;
  onDismiss: () => void;
}

export function BriefToast({ message, onDismiss }: BriefToastProps) {
  return (
    <div className="fixed bottom-24 left-1/2 z-[60] w-[min(420px,92vw)] -translate-x-1/2 rounded-[14px] border border-(--border-prominent) bg-(--bg-surface-elevated) px-4 py-2.5 text-center text-sm text-(--text-primary) shadow-(--shadow-lg)">
      {message}
      <button type="button" className="ml-3 text-xs text-(--text-muted) underline" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  );
}
