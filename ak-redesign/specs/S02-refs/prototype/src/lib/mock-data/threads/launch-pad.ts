import type { ThreadComment, ThreadData } from "@/types";
import { buildHeader, buildSidebar } from "./shared";

const baseThread: ThreadData = {
  id: "launchpad-001",
  category: "launch-pad",
  header: buildHeader({
    category: "launch-pad",
    title: "Launchpad: PromptForge beta launch for creator onboarding",
    authorId: "u5",
    tags: ["Launchpad", "Beta", "Feedback Wanted"],
    views: 11280,
    upvotes: 520,
    bookmarks: 164,
  }),
  bodyMarkdown:
    "We’re launching PromptForge in beta for creators who want to operationalize prompt systems without losing editorial quality. The immediate need is high-fidelity feedback on onboarding clarity and pricing comprehension.",
  sidebar: { aboutAuthor: { authorId: "u5", bio: "Builds monetizable creator AI systems and ships in public.", followers: 14520 }, relatedThreads: [], trendingThreads: [] },
  insights: {
    summary: "Early reactions are positive on value proposition, but onboarding friction in step three is repeatedly flagged.",
    keyAgreements: ["Positioning is clear.", "Onboarding friction is real.", "Feedback prompts improve comment quality."],
    openQuestions: [{ id: "oq-launch-1", question: "Should pricing explanation move before account setup?", commentId: "tcom-launch-3" }],
    topContributor: { userId: "u1", topCommentId: "tcom-launch-3", excerpt: "Step three copy assumes too much prior context for first-time users." },
    genealogy: { buildsOn: [{ id: "showcase-001", title: "Showcase: conversion-focused onboarding redesign", authorName: "Sophia Patel", engagementCount: 719, category: "showcase" }], contradicts: [], canonical: { id: "review-001", title: "45-day production review: Claude + retrieval workflow for creator teams", authorName: "Marcus Johnson", engagementCount: 741, category: "review" } },
  },
  categoryData: {
    media: { type: "image", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1280&h=720&fit=crop" },
    productName: "PromptForge",
    productLogoUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=96&h=96&fit=crop",
    tagline: "Turn scattered prompts into deployable creator workflows.",
    stage: "beta",
    primaryCtaLabel: "Join waitlist →",
    secondaryUrl: "https://createconomy.app/promptforge",
    waitlistSignups: 1460,
    makerNote:
      "I built this after repeatedly seeing teams lose quality once prompt ownership fragmented. I need direct feedback on where the onboarding flow breaks trust.",
    feedbackFocusAreas: ["Onboarding clarity", "Pricing model", "Activation time"],
    milestones: [
      { id: "m1", title: "Prototype shipped", date: "2026-01-14" },
      { id: "m2", title: "Private alpha with 12 creators", date: "2026-02-02" },
      { id: "m3", title: "Public beta launch", date: "2026-03-20" },
      { id: "m4", title: "Team workspace rollout", date: "2026-04-10", upcoming: true },
    ],
    changelog: [
      { version: "v0.9.2", date: "2026-03-20", note: "Added onboarding diagnostics panel." },
      { version: "v0.9.1", date: "2026-03-11", note: "Improved prompt library search." },
    ],
    builtWith: ["Next.js", "Claude API", "Vercel", "PostHog"],
  },
  qualityDimensions: { novelty: 76, verifiability: 69, actionability: 87, synthesis: 73 },
  alien: { updates: [], coAuthors: ["u5"], serendipity: [{ id: "gigs-001", title: "Hiring: AI workflow engineer for media team", authorName: "Rachel Moore", engagementCount: 430, category: "gigs" }] },
};

export const launchpadThread: ThreadData = {
  ...baseThread,
  sidebar: buildSidebar(baseThread),
};

export const launchpadComments: ThreadComment[] = [
  { id: "tcom-launch-1", threadId: "launchpad-001", authorId: "u3", body: "Hero section is strong. I understood the value prop in under 5 seconds.", createdAt: "2026-03-20T15:20:00.000Z", upvotes: 28, downvotes: 0, intentTag: "evidence" },
  { id: "tcom-launch-2", threadId: "launchpad-001", authorId: "u2", body: "The onboarding KPI target is unclear. What activation metric are you optimizing for exactly?", createdAt: "2026-03-20T15:33:00.000Z", upvotes: 33, downvotes: 1, intentTag: "question" },
  { id: "tcom-launch-3", threadId: "launchpad-001", authorId: "u1", body: "Step three copy assumes too much prior context. New users won’t know what 'prompt state' means yet.", createdAt: "2026-03-20T15:41:00.000Z", upvotes: 47, downvotes: 0, intentTag: "implementation-note" },
  { id: "tcom-launch-4", threadId: "launchpad-001", authorId: "u5", body: "This is exactly the signal I needed. I’ll rewrite step three and publish a changelog update tonight.", createdAt: "2026-03-20T16:05:00.000Z", upvotes: 24, downvotes: 0, isOpReply: true, parentId: "tcom-launch-3", intentTag: "decision-proposal" },
  { id: "tcom-launch-5", threadId: "launchpad-001", authorId: "u4", body: "Move pricing explainer before account creation to reduce drop-off anxiety.", createdAt: "2026-03-20T16:22:00.000Z", upvotes: 26, downvotes: 2, intentTag: "counterpoint" },
];
