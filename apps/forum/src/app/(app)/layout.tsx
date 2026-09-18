import type { ReactNode } from "react";

import { ErrorBoundary } from "@/components/error-boundary";
import { CmpOverlay } from "@/components/consent/cmp-overlay";
import { NewsletterOverlay } from "@/components/newsletter/newsletter-overlay";

/**
 * (app) group layout — CAP-025 slot order (quoted): ErrorBoundary (the
 * app root owns crash containment) → CMP slot (M18, SLICE-P7T-13) →
 * BetaBanner (E1 — still ungated, not mounted) → children. CAP-026: the
 * ErrorBoundary sits ABOVE the CMP slot so a CMP crash degrades (CAP-028
 * — analytics denied, app + legal pages stay up) instead of taking the
 * whole tree down; `children` (incl. `/privacy` /terms` /dmca`) sits
 * OUTSIDE the boundary that wraps the CMP/overlay slots, so it is never
 * at risk from either overlay's own render errors.
 */
export default function MainAppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ErrorBoundary>
        <CmpOverlay />
        <NewsletterOverlay />
      </ErrorBoundary>
      {children}
    </>
  );
}
