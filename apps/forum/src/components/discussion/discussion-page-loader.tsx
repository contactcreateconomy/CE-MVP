"use client";

import { useQuery } from "convex/react";

import { DiscussionPageClient } from "@/components/discussion/discussion-page-client";
import { PostDetailClient } from "@/components/discussion/post-detail-client";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import type { DiscussionThread } from "@/types/discussion";
import type { User } from "@/types";

interface DiscussionPageLoaderProps {
  pathSlug: string;
}

function DiscussionPageLoaderWithConvex({ pathSlug }: DiscussionPageLoaderProps) {
  // SLICE-P4-13 strangler (00-TRANSITION): canonical postSeoMeta slug
  // resolves FIRST; only a null canonical falls through to the legacy
  // forum thread. Never rename either side's slug space.
  const canonical = useQuery(api.posts.detail.getDetail, { slug: pathSlug });
  const state = useQuery(
    api.forum.discussionRoute.getDiscussionRouteState,
    canonical === null ? { pathSlug } : "skip",
  );
  const sidebarData = useQuery(
    api.forum.discussionRoute.getDiscussionSidebarData,
    state?.kind === "rich" ? { threadSlug: pathSlug } : "skip",
  );

  if (canonical === undefined || state === undefined) {
    return null;
  }

  if (canonical) {
    return <PostDetailClient detail={canonical as any} /> /* eslint-disable-line @typescript-eslint/no-explicit-any -- CAP-090's shape is client-edge untyped until codegen push */;
  }

  if (state.kind === "not_found") {
    return (
      <section className="animate-route-emerge space-y-2">
        <h1 className="text-xl font-semibold text-(--text-primary)">Discussion not found</h1>
        <p className="text-sm text-(--text-muted)">This slug does not match a post or thread in the database.</p>
      </section>
    );
  }

  // Both rich threads and regular posts now come through as "rich" kind
  return (
    <DiscussionPageClient
      thread={state.thread as unknown as DiscussionThread}
      author={state.author}
      category={state.category as import("@/types").Category | null}
      related={sidebarData?.related ?? state.related}
      trending={sidebarData?.trending ?? state.trending}
      users={[
        ...(state.users as User[]),
        ...((sidebarData?.sidebarUsers ?? []) as User[]),
      ]}
    />
  );
}

export function DiscussionPageLoader({ pathSlug }: DiscussionPageLoaderProps) {
  if (!isConvexConfigured()) {
    return (
      <p className="text-sm text-(--text-muted)">
        Connect Convex (set <code className="font-mono">NEXT_PUBLIC_CONVEX_URL</code>) to load discussions.
      </p>
    );
  }

  return <DiscussionPageLoaderWithConvex pathSlug={pathSlug} />;
}
