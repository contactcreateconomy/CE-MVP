"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { ArrowUpRight, Check, ChevronDown, Crown, Pause, Play, TrendingUp } from "lucide-react";

import { motionFor, useFeedMotion, usePrefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { FeedAvatar } from "./feed-avatar";
import type { FeedPodiumDimension, FeedPodiumEntry, FeedVibingItem } from "./feed-display-types";

const full = new Intl.NumberFormat("en-US");

/* ── What's Vibing (§9.5, L-45) ─────────────────────────────────────── */

const PERIOD_MS = 6000;

/** Rotation clock: pausable without losing progress. */
function useRotation(n: number, paused: boolean) {
  const [i, setI] = useState(0);
  const elapsed = useRef(0);
  useEffect(() => {
    if (paused || n < 2) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      elapsed.current += now - last;
      last = now;
      if (elapsed.current >= PERIOD_MS) {
        elapsed.current = 0;
        setI((x) => (x + 1) % n);
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [paused, n]);
  return i % Math.max(n, 1);
}

/** Sequential, never overlapping: out = fade + soft blur (180ms), in = focus
 *  pull context → hook → meta, 60ms apart. Reduced motion → crossfade. */
function useSequence() {
  const reduced = usePrefersReducedMotion();
  const m = motionFor(reduced);
  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduced ? 0 : 0.06 } },
    exit: { opacity: 0, filter: reduced ? "none" : "blur(4px)", transition: { duration: 0.18 } },
  };
  return { container, item: m.focusPull };
}

export interface FeedVibingWidgetProps {
  items: FeedVibingItem[];
  className?: string;
}

/** Renders nothing when nothing is trending (D-012); quiet fallback is B9. */
export function FeedVibingWidget({ items, className }: FeedVibingWidgetProps) {
  const [hold, setHold] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const i = useRotation(items.length, hold || userPaused);
  const { container, item } = useSequence();
  if (items.length === 0) return null;
  const h = items[i];

  return (
    <section
      aria-label="What's Vibing"
      aria-roledescription="rotating highlights"
      onPointerEnter={() => setHold(true)}
      onPointerLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setHold(false)}
      className={cn("group/v frost-subtle rounded-lg border border-border-subtle p-2.5", className)}
    >
      <header className="flex h-7 items-center gap-2 px-1">
        <TrendingUp className="size-3.75 text-brand-primary" strokeWidth={1.5} aria-hidden />
        <h2 className="flex-1 text-body-sm font-semibold text-text-primary">What&apos;s Vibing</h2>
        {items.length > 1 ? (
          // WCAG 2.2.2: pause control, visible on hover / focus only.
          <button
            type="button"
            onClick={() => setUserPaused((p) => !p)}
            aria-label={userPaused ? "Resume rotation" : "Pause rotation"}
            className="focus-ring flex size-7 items-center justify-center rounded-full text-text-muted opacity-0 transition-opacity duration-normal hover:bg-bg-overlay hover:text-text-primary focus-visible:opacity-100 group-hover/v:opacity-100 group-focus-within/v:opacity-100"
          >
            {userPaused ? <Play className="size-3" strokeWidth={1.75} /> : <Pause className="size-3" strokeWidth={1.75} />}
          </button>
        ) : null}
      </header>

      <Link
        href={h.href}
        aria-live={hold || userPaused ? "polite" : "off"}
        className={cn(
          "focus-ring group mt-2 block h-45 rounded-md border bg-bg-surface/70 p-4 transition-colors duration-normal hover:border-border-default",
          h.featured ? "border-border-active" : "border-border-subtle",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={h.id} variants={container} initial="hidden" animate="visible" exit="exit" className="flex h-full flex-col">
            <motion.p variants={item} className="flex items-center gap-1.5 text-caption font-medium text-brand-primary">
              {h.featured ? (
                <span className="rounded-full border border-border-active px-1.5 font-mono text-micro uppercase tracking-wider">Featured</span>
              ) : null}
              {h.contextLabel}
            </motion.p>
            <motion.p variants={item} className="mt-2 line-clamp-3 text-body-md font-semibold text-text-primary">
              {h.title}
            </motion.p>
            <motion.div variants={item} className="mt-auto flex items-center justify-between">
              <span className="font-mono text-micro uppercase tracking-widest text-text-muted">
                <span className="text-text-secondary">{full.format(h.engagedCount)}</span> engaged
              </span>
              <ArrowUpRight
                className="size-3.75 text-text-muted transition-[translate,color] duration-normal group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-text-primary"
                strokeWidth={1.5}
                aria-hidden
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </Link>
    </section>
  );
}

/** Mobile: one-line ticker under the sorter (§8); same sequence, holds on touch. */
export function FeedVibingTicker({ items, className }: FeedVibingWidgetProps) {
  const [hold, setHold] = useState(false);
  const i = useRotation(items.length, hold);
  const { container, item } = useSequence();
  if (items.length === 0) return null;
  const h = items[i];
  return (
    <Link
      href={h.href}
      aria-label={`What's Vibing: ${h.contextLabel}, ${h.shortTitle ?? h.title}`}
      onTouchStart={() => setHold(true)}
      onTouchEnd={() => window.setTimeout(() => setHold(false), 1500)}
      className={cn("focus-ring flex h-9 items-center gap-2 overflow-hidden rounded-full border border-border-subtle bg-bg-surface/70 px-3", className)}
    >
      <TrendingUp className="size-3.5 shrink-0 text-brand-primary" strokeWidth={1.5} aria-hidden />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={h.id} variants={container} initial="hidden" animate="visible" exit="exit" className="flex min-w-0 flex-1 items-center gap-1 whitespace-nowrap text-caption">
          <motion.span variants={item} className="shrink-0 text-brand-primary">
            {h.featured ? "Featured" : h.contextLabel}
          </motion.span>
          <motion.span variants={item} className="truncate text-text-secondary">
            · {h.shortTitle ?? h.title}
          </motion.span>
        </motion.span>
      </AnimatePresence>
    </Link>
  );
}

/* ── Podium (§9.7, L-28/L-32) ───────────────────────────────────────── */

const CROWN = ["text-rank-gold", "text-rank-silver", "text-rank-bronze"] as const;

function Rank({ rank }: { rank: number }) {
  return rank <= 3 ? (
    <Crown className={cn("size-3.75 shrink-0 fill-current/20", CROWN[rank - 1])} strokeWidth={1.75} aria-label={`Rank ${rank}`} />
  ) : (
    <span className="w-3.75 shrink-0 text-center font-mono text-caption tabular-nums text-text-muted">{rank}</span>
  );
}

/** Numbers in Geist Mono, words in Geist. */
const monoNumbers = (t: string) =>
  t.split(/(\+?\d[\d,.]*)/).map((x, i) => (i % 2 ? <span key={i} className="font-mono">{x}</span> : x));

function Rows({ entries }: { entries: FeedPodiumEntry[] }) {
  const m = useFeedMotion();
  return (
    <motion.ol variants={m.stagger} initial="hidden" animate="visible" className="flex flex-col">
      {entries.map((e) => {
        const inner = (
          <>
            <Rank rank={e.rank} />
            <FeedAvatar person={e.person} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body-sm font-medium text-text-primary">{e.person.name}</span>
              {e.did ? <span className="block truncate text-micro text-text-muted">{monoNumbers(e.did)}</span> : null}
            </span>
            {e.person.levelLabel ? <span className="shrink-0 text-micro text-text-muted">{e.person.levelLabel}</span> : null}
          </>
        );
        const row = "flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5";
        return (
          <motion.li key={`${e.rank}-${e.person.name}`} variants={m.focusPull}>
            {e.href ? (
              <Link href={e.href} className={cn(row, "focus-ring transition-colors duration-normal hover:bg-bg-overlay/60")}>
                {inner}
              </Link>
            ) : (
              <div className={row}>{inner}</div>
            )}
          </motion.li>
        );
      })}
    </motion.ol>
  );
}

function DimensionPicker({ dimensions, active, onChange }: { dimensions: FeedPodiumDimension[]; active: string; onChange: (key: string) => void }) {
  const current = dimensions.find((d) => d.key === active) ?? dimensions[0];
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="focus-ring flex h-7 items-center gap-1 rounded-full border border-border-subtle px-2.5 text-caption font-medium text-text-secondary transition-colors duration-normal hover:border-border-default hover:text-text-primary"
        >
          {current?.label} <ChevronDown className="size-3" strokeWidth={1.75} aria-hidden />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={4} className="frost-strong z-dropdown w-48 rounded-lg border border-border-subtle p-1">
          {dimensions.map((d) => (
            <DropdownMenu.Item
              key={d.key}
              onSelect={() => onChange(d.key)}
              className={cn(
                "flex h-8 cursor-pointer items-center justify-between rounded-md px-2.5 text-body-sm outline-none data-highlighted:bg-bg-overlay",
                d.key === active ? "text-brand-primary" : "text-text-secondary",
              )}
            >
              {d.label}
              {d.key === active ? <Check className="size-3.5" strokeWidth={2} aria-hidden /> : null}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export interface FeedPodiumWidgetProps {
  /** Follows the sorter window: "this week" (Hot), "this month" (Top), "today" (New). */
  windowLabel: string;
  /** Dimension registry (L-32). Absent / single → no picker. */
  dimensions?: FeedPodiumDimension[];
  activeDimension?: string;
  onDimensionChange?: (key: string) => void;
  /** null → "Forming" (below the projection threshold, CAP-294). */
  entries: FeedPodiumEntry[] | null;
  /** e.g. "needs 25 contributors (12 so far)" — from data, never invented. */
  formingDetail?: string | null;
  leaderboardHref: string;
  className?: string;
}

function Forming({ detail }: { detail?: string | null }) {
  return (
    <div className="rounded-md border border-dashed border-border-default px-3 py-5 text-center">
      <p className="text-body-sm font-medium text-text-primary">Forming</p>
      {detail ? <p className="mt-0.5 text-caption text-text-muted">{monoNumbers(detail)}</p> : null}
    </div>
  );
}

/** Rows say WHAT someone did, in plain words — never opaque points (R-10). */
export function FeedPodiumWidget(p: FeedPodiumWidgetProps) {
  const picker = p.dimensions && p.dimensions.length > 1 && p.onDimensionChange;
  return (
    <section aria-label="Podium" className={cn("frost-subtle rounded-lg border border-border-subtle p-2.5", p.className)}>
      <header className="flex items-center gap-2 px-1">
        <h2 className="flex-1 text-body-sm font-semibold text-text-primary">
          Podium <span className="font-normal text-text-muted">· {p.windowLabel}</span>
        </h2>
        {picker ? <DimensionPicker dimensions={p.dimensions!} active={p.activeDimension ?? p.dimensions![0].key} onChange={p.onDimensionChange!} /> : null}
      </header>
      <div className="mt-2">{p.entries && p.entries.length ? <Rows entries={p.entries.slice(0, 5)} /> : <Forming detail={p.formingDetail} />}</div>
      <Link
        href={p.leaderboardHref}
        className="focus-ring mt-2 flex h-8 w-full items-center justify-center gap-1 rounded-full text-caption font-medium text-text-secondary transition-colors duration-normal hover:bg-bg-overlay hover:text-text-primary"
      >
        Full leaderboard <ArrowUpRight className="size-3.5" strokeWidth={1.75} aria-hidden />
      </Link>
    </section>
  );
}

/** Mobile in-feed card (after the 5th post, §8): dimension chips + top 3. */
export function FeedPodiumCard(p: FeedPodiumWidgetProps) {
  return (
    <section aria-label="Podium" className={cn("frost-look rounded-lg border border-border-subtle p-3.5", p.className)}>
      <h2 className="text-body-sm font-semibold text-text-primary">
        Podium <span className="font-normal text-text-muted">· {p.windowLabel}</span>
      </h2>
      {p.dimensions && p.dimensions.length > 1 && p.onDimensionChange ? (
        <div className="no-scrollbar -mx-3.5 mt-2 flex gap-1.5 overflow-x-auto px-3.5">
          {p.dimensions.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => p.onDimensionChange!(d.key)}
              aria-pressed={d.key === p.activeDimension}
              className={cn(
                "focus-ring h-7 shrink-0 rounded-full border px-2.5 text-caption font-medium transition-[scale] active:scale-97 active:duration-press",
                d.key === p.activeDimension ? "border-transparent bg-brand-primary text-text-inverse" : "border-border-subtle text-text-secondary",
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-2">{p.entries && p.entries.length ? <Rows entries={p.entries.slice(0, 3)} /> : <Forming detail={p.formingDetail} />}</div>
      <Link
        href={p.leaderboardHref}
        className="focus-ring mt-1 flex h-9 w-full items-center justify-center gap-1 rounded-full border border-border-subtle text-caption font-medium text-text-primary transition-colors duration-normal hover:bg-bg-overlay"
      >
        See leaderboard <ArrowUpRight className="size-3.5" strokeWidth={1.75} aria-hidden />
      </Link>
    </section>
  );
}
