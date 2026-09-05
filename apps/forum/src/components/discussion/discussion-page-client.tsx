"use client";

import { useAuth } from "@cemvp/auth-ui";
import { useMutation } from "convex/react";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { track } from "@vercel/analytics/react";

import { useUIPreferences } from "@/stores/ui-preferences-store";

import { api, type Id } from "@/lib/convex";
import type { ContributionTag, DiscussionThread } from "@/types/discussion";
import type { Category, User } from "@/types";

import { BriefToast } from "./brief-toast";
import { getCategoryTemplate } from "./categories/registry";
import { CategoryThreadBody } from "./category-bodies";
import { ThreadComments } from "./thread-comments";
import { ThreadComposer } from "./thread-composer";
import { ThreadHeader } from "./thread-header";
import { ThreadDiscussionProvider, useThreadDiscussion } from "./thread-discussion-context";
import { ThreadSidebar, type ThreadSidebarPreview } from "./thread-sidebar";

interface DiscussionPageClientProps {
  thread: DiscussionThread;
  author: User | null;
  category: Category | null;
  related: ThreadSidebarPreview[];
  trending: ThreadSidebarPreview[];
  users: User[];
}

export function DiscussionPageClient(props: DiscussionPageClientProps) {
  return (
    <ThreadDiscussionProvider>
      <DiscussionPageInner {...props} />
    </ThreadDiscussionProvider>
  );
}

function DiscussionPageInner({
  thread,
  author,
  category,
  related,
  trending,
  users,
}: DiscussionPageClientProps) {
  const { authStatus, openAuthModal } = useAuth();
  const { mainComposerText, setMainComposerText } = useThreadDiscussion();
  const { contentViewMode, setContentViewMode } = useUIPreferences();
  const isMax = contentViewMode === "max";
  const setIsMax = (value: boolean) => setContentViewMode(value ? "max" : "min");
  const [toast, setToast] = useState<string | null>(null);

  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  // Initialize interaction state from server data
  const [upvotes, setUpvotes] = useState(thread.upvotes);
  const [isUpvoted, setIsUpvoted] = useState(thread.viewerHasUpvoted ?? false);
  const [bookmarks, setBookmarks] = useState(thread.bookmarks);
  const [isBookmarked, setIsBookmarked] = useState(thread.viewerHasBookmarked ?? false);
  const [sort, setSort] = useState<"best" | "new" | "top">("best");
  const [activeFilters, setActiveFilters] = useState<Set<ContributionTag>>(new Set());
  const [gigsMode, setGigsMode] = useState<"all" | "questions" | "responses">("all");
  const [showcaseTheme, setShowcaseTheme] = useState(false);

  // Wire mutations — only when postId is available (real posts + rich threads with a post row)
  const toggleUpvoteMutation = useMutation(api.forum.mutations.toggleUpvote);
  const toggleFavoriteMutation = useMutation(api.forum.mutations.toggleFavorite);
  const incrementViewCountMutation = useMutation(api.forum.mutations.incrementViewCount);

  // Track view count once on mount (ref prevents double-count in React StrictMode)
  const hasCountedView = useRef(false);
  useEffect(() => {
    if (thread.postId && !hasCountedView.current) {
      hasCountedView.current = true;
      incrementViewCountMutation({ postId: thread.postId as Id<"forumPosts"> }).catch(() => {});
      track("thread_viewed", { category: thread.category });
    }
  }, [thread.postId, thread.category, incrementViewCountMutation]);

  const ensureAuthenticated = useCallback(() => {
    if (authStatus !== "authenticated") {
      openAuthModal("login");
      return false;
    }
    return true;
  }, [authStatus, openAuthModal]);

  const scrollToComments = () => {
    document.getElementById("discussion-comments")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleFilter = (tag: ContributionTag) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const feedbackChips = getCategoryTemplate(thread.category)?.getFeedbackChips?.(thread) ?? null;

  const handleToggleUpvote = async () => {
    if (!ensureAuthenticated()) return;
    // Optimistic update
    const wasUpvoted = isUpvoted;
    setIsUpvoted(!wasUpvoted);
    setUpvotes((u) => u + (wasUpvoted ? -1 : 1));
    // Real mutation
    if (thread.postId) {
      try {
        await toggleUpvoteMutation({ postId: thread.postId as Id<"forumPosts"> });
      } catch {
        // Revert on failure
        setIsUpvoted(wasUpvoted);
        setUpvotes((u) => u + (wasUpvoted ? 1 : -1));
      }
    }
  };

  const handleToggleBookmark = async () => {
    if (!ensureAuthenticated()) return;
    // Optimistic update
    const wasBookmarked = isBookmarked;
    setIsBookmarked(!wasBookmarked);
    setBookmarks((b) => b + (wasBookmarked ? -1 : 1));
    // Real mutation
    if (thread.postId) {
      try {
        await toggleFavoriteMutation({ postId: thread.postId as Id<"forumPosts"> });
      } catch {
        // Revert on failure
        setIsBookmarked(wasBookmarked);
        setBookmarks((b) => b + (wasBookmarked ? 1 : -1));
      }
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="min-w-0 flex-1 space-y-6 animate-route-emerge"
        >
          <ThreadHeader
            thread={thread}
            author={author}
            category={category}
            isMax={isMax}
            onSetMax={setIsMax}
            upvotes={upvotes}
            isUpvoted={isUpvoted}
            onToggleUpvote={handleToggleUpvote}
            bookmarks={bookmarks}
            isBookmarked={isBookmarked}
            onToggleBookmark={handleToggleBookmark}
            onScrollToComments={scrollToComments}
            onToast={(msg) => {
              setToast(msg);
              window.setTimeout(() => setToast(null), 2500);
            }}
            ensureAuthenticated={ensureAuthenticated}
          />

          <motion.div
            key={isMax ? "max" : "min"}
            initial={{ opacity: 0.88 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <CategoryThreadBody
              thread={thread}
              isMax={isMax}
              author={author}
              ensureAuthenticated={ensureAuthenticated}
            />
          </motion.div>

          <div id="discussion-comments" className="scroll-mt-24 space-y-4">
            {feedbackChips ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-(--text-muted)">What I need feedback on</p>
                <div className="flex flex-wrap gap-2">
                  {feedbackChips.map((c) => (
                    <span key={c} className="rounded-full border border-(--border-default) bg-(--bg-inset) px-3 py-1 text-xs text-(--text-secondary)">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <ThreadComposer thread={thread} mainValue={mainComposerText} onMainValueChange={setMainComposerText} />

            <ThreadComments
              thread={thread}
              authorId={thread.authorId}
              usersById={usersById}
              isMax={isMax}
              activeFilters={activeFilters}
              onToggleFilter={toggleFilter}
              onClearFilters={() => setActiveFilters(new Set())}
              ensureAuthenticated={ensureAuthenticated}
              sort={sort}
              onSortChange={setSort}
              gigsCommentMode={gigsMode}
              onGigsCommentModeChange={setGigsMode}
              showcaseGroupByTheme={showcaseTheme}
              onShowcaseGroupToggle={setShowcaseTheme}
            />
          </div>
        </motion.div>

        <ThreadSidebar
          thread={thread}
          author={author}
          isMax={isMax}
          related={related}
          trending={trending}
          usersById={usersById}
          categoryName={category?.name ?? "Category"}
        />
      </div>

      {toast ? <BriefToast message={toast} onDismiss={() => setToast(null)} /> : null}
    </>
  );
}
