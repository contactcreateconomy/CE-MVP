"use client";

import { useMutation } from "convex/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { track } from "@vercel/analytics/react";

import { PostCard } from "@/components/feed/post-card";
import { EmptyState } from "@/components/states/empty-state";
import { FeedUndoToast } from "@/components/feed/feed-undo-toast";
import { ReportPostDialog } from "@/components/feed/report-post-dialog";
import { api, type Id } from "@/lib/convex";
import { getDiscussionHrefForPost } from "@/lib/discussion/feed-post-discussion-slug";
import type { Category, Comment, Post, User } from "@/types";
import { useAuth } from "@cemvp/auth-ui";

interface FeedClientProps {
  initialPosts: Post[];
  allComments: Comment[];
  users: User[];
  selectedSort: "top" | "hot" | "new" | "fav";
  categories: Category[];
  /** When set and there are no posts to show, overrides default empty copy (e.g. search / saved). */
  emptyState?: { title: string; description: string; ctaLabel?: string };
}

interface UndoState {
  postId: string;
  timerId: number;
  message: string;
}

export function FeedClient({
  initialPosts,
  allComments,
  users,
  selectedSort,
  categories,
  emptyState: emptyStateOverride,
}: FeedClientProps) {
  const { authStatus, openAuthModal } = useAuth();
  const [hiddenPostIds, setHiddenPostIds] = useState<Set<string>>(new Set());
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [reportPostId, setReportPostId] = useState<string | null>(null);

  const toggleFavoriteMutation = useMutation(api.forum.mutations.toggleFavorite);
  const toggleUpvoteMutation = useMutation(api.forum.mutations.toggleUpvote);
  const reportMutation = useMutation(api.forum.mutations.createReport);

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

  const visiblePosts = useMemo(
    () => initialPosts.filter((post) => !hiddenPostIds.has(post.id)),
    [hiddenPostIds, initialPosts],
  );

  const sortedPosts = useMemo(
    () => (selectedSort === "fav" ? visiblePosts.filter((post) => post.isFavorited) : visiblePosts),
    [visiblePosts, selectedSort],
  );

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

  const toggleFavorite = useCallback(
    async (post: Post) => {
      if (authStatus !== "authenticated") {
        openAuthModal();
        return;
      }
      try {
        await toggleFavoriteMutation({ postId: post.id as Id<"forumPosts"> });
      } catch {
        /* ignore */
      }
    },
    [authStatus, openAuthModal, toggleFavoriteMutation],
  );

  const toggleUpvote = useCallback(
    async (post: Post) => {
      if (authStatus !== "authenticated") {
        openAuthModal();
        return;
      }
      try {
        await toggleUpvoteMutation({ postId: post.id as Id<"forumPosts"> });
      } catch {
        /* ignore */
      }
    },
    [authStatus, openAuthModal, toggleUpvoteMutation],
  );

  const reportPost = useCallback(
    async (reason: string) => {
      if (!reportPostId) {
        return;
      }
      try {
        await reportMutation({
          contentType: "post",
          contentId: reportPostId,
          reason: reason as "spam" | "harassment" | "misinformation" | "off_topic" | "other",
        });
        hidePost(reportPostId);
        setReportPostId(null);
        setUndoState((current) => (current ? { ...current, message: "Post reported and hidden" } : current));
      } catch (err) {
        setReportPostId(null);
        setUndoState((current) =>
          current
            ? { ...current, message: err instanceof Error ? err.message : "Could not report post" }
            : current,
        );
      }
    },
    [hidePost, reportPostId, reportMutation],
  );
  const handleShare = useCallback(async (post: Post) => {
    const shareUrl =
      typeof window === "undefined" ? "" : `${window.location.origin}${getDiscussionHrefForPost(post)}`;

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
    if (emptyStateOverride) {
      return (
        <EmptyState
          title={emptyStateOverride.title}
          description={emptyStateOverride.description}
          ctaLabel={emptyStateOverride.ctaLabel}
        />
      );
    }
    return (
      <EmptyState
        title={selectedSort === "fav" ? "No favorite posts yet" : "No posts in this category yet"}
        description={
          selectedSort === "fav"
            ? "Bookmark posts as favorites and they will appear here."
            : "Be the first to post, or try another Discover filter."
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
              categories={categories}
              isFavorited={post.isFavorited}
              isUpvoted={post.viewerHasUpvote ?? false}
              onToggleFavorite={() => void toggleFavorite(post)}
              onToggleUpvote={() => void toggleUpvote(post)}
              onHide={() => hidePost(post.id)}
              onReport={() => setReportPostId(post.id)}
              onShare={() => void handleShare(post)}
              onPostClick={() => track("post_clicked", { category: post.category })}
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
