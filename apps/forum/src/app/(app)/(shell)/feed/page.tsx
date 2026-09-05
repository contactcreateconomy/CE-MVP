/**
 * Route: /feed
 * Data: Convex listFeedPage + listCategories (client; URL query is read in FeedRouteClient so sort/category changes do not refetch this RSC or flash loading.tsx).
 *
 * ISR: Revalidate every 60 seconds so anonymous visitors and crawlers get a
 * fresh static shell without hitting the Convex backend on every request.
 */
import { Suspense } from "react";

import { FeedRouteClient } from "@/components/feed/feed-route-client";

export const revalidate = 60;

export default function FeedPage() {
  return (
    <Suspense fallback={null}>
      <FeedRouteClient />
    </Suspense>
  );
}
