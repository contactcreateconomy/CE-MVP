"use client";

import { useState } from "react";
import { motion } from "motion/react";

import { SPRINGS, usePrefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { formatGravity, gSwitchReason } from "./feed-format";
import type { FeedViewerInteractions } from "./feed-display-types";

export interface FeedGSwitchProps {
  gravity: number;
  viewer: FeedViewerInteractions;
  /** Tap G = appreciate (L-63). Absent → the switch is display-only. */
  onAppreciate?: () => void;
  className?: string;
}

/**
 * G-switch (L-63, replaces the gem / Orbit): at rest a "G" mark; once the
 * viewer has added Gravity in any way (appreciate, save, comment, qualified
 * share) a capsule slides in from the left and docks into the G — "you've
 * slid into this post", echoing the logo's geometry. The count beside it is
 * Gravity as a unit ("18G", L-62), hidden at 0.
 *
 * Four beats (Bible §11.1): press 0.97 (acknowledge) → capsule slides on the
 * critically damped feedback spring (commit) → one celebrate glow, dark only,
 * only on the user's own tap (confirm) → stays on (settle). Reduced motion:
 * instant state, no glow.
 */
export function FeedGSwitch({ gravity, viewer, onAppreciate, className }: FeedGSwitchProps) {
  const reduced = usePrefersReducedMotion();
  const reason = gSwitchReason(viewer);
  const on = reason !== null;
  const count = formatGravity(gravity);
  const [celebrate, setCelebrate] = useState(0);

  return (
    <button
      type="button"
      onClick={() => {
        if (!viewer.appreciated && !reduced) setCelebrate((n) => n + 1);
        onAppreciate?.();
      }}
      disabled={!onAppreciate}
      aria-pressed={!!viewer.appreciated}
      aria-label={reason ?? "Add Gravity"}
      title={reason ?? "Add Gravity"}
      data-on={on}
      className={cn(
        "focus-ring relative inline-flex h-8 items-center gap-1.5 rounded-full px-2 text-caption transition-[background-color,color,scale] duration-normal active:scale-97 active:duration-press disabled:cursor-default",
        on ? "text-brand-primary" : "text-text-muted hover:bg-bg-overlay hover:text-text-primary",
        className,
      )}
    >
      {celebrate > 0 ? (
        <span
          key={celebrate}
          aria-hidden
          className="glow-celebrate pointer-events-none absolute inset-0 rounded-full"
          onAnimationEnd={() => setCelebrate(0)}
        />
      ) : null}
      <span aria-hidden className="relative inline-flex size-4 items-center justify-center">
        <span className="text-label-md font-semibold leading-none">G</span>
        <motion.span
          className="absolute left-1/2 top-1/2 h-0.75 w-2 -translate-y-1/2 rounded-full bg-brand-primary"
          initial={false}
          animate={on ? { x: 0, opacity: 1 } : { x: -10, opacity: 0 }}
          transition={reduced ? { duration: 0 } : SPRINGS.feedback}
        />
      </span>
      {count ? <span className="font-mono tabular-nums">{count}</span> : null}
    </button>
  );
}
