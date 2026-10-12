"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type WheelEvent } from "react";
import { AnimatePresence, motion, useInView, type PanInfo } from "motion/react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { SPRINGS, motionFor, usePrefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

import type { FeedHeroSlide } from "./feed-display-types";
import { postTypeMeta } from "./feed-post-type-meta";

/*
 * Desktop hero — a trailer for what's best right now (FEED-DESIGN §9.2,
 * founder-approved Make geometry). lg+ only; mobile starts with the feed
 * (D-017).
 *  - large (L-43): centred cover-flow, text overlaid on the active frame;
 *    side frames scale 0.8 + brightness 0.45 + a slight turn, never blurred
 *    (L-40, R-07); neutral frost, no colour bleed (R-05).
 *  - compact: a cascade on the left, the frame text on the right.
 * Never auto-rotates (L-31, R-06): arrows, ← →, trackpad (wheel lockout) and
 * drag. Frame 1 plays tease → reveal once per session. Reduced motion: no
 * 3D, only the active frame, crossfades.
 */

type Mode = "default" | "compact";

const HEIGHT: Record<Mode, number> = { default: 360, compact: 208 };
const CARD: Record<Mode, { w: number; h: number }> = { default: { w: 480, h: 270 }, compact: { w: 256, h: 144 } };
const COMPACT_STAGE_W = 380;
const SIDE_GAP = 28; // side frames never touch the active frame
const WHEEL_LOCKOUT_MS = 400;
const WHEEL_THRESHOLD = 20;
const TEASE_KEY = "cc-hero-tease";

function frameTarget(mode: Mode, offset: number, reduced: boolean) {
  const { w, h } = CARD[mode];
  const d = Math.abs(offset);
  if (mode === "default") {
    // Active frame sits high so the CTA row below stays clear.
    const base = { width: w, height: h, x: offset * (w / 2 + SIDE_GAP + (w * 0.8) / 2) - w / 2, y: -h / 2 - 21 };
    if (reduced) return { ...base, x: -w / 2, opacity: d === 0 ? 1 : 0 };
    return { ...base, z: -d * 60, rotateY: -offset * 14, scale: d ? 0.8 : 1, opacity: 1, filter: `brightness(${d ? 0.45 : 1})` };
  }
  const base = { width: w, height: h, x: COMPACT_STAGE_W / 2 - w - 12 - offset * 56, y: -h / 2 };
  if (reduced) return { ...base, x: COMPACT_STAGE_W / 2 - w - 12, opacity: d === 0 ? 1 : 0 };
  return { ...base, z: -offset * 70, rotateY: offset * 10, scale: 1 - offset * 0.14, opacity: [1, 1, 0.9][d], filter: `brightness(${[1, 0.55, 0.42][d]})` };
}

function visibleOffsets(mode: Mode, n: number) {
  if (mode === "compact") return Array.from({ length: Math.min(n, 3) }, (_, i) => i);
  const before = Math.min(1, Math.floor((n - 1) / 2));
  const after = Math.min(1, n - 1 - before);
  return Array.from({ length: before + after + 1 }, (_, i) => i - before);
}

function sessionOnce(key: string): boolean {
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
  } catch {
    return false;
  }
  return true;
}

function Cover({ slide }: { slide: FeedHeroSlide }) {
  return slide.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={slide.imageUrl} alt="" draggable={false} className="block size-full select-none bg-bg-overlay object-cover" />
  ) : (
    <div className="relative size-full bg-linear-135 from-bg-surface to-bg-overlay">
      <div className={cn("absolute inset-0", postTypeMeta(slide.type).wash)} />
    </div>
  );
}

function Cta({ slide, revealed, reduced }: { slide: FeedHeroSlide; revealed: boolean; reduced: boolean }) {
  return (
    <Link
      href={slide.href}
      className="hover:glow-cta active:glow-active focus-ring inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-primary px-4 text-body-sm font-semibold text-text-inverse transition-[background-color,box-shadow,scale] duration-normal hover:bg-brand-primary-hover active:scale-97 active:duration-press"
    >
      {slide.ctaLabel}
      {/* L-38: the arrow pulses 3× after the reveal, then rests. */}
      <motion.span
        aria-hidden
        className="inline-flex"
        animate={revealed && !reduced ? { x: [0, 2, 0], y: [0, -2, 0] } : undefined}
        transition={{ duration: 0.5, repeat: 2, ease: "easeOut", delay: 0.3 }}
      >
        <ArrowUpRight className="size-3.5" strokeWidth={2} />
      </motion.span>
    </Link>
  );
}

const controlBtn =
  "focus-ring inline-flex size-7.5 items-center justify-center rounded-full text-text-secondary transition-[background-color,color,scale] duration-normal hover:bg-bg-overlay hover:text-text-primary active:scale-97 active:duration-press";

function Counter({ index, n, go }: { index: number; n: number; go: (d: 1 | -1) => void }) {
  return (
    <div className="flex items-center rounded-full border border-border-subtle bg-bg-surface/60">
      <button type="button" aria-label="Previous" onClick={() => go(-1)} className={controlBtn}>
        <ChevronLeft className="size-3.75" strokeWidth={1.5} />
      </button>
      <span className="min-w-9 text-center font-mono text-micro tabular-nums text-text-secondary" aria-live="polite">
        {index + 1} / {n}
      </span>
      <button type="button" aria-label="Next" onClick={() => go(1)} className={controlBtn}>
        <ChevronRight className="size-3.75" strokeWidth={1.5} />
      </button>
    </div>
  );
}

export interface FeedHeroCarouselProps {
  slides: FeedHeroSlide[];
  /** Initial state; the viewer toggles it (never changes on scroll). */
  initialMode?: Mode;
  className?: string;
}

export function FeedHeroCarousel({ slides, initialMode = "default", className }: FeedHeroCarouselProps) {
  const reduced = usePrefersReducedMotion();
  const m = motionFor(reduced);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [index, setIndex] = useState(0);
  const [settledId, setSettledId] = useState<string | null>(null);
  const [teasing, setTeasing] = useState<boolean | null>(null); // null = not yet in view
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const wheelLocked = useRef(false);
  const n = slides.length;
  const active = slides[index % Math.max(n, 1)];

  // Tease → reveal: frame 1, first time in view, once per session.
  useEffect(() => {
    if (teasing !== null || !inView) return;
    setTeasing(!reduced && sessionOnce(TEASE_KEY));
  }, [inView, teasing, reduced]);
  // The reveal timer has its own effect: in the one above, setTeasing(true)
  // re-runs the effect and its cleanup would cancel the reveal (stuck blur).
  useEffect(() => {
    if (teasing !== true) return;
    const t = window.setTimeout(() => setTeasing(false), 900);
    return () => window.clearTimeout(t);
  }, [teasing]);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (n < 2) return;
      setSettledId(null);
      setIndex((i) => (i + dir + n) % n);
    },
    [n],
  );

  if (n === 0) return null;

  const onWheel = (e: WheelEvent) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < WHEEL_THRESHOLD || wheelLocked.current) return;
    wheelLocked.current = true;
    window.setTimeout(() => (wheelLocked.current = false), WHEEL_LOCKOUT_MS);
    go(e.deltaX > 0 ? 1 : -1);
  };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) * Math.abs(info.velocity.x) > 8000 || Math.abs(info.offset.x) > 80) go(info.offset.x < 0 ? 1 : -1);
  };

  const ready = teasing === false;
  const textShown = ready && (reduced || settledId === active.id);
  const large = mode === "default";

  return (
    <section
      aria-label="Highlights"
      data-hero-state={teasing === false ? "ready" : teasing ? "teasing" : "waiting"}
      className={cn("frost-strong relative overflow-hidden rounded-xl border border-border-subtle transition-[height] duration-slow ease-out-cubic motion-reduce:transition-none", className)}
      style={{ height: HEIGHT[mode] }}
    >
      <div
        ref={ref}
        tabIndex={0}
        role="region"
        aria-roledescription="showcase"
        aria-label="Best on Createconomy right now"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
        onWheel={onWheel}
        className="focus-ring absolute inset-0 flex items-stretch rounded-xl"
      >
        {/* stage */}
        <motion.div
          className="relative shrink-0 touch-pan-y"
          initial={false}
          animate={{ width: large ? "100%" : COMPACT_STAGE_W }}
          transition={reduced ? { duration: 0 } : SPRINGS.glide}
          style={{
            perspective: large ? 1200 : 900,
            perspectiveOrigin: large ? "50% 50%" : "70% 50%",
            maskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
          }}
          drag={n > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          dragSnapToOrigin
          onDragEnd={onDragEnd}
        >
          <div className="absolute left-1/2 top-1/2" style={{ transformStyle: "preserve-3d" }}>
            <AnimatePresence initial={false}>
              {visibleOffsets(mode, n).map((o) => {
                const slide = slides[(index + o + n) % n];
                const center = o === 0;
                const t = frameTarget(mode, o, reduced);
                const tease = center && teasing !== false && !reduced;
                return (
                  <motion.div
                    key={slide.id}
                    className="absolute left-0 top-0 overflow-hidden rounded-xl"
                    style={{ transformStyle: "preserve-3d", zIndex: 10 - Math.abs(o) }}
                    initial={{ ...t, opacity: 0 }}
                    animate={tease ? { ...t, scale: 1.07, filter: "blur(14px) brightness(0.6)" } : t}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    transition={reduced ? { duration: 0.2 } : SPRINGS.glide}
                    onAnimationComplete={() => {
                      if (center && !tease) setSettledId(slide.id);
                    }}
                  >
                    <div className={cn("relative size-full rounded-xl", center ? "shadow-lg" : "shadow-md", slide.featured && "ring-1 ring-inset ring-border-active")}>
                      <Cover slide={slide} />
                      {slide.featured ? (
                        // L-30: promoted is always labelled.
                        <span className="absolute left-2.5 top-2.5 rounded-full bg-bg-surface-elevated/90 px-2 py-0.5 font-mono text-micro font-medium uppercase tracking-wider text-text-primary">
                          Featured
                        </span>
                      ) : null}
                      <AnimatePresence>
                        {large && center && textShown ? (
                          <motion.div
                            key={slide.id}
                            variants={m.stagger}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, transition: { duration: 0.15 } }}
                            className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-linear-to-t from-bg-canvas/90 via-bg-canvas/55 to-transparent px-5 pb-4 pt-16"
                          >
                            <motion.p variants={m.focusPull} className="font-mono text-micro font-medium uppercase tracking-widest text-brand-primary">
                              {slide.eyebrow}
                            </motion.p>
                            <motion.h2 variants={m.focusPull} className="line-clamp-2 text-heading-md font-semibold text-text-primary">
                              {slide.title}
                            </motion.h2>
                            {slide.summary ? (
                              <motion.p variants={m.focusPull} className="truncate text-body-sm text-text-secondary">
                                {slide.summary}
                              </motion.p>
                            ) : null}
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* compact: text beside the cascade */}
        {!large ? (
          <div className="relative flex min-w-0 flex-1 items-center pl-2 pr-14">
            <AnimatePresence mode="wait">
              {textShown ? (
                <motion.div key={active.id} variants={m.stagger} initial="hidden" animate="visible" exit={{ opacity: 0 }} className="flex min-w-0 flex-col gap-1.5">
                  <motion.p variants={m.focusPull} className="font-mono text-micro font-medium uppercase tracking-widest text-brand-primary">
                    {active.eyebrow}
                  </motion.p>
                  <motion.h2 variants={m.focusPull} className="line-clamp-2 text-heading-sm font-semibold text-text-primary">
                    {active.title}
                  </motion.h2>
                  {active.summary ? (
                    <motion.p variants={m.focusPull} className="line-clamp-1 text-body-sm text-text-secondary">
                      {active.summary}
                    </motion.p>
                  ) : null}
                  <motion.div variants={m.focusPull} className="mt-2">
                    <Cta slide={active} revealed={textShown} reduced={reduced} />
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}

        {/* controls */}
        <div className="absolute right-3 top-3">
          <button
            type="button"
            aria-label={large ? "Make smaller" : "Make larger"}
            onClick={() => setMode(large ? "compact" : "default")}
            className={controlBtn}
          >
            {large ? <Minimize2 className="size-3.5" strokeWidth={1.5} /> : <Maximize2 className="size-3.5" strokeWidth={1.5} />}
          </button>
        </div>
        <div className="absolute bottom-3 right-3 flex items-center gap-3">
          {n > 1 ? <Counter index={index} n={n} go={go} /> : null}
          {large ? (
            <div className="flex h-9 items-center">
              <AnimatePresence mode="wait">
                {textShown ? (
                  <motion.div key={active.id} variants={m.focusPull} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
                    <Cta slide={active} revealed={textShown} reduced={reduced} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function FeedHeroCarouselSkeleton({ className }: { className?: string }) {
  return (
    <section aria-busy="true" aria-label="Highlights loading" className={cn("frost-strong flex h-46 items-center gap-6 overflow-hidden rounded-xl border border-border-subtle p-5", className)}>
      <Skeleton className="h-full w-65 shrink-0 rounded-lg" />
      <div className="flex flex-1 flex-col gap-3">
        <Skeleton className="h-2.5 w-20 rounded-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-5/6" />
        <div className="mt-6 flex gap-2">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>
    </section>
  );
}
