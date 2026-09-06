/**
 * Route: /feed — the CANONICAL M9 feed (SLICE-P6-03). Four sorts over
 * postDistributionScores + cardSummaries; hero/Vibing/Featured/Podium
 * chrome; per-card controls. The legacy demo feed is retired from this
 * route (00-TRANSITION). noindex per CAP-486.
 */
import type { Metadata } from "next";
import { Suspense } from "react";

import { CanonicalFeedClient } from "@/components/feed/canonical-feed-client";

export const metadata: Metadata = {
  title: "Feed — Createconomy",
  robots: { index: false, follow: true },
};

export default function FeedPage() {
  return (
    <Suspense fallback={null}>
      <CanonicalFeedClient />
    </Suspense>
  );
}
