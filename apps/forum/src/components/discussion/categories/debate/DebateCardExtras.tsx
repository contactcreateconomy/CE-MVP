"use client";

import { ThumbsUp, ThumbsDown } from "lucide-react";

import type { Post } from "@/types/post";

export function DebateCardExtras({ post }: { post: Post }) {
  const body = post.categoryBody;
  if (!body || typeof body !== "object" || !Object.keys(body).length) return null;

  // Debate posts created via compose won't have vote counts yet — show motion only
  const motion = typeof body.motion === "string" ? body.motion : "";
  const votes = body.votes as { agree?: number; disagree?: number } | undefined;

  const hasVotes = votes && (typeof votes.agree === "number" || typeof votes.disagree === "number");

  if (!hasVotes && !motion) return null;

  return (
    <div className="mt-1.5 flex items-center gap-2 text-xs text-(--text-secondary)">
      {hasVotes && (
        <>
          <span className="inline-flex items-center gap-1">
            <ThumbsUp className="h-3 w-3 text-(--feedback-success)" />
            {votes.agree ?? 0}
          </span>
          <span className="inline-flex items-center gap-1">
            <ThumbsDown className="h-3 w-3 text-(--feedback-error)" />
            {votes.disagree ?? 0}
          </span>
        </>
      )}
      {motion && !hasVotes && (
        <span className="truncate italic text-(--text-muted)">{motion}</span>
      )}
    </div>
  );
}
