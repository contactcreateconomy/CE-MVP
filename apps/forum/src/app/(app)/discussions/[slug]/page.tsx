/**
 * Route: /discussions/[slug]
 * Data: Convex forum.discussionRoute.getDiscussionRouteState
 * Both rich threads and regular posts render through the unified DiscussionPageClient.
 */
import { notFound } from "next/navigation";

import { DiscussionPageLoader } from "@/components/discussion/discussion-page-loader";

interface DiscussionPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function DiscussionPage({ params }: DiscussionPageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  return <DiscussionPageLoader pathSlug={slug} />;
}
