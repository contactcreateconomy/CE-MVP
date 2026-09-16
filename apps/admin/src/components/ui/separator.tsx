"use client";

import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * Separator — STYLE-KIT border/subtle rule. Horizontal (default) or
 * vertical. Not a new overlay; used in the admin shell groups.
 */
export function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}) {
  return (
    <div
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        "shrink-0 bg-border-subtle",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
}
