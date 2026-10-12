"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";

import { toCardData, toHeroSlides, toNavItems, toPodium, toVibingItems } from "@/components/feed/feed-adapter";
import { FeedPageView } from "@/components/feed/feed-page-view";
import type { FeedSort } from "@/components/feed/feed-display-types";

import wire from "./wire-payload.json";

/** Offline stand-in for convex-test storage URLs (they point at a fake
 *  deployment and cannot load). Only the image URL is swapped. */
function standIn(url: string | null, hue: number): string | null {
  if (!url) return null;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 416 280"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 70% 50%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360} 60% 18%)"/></linearGradient></defs><rect width="416" height="280" fill="url(#g)"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
const NOW = Date.UTC(2026, 9, 12, 12);

/**
 * /lab/feed?source=wire — the REAL adapter + display components over a
 * payload captured from the REAL feed.list / getChrome code running on the
 * real schema (tests/integration/feed-u2-payload.test.ts, convex-test).
 * Lab only (D-012). Proof for FEED-U2 while this container cannot run a
 * Convex backend; it is not the live /feed.
 */
export function FeedWireLab({ forcedTheme }: { forcedTheme?: "light" | "dark" }) {
  const [sort, setSort] = useState<FeedSort>("top");
  const { setTheme } = useTheme();
  const forced = useRef(false);
  useEffect(() => {
    if (forcedTheme && !forced.current) {
      forced.current = true;
      setTheme(forcedTheme);
    }
  }, [forcedTheme, setTheme]);
  const chrome = wire.chrome as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const labels = useMemo(() => {
    const m = new Map<string, string>(chrome.typeNav.map((t: { type: string; label: string }) => [t.type, t.label]));
    return (t: string) => m.get(t) ?? null;
  }, [chrome]);
  const cards = (wire.list.page as unknown[]).map((raw, i) => {
    const c = toCardData(raw, labels, NOW);
    return {
      ...c,
      coverImageUrl: standIn(c.coverImageUrl, 200 + i * 20),
      author: { ...c.author, avatarUrl: standIn(c.author.avatarUrl, 30) },
      participants: c.participants.map((p, j) => ({ ...p, avatarUrl: standIn(p.avatarUrl, 120 + j * 40) })),
    };
  });
  const hero = toHeroSlides(chrome.hero).map((s) => ({ ...s, imageUrl: standIn(s.imageUrl, 28) }));

  return (
    <>
      <p className="sticky top-0 z-toast bg-feedback-warning/15 px-4 py-2 text-center text-caption text-text-primary">
        Lab · real feed.list + getChrome output (convex-test, real schema) through the real adapter · image URLs swapped for offline stand-ins
      </p>
      <FeedPageView
        heroSlides={hero}
        nav={{ items: toNavItems(chrome.typeNav), activeKey: "home", onStartDiscussion: () => {} }}
        sort={sort}
        onSortChange={setSort}
        listState="ready"
        cards={cards}
        cardActions={() => ({ onOpenStrings: () => {}, onVote: () => {} })}
        vibing={toVibingItems(chrome.vibing, chrome.featured, labels)}
        podium={{ windowLabel: "this week", entries: toPodium(chrome.podium).entries, leaderboardHref: "/lab/feed" }}
      />
    </>
  );
}
