"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOCK_FEATURED_SLIDES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { FeaturedSlide } from "@/lib/types";

const AUTO_PLAY_INTERVAL = 5000;

export function FeaturedSlider() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const slides = MOCK_FEATURED_SLIDES;

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
    },
    [current]
  );

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-play
  useEffect(() => {
    const timer = setInterval(next, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [next]);

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <section
      className="relative w-full"
      aria-label="Featured announcements"
      aria-roledescription="carousel"
    >
      {/* Desktop: show multiple cards peek; Mobile: one card */}
      <div className="relative overflow-hidden rounded-xl md:rounded-2xl h-[200px] md:h-[280px]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              "absolute inset-0 flex items-end p-6 md:p-8 rounded-xl md:rounded-2xl bg-gradient-to-br",
              slides[current].gradient
            )}
          >
            <div className="relative z-10">
              <h2 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">
                {slides[current].title}
              </h2>
              <p className="text-sm md:text-base text-white/80">
                {slides[current].subtitle}
              </p>
            </div>
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-xl md:rounded-2xl" />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm rounded-full"
          onClick={prev}
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm rounded-full"
          onClick={next}
          aria-label="Next slide"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Dot Indicators */}
      <div
        className="flex justify-center gap-2 mt-3"
        role="tablist"
        aria-label="Slide indicators"
      >
        {slides.map((slide, idx) => (
          <button
            key={slide.id}
            onClick={() => goTo(idx)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              idx === current
                ? "w-6 bg-primary"
                : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            role="tab"
            aria-selected={idx === current}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
