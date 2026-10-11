"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";

import type { FeedCardData, FeedPodiumWindow, FeedSort } from "@/components/feed/feed-display-types";
import { FeedPageView, type FeedListState } from "@/components/feed/feed-page-view";

import { cards as fixtureCards, heroSlides, navItems, podiumByWindow, vibing } from "./fixtures";

interface LabFeedClientProps {
  initialState: FeedListState;
  forcedTheme?: "dark" | "light";
  showToolbar: boolean;
  typeFilter: string;
  heroMode: "default" | "compact";
}

/** Local-state stand-in for the wiring GLM builds on /feed. */
export function LabFeedClient({ initialState, forcedTheme, showToolbar, typeFilter, heroMode }: LabFeedClientProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [listState, setListState] = useState<FeedListState>(initialState);
  const [sort, setSort] = useState<FeedSort>("top");
  const [podiumWindow, setPodiumWindow] = useState<FeedPodiumWindow>("d7");
  const [cards, setCards] = useState<FeedCardData[]>(fixtureCards);
  const [hidden, setHidden] = useState<string | null>(null);

  useEffect(() => {
    if (forcedTheme) setTheme(forcedTheme);
  }, [forcedTheme, setTheme]);

  const visible = useMemo(() => {
    let list = cards.filter((c) => c.id !== hidden);
    if (typeFilter !== "home") list = list.filter((c) => c.type === typeFilter);
    if (sort === "fav") list = list.filter((c) => c.isSaved);
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
        nav={{ items: navItems, activeKey: typeFilter, onStartDiscussion: () => {} }}
        sort={sort}
        onSortChange={setSort}
        listState={effectiveState}
        cards={visible}
        cardActions={(card) => ({
          onToggleValued: () =>
            patch(card.id, (c) => ({ isValued: !c.isValued, valuableCount: c.valuableCount + (c.isValued ? -1 : 1) })),
          onToggleSaved: () => patch(card.id, (c) => ({ isSaved: !c.isSaved })),
          onWhy: () => {},
          onShare: () => {},
          onHide: () => setHidden(card.id),
          onMute: () => setHidden(card.id),
          onReport: () => setHidden(card.id),
        })}
        onEmptyAction={() => {}}
        vibing={vibing}
        podium={{
          window: podiumWindow,
          onWindowChange: setPodiumWindow,
          entries: podiumByWindow[podiumWindow],
          leaderboardHref: "/lab/feed",
        }}
        undo={hidden ? { message: "Post hidden", onUndo: () => setHidden(null), onDismiss: () => setHidden(null) } : null}
      />

      {showToolbar ? (
        <div className="glass-chrome fixed bottom-2 left-2 z-toast flex gap-1 rounded-full border border-border-default p-1 text-caption">
          <button
            type="button"
            className="rounded-full px-2 py-1 text-text-secondary hover:text-text-primary"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? "Dark" : "Light"}
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
