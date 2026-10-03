"use client";

import { Button } from "@/components/ui/button";

interface FeedUndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export function FeedUndoToast({ message, onUndo, onDismiss }: FeedUndoToastProps) {
  return (
    <div className="fixed bottom-24 left-1/2 z-50 w-[min(560px,92vw)] -translate-x-1/2 rounded-[14px] border border-[var(--border-prominent)] bg-[var(--bg-surface-elevated)] px-3 py-2 shadow-[var(--shadow-lg)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--text-primary)]">{message}</p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onUndo}>
            Undo
          </Button>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
