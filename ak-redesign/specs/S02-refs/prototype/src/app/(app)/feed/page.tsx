/**
 * Route: /feed
 * Auth requirement: Optional (renders for guest and member states)
 * Data dependencies: posts, users, categories, leaderboard, campaigns, notifications
 * Backend endpoints needed:
 * - GET /api/feed?sort=hot|new|top&category=<slug>
 * - GET /api/users/:id
 * - GET /api/categories
 * - GET /api/leaderboard?window=weekly
 * - GET /api/campaigns/active
 * - GET /api/notifications/unread-count
 */
import { Suspense } from "react";

import { FeedClient } from "@/components/feed/feed-client";
import { TrendSorter } from "@/components/feed/trend-sorter";
import { getFeedData } from "@/lib/adapters/content";
import type { Post } from "@/types";

interface FeedPageProps {
  searchParams?: Promise<{
    category?: string;
    sort?: string;
  }>;
}

function viralityScore(post: Post) {
  return post.upvotes * 1.2 + post.commentsCount * 2 + post.views * 0.06;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const { posts, comments, users } = getFeedData();
  const resolvedSearchParams = await searchParams;
  const selectedCategory = resolvedSearchParams?.category;
  const resolvedSort = resolvedSearchParams?.sort;
  const selectedSort: "top" | "hot" | "new" | "fav" =
    resolvedSort === "hot" || resolvedSort === "new" || resolvedSort === "fav" ? resolvedSort : "top";

  const categoryPosts = selectedCategory
    ? posts.filter((post) => post.category === selectedCategory)
    : posts;

  const initialPosts = [...categoryPosts].sort((a, b) => {
    if (selectedSort === "new") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    if (selectedSort === "hot") {
      const hotScoreA = a.upvotes * 2 + a.commentsCount * 3;
      const hotScoreB = b.upvotes * 2 + b.commentsCount * 3;
      return hotScoreB - hotScoreA;
    }

    if (selectedSort === "fav") {
      if (a.isFavorited === b.isFavorited) {
        return viralityScore(b) - viralityScore(a);
      }
      return Number(b.isFavorited) - Number(a.isFavorited);
    }

    return viralityScore(b) - viralityScore(a);
  });


  return (
    <section className="space-y-4">
      <header className="card-surface animate-soft-float p-2">
        <Suspense fallback={null}>
          <TrendSorter />
        </Suspense>
      </header>

      <FeedClient
        initialPosts={initialPosts}
        allComments={comments}
        users={users}
        selectedSort={selectedSort}
        selectedCategory={selectedCategory}
      />
    </section>
  );
}
