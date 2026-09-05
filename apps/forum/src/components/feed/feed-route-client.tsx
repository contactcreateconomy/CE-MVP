"use client";

import { useQuery } from "convex/react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { FeedClient } from "@/components/feed/feed-client";
import { PostCardSkeleton } from "@/components/feed/post-card";
import { TrendSorter } from "@/components/feed/trend-sorter";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import { useSharedData } from "@/providers/shared-data-context";
import { useUIPreferences } from "@/stores/ui-preferences-store";
import type { Comment, Post, User } from "@/types";
import type { Category } from "@/types";

function parseFeedSearchParams(
  searchParams: URLSearchParams,
  fallbackSort: "top" | "hot" | "new" | "fav",
): {
  selectedCategory?: string;
  selectedSort: "top" | "hot" | "new" | "fav";
} {
  const category = searchParams.get("category");
  const rawSort = searchParams.get("sort");
  const selectedSort: "top" | "hot" | "new" | "fav" =
    rawSort === "hot" || rawSort === "new" || rawSort === "top" || rawSort === "fav" ? rawSort : fallbackSort;
  return {
    selectedCategory: category && category.length > 0 ? category : undefined,
    selectedSort,
  };
}

function mergeUsers(prev: User[], next: User[]): User[] {
  const byId = new Map(prev.map((u) => [u.id, u]));
  for (const u of next) {
    if (!byId.has(u.id)) {
      byId.set(u.id, u);
    }
  }
  return [...byId.values()];
}

function mergeComments(prev: Comment[], next: Comment[]): Comment[] {
  const ids = new Set(prev.map((c) => c.id));
  const out = [...prev];
  for (const c of next) {
    if (!ids.has(c.id)) {
      ids.add(c.id);
      out.push(c);
    }
  }
  return out;
}

function FeedRouteWithConvex({
  selectedCategory,
  selectedSort,
}: {
  selectedCategory?: string;
  selectedSort: "top" | "hot" | "new" | "fav";
}) {
  const sortArg =
    selectedSort === "top" ? "top" : selectedSort === "hot" ? "hot" : selectedSort === "fav" ? "fav" : "new";
  const needsPagination = sortArg === "new" || sortArg === "fav";

  const [cursor, setCursor] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const appendNextRef = useRef(false);
  /** Replaces a ref so we do not read `.current` during render (React Compiler / eslint rules). */
  const [feedPageReady, setFeedPageReady] = useState(false);

  useEffect(() => {
    setCursor(null);
    appendNextRef.current = false;
    setFeedPageReady(false);
  }, [selectedCategory, selectedSort]);

  const page = useQuery(api.forum.queries.listFeedPage, {
    sort: sortArg,
    category: selectedCategory,
    cursor: needsPagination ? cursor : null,
    limit: 24,
  });

  useEffect(() => {
    if (page === undefined || page === null) {
      return;
    }
    setFeedPageReady(true);
    if (appendNextRef.current) {
      appendNextRef.current = false;
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const next = [...prev];
        for (const p of page.posts as Post[]) {
          if (!seen.has(p.id)) {
            seen.add(p.id);
            next.push(p);
          }
        }
        return next;
      });
      setComments((prev) => mergeComments(prev, page.comments as Comment[]));
      setUsers((prev) => mergeUsers(prev, page.users as User[]));
      return;
    }
    setPosts(page.posts as Post[]);
    setComments(page.comments as Comment[]);
    setUsers(page.users as User[]);
  }, [page]);

  const { categories, categoriesLoading } = useSharedData();

  const loadMore = useCallback(() => {
    if (!page?.continueCursor || page.isDone) {
      return;
    }
    appendNextRef.current = true;
    setCursor(page.continueCursor);
  }, [page]);

  const canLoadMore = Boolean(needsPagination && page && !page.isDone && page.continueCursor);

  const initialPosts = useMemo(() => posts, [posts]);

  const isFeedLoading = page === undefined && !feedPageReady;

  return (
    <section className="space-y-4">
      <header className="card-surface p-2">
        <Suspense fallback={null}>
          <TrendSorter />
        </Suspense>
      </header>

      {isFeedLoading ? (
        <div className="space-y-4 pt-2">
          {[1, 2, 3].map((i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <FeedClient
            initialPosts={initialPosts}
            allComments={comments}
            users={users}
            selectedSort={selectedSort}
            categories={categories as Category[]}
          />

          {canLoadMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                className="rounded-full border border-(--border-subtle) px-4 py-2 text-sm font-medium text-(--text-secondary) transition-colors hover:border-(--border-active) hover:text-(--text-primary)"
                onClick={() => loadMore()}
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function FeedRouteWithSearchParams() {
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  const { feedSort, setFeedSort } = useUIPreferences();
  const { selectedCategory, selectedSort } = useMemo(
    () => parseFeedSearchParams(new URLSearchParams(queryKey), feedSort),
    [queryKey, feedSort],
  );

  // Persist the selected sort back to the store
  useEffect(() => {
    if (selectedSort !== feedSort) {
      setFeedSort(selectedSort);
    }
  }, [selectedSort, feedSort, setFeedSort]);

  return <FeedRouteWithConvex selectedCategory={selectedCategory} selectedSort={selectedSort} />;
}

export function FeedRouteClient() {
  if (!isConvexConfigured()) {
    return (
      <p className="text-sm text-(--text-muted)">
        Set <code className="font-mono">NEXT_PUBLIC_CONVEX_URL</code> and run the forum seed to load the feed.
      </p>
    );
  }

  return <FeedRouteWithSearchParams />;
}
