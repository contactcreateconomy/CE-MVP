import type { ThreadComment, ThreadData } from "@/types";
import { buildHeader, buildSidebar } from "./shared";

const baseThread: ThreadData = {
  id: "list-001",
  category: "list",
  header: buildHeader({
    category: "list",
    title: "Best AI tools for creator operations in 2026",
    authorId: "u1",
    tags: ["List", "Creator Ops", "Curation"],
    views: 9680,
    upvotes: 418,
    bookmarks: 190,
  }),
  bodyMarkdown:
    "This list is curated for creators optimizing weekly output quality and operational reliability. Inclusion depends on measurable workflow impact, not hype cycles.",
  sidebar: { aboutAuthor: { authorId: "u1", bio: "Publishes weekly curation frameworks for creator AI systems.", followers: 12810 }, relatedThreads: [], trendingThreads: [] },
  insights: {
    summary: "Community values the criteria transparency and asks for stronger coverage in audio-focused tools.",
    keyAgreements: ["Criteria clarity builds trust.", "Value lens differs by team maturity.", "Coverage gaps should be explicit."],
    openQuestions: [{ id: "oq-list-1", question: "Should this list split by solo vs team use cases?" }],
    topContributor: { userId: "u4", topCommentId: "tcom-list-2", excerpt: "Coverage gaps card is the right mechanism for collaborative curation." },
    genealogy: {
      buildsOn: [{ id: "compare-001", title: "Claude vs GPT for creator operations in 2026", authorName: "Sophia Patel", engagementCount: 1260, category: "compare" }],
      contradicts: [],
      canonical: { id: "review-001", title: "45-day production review: Claude + retrieval workflow for creator teams", authorName: "Marcus Johnson", engagementCount: 741, category: "review" },
    },
  },
  categoryData: {
    purpose: "Best AI tools for creators running repeatable weekly publishing systems.",
    targetAudience: "Solo and small-team creators shipping 3+ pieces/week",
    whyThisExists: "Most tool lists optimize for novelty. This one optimizes for production reliability and measurable output gains.",
    criteria: ["Must save at least 2 hours/week", "Must be usable within 3 days", "Monthly cost under $80 for base tier"],
    items: [
      { id: "list-item-1", rank: 1, name: "Claude Workbench", category: "Writing", rating: 4.8, note: "Best synthesis quality for strategy-heavy workflows.", details: "Strong for nuanced brief synthesis and voice-consistent long-form drafting." },
      { id: "list-item-2", rank: 2, name: "Descript", category: "Audio/Video", rating: 4.6, note: "Fast edit loop for spoken content teams.", details: "Excellent for script-to-publish short turnaround in podcast and video workflows." },
      { id: "list-item-3", rank: 3, name: "Perplexity", category: "Research", rating: 4.4, note: "High-velocity source discovery and citation support.", details: "Useful for building evidence-backed scripts and newsletters quickly." },
      { id: "list-item-4", rank: 4, name: "Notion AI", category: "Ops", rating: 4.1, note: "Strong team-level workflow documentation support.", details: "Best when paired with clear SOPs and review checkpoints." },
      { id: "list-item-5", rank: 5, name: "Midjourney", category: "Visuals", rating: 4.0, note: "High-quality concept visual generation.", details: "Great for visual ideation but requires curation for brand consistency." },
      { id: "list-item-6", rank: 6, name: "Zapier", category: "Automation", rating: 3.9, note: "Reliable glue for creator toolchains.", details: "Reduces repetitive admin flow across content systems." },
      { id: "list-item-7", rank: 7, name: "Runway", category: "Video", rating: 3.8, note: "Good for rapid motion prototypes.", details: "Useful for draft-level experimentation before full production pass." },
    ],
    lastUpdated: "2026-03-21T09:00:00.000Z",
    contributors: 14,
    ongoing: true,
    lenses: [
      { id: "editor", label: "Editor's choice" },
      { id: "value", label: "Best value" },
      { id: "popular", label: "Most popular" },
      { id: "beginner", label: "Beginner-friendly" },
      { id: "custom", label: "Custom" },
    ],
    coverageGaps: [
      { id: "gap-audio", label: "Only one item focused on audio editing", suggestionPrompt: "Suggest an audio-focused tool with measurable weekly time savings." },
      { id: "gap-collab", label: "Limited options for async team critique", suggestionPrompt: "Nominate tools that improve asynchronous review quality." },
    ],
  },
  qualityDimensions: { novelty: 62, verifiability: 77, actionability: 88, synthesis: 75 },
  alien: { updates: [], coAuthors: ["u1"], serendipity: [{ id: "showcase-001", title: "Showcase: conversion-focused onboarding redesign", authorName: "Sophia Patel", engagementCount: 719, category: "showcase" }] },
};

export const listThread: ThreadData = {
  ...baseThread,
  sidebar: buildSidebar(baseThread),
};

export const listComments: ThreadComment[] = [
  {
    id: "tcom-list-1",
    threadId: "list-001",
    authorId: "u5",
    body: "Criteria-first framing is excellent. Most lists skip this and lose trust immediately.",
    createdAt: "2026-03-20T10:48:00.000Z",
    upvotes: 25,
    downvotes: 0,
    intentTag: "evidence",
  },
  {
    id: "tcom-list-2",
    threadId: "list-001",
    authorId: "u4",
    body: "Coverage gaps card is the right mechanism for collaborative curation. Please keep that in MAX mode.",
    createdAt: "2026-03-20T11:05:00.000Z",
    upvotes: 18,
    downvotes: 1,
    intentTag: "implementation-note",
  },
];
