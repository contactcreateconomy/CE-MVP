/**
 * Static seed rows — post-type taxonomy per the locked spec (2026-08-31 correction).
 *
 * 8 active types: news · review · compare · qa(help) · spark · debate · list · showcase.
 * launch-pad + gigs: DAU-locked (admin flip via postTypeConfig.state, CAP-104) — NOT point-paywalled.
 * news: platform-injected only (M2); not member-composable (CAP-086 / W2-E1).
 */

type CategorySeedRow = {
  key: string;
  name: string;
  icon: string;
  description: string;
  primaryColor: string;
  /** true only for DAU-locked types (launch-pad, gigs) — hidden until admin flip. */
  lockedByDefault: boolean;
  pointsToUnlock?: number;
};

export const categoryRows: CategorySeedRow[] = [
  {
    key: "news",
    name: "News",
    icon: "newspaper",
    description: "AI ecosystem updates and platform launches.",
    primaryColor: "#3B82F6",
    lockedByDefault: false,
  },
  {
    key: "review",
    name: "Review",
    icon: "star",
    description: "Hands-on reviews of AI tools and workflows.",
    primaryColor: "#8B5CF6",
    lockedByDefault: false,
  },
  {
    key: "compare",
    name: "Compare",
    icon: "git-compare",
    description: "Side-by-side comparisons for better decisions.",
    primaryColor: "#22C55E",
    lockedByDefault: false,
  },
  {
    key: "qa",
    name: "Help",
    icon: "help-circle",
    description: "Ask questions, share answers, and learn together.",
    primaryColor: "#14B8A6",
    lockedByDefault: false,
  },
  {
    key: "spark",
    name: "Spark",
    icon: "zap",
    description: "Short takes and one-line statements.",
    primaryColor: "#A855F7",
    lockedByDefault: false,
  },
  {
    key: "debate",
    name: "Debate",
    icon: "swords",
    description: "Structured opposing takes from power users.",
    primaryColor: "#EF4444",
    lockedByDefault: false,
  },
  {
    key: "list",
    name: "List",
    icon: "layout-list",
    description: "Curated stacks and ranked resources.",
    primaryColor: "#F97316",
    lockedByDefault: false,
  },
  {
    key: "showcase",
    name: "Showcase",
    icon: "sparkles",
    description: "Ship logs, launches, and real outcomes.",
    primaryColor: "#EC4899",
    lockedByDefault: false,
  },
  {
    key: "launch-pad",
    name: "Launch Pad",
    icon: "rocket",
    description: "Monetization and launch strategy discussions.",
    primaryColor: "#F59E0B",
    lockedByDefault: true,
  },
  {
    key: "gigs",
    name: "Gigs",
    icon: "briefcase",
    description: "Creator jobs, collaborations, and requests.",
    primaryColor: "#EAB308",
    lockedByDefault: true,
  },
];

export const profileSeeds = [
  {
    seedKey: "u1",
    name: "Emily Zhang",
    handle: "emilyai",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=256&h=256&fit=crop&crop=faces",
    bio: "I test AI writing systems in production editorial teams.",
    level: 6,
    points: 14240,
    streakDays: 29,
    verified: true,
    role: "member" as const,
  },
  {
    seedKey: "u2",
    name: "Marcus Johnson",
    handle: "marcusdev",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&h=256&fit=crop&crop=faces",
    bio: "Building autonomous agents for creator funnels.",
    level: 7,
    points: 21780,
    streakDays: 42,
    role: "member" as const,
  },
  {
    seedKey: "u3",
    name: "Sophia Patel",
    handle: "sophiacreates",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces",
    bio: "Artist turned AI-native visual storyteller.",
    level: 5,
    points: 8930,
    streakDays: 14,
    verified: true,
    role: "member" as const,
  },
  {
    seedKey: "u4",
    name: "David Kim",
    handle: "davidk",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces",
    bio: "Product + growth operator for AI startups.",
    level: 4,
    points: 4680,
    streakDays: 9,
    role: "moderator" as const,
  },
  {
    seedKey: "u5",
    name: "Rachel Moore",
    handle: "rachelcodes",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces",
    bio: "Turned AI templates into a full-time business.",
    level: 8,
    points: 30220,
    streakDays: 63,
    verified: true,
    role: "member" as const,
  },
];

export const campaignRows = [
  {
    title: "7-Day AI Workflow Sprint",
    description: "Publish one workflow teardown per day for a week.",
    rewardPoints: 750,
    endsAt: "2026-03-10T00:00:00.000Z",
    participants: 412,
  },
  {
    title: "Tool Review Marathon",
    description: "Post 3 tool reviews with reproducible criteria.",
    rewardPoints: 500,
    endsAt: "2026-03-16T00:00:00.000Z",
    participants: 287,
  },
  {
    title: "Community Q&A Week",
    description: "Answer 10 unresolved Q&A threads.",
    rewardPoints: 420,
    endsAt: "2026-03-05T00:00:00.000Z",
    participants: 196,
  },
];

export const vibingRows = [
  { kind: "campaign" as const, label: "Freelance gig for an AI strategy sprint with a fast-moving fintech startup", href: "/feed?sort=hot", engagedUsers: 2847 },
  { kind: "discussion" as const, label: "Hiring now: AI content strategist to run creator campaigns across three product launches", href: "/feed?category=debate&sort=top", engagedUsers: 2419 },
  { kind: "post" as const, label: "Open thread: share your best AI workflow for rapid brand positioning and messaging", href: "/feed?sort=top", engagedUsers: 1986 },
  { kind: "update" as const, label: "Creator analytics beta is live with audience cohort snapshots", href: "/feed?sort=new", engagedUsers: 1724 },
  { kind: "creator" as const, label: "Community picks: 5 launch-ready tools creators used this week", href: "/feed?category=showcase&sort=hot", engagedUsers: 1598 },
  { kind: "campaign" as const, label: "Micro-gigs challenge: submit your one-day growth sprint results", href: "/feed?category=gigs&sort=hot", engagedUsers: 1442 },
  { kind: "discussion" as const, label: "What pricing model is converting best for AI productized services?", href: "/feed?sort=new", engagedUsers: 1327 },
  { kind: "post" as const, label: "Template drop: AI client onboarding checklist for freelance strategists", href: "/feed?category=list&sort=top", engagedUsers: 1189 },
  { kind: "update" as const, label: "Weekly digest: creator teams doubled output with lean content systems", href: "/feed?sort=fav", engagedUsers: 1046 },
  { kind: "creator" as const, label: "Showcase: solo founder built a viral waitlist using AI ad concepts", href: "/feed?category=showcase&sort=top", engagedUsers: 963 },
];

export const heroSlideRows = [
  { legacyPostKey: "p1", shares: 1480, eyebrow: "Editor’s Pick", ctaLabel: "Read", accentRgb: "14 165 233" },
  { legacyPostKey: "p14", shares: 1125, eyebrow: "Trending Deep Dive", ctaLabel: "Read", accentRgb: "99 102 241" },
  { legacyPostKey: "p19", shares: 1295, eyebrow: "Creator Playbook", ctaLabel: "Read", accentRgb: "236 72 153" },
  { legacyPostKey: "p27", shares: 986, eyebrow: "Build in Public", ctaLabel: "Read", accentRgb: "34 197 94" },
  { legacyPostKey: "p39", shares: 1204, eyebrow: "Launch Story", ctaLabel: "Read", accentRgb: "168 85 247" },
  { legacyPostKey: "p44", shares: 1572, eyebrow: "Workflow Sprint", ctaLabel: "Read", accentRgb: "249 115 22" },
  { legacyPostKey: "p53", shares: 1108, eyebrow: "Creator Debate", ctaLabel: "Read", accentRgb: "244 63 94" },
  { legacyPostKey: "p61", shares: 934, eyebrow: "Q&A Highlight", ctaLabel: "Read", accentRgb: "56 189 248" },
  { legacyPostKey: "p74", shares: 1411, eyebrow: "Top Lists", ctaLabel: "Read", accentRgb: "234 179 8" },
  { legacyPostKey: "p88", shares: 1022, eyebrow: "Talent Spotlight", ctaLabel: "Read", accentRgb: "20 184 166" },
];
