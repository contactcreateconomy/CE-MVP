import type { ThreadComment, ThreadData } from "@/types";
import { buildHeader, buildSidebar } from "./shared";

const baseThread: ThreadData = {
  id: "news-001",
  category: "news",
  header: buildHeader({
    category: "news",
    title: "Open model safety benchmark update: what changed this week",
    authorId: "u1",
    tags: ["News", "Model Safety", "Benchmarks"],
    postedAt: "2026-03-20T16:02:00.000Z",
    publishedAt: "2026-03-20T15:30:00.000Z",
    updatedAt: "2026-03-21T07:48:00.000Z",
    views: 18220,
    upvotes: 712,
    bookmarks: 240,
  }),
  bodyMarkdown:
    "Multiple labs published updated red-team benchmarks this week, and the biggest signal is not the aggregate score bump — it is the variance between policy-sensitive categories. For creator workflows, the practical implication is that general quality gains do not automatically translate to safer autonomous publishing pipelines.",
  sidebar: {
    aboutAuthor: { authorId: "u1", bio: "Tracks platform updates and converts them into creator-ops decision briefs.", followers: 12810 },
    relatedThreads: [],
    trendingThreads: [],
  },
  insights: {
    summary:
      "Commenters agree the benchmark shift is meaningful only when evaluated by scenario, not by headline score deltas.",
    keyAgreements: [
      "Safety evals should be use-case specific.",
      "Raw aggregate benchmarks hide operational risk.",
      "Creators need recency markers before acting on news.",
    ],
    openQuestions: [
      { id: "oq-news-1", question: "Should we require source triangulation before reposting benchmark claims?", commentId: "tcom-news-2" },
      { id: "oq-news-2", question: "How should contradictory source quality be weighted?" },
    ],
    topContributor: {
      userId: "u2",
      topCommentId: "tcom-news-2",
      excerpt: "Treat each benchmark claim like incident response evidence: source, method, confidence.",
    },
    genealogy: {
      buildsOn: [{ id: "compare-001", title: "Claude vs GPT for creator operations", authorName: "Sophia Patel", engagementCount: 1260, category: "compare" }],
      contradicts: [{ id: "debate-001", title: "Will agent-native products replace SaaS UI?", authorName: "David Kim", engagementCount: 1103, category: "debate" }],
      canonical: { id: "help-001", title: "Next.js streaming mismatch with AI output", authorName: "Marcus Johnson", engagementCount: 588, category: "help" },
    },
  },
  categoryData: {
    source: {
      name: "OpenAI Research Blog",
      faviconUrl: "https://www.google.com/s2/favicons?domain=openai.com&sz=64",
      publishedAt: "2026-03-20T14:50:00.000Z",
      readOriginalUrl: "https://openai.com",
    },
    corroboration: [
      { name: "Anthropic Safety Notes", stance: "confirms", claim: "Similar trend in policy-sensitive eval improvements.", credibility: "corporate" },
      { name: "Independent Eval Collective", stance: "skeptical", claim: "Method changes may inflate comparability.", credibility: "independent" },
      { name: "Policy Watch", stance: "contradicts", claim: "No evidence of practical reliability uplift yet.", credibility: "community" },
    ],
    timeline: [
      { id: "news-tl-1", label: "Initial benchmark release", at: "2026-03-20T14:50:00.000Z" },
      { id: "news-tl-2", label: "Methodology critique published", at: "2026-03-20T20:10:00.000Z" },
      { id: "news-tl-3", label: "Thread updated with cross-source notes", at: "2026-03-21T07:48:00.000Z" },
    ],
    conflictingReports: [
      {
        leftSource: "OpenAI Research Blog",
        leftClaim: "Safety reliability materially improved across common use cases.",
        rightSource: "Policy Watch",
        rightClaim: "Production reliability remains unchanged in high-pressure content ops.",
      },
    ],
    sentimentPulse: { positive: 39, neutral: 34, negative: 27 },
  },
  qualityDimensions: { novelty: 78, verifiability: 84, actionability: 72, synthesis: 76 },
  decision: {
    status: "in-progress",
    statement: "Adopt source-triangulation requirement before citing benchmark headlines in creator newsletters.",
    owner: "@emilyai",
    timestamp: "2026-03-21T08:02:00.000Z",
    followUpActions: ["Draft source confidence rubric", "Add contradiction flag in content checklist"],
  },
  alien: {
    updates: [
      { id: "u-news-1", byHandle: "@emilyai", at: "2026-03-21T07:48:00.000Z", content: "Added methodology comparison notes from independent evaluator thread." },
    ],
    coAuthors: ["u1"],
    freshnessWarning: { lastUpdatedDaysAgo: 1, updateRequests: 2 },
    serendipity: [{ id: "review-001", title: "45-day review: Claude + retrieval in production", authorName: "Marcus Johnson", engagementCount: 741, category: "review" }],
  },
};

export const newsThread: ThreadData = {
  ...baseThread,
  sidebar: buildSidebar(baseThread),
};

export const newsComments: ThreadComment[] = [
  {
    id: "tcom-news-1",
    threadId: "news-001",
    authorId: "u2",
    body: "The independent evaluator note is the most important part here. Score movement without method parity is just theater.",
    createdAt: "2026-03-20T16:11:00.000Z",
    upvotes: 58,
    downvotes: 2,
    intentTag: "evidence",
  },
  {
    id: "tcom-news-2",
    threadId: "news-001",
    authorId: "u3",
    body: "Treat each benchmark claim like incident response evidence: source, method, confidence. We should normalize this in the community template.",
    createdAt: "2026-03-20T16:26:00.000Z",
    upvotes: 74,
    downvotes: 1,
    intentTag: "implementation-note",
  },
  {
    id: "tcom-news-3",
    threadId: "news-001",
    authorId: "u1",
    body: "OP update: I added a contradiction table in the body. If anyone has more government-source coverage, drop links.",
    createdAt: "2026-03-20T17:02:00.000Z",
    upvotes: 46,
    downvotes: 0,
    isOpReply: true,
    intentTag: "resource",
  },
];
