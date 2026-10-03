"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, TrendingUp } from "lucide-react";

import { getVibingItems } from "@/lib/adapters/content";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SLIDE_INTERVAL_MS = 4000;

export function WhatsVibingWidget() {
  const items = useMemo(() => getVibingItems(10), []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (items.length <= 1 || isPaused) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [isPaused, items.length]);

  if (items.length === 0) {
    return null;
  }

  return (
    <Card
      className="animate-soft-float h-[250px]"
      style={{ animationDelay: "160ms" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <CardHeader className="pb-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <TrendingUp className="h-4 w-4 text-[var(--brand-primary)]" /> What&apos;s Vibing
        </h2>
      </CardHeader>

      <CardContent className="flex h-[186px] flex-col justify-between p-4 pt-0">
        <div className="relative h-full min-h-[140px] overflow-hidden rounded-[24px]">
          {items.map((item, index) => {
            const category = item.kind.charAt(0).toUpperCase() + item.kind.slice(1);

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-label={`Open trending post ${item.label}`}
                className={cn(
                  "group absolute inset-0 flex h-full cursor-pointer flex-col justify-between rounded-[24px] border border-[var(--border-prominent)] bg-[var(--bg-overlay)]/24 p-4 transition-all duration-500",
                  "hover:border-[var(--border-active)]/45",
                  index === activeIndex
                    ? "z-10 translate-y-0 scale-100 opacity-100"
                    : index < activeIndex
                      ? "pointer-events-none -translate-y-4 scale-95 opacity-0"
                      : "pointer-events-none translate-y-4 scale-95 opacity-0",
                )}
              >
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-[var(--brand-primary)]">Trending in {category}</span>
                  <h4 className="line-clamp-4 text-sm font-semibold leading-5 text-[var(--text-primary)]">
                    New post → {item.label}
                  </h4>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    <span>{item.engagedUsers.toLocaleString()} ENGAGED</span>
                    <span className="inline-flex items-center justify-center text-[var(--text-secondary)] transition-colors duration-200 group-hover:text-[var(--brand-primary)]">
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:[animation:pulse_1200ms_ease-in-out_infinite] group-hover:drop-shadow-[0_0_8px_rgba(14,165,233,0.55)]" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

      </CardContent>
    </Card>
  );
}
