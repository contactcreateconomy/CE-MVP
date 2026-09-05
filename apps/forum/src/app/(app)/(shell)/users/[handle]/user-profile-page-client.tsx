"use client";

import { useQuery } from "convex/react";
import { useMemo } from "react";

import { FeedClient } from "@/components/feed/feed-client";
import { UserAvatar } from "@/components/ui/user-avatar";
import { api } from "@/lib/convex";
import { reputationLabel } from "@/lib/discussion/reputation";
import { isConvexConfigured } from "@cemvp/convex-client";
import { useSharedData } from "@/providers/shared-data-context";
import type { Category, Post, User } from "@/types";

interface UserProfilePageClientProps {
  handle: string;
}

function mergeUsers(a: User[], b: User[]): User[] {
  const byId = new Map<string, User>();
  for (const u of [...a, ...b]) {
    if (!byId.has(u.id)) {
      byId.set(u.id, u);
    }
  }
  return [...byId.values()];
}

function UserProfilePageWithConvex({ handle }: UserProfilePageClientProps) {
  const user = useQuery(api.forum.queries.getProfileByHandle, { handle });
  const authorPosts = useQuery(
    api.forum.queries.getPostsByAuthorProfileId,
    user ? { profileId: user.id } : "skip",
  );

  const postIds = useMemo(() => {
    if (!authorPosts) {
      return [] as string[];
    }
    return (authorPosts as Post[]).map((p) => p.id);
  }, [authorPosts]);

  const previews = useQuery(
    api.forum.queries.listCommentPreviewsWithUsers,
    user && postIds.length > 0 ? { postIds, limitPerPost: 6 } : "skip",
  );

  const { categories, categoriesLoading } = useSharedData();

  const feedUsers = useMemo(() => {
    if (!user || !previews) {
      return user ? [user as User] : [];
    }
    return mergeUsers([user as User], previews.users as User[]);
  }, [user, previews]);

  if (user === undefined || authorPosts === undefined || categoriesLoading) {
    return null;
  }

  if (postIds.length > 0 && previews === undefined) {
    return null;
  }

  if (user === null) {
    return (
      <section className="animate-route-emerge space-y-2">
        <h1 className="text-xl font-semibold text-(--text-primary)">User not found</h1>
        <p className="text-sm text-(--text-muted)">No profile matches @{handle}.</p>
      </section>
    );
  }

  const comments = (previews?.comments ?? []) as import("@/types").Comment[];

  return (
    <section className="animate-route-emerge space-y-6">
      <div className="card-surface flex flex-col gap-4 rounded-xl border border-(--border-subtle) p-5 sm:flex-row sm:items-center">
        <UserAvatar user={user} size="lg" className="shrink-0" />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-(--text-primary)">{user.name}</h1>
          <p className="text-sm text-(--text-muted)">
            @{user.handle} · {reputationLabel(user.points)}
          </p>
          {user.bio ? <p className="mt-2 text-sm text-(--text-secondary)">{user.bio}</p> : null}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Posts</h2>
        <FeedClient
          initialPosts={authorPosts as Post[]}
          allComments={comments}
          users={feedUsers}
          selectedSort="new"
          categories={categories as Category[]}
          emptyState={{
            title: "No posts yet",
            description: "This member hasn’t published anything yet.",
          }}
        />
      </div>
    </section>
  );
}

export function UserProfilePageClient({ handle }: UserProfilePageClientProps) {
  if (!isConvexConfigured()) {
    return <p className="text-sm text-(--text-muted)">Connect Convex to view profiles.</p>;
  }

  return <UserProfilePageWithConvex handle={handle} />;
}
