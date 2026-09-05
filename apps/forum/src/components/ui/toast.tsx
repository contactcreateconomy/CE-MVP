"use client";

import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Toast — STYLE-KIT §11.7 TOAST: bottom-center (mobile) / bottom-right
 * (desktop), bg/surface-elevated, radius/lg, shadow/lg, border/subtle,
 * max 420px, slide-up + fade. Variants carry a 2px semantic left border
 * (border-l-2 — §11.7 nominally says 3px, but 3px has no border-width
 * scale step and a raw arbitrary value would break the zero-raw-px rule;
 * nearest scale value ships, logged in RECONCILIATION-NOTE) + icon per
 * §11.7. Replaces the ad-hoc BriefToast/FeedUndoToast styling.
 */
export type ToastVariant = "success" | "error" | "warning" | "info";

const variantStyles: Record<ToastVariant, { border: string; icon: typeof Info }> = {
  success: { border: "border-l-feedback-success", icon: CheckCircle2 },
  error: { border: "border-l-feedback-error", icon: XCircle },
  warning: { border: "border-l-feedback-warning", icon: AlertTriangle },
  info: { border: "border-l-feedback-info", icon: Info },
};

const variantIconColor: Record<ToastVariant, string> = {
  success: "text-feedback-success",
  error: "text-feedback-error",
  warning: "text-feedback-warning",
  info: "text-feedback-info",
};

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
  /** Auto-dismiss in ms. Default 4000 per §11.7; 0 disables. */
  duration?: number;
  onDismiss: () => void;
  /** Optional action row (e.g. Undo) rendered instead of the X. */
  action?: React.ReactNode;
}

export function Toast({
  message,
  variant = "info",
  duration = 4000,
  onDismiss,
  action,
}: ToastProps) {
  useEffect(() => {
    if (duration <= 0) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [duration, onDismiss, message]);

  const { border, icon: Icon } = variantStyles[variant];

  return (
    <div
      role="status"
      className={cn(
        "fixed bottom-24 left-1/2 z-toast w-(--container-toast) -translate-x-1/2 rounded-lg border border-border-subtle border-l-2 bg-bg-surface-elevated px-4 py-2.5 shadow-lg animate-soft-float sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0",
        border,
      )}
    >
      <div className="flex items-center gap-2.5">
        <Icon className={cn("size-4 shrink-0", variantIconColor[variant])} aria-hidden />
        <p className="min-w-0 flex-1 text-sm text-text-primary">{message}</p>
        {action}
        {!action && (
          <button
            type="button"
            className="shrink-0 rounded-md p-1 text-text-muted outline-hidden transition-colors duration-normal ease-out-cubic hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand-primary-hover"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
