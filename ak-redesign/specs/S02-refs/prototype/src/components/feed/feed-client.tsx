"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { PostCard } from "@/components/feed/post-card";
import { EmptyState } from "@/components/states/empty-state";
import { FeedUndoToast } from "@/components/feed/feed-undo-toast";
import { ReportPostDialog } from "@/components/feed/report-post-dialog";
import type { CategoryKey, Comment, Post, User } from "@/types";

interface FeedClientProps {
  initialPosts: Post[];
  allComments: Comment[];
  users: User[];
  selectedSort: "top" | "hot" | "new" | "fav";
  selectedCategory?: string;
}

function viralityScore(post: Post) {
  return post.upvotes * 1.2 + post.commentsCount * 2 + post.views * 0.06;
}

const starterCategoryOrder: CategoryKey[] = [
  "news",
  "review",
  "compare",
  "launch-pad",
  "debate",
  "help",
  "list",
  "showcase",
  "gigs",
];

interface UndoState {
  postId: string;
  timerId: number;
  message: string;
}

export function FeedClient({ initialPosts, allComments, users, selectedSort, selectedCategory }: FeedClientProps) {
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({});
  const [upvoteDeltaByPostId, setUpvoteDeltaByPostId] = useState<Record<string, number>>({});
  const [isUpvotedByPostId, setIsUpvotedByPostId] = useState<Record<string, boolean>>({});
  const [hiddenPostIds, setHiddenPostIds] = useState<Set<string>>(new Set());
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [reportPostId, setReportPostId] = useState<string | null>(null);

  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);

  const commentsByPostId = useMemo(() => {
    const map = new Map<string, Comment[]>();
    for (const comment of allComments) {
      const existing = map.get(comment.postId) ?? [];
      existing.push(comment);
      map.set(comment.postId, existing);
    }
    return map;
  }, [allComments]);

  const effectivePosts = useMemo(
    () =>
      initialPosts
        .map((post) => ({
          ...post,
          isFavorited: favoriteOverrides[post.id] ?? post.isFavorited,
          upvotes: post.upvotes + (upvoteDeltaByPostId[post.id] ?? 0),
        }))
        .filter((post) => !hiddenPostIds.has(post.id)),
    [favoriteOverrides, hiddenPostIds, initialPosts, upvoteDeltaByPostId],
  );

  const sortedPosts = useMemo(() => {
    const sorted = [...effectivePosts].sort((a, b) => {
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

    const filtered = selectedSort === "fav" ? sorted.filter((post) => post.isFavorited) : sorted;

    if (selectedCategory || selectedSort !== "top") {
      return filtered;
    }

    const starterPostsByCategory = new Map<CategoryKey, Post>();

    for (const category of starterCategoryOrder) {
      const starterPost = filtered.find((post) => post.category === category && post.threadExperimentId);
      if (starterPost) {
        starterPostsByCategory.set(category, starterPost);
      }
    }

    const pinnedStarters = starterCategoryOrder
      .map((category) => starterPostsByCategory.get(category))
      .filter((post): post is Post => Boolean(post));

    const pinnedIds = new Set(pinnedStarters.map((post) => post.id));
    const remaining = filtered.filter((post) => !pinnedIds.has(post.id));

    return [...pinnedStarters, ...remaining];
  }, [effectivePosts, selectedCategory, selectedSort]);

  useEffect(() => {
    return () => {
      if (undoState) {
        window.clearTimeout(undoState.timerId);
      }
    };
  }, [undoState]);

  const hidePost = useCallback((postId: string) => {
    setHiddenPostIds((current) => new Set(current).add(postId));

    setUndoState((current) => {
      if (current) {
        window.clearTimeout(current.timerId);
      }

      const timerId = window.setTimeout(() => {
        setUndoState(null);
      }, 5500);

      return { postId, timerId, message: "Post hidden" };
    });
  }, []);

  const undoHide = useCallback(() => {
    setUndoState((current) => {
      if (!current) {
        return current;
      }
      window.clearTimeout(current.timerId);
      setHiddenPostIds((hidden) => {
        const next = new Set(hidden);
        next.delete(current.postId);
        return next;
      });
      return null;
    });
  }, []);

  const dismissUndo = useCallback(() => {
    setUndoState((current) => {
      if (current) {
        window.clearTimeout(current.timerId);
      }
      return null;
    });
  }, []);

  const toggleFavorite = useCallback((post: Post) => {
    setFavoriteOverrides((current) => {
      const nextValue = !(current[post.id] ?? post.isFavorited);
      return {
        ...current,
        [post.id]: nextValue,
      };
    });
  }, []);

  const toggleUpvote = useCallback((post: Post) => {
    setIsUpvotedByPostId((current) => {
      const currentlyUpvoted = current[post.id] ?? false;
      const nextUpvoted = !currentlyUpvoted;

      setUpvoteDeltaByPostId((deltaCurrent) => ({
        ...deltaCurrent,
        [post.id]: nextUpvoted ? 1 : 0,
      }));

      return {
        ...current,
        [post.id]: nextUpvoted,
      };
    });
  }, []);

  const reportPost = useCallback(
    (reason: string) => {
      if (!reportPostId) {
        return;
      }
      hidePost(reportPostId);
      setReportPostId(null);
      setUndoState((current) => (current ? { ...current, message: `Post reported (${reason}) and hidden` } : current));
    },
    [hidePost, reportPostId],
  );
  const handleShare = useCallback(async (post: Post) => {
    const targetPath = post.threadExperimentId ? `/discussion/${post.threadExperimentId}` : `/discussions/${post.slug}`;
    const shareUrl = typeof window === "undefined" ? "" : `${window.location.origin}${targetPath}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text: post.summary, url: shareUrl });
        return;
      } catch {
        // fall through to clipboard fallback
      }
    }

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {
        // ignore clipboard errors to avoid breaking the interaction flow
      }
    }
  }, []);

  if (sortedPosts.length === 0) {
    return (
      <EmptyState
        title={selectedSort === "fav" ? "No favorite posts yet" : "No posts in this category yet"}
        description={
          selectedSort === "fav"
            ? "Bookmark posts as favorites and they will appear here."
            : "Try another Discover filter or switch back to Home for all discussions."
        }
        ctaLabel="Create Post"
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        {sortedPosts.map((post) => {
          const comments = commentsByPostId.get(post.id) ?? [];
          const commenters = Array.from(
            new Map(
              comments
                .map((comment) => usersById.get(comment.authorId))
                .filter((user): user is User => Boolean(user))
                .map((user) => [user.id, user]),
            ).values(),
          );

          return (
            <PostCard
              key={post.id}
              post={post}
              author={usersById.get(post.authorId) ?? null}
              comments={comments}
              commenters={commenters}
              isFavorited={post.isFavorited}
              isUpvoted={isUpvotedByPostId[post.id] ?? false}
              onToggleFavorite={() => toggleFavorite(post)}
              onToggleUpvote={() => toggleUpvote(post)}
              onHide={() => hidePost(post.id)}
              onReport={() => setReportPostId(post.id)}
              onShare={() => void handleShare(post)}
            />
          );
        })}
      </div>

      <ReportPostDialog
        open={Boolean(reportPostId)}
        onOpenChange={(open) => {
          if (!open) {
            setReportPostId(null);
          }
        }}
        onSubmit={reportPost}
      />

      {undoState ? (
        <FeedUndoToast message={undoState.message} onUndo={undoHide} onDismiss={dismissUndo} />
      ) : null}
    </>
  );
}
