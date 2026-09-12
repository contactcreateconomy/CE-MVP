/**
 * Route: /sell — SLICE-P6-16 (CONTRACT-6-sell): the Rocketeer Dashboard —
 * store lifecycle (CAP-233/270), product submit + edit requests
 * (CAP-234/239), analytics (CAP-257/450), sales evidence incl. the CAP-525
 * interim two-field self-report. A13 stays fenced: distinct copy keys, no
 * verified-vs-unverified badge token.
 */
import type { Metadata } from "next";
import { Suspense } from "react";

import { SellDashboardClient } from "./sell-dashboard-client";

export const metadata: Metadata = {
  title: "Rocketeer Dashboard — Createconomy",
  robots: { index: false, follow: false },
};

export default function SellPage() {
  return (
    <Suspense fallback={null}>
      <SellDashboardClient />
    </Suspense>
  );
}
