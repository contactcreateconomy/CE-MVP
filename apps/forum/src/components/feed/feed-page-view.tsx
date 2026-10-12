"use client";

import { Fragment, useRef, type ReactNode } from "react";
import { ArrowUp, Bookmark, Inbox } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

import { FeedCard, FeedCardSkeleton, type FeedCardActions } from "./feed-card";
import type { FeedCardData, FeedHeroSlide, FeedSort } from "./feed-display-types";
import { FeedHeroCarousel, FeedHeroCarouselSkeleton } from "./feed-hero-carousel";
import { FeedDiscoverChips, FeedLeftNav, type FeedLeftNavProps } from "./feed-left-nav";
import {
  FeedPodiumCard,
  FeedPodiumWidget,
  FeedVibingTicker,
  FeedVibingWidget,
  type FeedPodiumWidgetProps,
  type FeedVibingWidgetProps,
} from "./feed-rail";
import { FeedTabs, type FeedTabsProps } from "./feed-tabs";

export type FeedListState = "loading" | "ready" | "empty";

/** Mobile: the Podium becomes an in-feed card after the 5th post (§8). */
const PODIUM_AFTER = 5;

export interface FeedPageViewProps {
  heroSlides: FeedHeroSlide[];
  /** Hero data still resolving → skeleton (lg+). Empty + not loading → no hero. */
  heroLoading?: boolean;
  /** Initial hero state (lab/review only; the member toggles it). */
  heroMode?: "default" | "compact";
  nav: FeedLeftNavProps;
  sort: FeedSort;
  onSortChange: (sort: FeedSort) => void;
  favNew?: FeedTabsProps["favNew"];
  sortNotes?: FeedTabsProps["notes"];
  listState: FeedListState;
  cards: FeedCardData[];
  /** Per-card handlers; omit a key to hide that control/menu item. */
  cardActions?: (card: FeedCardData) => FeedCardActions;
  /** "12 new posts ↑" — floats, never pushes content (§9.8). */
  newPosts?: { count: number; onShow: () => void } | null;
  /** Insert "You're caught up since your last visit" after this many cards (L-19). */
  caughtUpAfter?: number | null;
  /** Empty-state CTA (e.g. open the composer). */
  onEmptyAction?: () => void;
  /** Below the list: "load more" sentinel / button, owned by the wiring. */
  footer?: ReactNode;
  vibing: FeedVibingWidgetProps["items"];
  podium: Omit<FeedPodiumWidgetProps, "className">;
  /** Cards the viewer hid this session — they collapse in place to "Hidden · Undo" (L-79). */
  hiddenIds?: ReadonlySet<string>;
}

function Divider({ children }: { children: ReactNode }) {
  return (
    <div role="separator" className="flex items-center gap-3 py-1 text-caption text-text-muted">
      <span className="h-px flex-1 bg-border-default" />
      {children}
      <span className="h-px flex-1 bg-border-default" />
    </div>
  );
}

/**
 * The feed page body below the shell (FEED-DESIGN §8, founder-approved Make
 * layout). lg+: hero across the container, then a centred ~1000px grid —
 * left 170 · centre fluid · right 226, gaps 22 (v2 proportions win over
 * STYLE-KIT's 240/320 rails, §8). <lg: Discover chips, sorter, Vibing ticker,
 * cards, Podium as an in-feed card after the 5th post; no hero (D-017).
 */
export function FeedPageView(props: FeedPageViewProps) {
  const { heroSlides, heroLoading, heroMode, nav, sort, onSortChange, favNew, sortNotes, listState, cards } = props;
  const { cardActions, hiddenIds, newPosts, caughtUpAfter, onEmptyAction, footer, vibing, podium } = props;
  const tabsRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative min-h-dvh bg-bg-canvas text-text-primary">
      <div className="canvas-dot-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative z-10 mx-auto w-full max-w-250 px-4 pb-[calc(var(--tabbar-h)+var(--safe-bottom)+2rem)] pt-4 lg:px-3 lg:pb-12 lg:pt-6 xl:px-0">
        {heroLoading || heroSlides.length > 0 ? (
          <div className="hidden lg:block">
            {heroLoading ? <FeedHeroCarouselSkeleton /> : <FeedHeroCarousel slides={heroSlides} initialMode={heroMode} />}
          </div>
        ) : null}

        <div className="lg:mt-6 lg:grid lg:grid-cols-[170px_minmax(0,1fr)_226px] lg:items-start lg:gap-5.5">
          <FeedLeftNav {...nav} className={cn("sticky top-20 hidden lg:flex", nav.className)} />

          <main className="min-w-0">
            <section className="flex flex-col gap-3" aria-label="Feed">
              <FeedDiscoverChips items={nav.items} topics={nav.topics} activeKey={nav.activeKey} className="lg:hidden" />
              <FeedTabs ref={tabsRef} active={sort} onSelect={onSortChange} favNew={favNew} notes={sortNotes} />
              <FeedVibingTicker items={vibing} className="lg:hidden" />

              {newPosts && newPosts.count > 0 ? (
                <div className="sticky top-20 z-sticky h-0">
                  <button
                    type="button"
                    onClick={newPosts.onShow}
                    className="frost-strong focus-ring absolute left-1/2 top-1 inline-flex h-8 -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-border-subtle px-3.5 text-caption font-semibold text-text-primary transition-[scale] active:scale-97 active:duration-press"
                  >
                    <span className="font-mono">{newPosts.count}</span> new posts <ArrowUp className="size-3.5" strokeWidth={2} aria-hidden />
                  </button>
                </div>
              ) : null}

              {listState === "loading" ? (
                <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading posts">
                  <FeedCardSkeleton />
                  <FeedCardSkeleton />
                  <FeedCardSkeleton />
                </div>
              ) : listState === "empty" ? (
                <div className="frost-look rounded-lg border border-border-subtle">
                  <EmptyState
                    icon={sort === "fav" ? <Bookmark /> : <Inbox />}
                    heading={sort === "fav" ? "Nothing new in your favs" : "No posts here yet"}
                    description={
                      sort === "fav"
                        ? "Save posts or join a discussion and new activity shows up here."
                        : "Try another Discover filter or switch back to All."
                    }
                    action={onEmptyAction ? { label: "Start Discussion", onClick: onEmptyAction } : undefined}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {cards.map((card, i) => (
                    <Fragment key={card.id}>
                      <FeedCard card={card} hidden={hiddenIds?.has(card.id)} {...(cardActions?.(card) ?? {})} />
                      {caughtUpAfter != null && i === caughtUpAfter - 1 ? <Divider>You&apos;re caught up since your last visit</Divider> : null}
                      {i === PODIUM_AFTER - 1 ? <FeedPodiumCard {...podium} className="lg:hidden" /> : null}
                    </Fragment>
                  ))}
                </div>
              )}

              {footer}
            </section>
          </main>

          <aside className="sticky top-20 hidden flex-col gap-3 lg:flex" aria-label="Trending and podium">
            <FeedVibingWidget items={vibing} />
            <FeedPodiumWidget {...podium} />
          </aside>
        </div>
      </div>

    </div>
  );
}
