"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

import type { FeedNavItem } from "./feed-display-types";
import { postTypeMeta } from "./feed-post-type-meta";

const ITEM_H = 40; // h-10
const ITEM_GAP = 4; // space-y-1

export interface FeedLeftNavProps {
  /** "home" first, then the active post types (postTypeConfig, state=active). */
  items: FeedNavItem[];
  activeKey: string;
  /** Hidden when absent (e.g. guests → wiring passes the sign-in opener). */
  onStartDiscussion?: () => void;
  className?: string;
}

/**
 * Left rail (lg+): "Start Discussion" CTA + Discover list with a sliding
 * active outline. Prototype `left-sidebar.tsx`; the conic `GlowingEffect`
 * around the CTA is removed by S00 §7 and replaced by `.glow-cta`.
 */
export function FeedLeftNav({ items, activeKey, onStartDiscussion, className }: FeedLeftNavProps) {
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.key === activeKey),
  );

  return (
    <aside className={cn("sticky top-20 h-fit w-60 shrink-0 space-y-4", className)}>
      {onStartDiscussion ? (
        <div className="card-surface p-3">
          <button
            type="button"
            onClick={onStartDiscussion}
            className="glow-cta focus-ring inline-flex h-9 w-full items-center justify-center gap-1 rounded-full bg-brand-primary text-body-md font-semibold text-text-inverse transition-[transform,background-color] duration-normal ease-out-cubic hover:bg-brand-primary-hover active:scale-97"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Start Discussion
          </button>
        </div>
      ) : null}

      <nav className="card-surface" aria-label="Discover">
        <h2 className="p-4 pb-2 text-label-md font-semibold uppercase text-text-muted">Discover</h2>
        <div className="relative space-y-1 p-3 pt-0">
          <div
            aria-hidden
            className="glow-active pointer-events-none absolute left-3 right-3 rounded-full border border-border-active/70 transition-[top] duration-slow ease-out-cubic motion-reduce:transition-none"
            style={{ top: activeIndex * (ITEM_H + ITEM_GAP), height: ITEM_H }}
          />
          {items.map((item) => {
            const isActive = item.key === activeKey;
            const { Icon } = postTypeMeta(item.key);
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={"text-heading-xs " + cn(
                  "focus-ring relative z-10 flex h-10 w-full items-center gap-2.5 rounded-full px-3 font-semibold transition-colors duration-normal",
                  isActive ? "text-brand-primary" : "text-text-primary hover:bg-bg-overlay/55 hover:text-brand-primary",
                )}
              >
                <Icon className={cn("size-4", isActive && "scale-105")} strokeWidth={2.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
