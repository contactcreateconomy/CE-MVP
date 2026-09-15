import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * Card — STYLE-KIT §11.3. Surface tokens via .card-surface (bg/surface,
 * border/subtle, radius/lg, shadow/xs). Interactive variant adds the
 * §11.3 hover/active states; focus-visible for keyboard users.
 * Selected (§11.8 matrix "Active ✓ (selected)") uses the shared selected
 * visual defined by §11.10/§11.11: brand at 10% + 2px brand left border.
 * Loading (§11.8): compose with Skeleton (§11.9) — not baked in.
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** §11.8 selected state — same visual as A1 row-selected / A12 claimed-by-me. */
  selected?: boolean;
}

export function Card({ className, selected = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "card-surface",
        selected && "border-l-2 border-l-brand-primary bg-brand-primary/10",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-between gap-2 p-4 pb-2", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 pt-0", className)} {...props} />;
}

/** §11.3 interactive card: hover border/prominent + shadow/sm + -1px lift, active reset. */
export function CardInteractive({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "card-surface outline-hidden transition-[border-color,box-shadow,transform] duration-normal ease-out-cubic hover:-translate-y-px hover:border-border-prominent hover:shadow-sm focus-visible:-translate-y-px focus-visible:border-border-active focus-visible:shadow-glow-primary-border active:translate-y-0 active:shadow-none",
        className,
      )}
      {...props}
    />
  );
}
