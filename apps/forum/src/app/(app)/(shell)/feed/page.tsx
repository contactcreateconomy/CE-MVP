/**
 * Route: /feed — the CANONICAL M9 feed (SLICE-P6-03). Four sorts over
 * postDistributionScores + cardSummaries; hero/Vibing/Featured/Podium
 * chrome; per-card controls. The legacy demo feed is retired from this
 * route (00-TRANSITION). noindex per CAP-486.
 *
 * /feed?category=<post-type> (left-sidebar + discover links) is the URL
 * entry point for the type filter.
 */
import type { Metadata } from "next";
import { Suspense } from "react";

import { CanonicalFeedClient } from "@/components/feed/canonical-feed-client";

export const metadata: Metadata = {
  title: "Feed — Createconomy",
  robots: { index: false, follow: true },
};

/** Client taxonomy keys match the canonical post-type literals except the
 *  legacy "qa" spelling for help (types/category.ts note) — map it so the
 *  sidebar's /feed?category=qa link filters the same posts the type-nav
 *  "Help" button does. */
const CATEGORY_KEY_TO_POST_TYPE: Record<string, string> = { qa: "help" };

function firstSearchParam(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

interface FeedPageProps {
  searchParams?: Promise<{ category?: string | string[] }>;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const resolved = await searchParams;
  const raw = (firstSearchParam(resolved?.category) ?? "").trim();
  const initialTypeFilter = raw ? (CATEGORY_KEY_TO_POST_TYPE[raw] ?? raw) : null;
  return (
    <Suspense fallback={null}>
      <CanonicalFeedClient initialTypeFilter={initialTypeFilter} />
    </Suspense>
  );
}
