/**
 * Route: /go/[linkId] — SLICE-P6-17: the BUY interstitial. Internal id
 * only (never a raw affiliate URL). Three DISTINCT states (quoted);
 * off-platform = interstitial with NO auto-redirect. A6 archetype built
 * in-slice (F-24). Interstitial COPY is founder/legal-owned (go OQ3):
 * the structure ships with placeholder copy, not invented claims.
 */
import type { Metadata } from "next";

import { GoClient } from "./go-client";

export const metadata: Metadata = {
  title: "Leaving Createconomy",
  robots: { index: false, follow: false },
};

export default async function GoPage({ params }: { params: Promise<{ linkId: string }> }) {
  const { linkId } = await params;
  return <GoClient linkId={decodeURIComponent(linkId)} />;
}
