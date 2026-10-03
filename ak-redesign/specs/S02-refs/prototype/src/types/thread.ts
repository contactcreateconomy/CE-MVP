import type { CategoryKey } from "./category";

export type ThreadMode = "min" | "max";

export type ThreadId =
  | "news-001"
  | "review-001"
  | "compare-001"
  | "launchpad-001"
  | "debate-001"
  | "help-001"
  | "list-001"
  | "showcase-001"
  | "gigs-001";

export type SourceStance = "confirms" | "skeptical" | "contradicts";

export type SourceCredibility = "independent" | "corporate" | "government" | "community";

export type DebateStatus = "open" | "closed" | "resolved";

export type LaunchStage = "idea" | "prototype" | "beta" | "live";

export type EmploymentType = "full-time" | "part-time" | "contract" | "one-off";

export type WorkLocation = "remote" | "on-site" | "hybrid";

export type VerdictLabel = "recommended" | "with-caveats" | "not-recommended";

export type ArgumentStrength = "strong" | "medium";

export type CommentIntentType =
  | "evidence"
  | "counterpoint"
  | "question"
  | "resource"
  | "solution"
  | "implementation-note"
  | "decision-proposal";

export interface CompactThreadReference {
  id: ThreadId;
  title: string;
  authorName: string;
  engagementCount: number;
  category: CategoryKey;
}

export interface ThreadSource {
  name: string;
  faviconUrl?: string;
  publishedAt: string;
  readOriginalUrl?: string;
  originalReportingHandle?: string;
}

export interface CorroborationSource {
  name: string;
  stance: SourceStance;
  claim: string;
  credibility?: SourceCredibility;
}

export interface ThreadHeaderData {
  category: CategoryKey;
  title: string;
  authorId: string;
  authorBadge: string;
  reputationLabel: string;
  postedAt: string;
  publishedAt?: string;
  updatedAt?: string;
  views: number;
  tags: string[];
  aiSummary: string;
  upvotes: number;
  commentsCount: number;
  bookmarks: number;
  staleAfterDays?: number;
  updatedSinceOriginalCount?: number;
}

export interface ThreadSidebarData {
  aboutAuthor: {
    authorId: string;
    bio: string;
    followers: number;
  };
  relatedThreads: CompactThreadReference[];
  trendingThreads: CompactThreadReference[];
}

export interface ThreadInsightRail {
  summary: string;
  keyAgreements: string[];
  openQuestions: Array<{ id: string; question: string; commentId?: string }>;
  topContributor: {
    userId: string;
    topCommentId: string;
    excerpt: string;
  };
  genealogy: {
    buildsOn: CompactThreadReference[];
    contradicts: CompactThreadReference[];
    canonical?: CompactThreadReference;
  };
}

export interface QualityDimension {
  novelty: number;
  verifiability: number;
  actionability: number;
  synthesis: number;
}

export interface DecisionRecord {
  status: "open" | "in-progress" | "decided" | "reopened";
  statement: string;
  owner: string;
  timestamp: string;
  followUpActions: string[];
}

export interface NewsThreadData {
  source: ThreadSource;
  corroboration: CorroborationSource[];
  timeline: Array<{ id: string; label: string; at: string; targetId?: string }>;
  conflictingReports: Array<{ leftSource: string; leftClaim: string; rightSource: string; rightClaim: string }>;
  sentimentPulse: { positive: number; neutral: number; negative: number };
}

export interface ReviewCriterion {
  label: string;
  score: number;
  weight: number;
}

export interface ReviewThreadData {
  productName: string;
  productLogoUrl?: string;
  productUrl: string;
  reviewerContextNote: string;
  verdict: {
    rating: number;
    label: VerdictLabel;
    rationale: string;
  };
  criteria: ReviewCriterion[];
  reviewerContext: string[];
  communitySentiment: {
    agreePct: number;
    disagreePct: number;
    topAgreeQuote: string;
    topDisagreeQuote: string;
  };
}

export interface CompareOption {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface CompareThreadData {
  options: CompareOption[];
  criteria: Array<{ key: string; label: string }>;
  scores: Record<string, Record<string, number>>;
  verdictCards: Array<{ optionId: string; overallScore: number; bestFor: string; communityPick?: boolean }>;
  scenarios: Array<{ id: string; label: string; recommendedOptionId: string; rationale: string }>;
  similarRowThreshold: number;
  communityOverride?: Record<string, Record<string, number>>;
}

export interface LaunchpadThreadData {
  media: { type: "image" | "video"; url: string };
  productName: string;
  productLogoUrl?: string;
  tagline: string;
  stage: LaunchStage;
  primaryCtaLabel: string;
  secondaryUrl: string;
  waitlistSignups?: number;
  makerNote: string;
  feedbackFocusAreas: string[];
  milestones: Array<{ id: string; title: string; date: string; upcoming?: boolean }>;
  changelog: Array<{ version: string; date: string; note: string }>;
  builtWith: string[];
}

export interface DebateArgument {
  id: string;
  side: "for" | "against";
  claim: string;
  strength: ArgumentStrength;
  upvotes: number;
}

export interface DebateTreeNode {
  id: string;
  claim: string;
  relation: "supports" | "counters";
  parentId?: string;
  linkedCommentId?: string;
}

export interface DebateThreadData {
  proposition: string;
  status: DebateStatus;
  voteDistribution: { agree: number; disagree: number; abstain: number; total: number };
  arguments: DebateArgument[];
  argumentTree: DebateTreeNode[];
  commonGround: string[];
  mindsChangedCount: number;
}

export interface HelpThreadData {
  problem: {
    tryingToDo: string;
    tried: string[];
    stuck: string;
  };
  environment: string[];
  solved: boolean;
  solutionCommentId?: string;
  reproducibilityCount: number;
  diagnosticPath: Array<{ label: string; state: "tried" | "suggested" }>;
  similarSolvedThreads: Array<{ id: ThreadId; title: string; snippet: string; solveTime: string }>;
}

export interface ListRankedItem {
  id: string;
  rank: number;
  name: string;
  logoUrl?: string;
  category: string;
  rating: number;
  note: string;
  details: string;
}

export interface ListThreadData {
  purpose: string;
  targetAudience: string;
  whyThisExists: string;
  criteria: string[];
  items: ListRankedItem[];
  lastUpdated: string;
  contributors: number;
  ongoing: boolean;
  lenses: Array<{ id: string; label: string }>;
  coverageGaps: Array<{ id: string; label: string; suggestionPrompt: string }>;
}

export interface ShowcaseMediaItem {
  id: string;
  type: "image" | "video" | "audio";
  url: string;
  caption: string;
}

export interface ShowcaseThreadData {
  media: ShowcaseMediaItem[];
  creatorIntent: string;
  feedbackTags: string[];
  versions: Array<{ label: string; date: string; note: string; current?: boolean; mediaId?: string }>;
  annotatedAreas: Array<{ commentId: string; mediaId: string; x: number; y: number }>;
}

export interface GigSkill {
  label: string;
  required: boolean;
}

export interface GigThreadData {
  roleTitle: string;
  employmentType: EmploymentType;
  location: WorkLocation;
  compensationRange: string;
  durationOrStart: string;
  posterNote: string;
  skills: GigSkill[];
  applicantCount: number;
  status: "open" | "closed";
  processStage: "applied" | "screening" | "interview" | "offer";
  fitChecklist: string[];
  marketContext: { currentRange: string; platformRange: string };
}

export interface AlienFeatureData {
  updates: Array<{ id: string; byHandle: string; at: string; content: string }>;
  coAuthors: string[];
  decision?: DecisionRecord;
  qualityDimensions?: QualityDimension;
  freshnessWarning?: { lastUpdatedDaysAgo: number; updateRequests: number };
  serendipity: CompactThreadReference[];
}

export interface ThreadData {
  id: ThreadId;
  category: CategoryKey;
  header: ThreadHeaderData;
  bodyMarkdown: string;
  sidebar: ThreadSidebarData;
  insights: ThreadInsightRail;
  categoryData:
    | NewsThreadData
    | ReviewThreadData
    | CompareThreadData
    | LaunchpadThreadData
    | DebateThreadData
    | HelpThreadData
    | ListThreadData
    | ShowcaseThreadData
    | GigThreadData;
  decision?: DecisionRecord;
  qualityDimensions?: QualityDimension;
  alien?: AlienFeatureData;
}
