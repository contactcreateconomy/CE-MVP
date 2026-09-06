/**
 * Route: /sell/apply — SLICE-P6-13 (CAP-230/231/262): the store
 * application: eligibility eval, four attestations, data-honesty.
 */
import type { Metadata } from "next";
import { Suspense } from "react";

import { SellApplyClient } from "./sell-apply-client";

export const metadata: Metadata = {
  title: "Apply to sell — Createconomy",
  robots: { index: false, follow: false },
};

export default function SellApplyPage() {
  return (
    <Suspense fallback={null}>
      <SellApplyClient />
    </Suspense>
  );
}
