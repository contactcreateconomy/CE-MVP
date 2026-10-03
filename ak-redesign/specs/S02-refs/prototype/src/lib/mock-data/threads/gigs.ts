import type { ThreadComment, ThreadData } from "@/types";
import { buildHeader, buildSidebar } from "./shared";

const baseThread: ThreadData = {
  id: "gigs-001",
  category: "gigs",
  header: buildHeader({
    category: "gigs",
    title: "Hiring: AI workflow engineer for media team",
    authorId: "u5",
    tags: ["Gigs", "Hiring", "Remote"],
    views: 8750,
    upvotes: 312,
    bookmarks: 156,
  }),
  bodyMarkdown:
    "We are hiring an AI workflow engineer to help our creator media team scale from 20 to 70 high-quality outputs/week without quality collapse. Looking for builders who can turn ambiguity into resilient systems.",
  sidebar: { aboutAuthor: { authorId: "u5", bio: "Runs a distributed creator media team shipping AI-assisted content systems.", followers: 14520 }, relatedThreads: [], trendingThreads: [] },
  insights: {
    summary: "Candidates appreciate compensation clarity; most questions focus on expected technical depth and ownership scope.",
    keyAgreements: ["Compensation transparency is strong.", "Required/preferred split is clear.", "Process stage visibility improves trust."],
    openQuestions: [{ id: "oq-gigs-1", question: "Is prior production incident experience mandatory?", commentId: "tcom-gigs-1" }],
    topContributor: { userId: "u2", topCommentId: "tcom-gigs-1", excerpt: "Can you clarify expected ownership boundaries for deployment reliability?" },
    genealogy: {
      buildsOn: [{ id: "launchpad-001", title: "Launchpad: PromptForge beta launch for creator onboarding", authorName: "Rachel Moore", engagementCount: 664, category: "launch-pad" }],
      contradicts: [],
      canonical: { id: "help-001", title: "Need help: Next.js streaming mismatch with AI output hydration", authorName: "Marcus Johnson", engagementCount: 588, category: "help" },
    },
  },
  categoryData: {
    roleTitle: "AI Workflow Engineer",
    employmentType: "contract",
    location: "remote",
    compensationRange: "$6,000–$8,500 / month",
    durationOrStart: "4-month contract · start April 2026",
    posterNote:
      "We care more about evidence of shipped systems than polished resumes. If you can show pragmatic thinking under production constraints, you’re a fit.",
    skills: [
      { label: "TypeScript", required: true },
      { label: "Next.js", required: true },
      { label: "Prompt Systems", required: true },
      { label: "Observability", required: true },
      { label: "UX Writing", required: false },
      { label: "Growth Analytics", required: false },
    ],
    applicantCount: 24,
    status: "open",
    processStage: "screening",
    fitChecklist: ["Built production AI workflow", "Can debug frontend + model interaction failures", "Can communicate trade-offs clearly"],
    marketContext: {
      currentRange: "$6,000–$8,500",
      platformRange: "$5,200–$9,100",
    },
  },
  qualityDimensions: { novelty: 58, verifiability: 76, actionability: 90, synthesis: 67 },
  alien: {
    updates: [],
    coAuthors: ["u5"],
    serendipity: [{ id: "showcase-001", title: "Showcase: conversion-focused onboarding redesign", authorName: "Sophia Patel", engagementCount: 719, category: "showcase" }],
  },
};

export const gigsThread: ThreadData = {
  ...baseThread,
  sidebar: buildSidebar(baseThread),
};

export const gigsComments: ThreadComment[] = [
  {
    id: "tcom-gigs-1",
    threadId: "gigs-001",
    authorId: "u2",
    body: "Can you clarify expected ownership boundaries for deployment reliability vs feature implementation?",
    createdAt: "2026-03-20T12:12:00.000Z",
    upvotes: 19,
    downvotes: 0,
    partition: "question",
    intentTag: "question",
  },
  {
    id: "tcom-gigs-2",
    threadId: "gigs-001",
    authorId: "u1",
    body: "Interested. I’ve shipped 3 AI-assisted editorial systems and can share relevant architecture breakdowns.",
    createdAt: "2026-03-20T12:26:00.000Z",
    upvotes: 22,
    downvotes: 1,
    partition: "response",
    intentTag: "resource",
    candidateShowcaseProof: [
      { id: "pow-1", title: "AI Briefing Dashboard", href: "/discussion/showcase-001" },
      { id: "pow-2", title: "Workflow Reliability Postmortem", href: "/discussion/help-001" },
    ],
  },
];
