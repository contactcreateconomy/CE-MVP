"use client";

import { useState } from "react";
import { ThumbsUp, MessageSquare, Share2, Bookmark, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { avatarBg, formatRelativeDate } from "@/lib/format";
import type { SeedComment, StanceTag, RoleTag } from "@/app/(app)/(content)/content/_seed";

interface CommentCardProps {
  comment: SeedComment;
  depth?: number;
  showAiSummary?: boolean;
  isHighlighted?: boolean;
  onToast?: (msg: string) => void;
}

const STANCE_STYLES: Record<StanceTag, { label: string; cls: string }> = {
  question: { label: "Question", cls: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  answer: { label: "Answer", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" },
  story: { label: "Story", cls: "bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400" },
  critique: { label: "Critique", cls: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400" },
  supportive: { label: "Supportive", cls: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400" },
  resource: { label: "Resource", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400" },
};

const ROLE_STYLES: Record<RoleTag, { label: string; cls: string }> = {
  creator: { label: "Creator", cls: "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-[var(--brand-primary)]/20" },
  moderator: { label: "Mod", cls: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  "top-contributor": { label: "Top", cls: "bg-violet-500/10 text-violet-500 border-violet-500/20" },
  "verified-buyer": { label: "Buyer ✓", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" },
  new: { label: "New", cls: "bg-[var(--bg-overlay)] text-[var(--text-muted)] border-[var(--border-subtle)]" },
};

const THEME_LABELS: Record<string, string> = {
  pricing: "Pricing",
  implementation: "Implementation",
  cases: "Case Study",
  tools: "Tools",
};

const MAX_VISIBLE_DEPTH = 3;

export function CommentCard({ comment, depth = 0, showAiSummary = false, isHighlighted = false, onToast }: CommentCardProps) {
  const [repliesOpen, setRepliesOpen] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes);

  const hasReplies = comment.replies && comment.replies.length > 0;
  const stance = STANCE_STYLES[comment.stance];
  const roleStyle = ROLE_STYLES[comment.author.role];
  const isTopLevel = depth === 0;
  const canNest = depth < MAX_VISIBLE_DEPTH;

  function handleLike() {
    const next = !liked;
    setLiked(next);
    setLikeCount((n) => (liked ? n - 1 : n + 1));
    onToast?.(next ? "Liked" : "Removed like");
  }

  function handleBookmark() {
    const next = !bookmarked;
    setBookmarked(next);
    onToast?.(next ? "Bookmarked" : "Removed bookmark");
  }

  return (
    <div
      className={cn(
        "relative animate-soft-float-up",
        isHighlighted && "ring-1 ring-[var(--brand-primary)]/30 rounded-xl"
      )}
    >
      {/* Depth line for replies */}
      {depth > 0 && (
        <div
          className="absolute left-4 top-0 bottom-0 w-px bg-[var(--border-subtle)]"
          style={{ left: `${(depth - 1) * 32 + 16}px` }}
        />
      )}

      <div
        className={cn(
          "p-4 rounded-xl",
          isTopLevel ? "bg-[var(--bg-surface)]" : "bg-[var(--bg-surface-elevated)]",
          depth > 0 && "ml-8"
        )}
      >
        {/* AI summary badge — shown in insights mode */}
        {showAiSummary && comment.aiSummary && (
          <div className="flex items-start gap-1.5 mb-2.5 px-2.5 py-2 rounded-lg bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/15">
            <Sparkles className="h-3 w-3 text-[var(--brand-primary)] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{comment.aiSummary}</p>
          </div>
        )}

        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            {/* Avatar */}
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0",
                avatarBg(comment.author.id)
              )}
            >
              {comment.author.initials}
            </div>

            {/* Identity */}
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-[var(--text-primary)]">{comment.author.name}</span>
                <span className="text-xs text-[var(--text-muted)]">{comment.author.handle}</span>
                {comment.author.role !== "new" && (
                  <span
                    className={cn(
                      "text-micro font-medium px-1.5 py-0.5 rounded-full border",
                      roleStyle.cls
                    )}
                  >
                    {roleStyle.label}
                  </span>
                )}
                <span
                  className={cn(
                    "text-micro font-medium px-1.5 py-0.5 rounded-full border",
                    stance.cls
                  )}
                >
                  {stance.label}
                </span>
              </div>
              <p className="text-micro text-[var(--text-muted)] mt-0.5">{formatRelativeDate(comment.publishedAt)}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <p className="mt-2.5 text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
          {comment.body}
        </p>

        {/* Theme chips */}
        {comment.aiThemes.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {comment.aiThemes.map((t) => (
              <span
                key={t}
                className="text-micro px-2 py-0.5 rounded-full bg-[var(--bg-overlay)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
              >
                {THEME_LABELS[t] ?? t}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 flex items-center gap-1">
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
              liked
                ? "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                : "text-[var(--text-muted)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-secondary)]"
            )}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            {likeCount}
          </button>

          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-secondary)] transition-colors">
            <MessageSquare className="h-3.5 w-3.5" />
            Reply
          </button>

          <button
            onClick={handleBookmark}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
              bookmarked
                ? "text-amber-500 bg-amber-500/10"
                : "text-[var(--text-muted)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-secondary)]"
            )}
          >
            <Bookmark className={cn("h-3.5 w-3.5", bookmarked && "fill-current")} />
          </button>

          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-secondary)] transition-colors">
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Replies — now supports nesting up to MAX_VISIBLE_DEPTH */}
      {hasReplies && canNest && (
        <div className="mt-1">
          {repliesOpen && (
            <div className="space-y-1 pl-4 border-l-2 border-[var(--border-subtle)] ml-4">
              {comment.replies!.map((reply) => (
                <CommentCard
                  key={reply.id}
                  comment={reply}
                  depth={depth + 1}
                  showAiSummary={showAiSummary}
                  onToast={onToast}
                />
              ))}
            </div>
          )}
          <button
            onClick={() => setRepliesOpen((v) => !v)}
            className="ml-4 mt-1 flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            {repliesOpen ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Hide {comment.replies!.length} {comment.replies!.length === 1 ? "reply" : "replies"}
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Show {comment.replies!.length} {comment.replies!.length === 1 ? "reply" : "replies"}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
