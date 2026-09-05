import type { CategoryKey } from "./category";
import type { ContentReference } from "./platform";

export type ContributionTag = "evidence" | "counterpoint" | "question" | "resource" | "solution";

export interface ThreadComment {
  id: string;
  threadId: string;
  parentId: string | null;
  authorId: string;
  body: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  tags?: ContributionTag[];
  fallacyTags?: string[];
  isSolution?: boolean;
  /** Gigs MAX: "question" | "application" */
  gigsPartition?: "question" | "application";
  showcaseThemes?: ("ux" | "visual" | "technical" | "other")[];
  proofOfWorkSlugs?: string[];
  /** Showcase MAX: percent coords "x,y" for "See in media" */
  mediaPin?: string;
}

export interface InsightRailContent {
  summary: string;
  keyAgreements: string[];
  openQuestions: { text: string; anchorId: string }[];
  topContributor: {
    userId: string;
    excerpt: string;
  };
}

export interface NewsSource {
  name: string;
  url?: string;
  favicon?: string;
  stance: "confirms" | "skeptical" | "contradicts";
  credibility?: "independent" | "corporate" | "government" | "community";
}

export interface NewsBody {
  sourceName: string;
  sourceUrl?: string;
  sourceFavicon?: string;
  publishedAt: string;
  updatedAt?: string;
  isOriginalReporting: boolean;
  corroboration: NewsSource[];
  timeline: { date: string; label: string; anchorId: string }[];
  conflictingSummary?: { claim: string; sourceName: string };
}

export interface ReviewCriterion {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  weightPercent: number;
}

export interface ReviewBody {
  productName: string;
  productUrl: string;
  productLogo?: string;
  reviewerContextNote: string;
  verdict: "recommended" | "caveats" | "not_recommended";
  verdictRationale: string;
  starRating: number;
  criteria: ReviewCriterion[];
  reviewerContextMax: { label: string; value: string }[];
  sentiment: { agreePct: number; disagreePct: number; agreeQuote: string; disagreeQuote: string };
}

export interface CompareOption {
  id: string;
  name: string;
  logo?: string;
  overallScore: number;
  bestFor: string;
  isCommunityPick?: boolean;
  scores: Record<string, number>;
}

export interface CompareBody {
  criteriaLabels: string[];
  options: CompareOption[];
  scenarios: { id: string; label: string; winnerId: string; rationale: string }[];
}

export type LaunchStage = "idea" | "prototype" | "beta" | "live";

export interface LaunchpadBody {
  heroImage: string;
  productName: string;
  logo?: string;
  tagline: string;
  stage: LaunchStage;
  productUrl: string;
  waitlistCount?: number;
  makerNote: string;
  feedbackChips: string[];
  milestones: { date: string; label: string; upcoming?: boolean }[];
  changelog: { version: string; date: string; summary: string; current?: boolean }[];
  builtWith: string[];
}

export interface DebateArgumentNode {
  id: string;
  claim: string;
  side: "for" | "against";
  relation?: "supports" | "counters";
  parentId: string | null;
  commentAnchorId: string;
  children?: DebateArgumentNode[];
}

export interface DebateBody {
  motion: string;
  status: "open" | "closed" | "resolved";
  votes: { agree: number; disagree: number; abstain: number };
  forArguments: { id: string; claim: string; strength: "strong" | "medium"; upvotes: number }[];
  againstArguments: { id: string; claim: string; strength: "strong" | "medium"; upvotes: number }[];
  argumentTree: DebateArgumentNode[];
  commonGround: string[];
}

export interface QaBody {
  goal: string;
  tried: string[];
  stuck: string;
  environment: string[];
  solved: boolean;
  solutionCommentId?: string;
  reproducibilityCount: number;
  diagnosticSteps: { label: string; tried: boolean }[];
}

export interface ListBody {
  purpose: string;
  audience: string;
  whyExists: string;
  criteria: { met: boolean; text: string }[];
  lastUpdated: string;
  contributorCount: number;
  ongoing?: boolean;
  targetCount?: number;
  currentCount: number;
  items: {
    rank: number;
    name: string;
    logo?: string;
    categoryChip: string;
    stars: number;
    blurb: string;
    detail?: string;
    lensRanks: Record<string, number>;
  }[];
  lenses: { id: string; label: string }[];
  coverageGaps: { text: string; context: string }[];
}

export interface ShowcaseBody {
  media: { type: "image" | "video"; src: string; thumb?: string; caption: string }[];
  creatorIntent: string;
  feedbackChips: string[];
  versions: { version: string; date: string; note: string; current?: boolean }[];
}

export interface GigsBody {
  roleTitle: string;
  employment: "full-time" | "part-time" | "contract" | "one-off";
  location: "remote" | "on-site" | "hybrid";
  budget?: string;
  duration?: string;
  startDate?: string;
  incompleteFields?: ("budget" | "duration")[];
  requiredSkills: string[];
  preferredSkills: string[];
  posterNote: string;
  applicantCount: number;
  isOpen: boolean;
  processStage: "applied" | "screening" | "interview" | "offer";
  stages: string[];
}

export interface DiscussionThreadBase {
  id: string;
  slug: string;
  category: CategoryKey;
  title: string;
  body: string;
  authorId: string;
  createdAt: string;
  updatedAt?: string;
  views: number;
  upvotes: number;
  bookmarks: number;
  tags: string[];
  aiSummary: string;
  comments: ThreadComment[];
  insightRail: InsightRailContent;
  relatedSlugs: string[];
  trendingSlugs: string[];
  /** The forumPosts._id — present for real posts and rich threads with a matching post row */
  postId?: string;
  viewerHasUpvoted?: boolean;
  viewerHasBookmarked?: boolean;
  /** Cross-app content references (e.g. marketplace listings, seller products). */
  contentReferences?: ContentReference[];
}

export type DiscussionThread =
  | (DiscussionThreadBase & { category: "news"; categoryBody: NewsBody })
  | (DiscussionThreadBase & { category: "review"; categoryBody: ReviewBody })
  | (DiscussionThreadBase & { category: "compare"; categoryBody: CompareBody })
  | (DiscussionThreadBase & { category: "launch-pad"; categoryBody: LaunchpadBody })
  | (DiscussionThreadBase & { category: "debate"; categoryBody: DebateBody })
  | (DiscussionThreadBase & { category: "qa"; categoryBody: QaBody })
  | (DiscussionThreadBase & { category: "list"; categoryBody: ListBody })
  | (DiscussionThreadBase & { category: "showcase"; categoryBody: ShowcaseBody })
  | (DiscussionThreadBase & { category: "gigs"; categoryBody: GigsBody })
  | (DiscussionThreadBase & { category: "spark"; categoryBody?: Record<string, unknown> })
  | (DiscussionThreadBase & { categoryBody?: Record<string, unknown> });
