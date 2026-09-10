"use client";

import { useQuery } from "convex/react";

import { PostDetailClient } from "@/components/discussion/post-detail-client";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";

interface DiscussionPageLoaderProps {
  pathSlug: string;
}

function DiscussionPageLoaderWithConvex({ pathSlug }: DiscussionPageLoaderProps) {
  // P7-CLEANUP: canonical-only (CAP-090 postSeoMeta → posts.getDetail). The
  // legacy forum-thread strangler fallback retired with the forum* tables —
  // demo-era legacy slugs now resolve as honest not-found.
  const canonical = useQuery(api.posts.detail.getDetail, { slug: pathSlug });

  if (canonical === undefined) {
    return null;
  }

  if (canonical === null) {
    return (
      <section className="animate-route-emerge space-y-2">
        <h1 className="text-xl font-semibold text-(--text-primary)">Discussion not found</h1>
        <p className="text-sm text-(--text-muted)">This slug does not match any published post.</p>
      </section>
    );
  }

  return <PostDetailClient detail={canonical as any} /> /* eslint-disable-line @typescript-eslint/no-explicit-any -- CAP-090's shape is client-edge untyped */;
}

export function DiscussionPageLoader({ pathSlug }: DiscussionPageLoaderProps) {
  if (!isConvexConfigured()) {
    return (
      <section className="animate-route-emerge space-y-2">
        <h1 className="text-xl font-semibold text-(--text-primary)">Discussion</h1>
        <p className="text-sm text-(--text-muted)">Connect Convex to load this discussion.</p>
      </section>
    );
  }
  return <DiscussionPageLoaderWithConvex pathSlug={pathSlug} />;
}
