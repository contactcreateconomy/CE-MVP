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
 * active pill. prototype-v2 `left-sidebar.tsx`; the conic `GlowingEffect`
 * around the CTA and the hover text glow are not ported (D-007 / S00 §7 —
 * flagged in S02-SPEC §4); the CTA carries `.glow-cta`. Item labels come
 * from data: v2's sidebar ("Q&A", no Spark) is a SCOPE question, not copied.
 */
export function FeedLeftNav({ items, activeKey, onStartDiscussion, className }: FeedLeftNavProps) {
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.key === activeKey),
  );

  return (
    <aside className={cn("sticky top-20 h-fit w-60 shrink-0 space-y-4", className)}>
      {onStartDiscussion ? (
        <div className="card-surface animate-soft-float p-3 motion-reduce:animate-none">
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

      <nav className="card-surface animate-soft-float motion-reduce:animate-none" style={{ animationDelay: "60ms" }} aria-label="Discover">
        <h2 className="p-4 pb-2 text-label-md font-semibold uppercase text-text-muted">Discover</h2>
        <div className="relative space-y-1 p-3 pt-0">
          <div
            aria-hidden
            className="glow-active pointer-events-none absolute left-3 right-3 top-0 rounded-full border border-border-active/70 bg-bg-overlay/55 transition-transform duration-slow ease-out-cubic will-change-transform motion-reduce:transition-none"
            style={{ transform: `translateY(${activeIndex * (ITEM_H + ITEM_GAP)}px)`, height: ITEM_H }}
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
                  isActive ? "text-brand-primary" : "text-text-primary hover:text-brand-primary",
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
