"use client";

import Link from "next/link";
import { useQuery } from "convex/react";

import { FeedClient } from "@/components/feed/feed-client";
import { UserAvatar } from "@/components/ui/user-avatar";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import { useSharedData } from "@/providers/shared-data-context";
import { reputationLabel } from "@/lib/discussion/reputation";
import type { Category, Comment, Post, User } from "@/types";

interface SearchPageClientProps {
  q: string;
  category?: string;
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

function SearchPageWithConvex({ q, category }: SearchPageClientProps) {
  const searchResult = useQuery(api.forum.queries.searchPostsAndUsers, q ? { q, categoryFilter: category } : "skip");
  const { categories, categoriesLoading } = useSharedData();

  if (!q) {
    return (
      <section className="animate-route-emerge space-y-4">
        <h1 className="text-2xl font-semibold text-(--text-primary)">Search</h1>
        <p className="text-sm text-(--text-secondary)">
          Use the search field in the header and press Enter to find posts and people.
        </p>
      </section>
    );
  }

  if (searchResult === undefined || categoriesLoading) {
    return null;
  }

  const matchedPosts: Post[] = searchResult.posts as Post[];
  const matchedUsers = searchResult.users as User[];
  const feedUsers = mergeUsers(matchedUsers, searchResult.commentUsers as User[]);

  return (
    <section className="animate-route-emerge space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-(--text-primary)">Search results</h1>
        <p className="mt-1 text-sm text-(--text-muted)">Showing matches for &quot;{q}&quot;</p>
      </div>

      {matchedUsers.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">People</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {matchedUsers.map((u) => (
              <li key={u.id}>
                <Link
                  href={`/users/${encodeURIComponent(u.handle)}`}
                  className="card-surface flex items-center gap-3 rounded-menu border border-(--border-subtle) p-3 transition-colors hover:border-(--border-active)"
                >
                  <UserAvatar user={u} size="md" className="shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-(--text-primary)">{u.name}</p>
                    <p className="text-xs text-(--text-muted)">
                      @{u.handle} · {reputationLabel(u.points)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Posts</h2>
        <FeedClient
          initialPosts={matchedPosts}
          allComments={searchResult.comments as Comment[]}
          users={feedUsers}
          selectedSort="top"
          categories={categories as Category[]}
          emptyState={{
            title: "No posts match your search",
            description: `Nothing matched "${q}". Try another keyword or browse Discover categories.`,
          }}
        />
      </div>
    </section>
  );
}

export function SearchPageClient({ q, category }: SearchPageClientProps) {
  if (!isConvexConfigured()) {
    return (
      <p className="text-sm text-(--text-muted)">
        Connect Convex to search posts and members.
      </p>
    );
  }

  return <SearchPageWithConvex q={q} category={category} />;
}
