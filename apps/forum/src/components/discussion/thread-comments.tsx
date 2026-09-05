"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ArrowBigUp, ChevronDown, ChevronUp, MessageSquareReply, MoreHorizontal } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { UserAvatar } from "@/components/ui/user-avatar";
import { formatRelativeDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ContributionTag, DiscussionThread, ThreadComment } from "@/types/discussion";
import type { User } from "@/types";

import { ThreadComposer } from "./thread-composer";
import { useThreadDiscussion } from "./thread-discussion-context";

const FILTER_OPTIONS: ContributionTag[] = ["evidence", "counterpoint", "question", "resource", "solution"];

const TAG_LABEL: Record<ContributionTag, string> = {
  evidence: "Evidence",
  counterpoint: "Critical",
  question: "Question",
  resource: "Resource",
  solution: "Answer",
};

const TAG_COLOR: Record<ContributionTag, string> = {
  evidence: "bg-teal-500/15 text-teal-400",
  counterpoint: "bg-amber-500/15 text-amber-400",
  question: "bg-blue-500/15 text-blue-400",
  resource: "bg-purple-500/15 text-purple-400",
  solution: "bg-green-500/15 text-green-400",
};

function buildChildrenMap(comments: ThreadComment[]) {
  const map = new Map<string | null, ThreadComment[]>();
  for (const c of comments) {
    const p = c.parentId;
    const list = map.get(p) ?? [];
    list.push(c);
    map.set(p, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  return map;
}

function subtreeHasMatch(
  c: ThreadComment,
  childrenMap: Map<string | null, ThreadComment[]>,
  active: Set<ContributionTag>,
): boolean {
  if (active.size === 0) return true;
  const self = c.tags?.some((t) => active.has(t));
  if (self) return true;
  const kids = childrenMap.get(c.id) ?? [];
  return kids.some((ch) => subtreeHasMatch(ch, childrenMap, active));
}

interface ThreadCommentsProps {
  thread: DiscussionThread;
  authorId: string;
  usersById: Map<string, User>;
  isMax: boolean;
  activeFilters: Set<ContributionTag>;
  onToggleFilter: (tag: ContributionTag) => void;
  onClearFilters: () => void;
  ensureAuthenticated: () => boolean;
  sort: "best" | "new" | "top";
  onSortChange: (s: "best" | "new" | "top") => void;
  gigsCommentMode?: "all" | "questions" | "responses";
  onGigsCommentModeChange?: (m: "all" | "questions" | "responses") => void;
  showcaseGroupByTheme?: boolean;
  onShowcaseGroupToggle?: (v: boolean) => void;
}

export function ThreadComments({
  thread,
  authorId,
  usersById,
  isMax,
  activeFilters,
  onToggleFilter,
  onClearFilters,
  ensureAuthenticated,
  sort,
  onSortChange,
  gigsCommentMode = "all",
  onGigsCommentModeChange,
  showcaseGroupByTheme = false,
  onShowcaseGroupToggle,
}: ThreadCommentsProps) {
  const [votes, setVotes] = useState<Record<string, { up?: boolean }>>({});
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const commentList = thread.comments ?? [];

  const filterChipOptions = useMemo(() => {
    if (thread.category === "qa") return FILTER_OPTIONS;
    return FILTER_OPTIONS.filter((t) => t !== "solution");
  }, [thread.category]);

  const sortedComments = useMemo(() => {
    const list = [...commentList];
    if (sort === "new") return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sort === "top") return list.sort((a, b) => b.upvotes - a.upvotes);
    return list.sort((a, b) => b.upvotes + b.downvotes - (a.upvotes + a.downvotes));
  }, [commentList, sort]);

  const childrenMap = useMemo(() => buildChildrenMap(sortedComments), [sortedComments]);

  const filteredForGigs = useMemo(() => {
    if (thread.category !== "gigs" || !isMax || gigsCommentMode === "all") return sortedComments;
    return sortedComments.filter((c) =>
      gigsCommentMode === "questions" ? c.gigsPartition === "question" : c.gigsPartition === "application",
    );
  }, [sortedComments, thread.category, isMax, gigsCommentMode]);

  const childrenMapGigs = useMemo(() => buildChildrenMap(filteredForGigs), [filteredForGigs]);
  const mapToUse = thread.category === "gigs" && isMax && gigsCommentMode !== "all" ? childrenMapGigs : childrenMap;

  const solutionId =
    thread.category === "qa" &&
    thread.categoryBody &&
    "solved" in thread.categoryBody &&
    (thread.categoryBody as Record<string, unknown>).solved
      ? (thread.categoryBody as Record<string, unknown>).solutionCommentId as string | undefined
      : undefined;

  const roots = useMemo(() => {
    const listRoots = mapToUse.get(null) ?? [];
    return listRoots.filter((c) => subtreeHasMatch(c, mapToUse, activeFilters));
  }, [mapToUse, activeFilters]);

  const toggleVote = (id: string) => {
    if (!ensureAuthenticated()) return;
    setVotes((prev) => {
      const cur = prev[id] ?? {};
      return { ...prev, [id]: { up: !cur.up } };
    });
  };

  const shouldVirtualize = roots.length > 100;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: roots.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 120,
    overscan: 5,
    enabled: shouldVirtualize,
  });

  const renderShowcaseGrouped = () => {
    const themes = ["ux", "visual", "technical", "other"] as const;
    return (
      <div className="space-y-6">
        {themes.map((th) => {
          const inTheme = sortedComments.filter((c) => c.showcaseThemes?.includes(th));
          if (inTheme.length === 0) return null;
          return (
            <div key={th}>
              <p className="mb-2 text-xs font-semibold uppercase text-(--text-muted)">{th}</p>
              <div className="space-y-4 border-l-2 border-(--border-default) pl-4">
                {inTheme.map((c) => (
                  <CommentRow
                    key={c.id}
                    comment={c}
                    authorId={authorId}
                    usersById={usersById}
                    votes={votes}
                    onVote={toggleVote}
                    replyTo={replyTo}
                    setReplyTo={setReplyTo}
                    thread={thread}
                    ensureAuthenticated={ensureAuthenticated}
                    solutionId={solutionId}
                    isMax={isMax}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section className="space-y-5" aria-label="Comments">
      {solutionId ? (
        <div className="rounded-xl border border-(--feedback-success)/40 bg-(--feedback-success)/10 px-4 py-3 text-sm text-(--feedback-success)">
          This thread has an accepted solution.{" "}
          <a href={`#comment-${solutionId}`} className="font-semibold underline">
            Jump to solution →
          </a>
        </div>
      ) : null}

      {/* Header row: count + sort */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-(--text-primary)">
          {commentList.length} {commentList.length === 1 ? "comment" : "comments"}
        </p>
        <div className="flex items-center gap-1 text-xs">
          {(["best", "new", "top"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSortChange(s)}
              className={cn(
                "rounded-full px-3 py-1 font-medium capitalize transition-colors",
                sort === s
                  ? "bg-(--bg-overlay) text-(--text-primary)"
                  : "text-(--text-muted) hover:text-(--text-secondary)",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Max-mode extras: gigs, showcase, filter chips */}
      {thread.category === "gigs" && isMax && onGigsCommentModeChange ? (
        <div className="flex flex-wrap gap-2">
          {(["all", "questions", "responses"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onGigsCommentModeChange(m)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium capitalize",
                gigsCommentMode === m
                  ? "border-(--brand-primary) bg-(--brand-primary)/10 text-(--brand-primary)"
                  : "border-(--border-default) text-(--text-secondary)",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      ) : null}

      {thread.category === "showcase" && isMax && onShowcaseGroupToggle ? (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-(--text-secondary)">
          <input
            type="checkbox"
            checked={showcaseGroupByTheme}
            onChange={(e) => onShowcaseGroupToggle(e.target.checked)}
            className="rounded"
          />
          Group feedback by theme
        </label>
      ) : null}

      {isMax && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-(--text-muted)">Filter</span>
          {filterChipOptions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onToggleFilter(tag)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-label-sm font-medium capitalize transition-colors",
                activeFilters.has(tag)
                  ? "border-(--brand-primary) bg-(--brand-primary)/10 text-(--brand-primary)"
                  : "border-(--border-default) text-(--text-secondary) hover:border-(--border-active)",
              )}
            >
              {tag}
            </button>
          ))}
          {activeFilters.size > 0 ? (
            <button
              type="button"
              className="text-label-sm text-(--brand-primary) underline"
              onClick={onClearFilters}
            >
              Clear ({activeFilters.size})
            </button>
          ) : null}
        </div>
      )}

      {/* Comment list */}
      {commentList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-(--border-default) bg-(--bg-surface) px-6 py-12 text-center">
          <p className="text-sm font-medium text-(--text-secondary)">Be the first to reply</p>
          <p className="mt-1 text-xs text-(--text-muted)">Share your thoughts and start the conversation.</p>
        </div>
      ) : thread.category === "showcase" && isMax && showcaseGroupByTheme ? (
        renderShowcaseGrouped()
      ) : shouldVirtualize ? (
        <div ref={scrollContainerRef} className="max-h-[800px] overflow-y-auto">
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const c = roots[virtualRow.index];
              return (
                <div
                  key={c.id}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${virtualRow.start}px)` }}
                >
                  <RootComment
                    comment={c}
                    isMax={isMax}
                    authorId={authorId}
                    usersById={usersById}
                    votes={votes}
                    onVote={toggleVote}
                    replyTo={replyTo}
                    setReplyTo={setReplyTo}
                    thread={thread}
                    ensureAuthenticated={ensureAuthenticated}
                    solutionId={solutionId}
                    childrenMap={mapToUse}
                    activeFilters={activeFilters}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {roots.map((c) => (
            <RootComment
              key={c.id}
              comment={c}
              isMax={isMax}
              authorId={authorId}
              usersById={usersById}
              votes={votes}
              onVote={toggleVote}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              thread={thread}
              ensureAuthenticated={ensureAuthenticated}
              solutionId={solutionId}
              childrenMap={mapToUse}
              activeFilters={activeFilters}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// Top-level comment with collapsible replies (YouTube pattern)
function RootComment({
  comment,
  isMax,
  authorId,
  usersById,
  votes,
  onVote,
  replyTo,
  setReplyTo,
  thread,
  ensureAuthenticated,
  solutionId,
  childrenMap,
  activeFilters,
}: {
  comment: ThreadComment;
  isMax: boolean;
  authorId: string;
  usersById: Map<string, User>;
  votes: Record<string, { up?: boolean }>;
  onVote: (id: string) => void;
  replyTo: string | null;
  setReplyTo: (id: string | null) => void;
  thread: DiscussionThread;
  ensureAuthenticated: () => boolean;
  solutionId?: string;
  childrenMap: Map<string | null, ThreadComment[]>;
  activeFilters: Set<ContributionTag>;
}) {
  const replies = (childrenMap.get(comment.id) ?? []).filter((c) =>
    subtreeHasMatch(c, childrenMap, activeFilters),
  );
  const [repliesOpen, setRepliesOpen] = useState(false);

  return (
    <div id={`comment-${comment.id}`}>
      <CommentRow
        comment={comment}
        authorId={authorId}
        usersById={usersById}
        votes={votes}
        onVote={onVote}
        replyTo={replyTo}
        setReplyTo={setReplyTo}
        thread={thread}
        ensureAuthenticated={ensureAuthenticated}
        solutionId={solutionId}
        isMax={isMax}
      />

      {replies.length > 0 && (
        <div className="ml-10 mt-2">
          <button
            type="button"
            onClick={() => setRepliesOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-(--brand-primary) transition-colors hover:bg-(--brand-primary)/10"
          >
            {repliesOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            {repliesOpen ? "Hide replies" : `${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
          </button>

          {repliesOpen && (
            <div className="mt-3 border-l-2 border-(--border-default) pl-4 space-y-4">
              {replies.map((r) => (
                <div key={r.id} id={`comment-${r.id}`}>
                  <CommentRow
                    comment={r}
                    authorId={authorId}
                    usersById={usersById}
                    votes={votes}
                    onVote={onVote}
                    replyTo={replyTo}
                    setReplyTo={setReplyTo}
                    thread={thread}
                    ensureAuthenticated={ensureAuthenticated}
                    solutionId={solutionId}
                    isMax={isMax}
                    isReply
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Individual comment row — flat, YouTube-style
function CommentRow({
  comment,
  authorId,
  usersById,
  votes,
  onVote,
  replyTo,
  setReplyTo,
  thread,
  ensureAuthenticated,
  solutionId,
  isMax,
  isReply = false,
}: {
  comment: ThreadComment;
  authorId: string;
  usersById: Map<string, User>;
  votes: Record<string, { up?: boolean }>;
  onVote: (id: string) => void;
  replyTo: string | null;
  setReplyTo: (id: string | null) => void;
  thread: DiscussionThread;
  ensureAuthenticated: () => boolean;
  solutionId?: string;
  isMax: boolean;
  isReply?: boolean;
}) {
  const td = useThreadDiscussion();
  const user = usersById.get(comment.authorId) ?? null;
  const v = votes[comment.id] ?? {};
  const upCount = comment.upvotes + (v.up ? 1 : 0);
  const isOp = comment.authorId === authorId;
  const isSolution = solutionId === comment.id || comment.isSolution;
  const canReply = !isReply; // only allow replies to root comments

  return (
    <div className={cn("flex gap-3", isSolution && "rounded-xl border-l-4 border-(--feedback-success) pl-3")}>
      <UserAvatar user={user} size="sm" className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        {/* Author + timestamp + badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-semibold text-(--text-primary)">{user?.name ?? "Unknown"}</span>
          {isOp ? (
            <span className="rounded bg-(--brand-primary)/15 px-1.5 py-0.5 text-micro font-semibold text-(--brand-primary)">
              OP
            </span>
          ) : null}
          {isSolution ? (
            <span className="rounded bg-(--feedback-success)/15 px-1.5 py-0.5 text-micro font-semibold text-(--feedback-success)">
              Solution
            </span>
          ) : null}
          {/* Contribution tag badge — max mode only */}
          {isMax && comment.tags && comment.tags.length > 0 ? (
            <span className={cn("rounded px-1.5 py-0.5 text-micro font-semibold", TAG_COLOR[comment.tags[0]])}>
              {TAG_LABEL[comment.tags[0]]}
            </span>
          ) : null}
          <span className="text-(--text-muted)">{formatRelativeDate(comment.createdAt)}</span>
        </div>

        {/* Body */}
        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-(--text-primary)">
          {comment.body}
        </p>

        {/* Showcase: See in media */}
        {thread.category === "showcase" && isMax && comment.mediaPin ? (
          <button
            type="button"
            className="mt-1.5 text-xs font-medium text-(--brand-primary) hover:underline"
            onClick={() => {
              td.setMediaHighlightCoords(comment.mediaPin!);
              document.getElementById("showcase-media")?.scrollIntoView({ behavior: "smooth", block: "center" });
              window.setTimeout(() => td.setMediaHighlightCoords(null), 2200);
            }}
          >
            See in media
          </button>
        ) : null}

        {/* Debate: fallacy tags */}
        {thread.category === "debate" && isMax && comment.fallacyTags && comment.fallacyTags.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {comment.fallacyTags.map((f) => (
              <span key={f} className="rounded-full bg-(--bg-overlay) px-2 py-0.5 text-micro text-(--text-muted)">
                {f}
              </span>
            ))}
          </div>
        ) : null}

        {/* Gigs: proof of work links */}
        {thread.category === "gigs" && isMax && comment.proofOfWorkSlugs && comment.proofOfWorkSlugs.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-2">
            {comment.proofOfWorkSlugs.map((slug) => (
              <a
                key={slug}
                href={`/discussions/${slug}`}
                className="rounded-lg border border-(--border-default) bg-(--bg-inset) px-2 py-1 text-label-sm text-(--brand-primary) hover:underline"
              >
                Proof: {slug}
              </a>
            ))}
          </div>
        ) : null}

        {/* Actions */}
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium transition-colors",
              v.up ? "text-(--brand-primary)" : "text-(--text-secondary) hover:text-(--text-primary)",
            )}
            onClick={() => onVote(comment.id)}
          >
            <ArrowBigUp className={cn("h-4 w-4", v.up && "fill-current")} />
            {upCount > 0 ? upCount : null}
          </button>

          {canReply ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-medium text-(--text-secondary) hover:text-(--text-primary)"
              onClick={() => {
                if (!ensureAuthenticated()) return;
                setReplyTo(replyTo === comment.id ? null : comment.id);
              }}
            >
              <MessageSquareReply className="h-3.5 w-3.5" />
              Reply
            </button>
          ) : null}

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full text-(--text-muted) transition-colors hover:bg-(--bg-overlay) hover:text-(--text-primary)"
                aria-label="Comment actions"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-dropdown min-w-35 rounded-menu border border-border-default bg-bg-surface p-1 shadow-lg"
                align="end"
              >
                <DropdownMenu.Item className="cursor-pointer rounded-menu-item px-2.5 py-2 text-sm text-feedback-error outline-hidden transition-colors duration-normal ease-out-cubic data-highlighted:bg-feedback-error/10">
                  Report
                </DropdownMenu.Item>
                <DropdownMenu.Item className="cursor-pointer rounded-menu-item px-2.5 py-2 text-sm text-text-primary outline-hidden transition-colors duration-normal ease-out-cubic data-highlighted:bg-bg-overlay">
                  Copy link
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        {/* Inline reply composer */}
        {replyTo === comment.id ? (
          <div className="mt-3">
            <ThreadComposer
              thread={thread}
              placeholder={`Reply to @${user?.handle ?? "user"}…`}
              onSubmit={() => setReplyTo(null)}
              compact
              parentId={comment.id}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
