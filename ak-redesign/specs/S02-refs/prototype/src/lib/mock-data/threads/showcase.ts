import type { ThreadComment, ThreadData } from "@/types";
import { buildHeader, buildSidebar } from "./shared";

const baseThread: ThreadData = {
  id: "showcase-001",
  category: "showcase",
  header: buildHeader({
    category: "showcase",
    title: "Showcase: conversion-focused onboarding redesign",
    authorId: "u3",
    tags: ["Showcase", "UX", "Feedback"],
    views: 14310,
    upvotes: 610,
    bookmarks: 274,
  }),
  bodyMarkdown:
    "I redesigned onboarding for an AI writing tool to improve first-session activation. Looking for focused critique on UX flow clarity, visual hierarchy, and error recovery messaging.",
  sidebar: { aboutAuthor: { authorId: "u3", bio: "Designs and ships conversion-focused creator interfaces.", followers: 10120 }, relatedThreads: [], trendingThreads: [] },
  insights: {
    summary: "Feedback clusters around CTA clarity and progression confidence in the first two screens.",
    keyAgreements: ["Visual hierarchy improved.", "Primary CTA still competes with secondary actions.", "Error state copy needs stronger reassurance."],
    openQuestions: [{ id: "oq-show-1", question: "Should progress indicator be persistent across every onboarding step?", commentId: "tcom-showcase-2" }],
    topContributor: { userId: "u1", topCommentId: "tcom-showcase-2", excerpt: "Your screen two CTA hierarchy still creates split attention." },
    genealogy: {
      buildsOn: [{ id: "launchpad-001", title: "Launchpad: PromptForge beta launch for creator onboarding", authorName: "Rachel Moore", engagementCount: 664, category: "launch-pad" }],
      contradicts: [],
      canonical: { id: "list-001", title: "Best AI tools for creator operations in 2026", authorName: "Emily Zhang", engagementCount: 502, category: "list" },
    },
  },
  categoryData: {
    media: [
      {
        id: "show-media-1",
        type: "image",
        url: "https://images.unsplash.com/photo-1551281044-8b59f34f9f6a?w=1400&h=900&fit=crop",
        caption: "Primary onboarding flow overview",
      },
      {
        id: "show-media-2",
        type: "image",
        url: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1400&h=900&fit=crop",
        caption: "Step-2 CTA and guidance refinements",
      },
      {
        id: "show-media-3",
        type: "image",
        url: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1400&h=900&fit=crop",
        caption: "Error state copy and hierarchy revision",
      },
    ],
    creatorIntent:
      "I wanted first-time users to feel momentum in under 90 seconds without feeling pushed into irreversible decisions.",
    feedbackTags: ["UX Flow", "Visual Hierarchy", "Error Handling"],
    versions: [
      { label: "v1.0", date: "2026-02-25", note: "Baseline onboarding with high drop-off at step two." },
      { label: "v1.5", date: "2026-03-11", note: "Simplified progress framing and reduced copy density." },
      { label: "v2.0", date: "2026-03-20", note: "Current version with revised CTA hierarchy.", current: true },
    ],
    annotatedAreas: [
      { commentId: "tcom-showcase-2", mediaId: "show-media-2", x: 63, y: 42 },
      { commentId: "tcom-showcase-3", mediaId: "show-media-3", x: 44, y: 66 },
    ],
  },
  qualityDimensions: { novelty: 68, verifiability: 71, actionability: 89, synthesis: 74 },
  alien: {
    updates: [],
    coAuthors: ["u3"],
    serendipity: [{ id: "launchpad-001", title: "Launchpad: PromptForge beta launch for creator onboarding", authorName: "Rachel Moore", engagementCount: 664, category: "launch-pad" }],
  },
};

export const showcaseThread: ThreadData = {
  ...baseThread,
  sidebar: buildSidebar(baseThread),
};

export const showcaseComments: ThreadComment[] = [
  {
    id: "tcom-showcase-1",
    threadId: "showcase-001",
    authorId: "u5",
    body: "Overall flow is cleaner. I reached the value moment faster than your previous version.",
    createdAt: "2026-03-20T17:02:00.000Z",
    upvotes: 29,
    downvotes: 0,
    intentTag: "evidence",
  },
  {
    id: "tcom-showcase-2",
    threadId: "showcase-001",
    authorId: "u1",
    body: "On screen two, the secondary link still steals contrast from the primary CTA.",
    createdAt: "2026-03-20T17:20:00.000Z",
    upvotes: 38,
    downvotes: 1,
    intentTag: "implementation-note",
    annotation: { mediaId: "show-media-2", x: 63, y: 42 },
  },
  {
    id: "tcom-showcase-3",
    threadId: "showcase-001",
    authorId: "u4",
    body: "Error copy at this point sounds blameful. Try reframing toward recovery confidence.",
    createdAt: "2026-03-20T17:33:00.000Z",
    upvotes: 26,
    downvotes: 0,
    intentTag: "counterpoint",
    annotation: { mediaId: "show-media-3", x: 44, y: 66 },
  },
  {
    id: "tcom-showcase-4",
    threadId: "showcase-001",
    authorId: "u3",
    body: "Great notes — I’ll test lower-contrast secondary actions and softer recovery copy in v2.1.",
    createdAt: "2026-03-20T17:58:00.000Z",
    upvotes: 21,
    downvotes: 0,
    isOpReply: true,
    parentId: "tcom-showcase-2",
    intentTag: "decision-proposal",
  },
];
