"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Banner — STYLE-KIT §11.13. Full-width persistent status strip — NOT a
 * toast (no auto-dismiss, no bottom-right placement). Variants are
 * feedback-token-only; neutral uses border/prominent accent + bg/wash.
 * Consumers per SLICE-P3-06: CMP pre-choice strip (non-dismissible —
 * strictly_necessary is non-negotiable per cmp contract §3 A), BetaBanner
 * slot, admin operational-mode chrome (dismissible only when allowed).
 *
 * Accent width matches the shipped Toast variant borders (border-l-2;
 * §11.7/§11.13 nominally say 3px — no border-width scale step exists for
 * 3px, so the nearest step ships; logged in RECONCILIATION-NOTE).
 */
export type BannerVariant = "info" | "success" | "warning" | "error" | "neutral";

const variantConfig: Record<
  BannerVariant,
  { accent: string; icon: LucideIcon | null; iconClass: string }
> = {
  info: {
    accent: "border-l-feedback-info",
    icon: Info,
    iconClass: "text-feedback-info",
  },
  success: {
    accent: "border-l-feedback-success",
    icon: CheckCircle2,
    iconClass: "text-feedback-success",
  },
  warning: {
    accent: "border-l-feedback-warning",
    icon: AlertTriangle,
    iconClass: "text-feedback-warning",
  },
  error: {
    accent: "border-l-feedback-error",
    icon: XCircle,
    iconClass: "text-feedback-error",
  },
  // §11.13 NEUTRAL: accent border/prominent, no semantic icon, bg/wash
  neutral: { accent: "border-l-border-prominent", icon: null, iconClass: "" },
};

export interface BannerProps {
  variant?: BannerVariant;
  children: ReactNode;
  /** Optional action (Button/sm) before the dismiss control. */
  action?: ReactNode;
  /** Dismissible renders the X ghost; CMP pre-choice omits it (persistent). */
  onDismiss?: () => void;
  /** §11.13 sticky state (admin-home critical): under the 48px admin header. */
  sticky?: boolean;
  /** role defaults to status; use alert for error/warning when assertive. */
  role?: "status" | "alert";
  className?: string;
}

export function Banner({
  variant = "info",
  children,
  action,
  onDismiss,
  sticky = false,
  role,
  className,
}: BannerProps) {
  const { accent, icon: Icon, iconClass } = variantConfig[variant];
  const surface =
    variant === "neutral"
      ? "bg-bg-wash"
      : {
          info: "bg-feedback-info/10",
          success: "bg-feedback-success/10",
          warning: "bg-feedback-warning/10",
          error: "bg-feedback-error/10",
        }[variant];

  return (
    <div
      role={role ?? (variant === "error" || variant === "warning" ? "alert" : "status")}
      className={cn(
        "flex w-full items-start gap-2 rounded-md border border-border-subtle border-l-2 px-4 py-2.5",
        "animate-soft-float",
        surface,
        accent,
        sticky && "sticky top-12 z-sticky",
        className,
      )}
    >
      {Icon ? <Icon className={cn("mt-0.5 size-4 shrink-0", iconClass)} aria-hidden /> : null}
      <p className="min-w-0 flex-1 text-sm text-text-primary">{children}</p>
      {action ? <div className="flex shrink-0 items-center">{action}</div> : null}
      {onDismiss ? (
        <button
          type="button"
          className="shrink-0 rounded-md p-1 text-text-muted outline-hidden transition-colors duration-normal ease-out-cubic hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand-primary-hover"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
