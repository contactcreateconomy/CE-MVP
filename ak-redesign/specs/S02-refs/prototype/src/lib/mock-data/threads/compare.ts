import type { ThreadComment, ThreadData } from "@/types";
import { buildHeader, buildSidebar } from "./shared";

const baseThread: ThreadData = {
  id: "compare-001",
  category: "compare",
  header: buildHeader({
    category: "compare",
    title: "Claude vs GPT for creator operations in 2026",
    authorId: "u3",
    tags: ["Compare", "Decision", "Creator Ops"],
    views: 21300,
    upvotes: 980,
    bookmarks: 402,
  }),
  bodyMarkdown:
    "This comparison focuses on production creator workflows rather than benchmark vanity metrics. The objective is simple: choose the stack that best matches your operating constraints.",
  sidebar: { aboutAuthor: { authorId: "u3", bio: "Runs comparative field tests across AI workflows for media teams.", followers: 10120 }, relatedThreads: [], trendingThreads: [] },
  insights: {
    summary: "Community favors Claude for synthesis-heavy workflows and GPT for broad ecosystem integrations.",
    keyAgreements: ["Use-case context beats aggregate score.", "Cost variance matters more at scale.", "Team maturity changes the winner."],
    openQuestions: [
      { id: "oq-compare-1", question: "Should memory control be a top-level criterion?", commentId: "tcom-compare-4" },
      { id: "oq-compare-2", question: "How often should we recalibrate score weights?" },
    ],
    topContributor: { userId: "u1", topCommentId: "tcom-compare-2", excerpt: "Your scenario matrix is the right abstraction; people buy outcomes, not models." },
    genealogy: {
      buildsOn: [{ id: "review-001", title: "45-day production review: Claude + retrieval workflow for creator teams", authorName: "Marcus Johnson", engagementCount: 741, category: "review" }],
      contradicts: [{ id: "news-001", title: "Open model safety benchmark update: what changed this week", authorName: "Emily Zhang", engagementCount: 892, category: "news" }],
      canonical: { id: "list-001", title: "Best AI tools for creator ops in 2026", authorName: "Emily Zhang", engagementCount: 502, category: "list" },
    },
  },
  categoryData: {
    options: [
      { id: "claude", name: "Claude 4.6" },
      { id: "gpt", name: "GPT-Next" },
      { id: "gemini", name: "Gemini Pro" },
    ],
    criteria: [
      { key: "quality", label: "Output Quality" },
      { key: "speed", label: "Response Speed" },
      { key: "cost", label: "Cost Efficiency" },
      { key: "ux", label: "Workflow UX" },
      { key: "tooling", label: "Integration Surface" },
    ],
    scores: {
      quality: { claude: 9.2, gpt: 8.8, gemini: 8.1 },
      speed: { claude: 8.4, gpt: 9.1, gemini: 8.9 },
      cost: { claude: 8.3, gpt: 7.6, gemini: 8.7 },
      ux: { claude: 9.0, gpt: 8.4, gemini: 7.9 },
      tooling: { claude: 8.5, gpt: 9.3, gemini: 8.6 },
    },
    verdictCards: [
      { optionId: "claude", overallScore: 8.9, bestFor: "Best for deep synthesis and long-form strategy", communityPick: true },
      { optionId: "gpt", overallScore: 8.6, bestFor: "Best for fast iteration with broad integrations" },
      { optionId: "gemini", overallScore: 8.4, bestFor: "Best for multimodal workflows and cost-aware teams" },
    ],
    scenarios: [
      { id: "solo", label: "Solo creator", recommendedOptionId: "claude", rationale: "Highest strategy quality per prompt." },
      { id: "agency", label: "Agency team", recommendedOptionId: "gpt", rationale: "Integration breadth helps diverse pipelines." },
      { id: "budget", label: "Budget-first", recommendedOptionId: "gemini", rationale: "Cost profile is more forgiving at volume." },
      { id: "quality", label: "Quality-first", recommendedOptionId: "claude", rationale: "Most consistent synthesis quality." },
    ],
    similarRowThreshold: 0.4,
    communityOverride: {
      quality: { claude: 9.1, gpt: 8.5, gemini: 8.0 },
      speed: { claude: 8.2, gpt: 9.0, gemini: 8.8 },
      cost: { claude: 8.1, gpt: 7.2, gemini: 8.9 },
      ux: { claude: 8.8, gpt: 8.2, gemini: 7.7 },
      tooling: { claude: 8.4, gpt: 9.2, gemini: 8.4 },
    },
  },
  qualityDimensions: { novelty: 70, verifiability: 81, actionability: 91, synthesis: 83 },
  alien: { updates: [], coAuthors: ["u3", "u2"], serendipity: [{ id: "debate-001", title: "Will agent-native products replace SaaS UI?", authorName: "David Kim", engagementCount: 1103, category: "debate" }] },
};

export const compareThread: ThreadData = {
  ...baseThread,
  sidebar: buildSidebar(baseThread),
};

export const compareComments: ThreadComment[] = [
  { id: "tcom-compare-1", threadId: "compare-001", authorId: "u2", body: "Table clarity is excellent. Add memory persistence as a criterion for agent-heavy pipelines.", createdAt: "2026-03-20T13:04:00.000Z", upvotes: 62, downvotes: 1, intentTag: "resource" },
  { id: "tcom-compare-2", threadId: "compare-001", authorId: "u1", body: "Scenario matrix is the right abstraction; people buy outcomes, not models.", createdAt: "2026-03-20T13:25:00.000Z", upvotes: 77, downvotes: 0, intentTag: "evidence" },
  { id: "tcom-compare-3", threadId: "compare-001", authorId: "u5", body: "In our team, integration surface outweighed raw quality by a lot once we crossed 6 contributors.", createdAt: "2026-03-20T13:44:00.000Z", upvotes: 41, downvotes: 2, intentTag: "counterpoint" },
  { id: "tcom-compare-4", threadId: "compare-001", authorId: "u4", body: "Should memory control be first-class in this matrix? It impacts reuse and governance directly.", createdAt: "2026-03-20T14:10:00.000Z", upvotes: 35, downvotes: 1, intentTag: "question" },
  { id: "tcom-compare-5", threadId: "compare-001", authorId: "u3", body: "Great call. I’ll include memory-control as a MAX-mode adjustable criterion in the next revision.", createdAt: "2026-03-20T14:18:00.000Z", upvotes: 29, downvotes: 0, isOpReply: true, parentId: "tcom-compare-4", intentTag: "decision-proposal" },
  { id: "tcom-compare-6", threadId: "compare-001", authorId: "u2", body: "Community override row is useful — it reveals where author scoring diverges from field usage reality.", createdAt: "2026-03-20T14:36:00.000Z", upvotes: 33, downvotes: 1, intentTag: "implementation-note" },
];
