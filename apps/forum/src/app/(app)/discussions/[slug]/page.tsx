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
 * FATAL-M17-01, never separated." — generateMetadata sets noindex
 * unconditionally this wave; nothing here decides indexability.
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
  // Wave-2 posture (FATAL-M17-01): the indexable flip ships with P7G-01 +
  // P7T-11 as one pairing — never here, never separable.
  return { robots: { index: false, follow: false } };
}

export default async function DiscussionPage({ params }: DiscussionPageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  return <DiscussionPageLoader pathSlug={slug} />;
}
