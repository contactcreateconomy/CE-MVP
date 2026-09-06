/**
 * Route: /contribute — SLICE-P6-09: reachable ALWAYS (E3 — not 404).
 * Disabled render while constellation.ugc.enabled=false (soft beta);
 * the full gated flow mounts behind the flag.
 */
import type { Metadata } from "next";
import { Suspense } from "react";

import { ContributePageClient } from "./contribute-page-client";

export const metadata: Metadata = {
  title: "Contribute a reference — Createconomy",
  robots: { index: false, follow: false },
};

export default function ContributePage() {
  return (
    <Suspense fallback={null}>
      <ContributePageClient />
    </Suspense>
  );
}
