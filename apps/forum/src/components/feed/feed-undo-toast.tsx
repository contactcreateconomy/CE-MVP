"use client";

import { Toast } from "@/components/ui/toast";

interface FeedUndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}

/** §11.7 toast with action row (Undo), info variant, no auto-dismiss. */
export function FeedUndoToast({ message, onUndo, onDismiss }: FeedUndoToastProps) {
  return (
    <Toast
      message={message}
      variant="info"
      duration={0}
      onDismiss={onDismiss}
      action={
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="rounded-md px-2 py-1 text-xs font-semibold text-text-link outline-hidden transition-colors duration-normal ease-out-cubic hover:text-text-link-hover focus-visible:ring-2 focus-visible:ring-brand-primary-hover"
            onClick={onUndo}
          >
            Undo
          </button>
        </div>
      }
    />
  );
}
