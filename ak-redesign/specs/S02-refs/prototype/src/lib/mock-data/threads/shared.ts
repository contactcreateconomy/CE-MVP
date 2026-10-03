import type { CategoryKey, CompactThreadReference, ThreadData, ThreadHeaderData, ThreadId, ThreadSidebarData } from "@/types";

const referencePool: CompactThreadReference[] = [
  { id: "news-001", title: "Open model safety benchmarks just shifted", authorName: "Emily Zhang", engagementCount: 892, category: "news" },
  { id: "review-001", title: "45-day review: Claude + retrieval in production", authorName: "Marcus Johnson", engagementCount: 741, category: "review" },
  { id: "compare-001", title: "Claude vs GPT for creator operations", authorName: "Sophia Patel", engagementCount: 1260, category: "compare" },
  { id: "launchpad-001", title: "Launching PromptForge beta", authorName: "Rachel Moore", engagementCount: 664, category: "launch-pad" },
  { id: "debate-001", title: "Will agent-native products replace SaaS UI?", authorName: "David Kim", engagementCount: 1103, category: "debate" },
  { id: "help-001", title: "Next.js streaming mismatch with AI output", authorName: "Marcus Johnson", engagementCount: 588, category: "help" },
  { id: "list-001", title: "Best AI tools for creator ops in 2026", authorName: "Emily Zhang", engagementCount: 502, category: "list" },
  { id: "showcase-001", title: "Showcase: conversion-focused onboarding redesign", authorName: "Sophia Patel", engagementCount: 719, category: "showcase" },
  { id: "gigs-001", title: "Hiring: AI workflow engineer for media team", authorName: "Rachel Moore", engagementCount: 430, category: "gigs" },
];

export const categoryAuthorMap: Record<CategoryKey, string> = {
  news: "u1",
  review: "u2",
  compare: "u3",
  "launch-pad": "u5",
  debate: "u4",
  help: "u2",
  list: "u1",
  showcase: "u3",
  gigs: "u5",
};

export function getReferenceById(id: ThreadId) {
  return referencePool.find((entry) => entry.id === id)!;
}

export function pickRelated(category: CategoryKey, excludeId: ThreadId) {
  return referencePool.filter((entry) => entry.category === category && entry.id !== excludeId).slice(0, 4);
}

export function pickTrending(category: CategoryKey, excludeId: ThreadId) {
  return referencePool.filter((entry) => entry.category === category && entry.id !== excludeId).slice(0, 3);
}

export function buildHeader(overrides: Partial<ThreadHeaderData> & { category: CategoryKey; title: string; authorId: string }): ThreadHeaderData {
  const { category, title, authorId, ...rest } = overrides;

  return {
    authorBadge: "Pro Creator",
    reputationLabel: "AI Builder",
    postedAt: "2026-03-20T14:22:00.000Z",
    publishedAt: "2026-03-20T12:05:00.000Z",
    updatedAt: "2026-03-21T08:10:00.000Z",
    views: 14820,
    tags: ["AI Tools", "Workflow", "Createconomy"],
    aiSummary:
      "The thread consolidates practical implementation trade-offs from creators who have tested this workflow in production across speed, quality, and maintainability constraints.",
    upvotes: 643,
    commentsCount: 0,
    bookmarks: 188,
    staleAfterDays: 90,
    updatedSinceOriginalCount: 2,
    category,
    title,
    authorId,
    ...rest,
  };
}

export function buildSidebar(thread: ThreadData): ThreadSidebarData {
  return {
    aboutAuthor: {
      authorId: thread.header.authorId,
      bio: "Builder focused on practical AI systems, shipping workflows weekly and documenting production learnings.",
      followers: 12480,
    },
    relatedThreads: pickRelated(thread.category, thread.id),
    trendingThreads: pickTrending(thread.category, thread.id),
  };
}

export function threadLink(id: ThreadId) {
  return `/discussion/${id}`;
}
