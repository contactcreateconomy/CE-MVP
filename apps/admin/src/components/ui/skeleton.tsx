import type { HTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Skeleton — STYLE-KIT §11.9. Shimmer sweep bg/surface → bg/overlay →
 * bg/surface. §11.9 names 1500ms; the reconciled duration scale (§7.1,
 * RECONCILIATION-NOTE #9) has no 1500ms step, so the sweep rides the
 * existing --duration-shimmer token rather than adding a scale step
 * (same zero-new-token move as Layer 2's destructive ramp, note #14).
 * Variants: text-line / heading / avatar / image / button / card.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-progress-shimmer bg-bg-surface", className)}
      {...props}
    />
  );
}

/** §11.9 TEXT LINE — height 16px (h-4), radius/sm. */
export function SkeletonText({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("h-4 rounded-sm", className)} {...props} />;
}

/** §11.9 HEADING — height 24px (h-6), radius/sm. */
export function SkeletonHeading({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("h-6 rounded-sm", className)} {...props} />;
}

/** §11.9 AVATAR — circle, size prop (defaults sm 28px). */
export function SkeletonAvatar({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("size-7 rounded-full", className)} {...props} />;
}

/** §11.9 IMAGE — 16:9 rectangle, radius/md. */
export function SkeletonImage({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("aspect-video w-full rounded-md", className)} {...props} />;
}

/** §11.9 BUTTON — match button size (defaults md h-9), radius/md. */
export function SkeletonButton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("h-9 w-20 rounded-md", className)} {...props} />;
}

/** §11.9 SPINNER — inline loading, brand/primary. Layer 2 precedent
 * (Button loading) uses Loader2 + animate-spin; kept consistent. */
export function Spinner({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <Loader2
      className={cn("size-4 animate-spin text-brand-primary", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
