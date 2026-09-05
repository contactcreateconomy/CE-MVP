"use client";

import type { DiscussionThread } from "@/types/discussion";

import { getCategoryTemplate } from "./categories/registry";

export function InsightRailExtras({ thread }: { thread: DiscussionThread }) {
  const tpl = getCategoryTemplate(thread.category);
  if (tpl?.Insights) return <tpl.Insights thread={thread} />;
  return null;
}
