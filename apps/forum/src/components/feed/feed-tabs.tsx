"use client";

import { Bookmark, Clock3, Flame, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

import type { FeedSort } from "./feed-display-types";

const ITEMS = [
  { key: "top", label: "Top", Icon: TrendingUp },
  { key: "hot", label: "Hot", Icon: Flame },
  { key: "new", label: "New", Icon: Clock3 },
  { key: "fav", label: "Fav", Icon: Bookmark },
] as const satisfies ReadonlyArray<{ key: FeedSort; label: string; Icon: unknown }>;

export interface FeedTabsProps {
  active: FeedSort;
  onSelect: (sort: FeedSort) => void;
  className?: string;
}

/**
 * Feed sort control — prototype `trend-sorter.tsx`: a pill with a sliding
 * brand indicator (glow-active in dark). Same four sorts as `feed.list`
 * `sortMode`. Guests selecting Fav is the wiring's call (feed.list returns
 * `member_only`).
 */
export function FeedTabs({ active, onSelect, className }: FeedTabsProps) {
  const activeIndex = Math.max(
    0,
    ITEMS.findIndex((item) => item.key === active),
  );

  return (
    <div
      role="tablist"
      aria-label="Sort the feed"
      className={cn(
        "glass-chrome relative mx-auto w-full max-w-216 rounded-full border border-border-default p-1",
        className,
      )}
    >
      <div
        aria-hidden
        className="glow-active pointer-events-none absolute bottom-1 left-1 top-1 w-[calc(25%-0.25rem)] rounded-full bg-brand-primary transition-transform duration-slow ease-out-cubic motion-reduce:transition-none"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />
      <div className="relative z-10 grid grid-cols-4">
        {ITEMS.map(({ key, label, Icon }) => {
          const isActive = key === active;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(key)}
              className={"text-body-md " + cn(
                "focus-ring flex h-11 items-center justify-center gap-1.5 rounded-full font-semibold transition-colors duration-normal active:scale-97 lg:h-9",
                isActive ? "text-text-inverse" : "text-text-primary hover:text-brand-primary",
              )}
            >
              <Icon className="size-3.5" strokeWidth={2.25} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
