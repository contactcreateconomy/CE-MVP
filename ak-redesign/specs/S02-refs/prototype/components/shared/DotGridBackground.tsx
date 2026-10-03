"use client";

import { cn } from "@/lib/utils";

/**
 * Dot grid pattern background with fade-center mask.
 * Renders as a fixed full-screen element behind all content.
 */
export function DotGridBackground({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 dot-grid dot-grid-mask",
        className
      )}
      aria-hidden="true"
    />
  );
}
