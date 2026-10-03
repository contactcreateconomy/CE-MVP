"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BarChart3, ChevronLeft, ChevronRight, MessageSquare, Share2, ArrowRight } from "lucide-react";

import type { TopPostHeroSlide } from "@/lib/adapters/content";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SLIDE_INTERVAL_MS = 5200;

interface TopPostHeroCarouselProps {
  slides: TopPostHeroSlide[];
  className?: string;
}

function formatMetric(value: number) {
  return value.toLocaleString();
}

export function TopPostHeroCarousel({ slides, className }: TopPostHeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (slides.length <= 1 || isPaused) {
      return;
    }

    const timer = window.setInterval(() => {
      setDirection(1);
      setActiveIndex((current) => (current + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [isPaused, slides.length]);

  if (slides.length === 0) {
    return null;
  }

  const currentSlide = slides[activeIndex];

  const handleNext = () => {
    setDirection(1);
    setActiveIndex((current) => (current + 1) % slides.length);
  };

  const handlePrevious = () => {
    setDirection(-1);
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  };


  const accentStyle = {
    "--hero-accent": currentSlide.accentRgb,
  } as CSSProperties;

  return (
    <Card
      className={cn(
        "group/hero relative overflow-hidden rounded-[28px]",
        className,
      )}
      style={accentStyle}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured posts carousel"
    >
      <CardContent className="relative h-full p-0">
        <div className="pointer-events-none absolute inset-0 bg-transparent" />

        <AnimatePresence initial={false} mode="wait">
          <motion.article
            key={currentSlide.id}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: direction > 0 ? 24 : -24, filter: "blur(6px)" }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: direction > 0 ? -24 : 24, filter: "blur(4px)" }}
            transition={{ duration: prefersReducedMotion ? 0.2 : 0.42, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <div className="grid h-full gap-6 p-5 md:p-6 lg:grid-cols-[minmax(0,44%)_minmax(0,56%)] lg:gap-7 lg:p-7">
              <motion.div
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.99 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: prefersReducedMotion ? 0.2 : 0.35, delay: 0.04, ease: "easeOut" }}
                className="relative min-h-[220px] lg:min-h-0"
              >
                <Link
                  href={`/discussions/${currentSlide.slug}`}
                  aria-label={`Open featured post ${currentSlide.title}`}
                  className="group/image relative block h-full overflow-hidden rounded-[24px] border border-[var(--border-default)]/70 bg-[var(--bg-overlay)]/45 shadow-[0_10px_24px_rgba(9,9,11,0.12)] transition-transform duration-300"
                >
                  <div
                    className="pointer-events-none absolute -inset-12 opacity-75 blur-3xl transition-transform duration-700 group-hover/image:-translate-y-1 group-hover/image:translate-x-2"
                    style={{
                      background:
                        "radial-gradient(circle at 48% 50%, rgba(var(--hero-accent),0.4) 0%, rgba(var(--hero-accent),0.14) 38%, transparent 74%)",
                    }}
                  />
                  {currentSlide.coverImage ? (
                    <Image
                      src={currentSlide.coverImage}
                      alt={currentSlide.title}
                      fill
                      sizes="(max-width: 1023px) 100vw, 42vw"
                      className="object-cover transition-transform duration-700 group-hover/image:scale-[1.03]"
                      priority={activeIndex === 0}
                    />
                  ) : (
                    <div className="h-full w-full bg-[var(--bg-overlay)]" />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(2,7,17,0.45)] via-transparent to-transparent" />
                </Link>
              </motion.div>

              <motion.div
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={{ duration: prefersReducedMotion ? 0.2 : 0.35, delay: 0.1, ease: "easeOut" }}
                className="flex min-w-0 flex-col justify-center"
              >
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">{currentSlide.eyebrow}</p>

                <Link href={`/discussions/${currentSlide.slug}`} className="group/title block">
                  <h2 className="line-clamp-2 text-3xl font-semibold leading-[1.12] text-[var(--text-primary)] drop-shadow-[0_3px_10px_rgba(9,9,11,0.16)] transition-colors duration-200 group-hover/title:text-[var(--brand-primary)] lg:text-5xl">
                    {currentSlide.title}
                  </h2>
                </Link>

                <p className="mt-3 line-clamp-3 max-w-[66ch] text-base leading-relaxed text-[var(--text-secondary)] lg:text-lg">
                  {currentSlide.summary}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)]/80 bg-[var(--bg-overlay)]/65 px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                    <BarChart3 className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                    {formatMetric(currentSlide.reads)} reads
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)]/80 bg-[var(--bg-overlay)]/65 px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                    <MessageSquare className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                    {formatMetric(currentSlide.comments)} comments
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)]/80 bg-[var(--bg-overlay)]/65 px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                    <Share2 className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                    {formatMetric(currentSlide.shares)} shares
                  </span>
                </div>

                <motion.div
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0.2 : 0.32, delay: 0.18, ease: "easeOut" }}
                  className="mt-6"
                >
                  <Link
                    href={`/discussions/${currentSlide.slug}`}
                    className={cn(
                      buttonVariants({ variant: "primary", size: "md" }),
                      "group/cta relative h-10 rounded-full px-6 text-sm font-semibold shadow-none transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(14,165,233,0.34)]",
                    )}
                    aria-label={`Read featured post ${currentSlide.title}`}
                  >
                    <span
                      className="pointer-events-none absolute inset-0 rounded-full opacity-0 blur-xl transition-all duration-500 group-hover/cta:translate-x-1 group-hover/cta:opacity-90"
                      style={{
                        background:
                          "radial-gradient(circle at 35% 50%, rgba(var(--hero-accent),0.4) 0%, rgba(var(--hero-accent),0.06) 62%, transparent 100%)",
                      }}
                    />
                    <span className="relative z-10 inline-flex items-center gap-2">
                      <span>{currentSlide.ctaLabel}</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
                    </span>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </motion.article>
        </AnimatePresence>

        <div className="absolute right-5 bottom-5 z-20 flex items-center gap-2 md:right-6 md:bottom-6">
          <span className="rounded-full border border-[var(--border-default)]/80 bg-[var(--bg-overlay)]/75 px-3 py-1 text-[11px] font-semibold text-[var(--text-secondary)] backdrop-blur-sm">
            {(activeIndex + 1).toString().padStart(2, "0")} / {slides.length.toString().padStart(2, "0")}
          </span>
          <div className="inline-flex items-center gap-1 rounded-full border border-[var(--border-default)]/80 bg-[var(--bg-overlay)]/75 p-1 backdrop-blur-sm">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="h-8 w-8 rounded-full p-0 text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]/80"
              onClick={handlePrevious}
              aria-label="Show previous featured post"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="h-8 w-8 rounded-full p-0 text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]/80"
              onClick={handleNext}
              aria-label="Show next featured post"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>


      </CardContent>
    </Card>
  );
}
