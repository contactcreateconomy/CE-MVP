/**
 * Route: /discussions/[slug]
 * SLICE-P4-13 (strangler per 00-TRANSITION): the slug resolves CANONICAL
 * first (postSeoMeta → posts.getDetail) and falls back to the legacy forum
 * thread (forum.discussionRoute). Both rich threads and regular posts render
 * through the unified client layer — canonical typed posts through
 * PostDetailClient, legacy threads through DiscussionPageClient.
 *
 * CAP-107 (quoted): "Page ships noindex in Wave 2, flips to indexable only
 * when CAP-468 ships in Wave 7 — same-wave pairing required by
 * FATAL-M17-01, never separated." — SLICE-P7G-01: the evaluator
 * (seo/assertIndexable) now governs the sitemap + JSON-LD (the engine);
 * this SSR shell keeps the fail-closed noindex until the per-post robots
 * wiring rides P7O-07's /admin/seo view pairing (flagged, not silently
 * flipped — false → noindex,nofollow per CAP-467 either way).
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DiscussionPageLoader } from "@/components/discussion/discussion-page-loader";

interface DiscussionPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata(_props: DiscussionPageProps): Promise<Metadata> {
  // Fail-closed noindex (CAP-467): the evaluator's true-verdict flip rides
  // the sitemap/JSON-LD engine this batch ships; the shell never guesses.
  return { robots: { index: false, follow: false } };
}

export default async function DiscussionPage({ params }: DiscussionPageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  return <DiscussionPageLoader pathSlug={slug} />;
}
