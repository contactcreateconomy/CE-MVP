/**
 * Route: /resources/[slug]/view — SLICE-P6-08 (CAP-211): the sandboxed
 * PDF viewer. Delivery invariants: clean-forged artifact only, sandboxed
 * iframe (no cookies cross-origin, no scripts), flag-off renders disabled.
 */
import type { Metadata } from "next";

import { ResourceViewClient } from "./resource-view-client";

export const metadata: Metadata = {
  title: "View resource — Createconomy",
  robots: { index: false, follow: false },
};

export default async function ResourceViewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ResourceViewClient slug={decodeURIComponent(slug)} />;
}
