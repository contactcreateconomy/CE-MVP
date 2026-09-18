"use client";

import { Flame, Bookmark, TrendingUp, Clock3 } from "lucide-react";

export type FeedSortMode = "top" | "hot" | "new" | "fav";

const sortItems = [
  { key: "top", label: "Top", Icon: TrendingUp },
  { key: "hot", label: "Hot", Icon: Flame },
  { key: "new", label: "New", Icon: Clock3 },
  { key: "fav", label: "Fav", Icon: Bookmark },
] as const;

interface TrendSorterProps {
  value: FeedSortMode;
  onChange: (mode: FeedSortMode) => void;
}

/** Old-forum sliding pill: brand fill + glow, black label on the active slot. */
export function TrendSorter({ value, onChange }: TrendSorterProps) {
  const activeIndex = Math.max(0, sortItems.findIndex((item) => item.key === value));

  return (
    <div
      className="relative mx-auto w-full max-w-[864px] rounded-full border border-(--border-default) bg-(--bg-surface)/70 p-1 backdrop-blur-md"
      role="tablist"
      aria-label="Sort mode"
    >
      <div
        className="pointer-events-none absolute bottom-1 left-1 top-1 w-[calc(25%-0.25rem)] rounded-full bg-brand-primary shadow-glow-primary-pill transition-transform duration-slow ease-out"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />

      <div className="relative z-10 grid grid-cols-4">
        {sortItems.map(({ key, label, Icon }) => {
          const isActive = value === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(key)}
              className={`flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full text-base font-semibold transition-colors duration-normal ${
                isActive ? "text-text-inverse" : "text-(--text-primary) hover:text-(--text-primary)"
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
