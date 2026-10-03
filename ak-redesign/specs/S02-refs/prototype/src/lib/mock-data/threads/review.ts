import type { ThreadComment, ThreadData } from "@/types";
import { buildHeader, buildSidebar } from "./shared";

const baseThread: ThreadData = {
  id: "review-001",
  category: "review",
  header: buildHeader({
    category: "review",
    title: "45-day production review: Claude + retrieval workflow for creator teams",
    authorId: "u2",
    tags: ["Review", "Claude API", "Production"],
    views: 15430,
    upvotes: 689,
    bookmarks: 302,
  }),
  bodyMarkdown:
    "I tested this stack in two production content teams over 45 days. The verdict: high reliability when context hygiene is enforced, but degraded trust when prompt ownership is diffused across multiple contributors without governance.",
  sidebar: { aboutAuthor: { authorId: "u2", bio: "Builds retrieval-heavy content systems for creator operations.", followers: 10940 }, relatedThreads: [], trendingThreads: [] },
  insights: {
    summary: "Readers broadly agree the score is fair but want clearer weighting around onboarding overhead.",
    keyAgreements: ["Context hygiene is decisive.", "Reviewer disclosed enough usage detail.", "Weights are useful but team-size-sensitive."],
    openQuestions: [
      { id: "oq-review-1", question: "Should onboarding friction carry higher weight for small teams?", commentId: "tcom-review-3" },
      { id: "oq-review-2", question: "How stable was performance after week 4?" },
    ],
    topContributor: { userId: "u5", topCommentId: "tcom-review-2", excerpt: "I replicated similar gains only after we enforced retrieval source versioning." },
    genealogy: {
      buildsOn: [{ id: "news-001", title: "Open model safety benchmark update: what changed this week", authorName: "Emily Zhang", engagementCount: 892, category: "news" }],
      contradicts: [{ id: "compare-001", title: "Claude vs GPT for creator operations", authorName: "Sophia Patel", engagementCount: 1260, category: "compare" }],
      canonical: { id: "list-001", title: "Best AI tools for creator ops in 2026", authorName: "Emily Zhang", engagementCount: 502, category: "list" },
    },
  },
  categoryData: {
    productName: "Claude Retrieval Studio",
    productLogoUrl: "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=96&h=96&fit=crop",
    productUrl: "https://claude.ai",
    reviewerContextNote: "45 days · 2 production teams · Claude API + vector retrieval",
    verdict: {
      rating: 4.3,
      label: "recommended",
      rationale: "Excellent synthesis quality when retrieval discipline is enforced; onboarding tax is the main caveat.",
    },
    criteria: [
      { label: "Output quality", score: 4.5, weight: 35 },
      { label: "Reliability", score: 4.2, weight: 25 },
      { label: "Workflow speed", score: 4.0, weight: 20 },
      { label: "Onboarding", score: 3.4, weight: 12 },
      { label: "Cost efficiency", score: 4.1, weight: 8 },
    ],
    reviewerContext: ["2 editors + 1 strategist", "macOS + Vercel edge functions", "No affiliate relationship declared"],
    communitySentiment: {
      agreePct: 71,
      disagreePct: 29,
      topAgreeQuote: "The caveat framing is honest; this is not plug-and-play for junior teams.",
      topDisagreeQuote: "Onboarding score is too generous unless templates are already standardized.",
    },
  },
  qualityDimensions: { novelty: 74, verifiability: 82, actionability: 85, synthesis: 80 },
  alien: {
    updates: [],
    coAuthors: ["u2"],
    serendipity: [{ id: "help-001", title: "Next.js streaming mismatch with AI output", authorName: "Marcus Johnson", engagementCount: 588, category: "help" }],
  },
};

export const reviewThread: ThreadData = {
  ...baseThread,
  sidebar: buildSidebar(baseThread),
};

export const reviewComments: ThreadComment[] = [
  {
    id: "tcom-review-1",
    threadId: "review-001",
    authorId: "u1",
    body: "Good context disclosure. Can you share whether failure cases were clustered around long-context prompts or tool-call boundaries?",
    createdAt: "2026-03-20T11:06:00.000Z",
    upvotes: 39,
    downvotes: 1,
    intentTag: "question",
  },
  {
    id: "tcom-review-2",
    threadId: "review-001",
    authorId: "u5",
    body: "I replicated similar gains only after enforcing retrieval source versioning. Without that, quality drift looked random.",
    createdAt: "2026-03-20T11:34:00.000Z",
    upvotes: 66,
    downvotes: 0,
    intentTag: "evidence",
  },
  {
    id: "tcom-review-3",
    threadId: "review-001",
    authorId: "u3",
    body: "Weighting onboarding at 12% feels low for sub-5 person teams. I’d push it to ~20% for solo creators.",
    createdAt: "2026-03-20T11:55:00.000Z",
    upvotes: 44,
    downvotes: 3,
    intentTag: "counterpoint",
  },
  {
    id: "tcom-review-4",
    threadId: "review-001",
    authorId: "u2",
    body: "Agree on team-size variance. I’ll add an alternate weight profile in MAX mode for solo creator setups.",
    createdAt: "2026-03-20T12:20:00.000Z",
    upvotes: 31,
    downvotes: 0,
    isOpReply: true,
    parentId: "tcom-review-3",
    intentTag: "decision-proposal",
  },
  {
    id: "tcom-review-5",
    threadId: "review-001",
    authorId: "u4",
    body: "Strong review. The conflict-of-interest line should be mandatory in all review headers across categories.",
    createdAt: "2026-03-20T12:42:00.000Z",
    upvotes: 27,
    downvotes: 1,
    intentTag: "implementation-note",
  },
];
