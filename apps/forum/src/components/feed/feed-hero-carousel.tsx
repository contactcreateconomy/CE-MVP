"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type RefObject, type WheelEvent } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "motion/react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";

import { cn } from "@/lib/utils";

import type { FeedHeroSlide } from "./feed-display-types";
import { postTypeMeta } from "./feed-post-type-meta";

/*
 * Polymorphic desktop hero (lg+ only — mobile starts with the feed, D-017).
 * prototype-v2 `top-post-hero-carousel.tsx` on S00 tokens. Two states:
 *  - default: 3D cover-flow (focus card + 2 receding cards each side) over
 *    an ambient blur of the active cover;
 *  - compact: half height, a 4-card cascade on the left and the slide text
 *    on the right.
 * Motion physics are the prototype's (JS springs, not CSS tokens). Every
 * spatial motion collapses to opacity under prefers-reduced-motion, and
 * autoplay stops (WCAG 2.2.2).
 */

const SLIDE_INTERVAL_MS = 5200;
const BASE_SPRING = { type: "spring", stiffness: 300, damping: 30, mass: 1 } as const;
const TAP_SPRING = { type: "spring", stiffness: 450, damping: 18, mass: 1 } as const;
const COLLAPSE_SPRING = { type: "spring", stiffness: 200, damping: 28, mass: 1.2 } as const;
const CASCADE_SPRING = { type: "spring", stiffness: 180, damping: 25, mass: 0.9 } as const;
const TEXT_SPRING = { type: "spring", stiffness: 280, damping: 28, mass: 0.9 } as const;

const SWIPE_CONFIDENCE = 8000;
const WHEEL_LOCKOUT_MS = 400;
const WHEEL_THRESHOLD = 20;

const X_STRIDE = 440;
const Z_STRIDE = 160;
const ROTATE_Y_DEG = 12;
const MAX_SIDE = 2;
const TOP_PAD = 16;
const BOTTOM_PAD = 20;

const DEFAULT_H = 440;
const DEFAULT_H_XL = 520;
const COMPACT_H = 220;
const COMPACT_H_XL = 260;
const CASCADE_STEP = 96;
/** 2% soft fade at the stage's left/right edges (v2). */
const EDGE_MASK = "linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%)";

interface Layout {
  cardW: number;
  cardH: number;
  focusX: number;
  alignLeft: number;
}

const FALLBACK_LAYOUT: Layout = { cardW: 549, cardH: 275, focusX: -40, alignLeft: 260 };

function cardTransform(offset: number, focusX: number) {
  const dist = Math.abs(offset);
  return {
    x: focusX - offset * X_STRIDE,
    z: -dist * Z_STRIDE,
    rotateY: offset * ROTATE_Y_DEG,
    scale: dist === 0 ? 1 : dist === 1 ? 0.5 : 0.35,
    opacity: dist === 0 ? 1 : dist === 1 ? 0.55 : 0.14,
    blur: dist === 0 ? 0 : dist === 1 ? 8 : 16,
    brightness: dist === 0 ? 1 : dist === 1 ? 0.45 : 0.2,
  };
}

function Cover({ slide, className }: { slide: FeedHeroSlide; className?: string }) {
  const meta = postTypeMeta(slide.type);
  return slide.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={slide.imageUrl} alt="" className={cn("absolute inset-0 size-full object-cover", className)} />
  ) : (
    <div className={cn("absolute inset-0 flex items-center justify-center bg-linear-135 from-bg-surface to-bg-overlay", className)}>
      <div className={cn("absolute inset-0", meta.wash)} />
      <meta.Icon className={cn("relative size-14 opacity-60", meta.text)} aria-hidden />
    </div>
  );
}

function NavPill({ index, count, onPrev, onNext }: { index: number; count: number; onPrev: () => void; onNext: () => void }) {
  const btn =
    "focus-ring flex size-7 items-center justify-center rounded-full text-text-secondary transition-colors duration-normal hover:bg-bg-overlay hover:text-text-primary";
  return (
    <div className="glass-chrome flex items-center gap-0.5 rounded-full border border-border-default p-1">
      <button type="button" onClick={onPrev} aria-label="Previous featured post" className={btn}>
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-[4ch] text-center text-caption tabular-nums text-text-secondary" aria-live="polite">
        {index + 1} / {count}
      </span>
      <button type="button" onClick={onNext} aria-label="Next featured post" className={btn}>
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

function ExploreButton({ slide }: { slide: FeedHeroSlide }) {
  return (
    <Link
      href={slide.href}
      aria-label={`${slide.ctaLabel}: ${slide.title}`}
      className="glass-chrome focus-ring inline-flex items-center gap-1.5 rounded-full border border-border-default px-4 py-2 text-body-sm font-semibold text-text-primary transition-[border-color,box-shadow] duration-slow group-hover/hero:glow-active group-hover/hero:border-brand-primary"
    >
      {slide.ctaLabel}
      <ArrowUpRight className="size-3.5 transition-colors duration-slow group-hover/hero:text-brand-primary" />
    </Link>
  );
}

export interface FeedHeroCarouselProps {
  slides: FeedHeroSlide[];
  /** Element the focus card aligns to (v2: the sort control). Optional —
   *  without it a fixed fallback geometry is used. */
  alignToRef?: RefObject<HTMLElement | null>;
  /** Starting state; the member toggles with the minimize/maximize control. */
  initialMode?: "default" | "compact";
  className?: string;
}

export function FeedHeroCarousel({ slides, alignToRef, initialMode = "default", className }: FeedHeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState(false);
  const [mode, setMode] = useState<"default" | "compact">(initialMode);
  const [layout, setLayout] = useState<Layout>(FALLBACK_LAYOUT);
  const [isXl, setIsXl] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const wheelLocked = useRef(false);
  const reduceMotion = useReducedMotion() ?? false;
  const count = slides.length;

  // xl height switch (440 → 520), tracked live.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const sync = () => setIsXl(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Focus card = width of the align target, centred over it (v2 measures the sorter).
  useEffect(() => {
    function measure() {
      const hero = heroRef.current;
      const target = alignToRef?.current;
      if (!hero || !target) return;
      const h = hero.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      const cardW = Math.round(t.width);
      setLayout({
        cardW,
        cardH: Math.round(cardW * 0.5),
        focusX: t.left + t.width / 2 - (h.left + h.width / 2),
        alignLeft: Math.round(t.left - h.left),
      });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [alignToRef]);

  useEffect(() => {
    if (count <= 1 || isPaused || reduceMotion) return;
    const id = window.setInterval(() => {
      setDirection(1);
      setActiveIndex((i) => (i + 1) % count);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [count, isPaused, reduceMotion]);

  const goNext = useCallback(() => {
    setDirection(1);
    setActiveIndex((i) => (i + 1) % count);
  }, [count]);
  const goPrev = useCallback(() => {
    setDirection(-1);
    setActiveIndex((i) => (i - 1 + count) % count);
  }, [count]);

  // Horizontal wheel / trackpad swipe only (v2 also maps vertical wheel,
  // which fights page scroll — flagged in S02-SPEC §4).
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (mode !== "default" || wheelLocked.current) return;
      if (Math.abs(e.deltaX) < WHEEL_THRESHOLD || Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
      if (e.deltaX > 0) goNext();
      else goPrev();
      wheelLocked.current = true;
      window.setTimeout(() => {
        wheelLocked.current = false;
      }, WHEEL_LOCKOUT_MS);
    },
    [goNext, goPrev, mode],
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const power = Math.abs(info.offset.x) * info.velocity.x;
      if (power < -SWIPE_CONFIDENCE) goNext();
      else if (power > SWIPE_CONFIDENCE) goPrev();
    },
    [goNext, goPrev],
  );

  if (count === 0) return null;

  const active = slides[activeIndex % count];
  const activeMeta = postTypeMeta(active.type);
  const defaultH = isXl ? DEFAULT_H_XL : DEFAULT_H;
  const compactH = isXl ? COMPACT_H_XL : COMPACT_H;
  const { cardW, cardH, focusX, alignLeft } = layout;

  // Never show the same slide twice: side depth shrinks with small sets.
  const side = Math.min(MAX_SIDE, Math.floor((count - 1) / 2));
  const offsets = Array.from({ length: side * 2 + 1 }, (_, i) => i - side);

  const compactCardH = Math.round((compactH - 24) * 0.88);
  const compactCardW = Math.round((compactCardH * 16) / 9);
  const cascade = Array.from({ length: Math.min(4, count) }, (_, i) => ({
    slide: slides[(activeIndex + i) % count],
    position: i,
    idx: (activeIndex + i) % count,
  }));
  const cascadeAreaW = compactCardW + CASCADE_STEP * (cascade.length - 1) + 16;
  const compactLeftPad = Math.max(0, Math.round(alignLeft - (cascadeAreaW - compactCardW)));

  const fade = { duration: reduceMotion ? 0.15 : 0.2 };

  return (
    <motion.section
      ref={heroRef}
      className={cn("group/hero relative select-none overflow-hidden rounded-hero bg-bg-surface", className)}
      style={{ height: defaultH }}
      animate={{ height: mode === "default" ? defaultH : compactH }}
      transition={reduceMotion ? { duration: 0 } : COLLAPSE_SPRING}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onWheel={handleWheel}
      aria-roledescription="carousel"
      aria-label="Featured posts"
    >
      {/* Ambient background: the active cover, heavily blurred, cross-fading. */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={active.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.6 }}
          >
            {active.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={active.imageUrl} alt="" className="size-full scale-110 object-cover opacity-55 blur-3xl saturate-150" />
            ) : (
              <div className={cn("absolute inset-x-[10%] inset-y-[5%] rounded-full blur-3xl", activeMeta.wash)} />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-bg-surface via-bg-surface/50 via-28% to-transparent to-58%" />
            <div className="absolute inset-0 bg-radial from-transparent from-38% to-bg-surface/80" />
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {mode === "default" ? (
          <motion.div
            key="default"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fade}
          >
            {/* 3D stage */}
            <div
              className="absolute inset-x-0 z-10 flex items-center justify-center perspective-distant"
              style={{ top: TOP_PAD, bottom: BOTTOM_PAD, perspectiveOrigin: "42% 50%", maskImage: EDGE_MASK, WebkitMaskImage: EDGE_MASK }}
            >
              <motion.div
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                onDragEnd={handleDragEnd}
                aria-hidden
              />

              {offsets.map((offset) => {
                const dist = Math.abs(offset);
                const slide = slides[(activeIndex + offset + count) % count];
                const t = cardTransform(offset, focusX);
                const isCenter = offset === 0;
                return (
                  <motion.div
                    key={slide.id}
                    className="absolute transform-3d"
                    style={{ zIndex: isCenter ? 20 : 10 - dist }}
                    initial={{ opacity: 0 }}
                    animate={
                      reduceMotion
                        ? { x: t.x, opacity: t.opacity }
                        : { x: t.x, z: t.z, rotateY: t.rotateY, scale: t.scale, opacity: t.opacity }
                    }
                    transition={BASE_SPRING}
                    whileTap={isCenter && !reduceMotion ? { scale: 0.97, transition: TAP_SPRING } : undefined}
                  >
                    <motion.div
                      className={cn(
                        "relative overflow-hidden rounded-2xl",
                        isCenter ? "pointer-events-auto shadow-2xl" : "pointer-events-none shadow-lg",
                      )}
                      style={{ width: cardW, height: cardH }}
                      animate={{ filter: reduceMotion ? "none" : `blur(${t.blur}px) brightness(${t.brightness})` }}
                      transition={BASE_SPRING}
                    >
                      <Cover slide={slide} />
                      {isCenter ? (
                        <>
                          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-bg-surface/90 via-bg-surface/45 via-30% to-transparent to-68%" />
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={`overlay-${slide.id}`}
                              className="absolute inset-x-0 bottom-0 z-10 px-5 pb-5 pt-10"
                              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                              transition={{ duration: 0.28, ease: "easeOut" }}
                            >
                              <p className="mb-1 text-overline font-bold uppercase text-brand-primary">{slide.eyebrow}</p>
                              <h2 className="line-clamp-2 text-heading-md font-bold text-text-primary">{slide.title}</h2>
                            </motion.div>
                          </AnimatePresence>
                          <Link
                            href={slide.href}
                            aria-label={`Open: ${slide.title}`}
                            className="focus-ring absolute inset-0 z-20 rounded-2xl"
                          />
                        </>
                      ) : null}
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            <div className="absolute bottom-6 right-7 z-30 flex items-center gap-2.5">
              {count > 1 ? <NavPill index={activeIndex} count={count} onPrev={goPrev} onNext={goNext} /> : null}
              <ExploreButton slide={active} />
            </div>

            <button
              type="button"
              onClick={() => setMode("compact")}
              aria-label="Switch to compact view"
              className="glass-chrome focus-ring absolute right-3 top-3 z-40 flex size-7 items-center justify-center rounded-full border border-border-default opacity-0 transition-[opacity,box-shadow] duration-normal hover:glow-active hover:opacity-100! focus-visible:opacity-100 group-hover/hero:opacity-50"
            >
              <Minimize2 className="size-3.5 text-text-secondary" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="compact"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ ...fade, delay: reduceMotion ? 0 : 0.06 }}
          >
            <button
              type="button"
              onClick={() => setMode("default")}
              aria-label="Switch to full view"
              className="glass-chrome focus-ring absolute right-3 top-3 z-50 flex size-7 items-center justify-center rounded-full border border-border-default opacity-40 transition-[opacity,box-shadow] duration-normal hover:glow-active hover:opacity-100 focus-visible:opacity-100"
            >
              <Maximize2 className="size-3.5 text-text-secondary" />
            </button>

            <div className="absolute inset-0 flex items-stretch py-3" style={{ paddingRight: compactLeftPad }}>
              {/* Cascade: active in front + up to 3 upcoming fanned to the left */}
              <div
                className="relative shrink-0 -translate-x-[2%] perspective-[900px]"
                style={{ width: cascadeAreaW, marginLeft: compactLeftPad, perspectiveOrigin: "70% 50%" }}
              >
                <AnimatePresence mode="popLayout">
                  {cascade.map(({ slide, position, idx }) => {
                    const isFront = position === 0;
                    const deep = { x: -300, z: -300, rotateY: 28, scale: 0.32, opacity: 0, filter: "blur(8px) brightness(0.38)" };
                    const near = { x: -120, z: -140, rotateY: 16, scale: 0.55, opacity: 0, filter: "blur(6px) brightness(0.45)" };
                    return (
                      <motion.div
                        key={slide.id}
                        className="absolute right-0 transform-3d"
                        style={{ top: `calc(50% - ${compactCardH / 2}px)`, zIndex: 10 - position }}
                        initial={reduceMotion ? { opacity: 0 } : direction === 1 ? deep : near}
                        animate={
                          reduceMotion
                            ? { x: 0, opacity: isFront ? 1 : 0 }
                            : {
                                x: -position * CASCADE_STEP,
                                z: -position * 80,
                                rotateY: position * 10,
                                scale: 1 - position * 0.16,
                                opacity: isFront ? 1 : Math.max(0.4, 0.8 - position * 0.2),
                                filter: isFront ? "none" : `blur(${position * 1.2}px) brightness(${1 - position * 0.12})`,
                              }
                        }
                        exit={reduceMotion ? { opacity: 0 } : direction === 1 ? near : deep}
                        transition={reduceMotion ? { duration: 0.15 } : CASCADE_SPRING}
                      >
                        <div
                          className={cn("relative overflow-hidden rounded-xl", isFront ? "shadow-xl" : "shadow-lg")}
                          style={{ width: compactCardW, height: compactCardH }}
                        >
                          <Cover slide={slide} />
                          {isFront ? (
                            <>
                              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-bg-surface/55 to-transparent to-50%" />
                              <Link
                                href={slide.href}
                                aria-label={`Open: ${slide.title}`}
                                className="focus-ring absolute inset-0 z-10 rounded-xl"
                              />
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setDirection(1);
                                setActiveIndex(idx);
                              }}
                              aria-label={`View: ${slide.title}`}
                              className="focus-ring absolute inset-0 z-10 cursor-pointer rounded-xl"
                            />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              <div className="relative flex min-w-0 flex-1 flex-col justify-between py-3 pl-6">
                <div className="relative min-h-0 flex-1 overflow-hidden">
                  <AnimatePresence initial={false} custom={direction} mode="sync">
                    <motion.div
                      key={active.id}
                      custom={direction}
                      initial={reduceMotion ? { opacity: 0 } : { x: direction * 56, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={reduceMotion ? { opacity: 0 } : { x: direction * -56, opacity: 0 }}
                      transition={reduceMotion ? { duration: 0.15 } : TEXT_SPRING}
                      className="absolute inset-0 flex flex-col gap-1 pt-2"
                    >
                      <p className="mb-1 text-overline font-bold uppercase text-brand-primary">{active.eyebrow}</p>
                      <h3 className="line-clamp-2 text-heading-sm font-bold text-text-primary xl:text-heading-md">
                        {active.title}
                      </h3>
                      {active.summary ? (
                        <p className="mt-2 line-clamp-4 text-body-sm text-text-secondary">{active.summary}</p>
                      ) : null}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="flex shrink-0 items-center gap-2.5 pt-2">
                  {count > 1 ? <NavPill index={activeIndex} count={count} onPrev={goPrev} onNext={goNext} /> : null}
                  <ExploreButton slide={active} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

/** v2 `TopPostHeroCarouselSkeleton` (loading state while hero data resolves). */
export function FeedHeroCarouselSkeleton({ className }: { className?: string }) {
  const pulse = "animate-pulse motion-reduce:animate-none";
  return (
    <div
      className={cn("relative h-110 overflow-hidden rounded-hero border border-border-subtle bg-bg-surface xl:h-130", className)}
      aria-busy="true"
      aria-label="Loading featured posts"
    >
      <div className={cn("absolute inset-0 bg-bg-overlay/10", pulse)} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={cn("relative h-69 w-full max-w-137 overflow-hidden rounded-2xl bg-bg-overlay/40 shadow-sm", pulse)}>
          <div className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-10">
            <div className="mb-2.5 h-2 w-16 rounded-sm bg-bg-overlay/60" />
            <div className="mb-1.5 h-4 w-3/4 rounded-sm bg-bg-overlay/60" />
            <div className="h-4 w-1/2 rounded-sm bg-bg-overlay/60" />
          </div>
        </div>
      </div>
      <div className="absolute bottom-6 right-7 flex items-center gap-2.5">
        <div className={cn("h-9 w-22 rounded-full bg-bg-overlay/60", pulse)} />
        <div className={cn("h-9 w-24 rounded-full bg-bg-overlay/60", pulse)} />
      </div>
    </div>
  );
}
