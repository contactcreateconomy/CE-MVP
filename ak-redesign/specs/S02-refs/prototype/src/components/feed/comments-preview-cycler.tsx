"use client";

import { useEffect, useMemo, useState } from "react";

interface CommentPreviewItem {
  id: string;
  body: string;
  handle: string;
}

interface CommentsPreviewCyclerProps {
  comments: CommentPreviewItem[];
  isActive: boolean;
}

export function CommentsPreviewCycler({ comments, isActive }: CommentsPreviewCyclerProps) {
  const [index, setIndex] = useState(0);

  const visibleComments = useMemo(() => comments.slice(0, 4), [comments]);

  useEffect(() => {
    if (!isActive || visibleComments.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % visibleComments.length);
    }, 1700);

    return () => window.clearInterval(interval);
  }, [isActive, visibleComments]);

  useEffect(() => {
    setIndex(0);
  }, [visibleComments]);

  if (visibleComments.length === 0) {
    return null;
  }

  const activeComment = visibleComments[index];

  return (
    <div className="flex h-10 items-center rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-overlay)]/25 px-3">
      <p
        key={activeComment.id}
        className="block w-full truncate text-sm text-[var(--text-secondary)]"
      >
        <span className="font-mono text-xs text-[var(--text-muted)]">@{activeComment.handle}</span>{" "}
        {activeComment.body}
      </p>
    </div>
  );
}
