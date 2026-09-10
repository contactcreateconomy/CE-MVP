import type { ReactNode } from "react";

import { CmpOverlay } from "@/components/consent/cmp-overlay";

/**
 * (app) group layout — CAP-025 slot order (quoted): ErrorBoundary (the
 * app root owns crash containment) → CMP slot (M18, SLICE-P7T-13) →
 * BetaBanner (E1 — still ungated, not mounted) → children. Legal-family
 * routes render outside this group's consent surface via their own
 * layout carve-out (CAP-028: legal stays up when analytics/CMP fails).
 */
export default function MainAppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <CmpOverlay />
      {children}
    </>
  );
}
