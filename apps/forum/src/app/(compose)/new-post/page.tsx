/**
 * Route: /new-post (distraction-free compose layout — see (compose)/layout.tsx)
 * Suspense: the client reads ?type= (useSearchParams) — FEED-U3 Start sheet.
 */
import { Suspense } from "react";

import { NewPostPageClient } from "./new-post-page-client";

export default function NewPostPage() {
  return (
    <Suspense fallback={null}>
      <NewPostPageClient />
    </Suspense>
  );
}
