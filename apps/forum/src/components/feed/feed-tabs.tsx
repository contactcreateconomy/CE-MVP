"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import { motion } from "motion/react";

import { SPRINGS, usePrefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

import type { FeedSort } from "./feed-display-types";

const ITEMS = [
  { key: "top", label: "Top" },
  { key: "hot", label: "Hot" },
  { key: "new", label: "New" },
  { key: "fav", label: "Fav" },
] as const satisfies ReadonlyArray<{ key: FeedSort; label: string }>;

const HOVER_NOTE_MS = 400;
const TAP_NOTE_MS = 2800;
const tipKey = (k: FeedSort) => `cc-sort-tip-${k}`;

export interface FeedTabsProps {
  active: FeedSort;
  onSelect: (sort: FeedSort) => void;
  /** New human activity on saved / joined posts → Fav glows (L-47). */
  favNew?: boolean;
  /** Window notes, read from config (L-07): desktop hover note after 400ms,
   *  mobile first-use note once per tab. Absent → no note. */
  notes?: Partial<Record<FeedSort, string>>;
  ref?: Ref<HTMLDivElement>;
  className?: string;
}

/** Once-per-tab mobile note; a per-viewer convenience, so browser storage is fine. */
function firstTap(k: FeedSort): boolean {
  try {
    if (localStorage.getItem(tipKey(k))) return false;
    localStorage.setItem(tipKey(k), "1");
  } catch {
    /* private mode — the note simply shows */
  }
  return true;
}

/**
 * Sorter — Top · Hot · New · Fav (FEED-DESIGN §9.4): four equal tabs, no
 * divider, windows never printed on the tabs (L-07, L-44). The active pill is
 * solid brand with NO glow (L-70) and slides on the settle spring; Fav's
 * letters glow steadily only while there is new activity (L-47), so it stays
 * the only glow on the sorter. Material: frost-look card (Make sorter).
 */
export function FeedTabs({ active, onSelect, favNew = false, notes, ref, className }: FeedTabsProps) {
  const reduced = usePrefersReducedMotion();
  const [note, setNote] = useState<FeedSort | null>(null);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const showLater = (k: FeedSort) => {
    if (!notes?.[k]) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setNote(k), HOVER_NOTE_MS);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    setNote(null);
  };

  return (
    <div ref={ref} className={cn("frost-look relative rounded-lg border border-border-subtle", className)}>
      <div role="tablist" aria-label="Sort posts" className="flex items-center gap-1 p-1">
        {ITEMS.map(({ key, label }) => {
          const on = key === active;
          const glow = key === "fav" && favNew && !on;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={on}
              aria-label={glow ? "Fav, new activity" : label}
              onClick={(e) => {
                hide();
                const touch = (e.nativeEvent as PointerEvent).pointerType === "touch";
                if (touch && notes?.[key] && firstTap(key)) {
                  setNote(key);
                  timer.current = window.setTimeout(() => setNote(null), TAP_NOTE_MS);
                }
                onSelect(key);
              }}
              onPointerEnter={(e) => e.pointerType === "mouse" && showLater(key)}
              onPointerLeave={hide}
              onFocus={() => showLater(key)}
              onBlur={hide}
              className={cn(
                "focus-ring relative h-11 flex-1 rounded-full text-body-sm font-semibold transition-[color,scale] duration-normal active:scale-97 active:duration-press lg:h-9",
                on ? "text-text-inverse" : glow ? "glow-text-new" : "text-text-muted hover:text-text-primary",
              )}
            >
              {on ? (
                <motion.span
                  layoutId="feed-sort-pill"
                  aria-hidden
                  transition={reduced ? { duration: 0 } : SPRINGS.settle}
                  className="absolute inset-0 rounded-full bg-brand-primary"
                />
              ) : null}
              <span className="relative">{label}</span>
            </button>
          );
        })}
      </div>
      {note && notes?.[note] ? (
        <p
          role="status"
          className="pointer-events-none absolute left-1/2 top-full z-dropdown mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border-default bg-bg-surface-elevated px-2.5 py-1.5 text-caption text-text-secondary shadow-md"
        >
          {notes[note]}
        </p>
      ) : null}
    </div>
  );
}
