import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Badge — STYLE-KIT §11.5 PILL MECHANISM: radius/full, 4px 10px padding,
 * label/md medium, <color> at 10% bg + matching -text color. No border.
 * `tone` maps to the semantic feedback set; category pills compose this
 * with `style`-free tone variants below.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-bg-overlay text-text-secondary",
        brand: "bg-brand-primary/10 text-brand-primary",
        success: "bg-feedback-success/10 text-feedback-success",
        error: "bg-feedback-error/10 text-feedback-error",
        warning: "bg-feedback-warning/10 text-feedback-warning",
        info: "bg-feedback-info/10 text-feedback-info",
        // §11.5 TIME BADGE family
        hot: "bg-feedback-error/10 text-feedback-error",
        recent: "bg-feedback-warning/10 text-feedback-warning",
        evergreen: "bg-brand-primary/10 text-brand-primary",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

/**
 * §11.5 TAG: user hashtags — bg/surface-elevated, text/secondary,
 * border/default, radius/md, # prefix muted. Hover per spec.
 */
export function Tag({ className, children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-border-default bg-bg-surface-elevated px-2 py-0.5 text-xs text-text-secondary transition-colors duration-normal ease-out-cubic hover:border-border-prominent hover:bg-bg-overlay hover:text-text-primary",
        className,
      )}
      {...props}
    >
      <span className="text-text-muted">#</span>
      {children}
    </span>
  );
}

export { badgeVariants };
