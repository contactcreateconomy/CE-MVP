"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
} from "motion/react";
import {
  ChevronLeft, ChevronRight, ArrowUpRight, Minimize2, Maximize2,
} from "lucide-react";
import { useTheme } from "next-themes";

import type { TopPostHeroSlide } from "@/types/hero";
import { cn } from "@/lib/utils";

// ─── Physics ──────────────────────────────────────────────────────────────────
const BASE_SPRING     = { type: "spring", stiffness: 300, damping: 30, mass: 1   } as const;
const TAP_SPRING      = { type: "spring", stiffness: 450, damping: 18, mass: 1   } as const;
const COLLAPSE_SPRING = { type: "spring", stiffness: 200, damping: 28, mass: 1.2 } as const;
const CASCADE_SPRING  = { type: "spring", stiffness: 180, damping: 25, mass: 0.9 } as const;

// ─── Swipe ────────────────────────────────────────────────────────────────────
const SWIPE_CONFIDENCE = 8000;

function swipePower(offset: number, velocity: number) {
  return Math.abs(offset) * velocity;
}

// ─── Wheel debounce ───────────────────────────────────────────────────────────
const WHEEL_LOCKOUT_MS = 400;
const WHEEL_THRESHOLD  = 20;

// ─── Card geometry ────────────────────────────────────────────────────────────
const X_STRIDE     = 440;
const Z_STRIDE     = 160;
const ROTATE_Y_DEG = 12;
const SIDE_COUNT   = 2;
const TOP_PAD      = 16;
const BOTTOM_PAD   = 20;
const RIGHT_PAD    = 28;

// ─── Heights ──────────────────────────────────────────────────────────────────
const DEFAULT_H    = 440;
const DEFAULT_H_XL = 520;
const COMPACT_H    = 220;   // 50% of DEFAULT_H
const COMPACT_H_XL = 260;   // 50% of DEFAULT_H_XL

// ─── Layout (measured dynamically to match sorter width) ──────────────────────
interface Layout {
  cardW:      number;
  cardH:      number;
  focusX:     number;
  sorterLeft: number;
  heroWidth:  number; // full pixel width of the hero widget
}

function defaultLayout(): Layout {
  const cardW = 549;
  return { cardW, cardH: Math.round(cardW * 0.5), focusX: -40, sorterLeft: 260, heroWidth: 1100 };
}

// ─── Per-card transform ───────────────────────────────────────────────────────
function cardTransform(offset: number, focusX: number) {
  const dist       = Math.abs(offset);
  const scale      = dist === 0 ? 1    : dist === 1 ? 0.5  : 0.35;
  const opacity    = dist === 0 ? 1    : dist === 1 ? 0.55 : 0.14;
  const blur       = dist === 0 ? 0    : dist === 1 ? 8    : 16;
  const brightness = dist === 0 ? 1    : dist === 1 ? 0.45 : 0.2;
  return {
    x:       focusX - offset * X_STRIDE,
    z:       -dist  * Z_STRIDE,
    rotateY:  offset * ROTATE_Y_DEG,
    scale,
    opacity,
    blur,
    brightness,
  };
}

type CarouselState = "default" | "compact";

interface TopPostHeroCarouselProps {
  slides: TopPostHeroSlide[];
  className?: string;
}

export function TopPostHeroCarousel({ slides, className }: TopPostHeroCarouselProps) {
  const [activeIndex,    setActiveIndex]    = useState(0);
  const [isPaused,       setIsPaused]       = useState(false);
  const [imageErrors,    setImageErrors]    = useState<Record<string, boolean>>({});
  const [layout,         setLayout]         = useState<Layout>(defaultLayout);
  const [mounted,        setMounted]        = useState(false);
  const [carouselState,  setCarouselState]  = useState<CarouselState>("default");
  const [direction,      setDirection]      = useState<"left" | "right">("right");

  // Responsive default height — lazy init prevents 440→520 spring on mount
  const [defaultH, setDefaultH] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_H;
    return window.matchMedia("(min-width: 1280px)").matches ? DEFAULT_H_XL : DEFAULT_H;
  });

  const heroRef    = useRef<HTMLDivElement>(null);
  const wheelLocked = useRef(false);
  const prefersReducedMotion = useReducedMotion();
  const { resolvedTheme }    = useTheme();
  const isDark  = mounted ? resolvedTheme === "dark" : true;
  const count   = slides.length;
  const isXl    = defaultH === DEFAULT_H_XL;
  const compactH = isXl ? COMPACT_H_XL : COMPACT_H;
  const targetH  = carouselState === "default" ? defaultH : compactH;
  const compactCardH   = Math.round((compactH - 24) * 0.88);
  const compactCardW   = Math.round(compactCardH * 16 / 9);
  // 4-card cascade: front + 3 behind, each fanning 96px to the left
  const cascadeAreaW   = compactCardW + 96 * 3 + 16;
  // focus card left edge aligns with sorter widget left edge
  const compactLeftPad = Math.round(layout.sorterLeft - (cascadeAreaW - compactCardW));

  // ── Mount ───────────────────────────────────────────────────────────────────
  useEffect(() => { setMounted(true); }, []);

  // ── Responsive default height ────────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const handler = (e: MediaQueryListEvent) =>
      setDefaultH(e.matches ? DEFAULT_H_XL : DEFAULT_H);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ── Measure sorter width → derive cardW and cardH ───────────────────────────
  useEffect(() => {
    function measure() {
      if (!heroRef.current) return;
      const sorterEl = document.querySelector<HTMLElement>('.grid.grid-cols-4');
      if (!sorterEl) return;
      const heroRect   = heroRef.current.getBoundingClientRect();
      const sorterRect = sorterEl.getBoundingClientRect();
      const cardW      = Math.round(sorterRect.width);
      const cardH      = Math.round(cardW * 0.5);
      const focusX     = (sorterRect.left + cardW / 2) - (heroRect.left + heroRect.width / 2);
      // outer rounded box (parent of the inner grid) is the visual sorter widget
      const sorterBox  = sorterEl.parentElement ?? sorterEl;
      const sorterLeft = Math.round(sorterBox.getBoundingClientRect().left - heroRect.left);
      const heroWidth  = Math.round(heroRect.width);
      setLayout({ cardW, cardH, focusX, sorterLeft, heroWidth });
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // ── Auto-advance ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (count <= 1 || isPaused) return;
    const id = window.setInterval(() => {
      setDirection("right");
      setActiveIndex((i) => (i + 1) % count);
    }, 5200);
    return () => window.clearInterval(id);
  }, [isPaused, count]);

  const goNext = useCallback(() => {
    setDirection("right");
    setActiveIndex((i) => (i + 1) % count);
  }, [count]);

  const goPrev = useCallback(() => {
    setDirection("left");
    setActiveIndex((i) => (i - 1 + count) % count);
  }, [count]);

  // ── Mouse wheel (default state only) ────────────────────────────────────────
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (carouselState !== "default") return;
      if (wheelLocked.current) return;
      if (Math.abs(e.deltaX) < WHEEL_THRESHOLD && Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (delta > 0) goNext(); else goPrev();
      wheelLocked.current = true;
      setTimeout(() => { wheelLocked.current = false; }, WHEEL_LOCKOUT_MS);
    },
    [goNext, goPrev, carouselState],
  );

  // ── Drag / swipe (default state only) ───────────────────────────────────────
  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const power = swipePower(info.offset.x, info.velocity.x);
      if (power < -SWIPE_CONFIDENCE) goNext();
      else if (power > SWIPE_CONFIDENCE) goPrev();
    },
    [goNext, goPrev],
  );

  if (count === 0) return null;

  const active = slides[activeIndex];
  const { cardW, cardH, focusX } = layout;

  const visibleOffsets = Array.from(
    { length: SIDE_COUNT * 2 + 1 },
    (_, i) => i - SIDE_COUNT,
  );

  // Cascade slides for compact 3D: active (front) + next 3 upcoming
  const cascadeSlides = Array.from(
    { length: Math.min(4, count) },
    (_, i) => ({
      slide: slides[(activeIndex + i) % count],
      position: i,
      idx: (activeIndex + i) % count,
    }),
  );

  // Animation variants for compact text — matches image exit direction
  const textVariants = {
    enter: (dir: "left" | "right") => ({
      x: dir === "right" ? 56 : -56,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: "left" | "right") => ({
      x: dir === "right" ? -56 : 56,
      opacity: 0,
    }),
  };

  const textSpring = prefersReducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 280, damping: 28, mass: 0.9 };

  return (
    <motion.div
      ref={heroRef}
      className={cn(
        "group/hero relative overflow-hidden rounded-[28px] bg-(--bg-surface) select-none",
        className,
      )}
      style={{ height: defaultH }}
      animate={{ height: targetH }}
      transition={prefersReducedMotion ? { duration: 0 } : COLLAPSE_SPRING}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onWheel={handleWheel}
      aria-roledescription="carousel"
      aria-label="Featured posts carousel"
    >
      {/* ── AMBIENT BACKGROUND — always rendered behind both states ── */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeIndex}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.15 : 0.6 }}
          >
            {active.coverImage && !imageErrors[active.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={active.coverImage}
                alt=""
                aria-hidden
                className="h-full w-full object-cover scale-110"
                style={{ filter: "blur(72px) saturate(1.5)", opacity: 0.55 }}
              />
            ) : (
              <div
                className="h-full w-full"
                style={{
                  background: `radial-gradient(ellipse 120% 75% at 50% 35%,
                    rgba(${active.accentRgb}, 0.38) 0%,
                    rgba(${active.accentRgb}, 0.14) 45%,
                    transparent 72%)`,
                }}
              />
            )}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, var(--bg-surface) 0%, color-mix(in srgb, var(--bg-surface) 50%, transparent) 28%, transparent 58%), " +
                  "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 38%, color-mix(in srgb, var(--bg-surface) 80%, transparent) 100%)",
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── STATE SWITCHER ── */}
      <AnimatePresence mode="wait" initial={false}>

        {carouselState === "default" ? (
          /* ════════════════════════════════════════════════════════
             DEFAULT STATE — 3D cinematic cascade (unchanged)
          ════════════════════════════════════════════════════════ */
          <motion.div
            key="default"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          >
            {/* ── 3D STAGE ── */}
            <div
              className="absolute inset-x-0 z-10 flex items-center justify-center"
              style={{
                top:               TOP_PAD,
                bottom:            BOTTOM_PAD,
                perspective:       "1200px",
                perspectiveOrigin: "42% 50%",
                maskImage:         "linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%)",
                WebkitMaskImage:   "linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%)",
              }}
            >
              {/* Drag layer */}
              <motion.div
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                onDragEnd={handleDragEnd}
              />

              {visibleOffsets.map((offset) => {
                const dist       = Math.abs(offset);
                const slideIndex = (activeIndex + offset + count) % count;
                const slide      = slides[slideIndex];
                const t          = cardTransform(offset, focusX);
                const isCenter   = offset === 0;

                return (
                  <motion.div
                    key={slide.id}
                    className="absolute"
                    style={{
                      transformStyle: "preserve-3d",
                      zIndex: isCenter ? 20 : 10 - dist,
                    }}
                    initial={{ opacity: 0 }}
                    animate={prefersReducedMotion
                      ? { x: t.x, opacity: t.opacity }
                      : { x: t.x, z: t.z, rotateY: t.rotateY, scale: t.scale, opacity: t.opacity }}
                    transition={BASE_SPRING}
                    whileTap={isCenter ? { scale: 0.97, transition: TAP_SPRING } : undefined}
                  >
                    <motion.div
                      animate={{
                        filter: prefersReducedMotion
                          ? "none"
                          : `blur(${t.blur}px) brightness(${t.brightness})`,
                      }}
                      transition={BASE_SPRING}
                      style={{
                        width:        cardW,
                        height:       cardH,
                        borderRadius: 20,
                        overflow:     "hidden",
                        position:     "relative",
                        boxShadow:    isCenter
                          ? `0 32px 80px rgba(${active.accentRgb}, 0.55), 0 12px 36px rgba(0,0,0,0.8)`
                          : "0 8px 24px rgba(0,0,0,0.4)",
                        border: "1px solid transparent",
                        pointerEvents: isCenter ? "auto" : "none",
                      }}
                    >
                      {slide.coverImage && !imageErrors[slide.id] ? (
                        <Image
                          src={slide.coverImage}
                          alt={isCenter ? slide.title : ""}
                          fill
                          sizes="(min-width: 1280px) 549px, 90vw"
                          className="object-cover"
                          priority={isCenter && activeIndex === 0}
                          onError={() => setImageErrors((prev) => ({ ...prev, [slide.id]: true }))}
                        />
                      ) : (
                        <div
                          className="h-full w-full"
                          style={{ background: "linear-gradient(135deg, var(--bg-surface), var(--bg-overlay))" }}
                        />
                      )}

                      {isCenter && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: isDark
                              ? "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.80) 15%, rgba(0,0,0,0.62) 28%, rgba(0,0,0,0.32) 42%, rgba(0,0,0,0.08) 56%, transparent 68%)"
                              : "linear-gradient(to top, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 15%, rgba(255,255,255,0.52) 28%, rgba(255,255,255,0.22) 42%, rgba(255,255,255,0.05) 56%, transparent 68%)",
                          }}
                        />
                      )}

                      {isCenter && (
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={`overlay-${activeIndex}`}
                            className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-5 pt-10"
                            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                            transition={{ duration: 0.28, ease: "easeOut" }}
                          >
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--brand-primary) mb-1">
                              {active.eyebrow}
                            </p>
                            <h2 className="text-xl font-bold leading-snug text-(--text-primary) line-clamp-2 drop-shadow-sm">
                              {active.title}
                            </h2>
                          </motion.div>
                        </AnimatePresence>
                      )}

                      {isCenter && (
                        <Link
                          href={slide.discussionHref}
                          aria-label={`Open: ${slide.title}`}
                          className="absolute inset-0 z-20"
                          tabIndex={0}
                        />
                      )}
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            {/* ── NAV + EXPLORE ── */}
            <div
              className="absolute z-30 flex items-center gap-2.5"
              style={{ right: RIGHT_PAD, bottom: BOTTOM_PAD + 4 }}
            >
              <div
                className="flex items-center gap-0.5 rounded-full border border-(--border-default) px-1 py-1"
                style={{ background: isDark ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.72)", backdropFilter: "blur(16px)" }}
              >
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-(--text-secondary) transition-colors hover:bg-(--bg-overlay) hover:text-(--text-primary)"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-[4ch] text-center text-xs tabular-nums text-(--text-secondary)">
                  {activeIndex + 1} / {count}
                </span>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-(--text-secondary) transition-colors hover:bg-(--bg-overlay) hover:text-(--text-primary)"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <Link
                href={active.discussionHref}
                aria-label={`Explore: ${active.title}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold",
                  "border border-(--border-default) transition-all duration-300",
                  "text-(--text-primary)",
                  "group-hover/hero:border-(--brand-primary) group-hover/hero:shadow-[0_0_18px_2px_hsl(199_89%_48%_/_0.35)]",
                )}
                style={{ background: isDark ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.72)", backdropFilter: "blur(16px)" }}
              >
                Explore
                <ArrowUpRight className="h-3.5 w-3.5 text-(--text-primary) group-hover/hero:animate-[pulse_1s_ease-in-out_infinite] group-hover/hero:text-(--brand-primary)" />
              </Link>
            </div>

            {/* ── MINIMIZE TOGGLE ── */}
            <button
              type="button"
              onClick={() => setCarouselState("compact")}
              aria-label="Switch to compact view"
              className={cn(
                "absolute top-3 right-3 z-40",
                "flex h-7 w-7 items-center justify-center rounded-full",
                "border border-(--border-default)",
                "backdrop-blur-sm",
                "opacity-0 group-hover/hero:opacity-50 hover:!opacity-100",
                "hover:shadow-[0_0_12px_2px_hsl(199_89%_48%_/_0.4)]",
                "transition-all duration-200",
              )}
              style={{ background: isDark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.55)" }}
            >
              <Minimize2 className="h-3.5 w-3.5 text-(--text-secondary)" />
            </button>
          </motion.div>

        ) : (
          /* ════════════════════════════════════════════════════════
             COMPACT STATE — 3-column portrait layout
          ════════════════════════════════════════════════════════ */
          <motion.div
            key="compact"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, delay: prefersReducedMotion ? 0 : 0.06 }}
          >
            {/* ── MAXIMIZE TOGGLE ── */}
            <button
              type="button"
              onClick={() => setCarouselState("default")}
              aria-label="Switch to full view"
              className={cn(
                "absolute top-3 right-3 z-50",
                "flex h-7 w-7 items-center justify-center rounded-full",
                "border border-(--border-default)",
                "backdrop-blur-sm",
                "opacity-40 hover:opacity-100",
                "hover:shadow-[0_0_12px_2px_hsl(199_89%_48%_/_0.4)]",
                "transition-all duration-200",
              )}
              style={{ background: isDark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.55)" }}
            >
              <Maximize2 className="h-3.5 w-3.5 text-(--text-secondary)" />
            </button>

            {/* left-aligned flex row — cascade left inset aligns front card to sorter */}
            <div
              className="absolute inset-0 flex items-stretch justify-start gap-0"
              style={{ paddingTop: 12, paddingBottom: 12, paddingRight: Math.max(0, compactLeftPad), paddingLeft: 0 }}
            >

              {/* ── IMAGE AREA: 3D cascade — active (front) + 2 upcoming ── */}
              <div
                className="relative flex-shrink-0"
                style={{ width: cascadeAreaW, marginLeft: compactLeftPad, perspective: "900px", perspectiveOrigin: "70% 50%", transform: "translateX(-2%)" }}
              >
                <AnimatePresence mode="popLayout">
                  {cascadeSlides.map(({ slide, position, idx }) => {
                    const isFront = position === 0;
                    // "next" (right): old front (pos 0) exits LEFT into cascade depth — matches text.
                    //   New back card (pos 3) enters from deep-behind the stack.
                    // "prev" (left): symmetric — old back exits deeper, new front sweeps in from left.
                    const enterFrom = direction === "right"
                      ? { x: -300, z: -300, rotateY: 28, scale: 0.32, opacity: 0, filter: "blur(8px) brightness(0.38)" }
                      : { x: -120, z: -140, rotateY: 16, scale: 0.55, opacity: 0, filter: "blur(6px) brightness(0.45)" };
                    const exitTo = direction === "right"
                      ? { x: -120, z: -140, rotateY: 16, scale: 0.55, opacity: 0, filter: "blur(6px) brightness(0.45)" }
                      : { x: -300, z: -300, rotateY: 28, scale: 0.32, opacity: 0, filter: "blur(8px) brightness(0.38)" };
                    return (
                      <motion.div
                        key={slide.id}
                        className="absolute"
                        style={{
                          top: `calc(50% - ${compactCardH / 2}px)`,
                          right: 0,
                          transformStyle: "preserve-3d",
                          zIndex: 10 - position,
                        }}
                        initial={enterFrom}
                        animate={prefersReducedMotion
                          ? { x: 0, opacity: isFront ? 1 : 0.5 }
                          : {
                              x: -position * 96,
                              z: -position * 80,
                              rotateY: position * 10,
                              scale: 1 - position * 0.16,
                              opacity: isFront ? 1 : Math.max(0.4, 0.80 - position * 0.2),
                              filter: position === 0
                                ? "none"
                                : `blur(${position * 1.2}px) brightness(${1 - position * 0.12})`,
                            }
                        }
                        exit={exitTo}
                        transition={prefersReducedMotion ? { duration: 0 } : CASCADE_SPRING}
                      >
                        <div
                          className="relative overflow-hidden rounded-xl"
                          style={{
                            width: compactCardW,
                            height: compactCardH,
                            boxShadow: isFront
                              ? "0 20px 50px rgba(0,0,0,0.45), 0 6px 16px rgba(0,0,0,0.3)"
                              : "0 8px 24px rgba(0,0,0,0.25)",
                          }}
                        >
                          {slide.coverImage && !imageErrors[slide.id] ? (
                            <Image
                              src={slide.coverImage}
                              alt=""
                              fill
                              sizes="(min-width: 1280px) 260px, 200px"
                              className="object-cover"
                              priority={isFront}
                              onError={() => setImageErrors((prev) => ({ ...prev, [slide.id]: true }))}
                            />
                          ) : (
                            <div
                              className="h-full w-full"
                              style={{ background: `linear-gradient(135deg, rgba(${slide.accentRgb},0.4), rgba(${slide.accentRgb},0.1))` }}
                            />
                          )}
                          {isFront && (
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                background: isDark
                                  ? "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)"
                                  : "linear-gradient(to top, rgba(255,255,255,0.55) 0%, transparent 50%)",
                              }}
                            />
                          )}
                          {isFront ? (
                            <Link
                              href={slide.discussionHref}
                              aria-label={`Open: ${slide.title}`}
                              className="absolute inset-0 z-10"
                              tabIndex={0}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const forward = ((idx - activeIndex + count) % count) <= 3;
                                setDirection(forward ? "right" : "left");
                                setActiveIndex(idx);
                              }}
                              aria-label={`View: ${slide.title}`}
                              className="absolute inset-0 z-10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-(--brand-primary)"
                            />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* ── RIGHT COLUMN: text + nav ── */}
              <div className="relative flex-1 min-w-0 flex flex-col justify-between pl-6 py-3">

                {/* Animated text block */}
                <div className="relative overflow-hidden flex-1 min-h-0">
                  <AnimatePresence initial={false} custom={direction} mode="sync">
                    <motion.div
                      key={activeIndex}
                      custom={direction}
                      variants={textVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={textSpring}
                      className="absolute inset-0 flex flex-col justify-start pt-2 gap-1"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-(--brand-primary) mb-1">
                        {active.eyebrow}
                      </p>
                      <h3 className="text-lg font-bold leading-snug text-(--text-primary) line-clamp-2">
                        {active.title}
                      </h3>
                      {active.summary && (
                        <p className="mt-2 text-sm leading-relaxed text-(--text-secondary) line-clamp-4">
                          {active.summary}
                        </p>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Static nav + explore row */}
                <div className="flex items-center gap-2.5 pt-2 shrink-0">
                  <div
                    className="flex items-center gap-0.5 rounded-full border border-(--border-default) px-1 py-1"
                    style={{ background: isDark ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.72)", backdropFilter: "blur(16px)" }}
                  >
                    <button
                      type="button"
                      onClick={goPrev}
                      aria-label="Previous"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-(--text-secondary) transition-colors hover:bg-(--bg-overlay) hover:text-(--text-primary)"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="min-w-[4ch] text-center text-xs tabular-nums text-(--text-secondary)">
                      {activeIndex + 1} / {count}
                    </span>
                    <button
                      type="button"
                      onClick={goNext}
                      aria-label="Next"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-(--text-secondary) transition-colors hover:bg-(--bg-overlay) hover:text-(--text-primary)"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <Link
                    href={active.discussionHref}
                    aria-label={`Explore: ${active.title}`}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold",
                      "border border-(--border-default) transition-all duration-300",
                      "text-(--text-primary)",
                      "group-hover/hero:border-(--brand-primary) group-hover/hero:shadow-[0_0_18px_2px_hsl(199_89%_48%_/_0.35)]",
                    )}
                    style={{ background: isDark ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.72)", backdropFilter: "blur(16px)" }}
                  >
                    Explore
                    <ArrowUpRight className="h-3.5 w-3.5 text-(--text-primary) group-hover/hero:animate-[pulse_1s_ease-in-out_infinite] group-hover/hero:text-(--brand-primary)" />
                  </Link>
                </div>
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}

export function TopPostHeroCarouselSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-(--border-subtle) bg-(--bg-surface)",
        className,
      )}
    >
      <div className="absolute inset-0 z-0 bg-(--bg-overlay)/10 animate-pulse" />
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="relative h-[275px] w-full max-w-[549px] overflow-hidden rounded-[20px] bg-(--bg-overlay)/40 animate-pulse shadow-sm">
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-10">
            <div className="mb-2.5 h-2 w-16 rounded bg-(--bg-overlay)/60" />
            <div className="mb-1.5 h-4 w-3/4 rounded bg-(--bg-overlay)/60" />
            <div className="h-4 w-1/2 rounded bg-(--bg-overlay)/60" />
          </div>
        </div>
      </div>
      <div className="absolute bottom-6 right-7 z-30 flex items-center gap-2.5">
        <div className="h-[36px] w-[88px] animate-pulse rounded-full bg-(--bg-overlay)/60" />
        <div className="h-[36px] w-[96px] animate-pulse rounded-full bg-(--bg-overlay)/60" />
      </div>
    </div>
  );
}

export function TopPostHeroCarouselEmpty({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-(--border-subtle) bg-(--bg-surface)",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.08),transparent_52%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.02),transparent_40%)] dark:bg-[linear-gradient(to_top,rgba(255,255,255,0.02),transparent_40%)]" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-(--brand-primary)">Featured</p>
        <h2 className="mt-2 max-w-lg text-2xl font-bold leading-tight text-(--text-primary)">
          No featured discussions yet
        </h2>
        <p className="mt-3 max-w-md text-sm text-(--text-secondary)">
          Add a few high-signal creator posts here to make the discussion stage feel alive.
        </p>
      </div>
    </div>
  );
}
