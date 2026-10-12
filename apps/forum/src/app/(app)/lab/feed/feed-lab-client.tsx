"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";

import type { FeedCardData, FeedSort } from "@/components/feed/feed-display-types";
import { FeedPageView, type FeedListState } from "@/components/feed/feed-page-view";

import {
  cards as fixtureCards,
  debateAgreePct,
  heroSlides,
  navItems,
  podiumDimensions,
  podiumFor,
  podiumFormingDetail,
  podiumWindowFor,
  sortNotes,
  topicItems,
  vibing,
} from "./fixtures";

interface LabFeedClientProps {
  initialState: FeedListState;
  forcedTheme?: "dark" | "light";
  showToolbar: boolean;
  typeFilter: string;
  heroMode: "default" | "compact";
}

/** Local-state stand-in for the wiring on /feed (D-016: the page owns data). */
export function LabFeedClient({ initialState, forcedTheme, showToolbar, typeFilter, heroMode }: LabFeedClientProps) {
  const { setTheme, resolvedTheme } = useTheme();
  // next-themes resolves the theme on the client only — label after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [listState, setListState] = useState<FeedListState>(initialState);
  const [sort, setSort] = useState<FeedSort>("hot");
  const [favNew, setFavNew] = useState(true);
  const [dim, setDim] = useState("overall");
  const [cards, setCards] = useState<FeedCardData[]>(fixtureCards);
  const [hidden, setHidden] = useState<string | null>(null);
  const [newPosts, setNewPosts] = useState(12);

  // ?theme= applies once; re-running would undo every toggle.
  const forced = useRef(false);
  useEffect(() => {
    if (forcedTheme && !forced.current) {
      forced.current = true;
      setTheme(forcedTheme);
    }
  }, [forcedTheme, setTheme]);

  const visible = useMemo(() => {
    let list = cards;
    if (typeFilter !== "home") list = list.filter((c) => c.type === typeFilter || c.pinned);
    if (sort === "fav") list = list.filter((c) => c.viewer.saved || c.viewer.commented);
    return list;
  }, [cards, hidden, sort, typeFilter]);

  const patch = (id: string, change: (c: FeedCardData) => Partial<FeedCardData>) =>
    setCards((all) => all.map((c) => (c.id === id ? { ...c, ...change(c) } : c)));

  const effectiveState: FeedListState = listState === "ready" && visible.length === 0 ? "empty" : listState;

  return (
    <>
      <FeedPageView
        heroSlides={heroSlides}
        heroLoading={listState === "loading"}
        heroMode={heroMode}
        nav={{ items: navItems, topics: topicItems, activeKey: typeFilter, onStartDiscussion: () => {} }}
        sort={sort}
        onSortChange={(s) => {
          setSort(s);
          if (s === "fav") setFavNew(false); // L-47: clears on open
        }}
        favNew={favNew}
        sortNotes={sortNotes}
        listState={effectiveState}
        cards={visible}
        caughtUpAfter={typeFilter === "home" ? 4 : null}
        newPosts={newPosts ? { count: newPosts, onShow: () => setNewPosts(0) } : null}
        cardActions={(card) => ({
          onAppreciate: () =>
            patch(card.id, (c) => ({
              viewer: { ...c.viewer, appreciated: !c.viewer.appreciated },
              gravity: c.gravity + (c.viewer.appreciated ? -1 : 1),
            })),
          onToggleSaved: () => patch(card.id, (c) => ({ viewer: { ...c.viewer, saved: !c.viewer.saved } })),
          onShare: () => {},
          onOpenStrings: () => {},
          onVote:
            card.facet?.kind === "debate"
              ? (choice) => patch(card.id, (c) => ({ facet: { kind: "debate", votes: (c.facet as { votes: number }).votes + 1, viewerVote: choice, agreePct: debateAgreePct } }))
              : undefined,
          onWhy: () => {},
          onNotForMe: () => setHidden(card.id),
          onHide: () => setHidden(card.id),
          onMute: () => setHidden(card.id),
          onReport: () => setHidden(card.id),
          onUndoHide: () => setHidden(null),
        })}
        onEmptyAction={() => {}}
        vibing={vibing}
        podium={{
          windowLabel: podiumWindowFor[sort],
          dimensions: podiumDimensions,
          activeDimension: dim,
          onDimensionChange: setDim,
          entries: podiumFor(dim),
          formingDetail: podiumFormingDetail,
          leaderboardHref: "/lab/feed",
        }}
        hiddenIds={hidden ? new Set([hidden]) : undefined}
      />

      {showToolbar ? (
        <div className="frost-subtle fixed bottom-2 left-2 z-toast flex gap-1 rounded-full border border-border-default p-1 text-caption">
          <button
            type="button"
            className="rounded-full px-2 py-1 text-text-secondary hover:text-text-primary"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {!mounted ? "Theme" : resolvedTheme === "dark" ? "Dark" : "Light"}
          </button>
          {(["ready", "loading", "empty"] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={
                s === listState
                  ? "rounded-full bg-bg-overlay px-2 py-1 text-text-primary"
                  : "rounded-full px-2 py-1 text-text-secondary hover:text-text-primary"
              }
              onClick={() => setListState(s)}
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
