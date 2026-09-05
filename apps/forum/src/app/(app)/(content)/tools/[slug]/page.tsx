/**
 * Route: /tools/[slug] — Tool Profile (SLICE-P4-04, CAP-110/118/119).
 *
 * CAP-118 (quoted): "Page ships noindex in Wave 2, flips to indexable only
 * when CAP-468 ships in Wave 7 — same-wave pairing required by
 * FATAL-M17-01, never separated." Archived/draft tools are additionally
 * noindex states (CAP-118 §1) — noindex is unconditional in Wave 2.
 */
import type { Metadata } from "next";

import { ToolProfileClient } from "./tool-profile-client";

export const metadata: Metadata = {
  title: "Tool profile",
  robots: { index: false, follow: false },
};

interface ToolProfilePageProps {
  params: Promise<{ slug: string }>;
}

export default async function ToolProfilePage({ params }: ToolProfilePageProps) {
  const { slug } = await params;
  return <ToolProfileClient slug={slug} />;
}
