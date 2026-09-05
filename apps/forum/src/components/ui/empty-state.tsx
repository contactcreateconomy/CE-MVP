import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * EmptyState — STYLE-KIT §11.23 EMPTY STATE. Centered icon/2xl +
 * heading/md + description (max 300px) + optional CTA. Compact variant
 * (tables, palette): icon/lg + heading/sm, CTA optional.
 * Honest-empty rule: the description slot renders caller copy verbatim —
 * no fabricated counts (CAP-371).
 */
export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Semantic icon (lucide). Icon class is applied by the variant. */
  icon: ReactNode;
  heading: string;
  description?: string;
  /** Optional CTA (Button/md primary or secondary per §11.23). */
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  };
  /** Compact (tables, palette): icon/lg + heading/sm, no CTA required. */
  compact?: boolean;
}

export function EmptyState({
  icon,
  heading,
  description,
  action,
  compact = false,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 text-center",
        compact ? "gap-2 py-8" : "gap-0 py-10",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "flex items-center justify-center text-text-muted",
          compact ? "size-5" : "size-12 [&_svg]:size-12",
        )}
        aria-hidden
      >
        {icon}
      </div>
      {compact ? (
        <p className="text-sm font-medium text-text-primary">{heading}</p>
      ) : (
        <h3 className="mt-3 text-lg font-semibold text-text-primary">{heading}</h3>
      )}
      {description ? (
        <p className="mt-2 max-w-75 text-sm text-text-secondary">{description}</p>
      ) : null}
      {action ? (
        <Button
          className="mt-4"
          variant={action.variant ?? "primary"}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
