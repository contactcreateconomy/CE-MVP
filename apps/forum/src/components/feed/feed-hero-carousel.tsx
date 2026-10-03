"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, BarChart3, ChevronLeft, ChevronRight, MessageSquare, Share2 } from "lucide-react";

import { cn } from "@/lib/utils";

import type { FeedHeroMetric, FeedHeroSlide } from "./feed-display-types";
import { postTypeMeta } from "./feed-post-type-meta";

const SLIDE_INTERVAL_MS = 5200;

const METRIC = {
  reads: { Icon: BarChart3, noun: "reads" },
  replies: { Icon: MessageSquare, noun: "comments" },
  shares: { Icon: Share2, noun: "shares" },
} as const;

function MetricPill({ metric }: { metric: FeedHeroMetric }) {
  const { Icon, noun } = METRIC[metric.kind];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border-default/80 bg-bg-overlay/65 px-3 py-1.5 text-caption font-semibold text-text-secondary">
      <Icon className="size-3.5 text-brand-primary" />
      {metric.value.toLocaleString("en-US")} {noun}
    </span>
  );
}

export interface FeedHeroCarouselProps {
  slides: FeedHeroSlide[];
  className?: string;
}

/**
 * Desktop hero carousel (lg+ only — mobile starts with the feed, founder
 * 2026-10-03). Prototype `top-post-hero-carousel.tsx` on S00 tokens: the
 * per-slide rgb accent is the post type's `--cat-*` wash. Autoplay pauses on
 * hover/focus and is off under reduced motion.
 */
export function FeedHeroCarousel({ slides, className }: FeedHeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (slides.length <= 1 || isPaused || reduceMotion) return;
    const timer = window.setInterval(() => {
      setDirection(1);
      setActiveIndex((i) => (i + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isPaused, reduceMotion, slides.length]);

  if (slides.length === 0) return null;
  const slide = slides[activeIndex % slides.length];
  const meta = postTypeMeta(slide.type);

  const go = (step: 1 | -1) => {
    setDirection(step);
    setActiveIndex((i) => (i + step + slides.length) % slides.length);
  };

  const enter = reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * 24, filter: "blur(6px)" };
  const exit = reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * -24, filter: "blur(4px)" };

  return (
    <section
      className={cn("card-surface group/hero relative overflow-hidden rounded-hero", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured posts"
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.article
          key={slide.id}
          initial={enter}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          exit={exit}
          transition={{ duration: reduceMotion ? 0.16 : 0.42, ease: "easeOut" }}
          className="absolute inset-0"
          aria-roledescription="slide"
          aria-label={`${activeIndex + 1} of ${slides.length}`}
        >
          <div className="grid h-full grid-cols-[minmax(0,44%)_minmax(0,56%)] gap-7 p-7">
            <Link
              href={slide.href}
              tabIndex={-1}
              aria-hidden
              className="group/image relative block h-full overflow-hidden rounded-2xl border border-border-default/70 bg-bg-overlay/45 shadow-md"
            >
              <div
                className={cn(
                  "pointer-events-none absolute -inset-12 opacity-75 blur-3xl transition-transform duration-slow group-hover/image:-translate-y-1 group-hover/image:translate-x-2",
                  meta.wash,
                )}
              />
              {slide.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slide.imageUrl}
                  alt=""
                  className="absolute inset-0 size-full object-cover transition-transform duration-slow group-hover/image:scale-103"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <meta.Icon className={cn("size-16 opacity-60", meta.text)} aria-hidden />
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-(--scrim) via-transparent to-transparent" />
            </Link>

            <div className="flex min-w-0 flex-col justify-center pb-10">
              <p className="mb-2 text-overline font-semibold uppercase text-text-muted">{slide.eyebrow}</p>
              <Link href={slide.href} className="focus-ring group/title block rounded-sm">
                <h2 className="line-clamp-2 text-display-sm font-semibold text-text-primary transition-colors duration-normal group-hover/title:text-brand-primary xl:text-display-lg">
                  {slide.title}
                </h2>
              </Link>
              {slide.summary ? (
                <p className="mt-3 line-clamp-3 max-w-[66ch] text-body-md text-text-secondary xl:text-body-lg">
                  {slide.summary}
                </p>
              ) : null}
              {slide.metrics.length > 0 ? (
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {slide.metrics.map((m) => (
                    <MetricPill key={m.kind} metric={m} />
                  ))}
                </div>
              ) : null}
              <div className="mt-6">
                <Link
                  href={slide.href}
                  className="focus-ring group/cta inline-flex h-10 items-center gap-2 rounded-full bg-brand-primary px-6 text-body-sm font-semibold text-text-inverse transition-[transform,background-color] duration-normal ease-out-cubic hover:-translate-y-0.5 hover:bg-brand-primary-hover active:scale-97"
                >
                  {slide.ctaLabel}
                  <ArrowRight className="size-4 transition-transform duration-slow group-hover/cta:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </motion.article>
      </AnimatePresence>

      {slides.length > 1 ? (
        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
          <span className="glass-chrome rounded-full border border-border-default/80 px-3 py-1 text-label-sm font-semibold tabular-nums text-text-secondary">
            {String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </span>
          <div className="glass-chrome inline-flex items-center gap-1 rounded-full border border-border-default/80 p-1">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous featured post"
              className="focus-ring inline-flex size-8 items-center justify-center rounded-full text-text-primary transition-colors duration-fast hover:bg-bg-overlay/80"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next featured post"
              className="focus-ring inline-flex size-8 items-center justify-center rounded-full text-text-primary transition-colors duration-fast hover:bg-bg-overlay/80"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
