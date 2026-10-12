/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results untyped at the client edge */
"use client";

/**
 * CanonicalFeedClient — the /feed DATA CONTAINER (SLICE-P6-03 + FEED-U2).
 * Owns every query, mutation and session state, maps payloads through
 * `feed-adapter` and renders the canonical display layer (`FeedPageView`,
 * D-016: display components take props only). Four sorts over
 * postDistributionScores (anonymous lands on Hot — quoted), type filter via
 * Discover `?category=`, snapshot pagination, hide / mute / report with the
 * inline "Hidden · Undo" (L-79), debate vote-to-reveal (L-29). The hero,
 * Vibing and Podium come from feed.getChrome (L-31: the hero never
 * auto-rotates).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import { useAuth } from "@cemvp/auth-ui";

import { toCardData, toHeroSlides, toNavItems, toPodium, toVibingItems } from "./feed-adapter";
import type { FeedCardData, FeedSort } from "./feed-display-types";
import { FeedPageView, type FeedListState } from "./feed-page-view";

type SortMode = FeedSort;

export function CanonicalFeedClient({ initialTypeFilter = null }: { initialTypeFilter?: string | null }) {
  const configured = isConvexConfigured();
  const router = useRouter();
  const { authStatus, openAuthModal } = useAuth() as { authStatus: string; openAuthModal?: (mode?: any) => void };
  const member = authStatus === "authenticated";
  // CAP-183 (quoted): "Anonymous lands on Hot."
  const [sort, setSort] = useState<SortMode>("hot");
  const effectiveSort = sort === "fav" && !member ? "hot" : sort;
  // /feed?category=<post-type> (left-sidebar + discover links): the URL
  // param is the initial type filter — same mechanism as the type nav.
  const [typeFilter, setTypeFilter] = useState<string | null>(initialTypeFilter);
  const [pages, setPages] = useState<any[][]>([]);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  const page = useQuery(
    api.feed.list,
    configured ? ({ sortMode: effectiveSort, typeFilter: typeFilter ?? undefined, cursor } as any) : "skip",
  );
  const chrome = useQuery(api.feed.getChrome, configured ? {} : "skip");

  const cardAction = useMutation(api.feed.cardAction);
  const unhide = useMutation(api.feed.unhide);
  const castVote = useMutation(api.posts.debate.cast);

  // Re-navigation to a different ?category= resets the walk exactly like a
  // type-nav click (the param is the type filter's URL entry point).
  useEffect(() => {
    setTypeFilter(initialTypeFilter);
    setPages([]);
    setCursor(undefined);
  }, [initialTypeFilter]);

  // Page accumulation (cursor walk; sort/type/category resets clear it).
  // Subscription re-pushes for the ALREADY-appended cursor REPLACE the tail
  // page instead of appending it again — a naive unconditional append
  // duplicated every card on each reactive push once a cursor was set.
  const appendedCursorRef = useRef<number | undefined | null>(null);
  useEffect(() => {
    if (!page) return;
    const isNewFetch = appendedCursorRef.current !== cursor;
    appendedCursorRef.current = cursor;
    setPages((prev) => {
      if (cursor === undefined) return [page.page];
      if (!isNewFetch && prev.length > 0) return [...prev.slice(0, -1), page.page];
      const seen = new Set(prev.flat().map((c: any) => c.postId));
      return [...prev, page.page.filter((c: any) => !seen.has(c.postId))];
    });
    setLoadingMore(false);
  }, [page, cursor]);

  const typeLabels = useMemo(() => {
    const map = new Map<string, string>(((chrome as any)?.typeNav ?? []).map((t: any) => [t.type, t.label]));
    return (type: string) => map.get(type) ?? null;
  }, [chrome]);
  const cards: FeedCardData[] = useMemo(() => pages.flat().map((raw) => toCardData(raw, typeLabels)), [pages, typeLabels]);

  if (!configured) return null;

  const resetWalk = () => {
    setPages([]);
    setCursor(undefined);
  };
  const signIn = () => openAuthModal?.("login");
  const hide = (postId: string, action: "hide" | "mute" | "report") => {
    void cardAction({ postId: postId as any, action });
    setHiddenIds((prev) => new Set(prev).add(postId));
  };
  const undoHide = (postId: string) => {
    void unhide({ postId: postId as any });
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.delete(postId);
      return next;
    });
  };
  const listState: FeedListState = page === undefined && pages.length === 0 ? "loading" : cards.length === 0 ? "empty" : "ready";
  const navItems = toNavItems((chrome as any)?.typeNav);

  return (
    <FeedPageView
      heroSlides={toHeroSlides((chrome as any)?.hero)}
      heroLoading={chrome === undefined}
      nav={{
        items: navItems,
        activeKey: typeFilter ?? "home",
        onStartDiscussion: () => (member ? router.push("/new-post") : signIn()),
      }}
      sort={effectiveSort}
      onSortChange={(mode) => {
        if (mode === "fav" && !member) return signIn(); // §9.4: visitor → sign in
        setSort(mode);
        resetWalk();
      }}
      favNew={false /* D-13: no Fav-activity source yet */}
      listState={listState}
      cards={cards}
      hiddenIds={hiddenIds}
      cardActions={(card) => ({
        onOpenStrings: card.href ? () => router.push(card.href!) : undefined,
        onShare: card.href ? () => void navigator.clipboard?.writeText(`${window.location.origin}${card.href}`) : undefined,
        onVote:
          card.facet?.kind === "debate" ? (choice) => (member ? void castVote({ postId: card.id as any, choice }) : signIn()) : undefined,
        ...(member
          ? {
              onHide: () => hide(card.id, "hide"),
              onMute: () => hide(card.id, "mute"),
              onReport: () => hide(card.id, "report"),
              onUndoHide: () => undoHide(card.id),
            }
          : {}),
      })}
      onEmptyAction={member ? () => router.push("/new-post") : undefined}
      footer={
        page?.cursor != null ? (
          <div className="flex justify-center">
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => {
                setLoadingMore(true);
                setCursor(page.cursor!);
              }}
              className="focus-ring h-9 rounded-full border border-border-subtle px-4 text-caption font-medium text-text-secondary transition-[border-color,color,scale] duration-normal hover:border-border-default hover:text-text-primary active:scale-97 active:duration-press disabled:opacity-60"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          </div>
        ) : null
      }
      vibing={toVibingItems((chrome as any)?.vibing, (chrome as any)?.featured, typeLabels)}
      podium={{
        windowLabel: "this week", // getChrome serves the overall · 7-day projection
        entries: toPodium((chrome as any)?.podium).entries,
        leaderboardHref: "/leaderboard",
      }}
    />
  );
}
