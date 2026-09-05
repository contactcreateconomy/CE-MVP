"use client";

import { Quote } from "lucide-react";

import type { DiscussionThread } from "@/types/discussion";

import { FormattedBody } from "../../formatted-body";

/**
 * Spec-aligned spark body (2026-08-31): statement-first render — large type,
 * no structured fields, nothing reader-adjustable. The statement is the whole post.
 */
export function SparkBody({
  thread,
}: {
  thread: Extract<DiscussionThread, { category: "spark" }>;
  isMax: boolean;
}) {
  const statement = thread.title;

  return (
    <div className="space-y-4">
      <div className="border-(--border-default) bg-(--bg-surface) rounded-lg border p-6">
        <Quote className="mb-3 h-5 w-5 text-(--text-muted)" aria-hidden />
        <p className="text-xl leading-snug font-semibold text-(--text-primary)">{statement}</p>
      </div>
    </div>
  );
}
