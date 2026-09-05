"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, TrendingUp } from "lucide-react";

import { useQuery } from "convex/react";

import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SLIDE_INTERVAL_MS = 4000;

function WhatsVibingWidgetInner() {
  const fetched = useQuery(api.forum.queries.listVibingItems, { limit: 10 });
  const items = useMemo(() => fetched ?? [], [fetched]);
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

  if (fetched === undefined) {
    return (
      <Card className="animate-soft-float h-[250px] bg-(--bg-surface) border border-(--border-default) rounded-xl p-4" style={{ animationDelay: "160ms" }}>
        <CardHeader className="p-0 pb-3">
          <div className="h-4 w-32 animate-pulse rounded bg-(--bg-overlay)" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[140px] w-full animate-pulse rounded-2xl bg-(--bg-overlay)/50" />
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <Card
      className="animate-soft-float h-[250px] bg-(--bg-surface) border border-(--border-default) rounded-xl p-4"
      style={{ animationDelay: "160ms" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <CardHeader className="p-0 pb-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-(--text-primary)">
          <TrendingUp className="h-4 w-4 text-(--brand-primary)" /> What&apos;s Vibing
        </h2>
      </CardHeader>

      <CardContent className="flex h-[186px] flex-col justify-between p-0">
        <div className="relative h-full min-h-[140px] overflow-hidden rounded-2xl">
          {items.map((item, index) => {
            const category = item.kind.charAt(0).toUpperCase() + item.kind.slice(1);

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-label={`Open trending post ${item.label}`}
                className={cn(
                  "group absolute inset-0 flex h-full cursor-pointer flex-col justify-between rounded-2xl border border-(--border-prominent) bg-(--bg-overlay)/24 p-4 transition-all duration-500",
                  "hover:border-(--border-active)/45",
                  index === activeIndex
                    ? "z-10 translate-y-0 scale-100 opacity-100"
                    : index < activeIndex
                      ? "pointer-events-none -translate-y-4 scale-95 opacity-0"
                      : "pointer-events-none translate-y-4 scale-95 opacity-0",
                )}
              >
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-(--brand-primary)">Trending in {category}</span>
                  <h4 className="line-clamp-4 text-sm font-semibold leading-5 text-(--text-primary)">
                    New post → {item.label}
                  </h4>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 text-label-sm font-semibold uppercase tracking-[0.14em] text-(--text-muted)">
                    <span>{item.engagedUsers.toLocaleString()} ENGAGED</span>
                    <span className="inline-flex items-center justify-center text-(--text-secondary) transition-colors duration-normal group-hover:text-(--brand-primary)">
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-normal group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:animate-[pulse_1200ms_ease-in-out_infinite] group-hover:drop-shadow-[var(--glow-primary-md)]" />
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

/** Only mounted from `RightSidebarWithConvex` today; guard keeps `useQuery` off the tree when Convex URL is missing. */
export function WhatsVibingWidget() {
  if (!isConvexConfigured()) {
    return null;
  }
  return <WhatsVibingWidgetInner />;
}
