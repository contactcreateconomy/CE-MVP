"use client";

import type { ReactNode } from "react";
import { Bookmark, Inbox } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, SkeletonAvatar, SkeletonText } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { FeedCard, type FeedCardActions } from "./feed-card";
import type { FeedCardData, FeedHeroSlide, FeedSort } from "./feed-display-types";
import { FeedHeroCarousel } from "./feed-hero-carousel";
import { FeedLeftNav, type FeedLeftNavProps } from "./feed-left-nav";
import { FeedPodiumWidget, FeedVibingWidget, type FeedPodiumWidgetProps, type FeedVibingWidgetProps } from "./feed-rail";
import { FeedTabs } from "./feed-tabs";
import { FeedUndoToast } from "./feed-undo-toast";

export type FeedListState = "loading" | "ready" | "empty";

export interface FeedPageViewProps {
  heroSlides: FeedHeroSlide[];
  nav: FeedLeftNavProps;
  sort: FeedSort;
  onSortChange: (sort: FeedSort) => void;
  listState: FeedListState;
  cards: FeedCardData[];
  /** Per-card handlers; omit a key to hide that control/menu item. */
  cardActions?: (card: FeedCardData) => FeedCardActions;
  /** Empty-state CTA (e.g. open the composer). */
  onEmptyAction?: () => void;
  /** Below the list: "load more" sentinel / button, owned by the wiring. */
  footer?: ReactNode;
  vibing: FeedVibingWidgetProps["items"];
  podium: Omit<FeedPodiumWidgetProps, "className">;
  undo?: { message: string; onUndo: () => void; onDismiss: () => void } | null;
}

function FeedCardSkeleton() {
  return (
    <div className="card-surface space-y-4 p-4" aria-hidden>
      <div className="flex items-center gap-2.5">
        <SkeletonAvatar />
        <div className="flex-1 space-y-2">
          <SkeletonText className="w-32" />
          <SkeletonText className="w-20" />
        </div>
      </div>
      <Skeleton className="h-6 w-4/5" />
      <SkeletonText className="w-full" />
      <Skeleton className="h-11 w-full rounded-menu" />
    </div>
  );
}

/**
 * The whole feed page body, below the S00 shell (top bar + tab bar are the
 * shell's, not S02's). 390: tabs + cards only (no hero — founder
 * 2026-10-03). lg (1024+): hero carousel + left nav. xl (1280+): right rail.
 */
export function FeedPageView(props: FeedPageViewProps) {
  const { heroSlides, nav, sort, onSortChange, listState, cards, cardActions, onEmptyAction, footer, vibing, podium, undo } =
    props;

  return (
    <div className="relative min-h-dvh bg-bg-canvas text-text-primary">
      <div className="canvas-dot-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative z-10">
        {heroSlides.length > 0 ? (
          <div className="mx-auto hidden w-full max-w-(--container-app) px-8 pb-2 pt-6 lg:block">
            <FeedHeroCarousel slides={heroSlides} className="h-95 xl:h-105" />
          </div>
        ) : null}

        <div className="mx-auto flex w-full max-w-(--container-app) gap-4 px-4 py-4 md:px-6 lg:gap-8 lg:px-8 lg:py-6">
          <FeedLeftNav {...nav} className={cn("hidden lg:block", nav.className)} />

          <main className="min-w-0 flex-1 pb-[calc(var(--tabbar-h)+var(--safe-bottom)+2rem)] lg:pb-8">
            <section className="space-y-4" aria-label="Feed">
              <header className="card-surface p-2">
                <FeedTabs active={sort} onSelect={onSortChange} />
              </header>

              {listState === "loading" ? (
                <div className="space-y-4" aria-busy="true" aria-label="Loading posts">
                  <FeedCardSkeleton />
                  <FeedCardSkeleton />
                  <FeedCardSkeleton />
                </div>
              ) : listState === "empty" ? (
                <div className="card-surface">
                  <EmptyState
                    icon={sort === "fav" ? <Bookmark /> : <Inbox />}
                    heading={sort === "fav" ? "No favorite posts yet" : "No posts here yet"}
                    description={
                      sort === "fav"
                        ? "Bookmark posts as favorites and they will appear here."
                        : "Try another Discover filter or switch back to Home for all discussions."
                    }
                    action={onEmptyAction ? { label: "Start Discussion", onClick: onEmptyAction } : undefined}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {cards.map((card) => (
                    <FeedCard key={card.id} card={card} {...(cardActions?.(card) ?? {})} />
                  ))}
                </div>
              )}

              {footer}
            </section>
          </main>

          <aside className="sticky top-20 hidden h-fit w-80 shrink-0 space-y-4 xl:block" aria-label="Trending and podium">
            <FeedVibingWidget items={vibing} />
            <FeedPodiumWidget {...podium} />
          </aside>
        </div>
      </div>

      {undo ? (
        <div className="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+var(--safe-bottom)+1rem)] z-toast flex justify-center px-4 lg:bottom-6">
          <FeedUndoToast message={undo.message} onUndo={undo.onUndo} onDismiss={undo.onDismiss} />
        </div>
      ) : null}
    </div>
  );
}
