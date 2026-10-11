"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRightCircle, ArrowUpRight, Crown, Medal, TrendingUp } from "lucide-react";

import { formatPoints } from "@/lib/format";
import { cn } from "@/lib/utils";

import { FeedAvatar } from "./feed-avatar";
import type { FeedPodiumEntry, FeedPodiumWindow, FeedVibingItem } from "./feed-display-types";

/* ── What's Vibing ─────────────────────────────────────────────────── */

const VIBING_INTERVAL_MS = 4000;

export interface FeedVibingWidgetProps {
  items: FeedVibingItem[];
  className?: string;
}

/** Prototype `whats-vibing-widget.tsx`: one trending item at a time, stacked
 *  slide-up rotation every 4 s, paused on hover/focus and under reduced
 *  motion. Renders nothing when there is nothing trending (D-012). */
export function FeedVibingWidget({ items, className }: FeedVibingWidgetProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (items.length <= 1 || isPaused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActiveIndex((i) => (i + 1) % items.length), VIBING_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isPaused, items.length]);

  if (items.length === 0) return null;
  const current = activeIndex % items.length;

  return (
    <section
      className={cn("card-surface animate-soft-float h-62.5 border-border-default p-4 motion-reduce:animate-none", className)}
      style={{ animationDelay: "160ms" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      aria-label="What's Vibing"
    >
      <h2 className="inline-flex items-center gap-2 pb-3 text-heading-xs font-semibold text-text-primary">
        <TrendingUp className="size-4 text-brand-primary" /> What&apos;s Vibing
      </h2>
      <div className="h-46.5">
        <div className="relative h-full overflow-hidden rounded-2xl">
          {items.map((item, index) => (
            <Link
              key={item.id}
              href={item.href}
              tabIndex={index === current ? 0 : -1}
              aria-hidden={index !== current}
              className={cn(
                "focus-ring group absolute inset-0 flex flex-col justify-between rounded-2xl border border-border-prominent bg-bg-overlay/25 p-4 transition-[transform,opacity,border-color] duration-slow ease-out-cubic hover:border-border-active/45 motion-reduce:transition-opacity",
                index === current
                  ? "z-10 translate-y-0 scale-100 opacity-100"
                  : index < current
                    ? "pointer-events-none -translate-y-4 scale-95 opacity-0"
                    : "pointer-events-none translate-y-4 scale-95 opacity-0",
              )}
            >
              <div className="space-y-2">
                <span className="block text-caption font-semibold text-brand-primary">{item.contextLabel}</span>
                <h3 className="line-clamp-4 text-heading-xs font-semibold text-text-primary">{item.title}</h3>
              </div>
              <div className="inline-flex items-center gap-2 text-label-sm font-semibold uppercase tracking-widest text-text-muted">
                <span>{item.engagedCount.toLocaleString("en-US")} engaged</span>
                <ArrowUpRight className="size-3.5 text-text-secondary transition-[transform,color] duration-normal group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-primary" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Podium ────────────────────────────────────────────────────────── */

const WINDOWS: Array<{ key: FeedPodiumWindow; label: string }> = [
  { key: "h24", label: "24H" },
  { key: "d7", label: "7D" },
  { key: "m1", label: "1M" },
];

const RANK = {
  1: { icon: "text-rank-gold", ring: "ring-rank-gold" },
  2: { icon: "text-rank-silver", ring: "ring-rank-silver" },
  3: { icon: "text-rank-bronze", ring: "ring-rank-bronze" },
  4: { icon: "text-rank-four", ring: "ring-rank-four" },
  5: { icon: "text-rank-five", ring: "ring-rank-five" },
} as const;

export interface FeedPodiumWidgetProps {
  window: FeedPodiumWindow;
  onWindowChange: (window: FeedPodiumWindow) => void;
  /** null → "forming" (projection below its threshold, CAP-294). */
  entries: FeedPodiumEntry[] | null;
  leaderboardHref: string;
  className?: string;
}

/** Prototype `podium-widget.tsx`: 24H/7D/1M switch + top 5 with rank-tinted
 *  rings. Points are the projection's, never derived client-side (D-012 —
 *  the prototype's per-window multipliers are not ported). */
export function FeedPodiumWidget({ window, onWindowChange, entries, leaderboardHref, className }: FeedPodiumWidgetProps) {
  const activeIndex = Math.max(
    0,
    WINDOWS.findIndex((w) => w.key === window),
  );

  return (
    <section
      className={cn("card-surface animate-soft-float space-y-3 p-3 motion-reduce:animate-none", className)}
      style={{ animationDelay: "100ms" }}
      aria-label="Podium"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-label-md font-semibold uppercase text-text-muted">Podium</h2>
        <div role="tablist" aria-label="Podium window" className="relative w-40 rounded-full border border-border-default bg-bg-overlay/50 p-1">
          <div
            aria-hidden
            className="glow-active pointer-events-none absolute bottom-1 left-1 top-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-brand-primary transition-transform duration-slow ease-out-cubic motion-reduce:transition-none"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          />
          <div className="relative z-10 grid grid-cols-3">
            {WINDOWS.map((w) => {
              const isActive = w.key === window;
              return (
                <button
                  key={w.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onWindowChange(w.key)}
                  className={"text-micro " + cn(
                    "focus-ring h-6 rounded-full px-2 font-semibold transition-colors duration-normal",
                    isActive ? "text-text-inverse" : "text-text-secondary hover:text-text-primary",
                  )}
                >
                  {w.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {entries === null || entries.length === 0 ? (
        <p className="rounded-lg border border-border-subtle bg-bg-overlay/45 px-3 py-4 text-center text-body-sm text-text-secondary">
          Podium is forming
        </p>
      ) : (
        <ol className="space-y-2">
          {entries.slice(0, 5).map((entry) => {
            const tone = RANK[entry.rank as keyof typeof RANK] ?? RANK[5];
            const Icon = entry.rank <= 3 ? Crown : Medal;
            const shimmer = entry.rank <= 3;
            const row = (
              <>
                {shimmer ? (
                  // v2 top-3 hover sheen — no stated purpose; flagged in S02-SPEC §4 (founder call).
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 -left-[35%] w-[35%] -skew-x-12 bg-linear-to-r from-transparent via-text-primary/10 to-transparent opacity-0 transition-[left,opacity] duration-700 group-hover/row:left-[120%] group-hover/row:opacity-100 motion-reduce:hidden"
                  />
                ) : null}
                <span className="relative z-10 flex min-w-0 flex-1 items-center gap-2.5 pr-2">
                  <Icon className={cn("size-4 shrink-0", tone.icon)} aria-label={`Rank ${entry.rank}`} />
                  <FeedAvatar person={entry.person} size="sm" className={cn("size-8 border-0 ring-2", tone.ring)} />
                  <span className="min-w-0 truncate text-body-sm font-medium text-text-primary">{entry.person.name}</span>
                </span>
                <span className="relative z-10 shrink-0 text-caption font-semibold text-feedback-warning">{formatPoints(entry.points)}</span>
              </>
            );
            const rowClass =
              "group/row relative flex items-center justify-between gap-2 overflow-hidden rounded-lg border border-border-subtle bg-bg-overlay/45 px-3 py-2.5";
            return (
              <li key={`${entry.rank}-${entry.person.name}`}>
                {entry.href ? (
                  <Link href={entry.href} className={cn(rowClass, "focus-ring transition-colors duration-normal", shimmer && "hover:border-border-prominent")}>
                    {row}
                  </Link>
                ) : (
                  <div className={rowClass}>{row}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex justify-center">
        <Link
          href={leaderboardHref}
          aria-label="Open full leaderboard"
          className="focus-ring inline-flex size-8 items-center justify-center rounded-full text-brand-primary transition-colors duration-normal hover:bg-bg-overlay/55 hover:text-brand-primary-hover"
        >
          <ArrowRightCircle className="size-4" />
        </Link>
      </div>
    </section>
  );
}
