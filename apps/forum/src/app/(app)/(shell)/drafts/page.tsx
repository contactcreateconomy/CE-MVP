/**
 * Route: /drafts — My Drafts list.
 * Spec anchor: CAP-531 (draft save) + CAP-532 (My Drafts list), locked Phase 4
 * (W2-E3). This route is keyed to those capabilities — reclassified D→A in the
 * 2026-08-31 product-fit review. Storage is local-only for now; CAP-531's
 * server-side draft preservation lands with the spec-compliant composer.
 */
import { DraftsPageClient } from "./drafts-page-client";

export default function DraftsPage() {
  return <DraftsPageClient />;
}
