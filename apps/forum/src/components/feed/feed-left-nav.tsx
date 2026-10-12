"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Hash, Plus } from "lucide-react";

import { usePrefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

import type { FeedNavItem } from "./feed-display-types";
import { postTypeMeta } from "./feed-post-type-meta";
import { startSheetLayoutId } from "./feed-start-sheet";

export interface FeedLeftNavProps {
  /** "home" first, then the active post types (postTypeConfig, state=active). */
  items: FeedNavItem[];
  /** "Your topics" (interests / StellarMap order, §9.6). Empty → section hidden. */
  topics?: FeedNavItem[];
  activeKey: string;
  /** Hidden when absent (e.g. guests → wiring passes the sign-in opener). */
  onStartDiscussion?: () => void;
  className?: string;
}

const Count = ({ n }: { n?: number | null }) =>
  n ? <span className="font-mono text-micro tabular-nums text-text-muted">{n}</span> : null;

const Heading = ({ children, className }: { children: string; className?: string }) => (
  <p className={cn("mb-1.5 px-2.5 font-mono text-micro font-medium uppercase tracking-widest text-text-muted", className)}>{children}</p>
);

function Row({ item, active, topic }: { item: FeedNavItem; active: boolean; topic?: boolean }) {
  const Icon = topic ? Hash : postTypeMeta(item.key).Icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring flex h-8 w-full items-center gap-2.5 rounded-full px-2.5 text-body-sm transition-colors duration-normal",
        // Active = the selected state; glow-active is the one allowed at-rest glow (L-38).
        active ? "glow-active bg-bg-overlay font-medium text-brand-primary" : "text-text-secondary hover:bg-bg-overlay/60 hover:text-text-primary",
      )}
    >
      <Icon className={cn("size-3.75 shrink-0", !active && "text-text-muted")} strokeWidth={1.5} aria-hidden />
      <span className="flex-1 truncate">{item.label}</span>
      <Count n={item.count} />
    </Link>
  );
}

/**
 * Left rail (lg+, FEED-DESIGN §9.3 + §9.6, Make Discover): the Start
 * Discussion pill (one job — glows on hover/press only, L-34/L-38) above a
 * frosted Discover card (L2 functional → frost-subtle): post types, then
 * "Your topics", each with a mono new-since-last-visit count (none at 0).
 * Labels come from data (COPY-1). Drill-down + lens bus land in B9.
 */
export function FeedLeftNav({ items, topics = [], activeKey, onStartDiscussion, className }: FeedLeftNavProps) {
  const reduced = usePrefersReducedMotion();
  return (
    <aside className={cn("flex flex-col gap-3", className)}>
      {onStartDiscussion ? (
        // FEED-U3: the pill is the Start sheet's shared element — it grows
        // into the sheet and the sheet returns into it (§9.3, Bible §9.4).
        <motion.button
          type="button"
          onClick={onStartDiscussion}
          aria-haspopup="dialog"
          data-start-origin="rail"
          layoutId={reduced ? undefined : startSheetLayoutId("rail")}
          className="hover:glow-cta active:glow-active focus-ring inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-brand-primary text-body-sm font-semibold text-text-inverse transition-[background-color,box-shadow,scale] duration-normal hover:bg-brand-primary-hover active:scale-97 active:duration-press motion-reduce:active:scale-100"
        >
          <Plus className="size-4" strokeWidth={2} aria-hidden />
          Start Discussion
        </motion.button>
      ) : null}

      <nav aria-label="Discover" className="frost-subtle rounded-lg border border-border-subtle px-2 py-3">
        <Heading>Discover</Heading>
        {items.map((item) => (
          <Row key={item.key} item={item} active={item.key === activeKey} />
        ))}
        {topics.length > 0 ? (
          <>
            <Heading className="mt-3">Your topics</Heading>
            {topics.map((item) => (
              <Row key={item.key} item={item} active={item.key === activeKey} topic />
            ))}
          </>
        ) : null}
      </nav>
    </aside>
  );
}

/** Mobile (<lg): Discover as one horizontal chip row under the top bar (§8). */
export function FeedDiscoverChips({ items, topics = [], activeKey, className }: Omit<FeedLeftNavProps, "onStartDiscussion">) {
  return (
    <div className={cn("no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4", className)} role="navigation" aria-label="Discover">
      {[...items, ...topics].map((item) => {
        const on = item.key === activeKey;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "focus-ring flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-caption font-medium transition-[scale] active:scale-97 active:duration-press",
              on ? "border-transparent bg-bg-overlay text-brand-primary" : "border-border-subtle bg-bg-surface/70 text-text-secondary",
            )}
          >
            {item.label}
            <Count n={item.count} />
          </Link>
        );
      })}
    </div>
  );
}
