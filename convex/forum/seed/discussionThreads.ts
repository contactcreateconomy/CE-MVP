// @ts-nocheck
/* Seed bundle; shapes mirror apps/forum discussion types */

function iso(month: number, day: number, hour = 12, minute = 0): string {
  return new Date(Date.UTC(2026, month - 1, day, hour, minute)).toISOString();
}

function rail(partial) {
  return {
    summary: partial.summary,
    keyAgreements: partial.keyAgreements ?? ["Practical, cited details beat hot takes.", "Community wants primary sources in replies."],
    openQuestions: partial.openQuestions ?? [],
    topContributor: partial.topContributor ?? { userId: "u2", excerpt: "Strong write-up — primary source link makes this easy to verify." },
  };
}

function threadComments(slug, opId, opts = undefined) {
  const c = (n: number) => `${slug}-c${n}`;
  const base = [
    {
      id: c(1),
      threadId: slug,
      parentId: null,
      authorId: "u2",
      body: "Strong write-up — the primary source link makes this easy to verify.",
      createdAt: iso(3, 2, 10),
      upvotes: 24,
      downvotes: 1,
      tags: ["evidence"],
    },
    {
      id: c(2),
      threadId: slug,
      parentId: c(1),
      authorId: "u3",
      body: "Worth noting the changelog dropped the same day — might explain the traffic spike.",
      createdAt: iso(3, 2, 11),
      upvotes: 9,
      downvotes: 0,
      tags: ["resource"],
      isSolution: opts?.solutionId === c(2),
    },
    {
      id: c(3),
      threadId: slug,
      parentId: c(2),
      authorId: opId,
      body: "Good catch — I folded that into the update paragraph above.",
      createdAt: iso(3, 2, 12),
      upvotes: 14,
      downvotes: 0,
      tags: ["evidence"],
    },
    {
      id: c(4),
      threadId: slug,
      parentId: c(3),
      authorId: "u4",
      body: "Nested reply level 3 — continue thread should appear in MIN.",
      createdAt: iso(3, 2, 13),
      upvotes: 5,
      downvotes: 0,
    },
    {
      id: c(5),
      threadId: slug,
      parentId: c(4),
      authorId: "u5",
      body: "Level 4 — visible in MAX nesting depth.",
      createdAt: iso(3, 2, 14),
      upvotes: 3,
      downvotes: 0,
    },
    {
      id: c(6),
      threadId: slug,
      parentId: c(5),
      authorId: "u2",
      body: "Level 5 — MAX only full depth.",
      createdAt: iso(3, 2, 15),
      upvotes: 2,
      downvotes: 0,
    },
    {
      id: c(7),
      threadId: slug,
      parentId: null,
      authorId: "u4",
      body: "Counterpoint: two analyst notes interpreted pricing differently.",
      createdAt: iso(3, 3, 9),
      upvotes: 7,
      downvotes: 2,
      tags: ["counterpoint"],
      fallacyTags: ["False Dichotomy"],
    },
    {
      id: c(8),
      threadId: slug,
      parentId: null,
      authorId: "u5",
      body: "Has anyone reproduced this on the free tier?",
      createdAt: iso(3, 3, 10),
      upvotes: 11,
      downvotes: 0,
      tags: ["question"],
    },
  ];
  return base;
}

const newsBody = {
  sourceName: "OpenAI Blog",
  sourceUrl: "https://openai.com/news",
  sourceFavicon: "https://www.google.com/s2/favicons?domain=openai.com&sz=64",
  publishedAt: iso(3, 1, 8),
  updatedAt: iso(3, 2, 14),
  isOriginalReporting: false,
  corroboration: [
    { name: "The Verge", stance: "confirms", credibility: "corporate" },
    { name: "Tech analyst note", stance: "skeptical", credibility: "independent" },
    { name: "Community thread", stance: "contradicts", credibility: "community" },
  ],
  timeline: [
    { date: "Mar 1", label: "Initial API changelog published", anchorId: "body" },
    { date: "Mar 2", label: "Major hosts confirm rollout timing", anchorId: "c1" },
    { date: "Mar 3", label: "Creators report mixed latency", anchorId: "c7" },
  ],
  conflictingSummary: { claim: "Free tier keeps prior limits", sourceName: "Community thread" },
};

const reviewBody = {
  productName: "Claude API (Sonnet 4)",
  productUrl: "https://anthropic.com",
  productLogo: "https://www.google.com/s2/favicons?domain=anthropic.com&sz=128",
  reviewerContextNote: "30-day trial · 2 production projects · API v1",
  verdict: "recommended",
  verdictRationale: "Best balance of instruction-following and cost for daily creator workflows.",
  starRating: 4.2,
  criteria: [
    { id: "acc", label: "Accuracy", score: 4.1, maxScore: 5, weightPercent: 35 },
    { id: "spd", label: "Speed", score: 3.8, maxScore: 5, weightPercent: 25 },
    { id: "cost", label: "Cost", score: 3.5, maxScore: 5, weightPercent: 20 },
    { id: "ux", label: "DX / tooling", score: 4.4, maxScore: 5, weightPercent: 20 },
  ],
  reviewerContextMax: [
    { label: "Duration", value: "30 days" },
    { label: "Plan", value: "Team" },
    { label: "Environment", value: "macOS · 3 builders" },
    { label: "Conflict", value: "None — paid out of pocket" },
  ],
  sentiment: {
    agreePct: 72,
    disagreePct: 18,
    agreeQuote: "Mirrors what we saw shipping captions weekly.",
    disagreeQuote: "Latency still spikes on long tool chains.",
  },
};

const compareBody = {
  criteriaLabels: ["Speed", "Accuracy", "Price", "UX"],
  options: [
    {
      id: "a",
      name: "Model A",
      overallScore: 82,
      bestFor: "Solo builders shipping fast",
      isCommunityPick: true,
      scores: { Speed: 9, Accuracy: 8, Price: 7, UX: 8 },
    },
    {
      id: "b",
      name: "Model B",
      overallScore: 79,
      bestFor: "Teams needing compliance trails",
      scores: { Speed: 7, Accuracy: 9, Price: 6, UX: 7 },
    },
    {
      id: "c",
      name: "Model C",
      overallScore: 74,
      bestFor: "Budget-conscious experiments",
      scores: { Speed: 8, Accuracy: 7, Price: 9, UX: 6 },
    },
  ],
  scenarios: [
    { id: "s1", label: "Solo dev on a budget", winnerId: "c", rationale: "Model C wins on price while staying fast enough." },
    { id: "s2", label: "Agency with a team", winnerId: "b", rationale: "Accuracy and auditability matter more than raw speed." },
    { id: "s3", label: "Enterprise + compliance", winnerId: "b", rationale: "Strongest accuracy and enterprise posture." },
    { id: "s4", label: "Viral content velocity", winnerId: "a", rationale: "Highest speed and polished UX for iteration." },
  ],
};

const launchBody = {
  heroImage: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=675&fit=crop",
  productName: "ClipSmith AI",
  tagline: "One-click rough cuts from long-form talking head footage.",
  stage: "beta",
  productUrl: "https://example.com/clipsmith",
  waitlistCount: 1280,
  makerNote:
    "I built this after burning weekends editing podcast video. Beta testers cut edit time ~40% — I need honest feedback on onboarding step 3 and whether pricing feels fair for indies.",
  feedbackChips: ["Onboarding clarity", "Pricing model", "Target audience fit"],
  milestones: [
    { date: "Jan 2026", label: "Private alpha with 12 creators" },
    { date: "Feb 2026", label: "Beta waitlist opens", upcoming: false },
    { date: "Apr 2026", label: "Public launch target", upcoming: true },
  ],
  changelog: [
    { version: "v0.3.0", date: iso(3, 1), summary: "Timeline snapping + keyboard shortcuts", current: true },
    { version: "v0.2.0", date: iso(2, 15), summary: "Batch export + captions preview" },
  ],
  builtWith: ["Next.js", "Convex", "FFmpeg wasm", "Vercel"],
};

const debateBody = {
  motion: "AI will make 80% of SaaS tools irrelevant within 3 years.",
  status: "open",
  votes: { agree: 42, disagree: 38, abstain: 12 },
  forArguments: [
    { id: "f1", claim: "Distribution and UX collapse to a few agent hosts.", strength: "strong", upvotes: 56 },
    { id: "f2", claim: "Integration cost drops — glue SaaS loses moat.", strength: "medium", upvotes: 31 },
  ],
  againstArguments: [
    { id: "a1", claim: "Regulated industries still need auditable vertical SaaS.", strength: "strong", upvotes: 48 },
    { id: "a2", claim: "Data residency and contracts slow consolidation.", strength: "medium", upvotes: 22 },
  ],
  argumentTree: [
    {
      id: "root1",
      claim: "Agent hosts subsume narrow workflow tools",
      side: "for",
      parentId: null,
      commentAnchorId: "c1",
      children: [
        {
          id: "ch1",
          claim: "Except where compliance requires dedicated stacks",
          side: "against",
          relation: "counters",
          parentId: "root1",
          commentAnchorId: "c7",
          children: [],
        },
      ],
    },
  ],
  commonGround: [
    "Everyone agrees model capability is improving faster than most roadmaps assumed.",
    "Both sides see SMBs adopting bundled AI features first.",
  ],
};

const qaBody = {
  goal: "Ship Server Actions that call Convex mutations without double-submit races.",
  tried: ["Debounced client button", "useTransition", "Optimistic updates"],
  stuck: "Users on slow networks occasionally fire two mutations; seeing duplicate rows in mock UI.",
  environment: ["Next.js 16", "Convex", "Vercel"],
  solved: true,
  solutionCommentId: "qa-001-c2",
  reproducibilityCount: 14,
  diagnosticSteps: [
    { label: "Disable optimistic insert", tried: true },
    { label: "Add idempotency key on mutation", tried: false },
    { label: "Server-side dedupe by session", tried: false },
  ],
};

const listBody = {
  purpose: "Best AI tools for YouTube creators in 2026",
  audience: "Solo + small team creators publishing 3+ videos/week",
  whyExists: "Creators waste budget on overlapping tools — this list enforces strict inclusion criteria.",
  criteria: [
    { met: true, text: "Must save 2+ hours/week for typical workflow" },
    { met: true, text: "Price under $50/month or generous free tier" },
    { met: true, text: "Available globally without VPN games" },
  ],
  lastUpdated: iso(3, 3),
  contributorCount: 6,
  ongoing: true,
  targetCount: 12,
  currentCount: 5,
  items: [
    {
      rank: 1,
      name: "Descript",
      categoryChip: "Editing",
      stars: 4.6,
      blurb: "Text-based video edit still fastest for talking heads.",
      detail: "Strong for cuts and filler words; less for heavy color work.",
      lensRanks: { editors: 1, value: 2, popular: 1, beginner: 2, custom: 1 },
    },
    {
      rank: 2,
      name: "Opus Clip",
      categoryChip: "Clipping",
      stars: 4.4,
      blurb: "Auto shorts from long video with decent hooks.",
      detail: "Great for repurposing; review captions before publish.",
      lensRanks: { editors: 3, value: 1, popular: 2, beginner: 1, custom: 2 },
    },
    {
      rank: 3,
      name: "Epidemic Sound",
      categoryChip: "Audio",
      stars: 4.5,
      blurb: "Licensing clarity beats random royalty-free packs.",
      detail: "Worth it if music is core to your brand.",
      lensRanks: { editors: 2, value: 3, popular: 3, beginner: 3, custom: 3 },
    },
  ],
  lenses: [
    { id: "editors", label: "Editor's choice" },
    { id: "value", label: "Best value" },
    { id: "popular", label: "Most popular" },
    { id: "beginner", label: "Beginner-friendly" },
    { id: "custom", label: "Custom" },
  ],
  coverageGaps: [
    { text: "Only one strong Audio pick", context: "Add a budget-friendly audio tool" },
    { text: "Thumbnail design tools underrepresented", context: "Criteria allow under $50/mo" },
  ],
};

const showcaseBody = {
  media: [
    {
      type: "image",
      src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=675&fit=crop",
      thumb: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=120&fit=crop",
      caption: "Dashboard v2 — density vs clarity experiment",
    },
    {
      type: "image",
      src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=675&fit=crop",
      thumb: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=120&fit=crop",
      caption: "Analytics drill-in state",
    },
  ],
  creatorIntent:
    "I was trying to achieve a calmer hierarchy for first-time users without dumbing down power features — progressive disclosure via row expansion.",
  feedbackChips: ["UX Flow", "Visual Hierarchy", "Error Handling"],
  versions: [
    { version: "v2.0", date: iso(3, 2), note: "Tighter spacing + new empty state", current: true },
    { version: "v1.0", date: iso(2, 1), note: "Initial public mock" },
  ],
};

const gigsBody = {
  roleTitle: "Senior AI Workflow Designer (Contract)",
  employment: "contract",
  location: "remote",
  budget: "$90–110/hr",
  duration: "3 months, option to extend",
  startDate: "April 2026",
  requiredSkills: ["Next.js", "Convex", "Prompt systems", "Analytics"],
  preferredSkills: ["Video pipelines", "Design systems"],
  posterNote:
    "We're a lean media team (8 people) shipping weekly shows. Looking for someone who documents decisions and pairs with our editor — no agencies please.",
  applicantCount: 24,
  isOpen: true,
  processStage: "screening",
  stages: ["Applied", "Screening", "Interview", "Offer"],
  incompleteFields: [],
};

export const discussionThreads = [
  {
    id: "t-news-001",
    slug: "news-001",
    category: "news",
    title: "Major model hosts publish unified latency SLOs — what creators should expect",
    body: "Yesterday several providers aligned on how they report p95 latency. Here is what changed, what stayed marketing, and what to watch when you route production traffic.\n\nThe short version: cold start numbers are now split from steady-state, which makes comparisons actually possible.",
    authorId: "u1",
    createdAt: iso(3, 1, 9),
    updatedAt: iso(3, 2, 15),
    views: 12800,
    upvotes: 640,
    bookmarks: 112,
    tags: ["AI Tools", "Claude API", "Workflow"],
    aiSummary: "Providers updated latency reporting; thread breaks down what moved for creator production workloads.",
    comments: threadComments("news-001", "u1"),
    insightRail: rail({
      summary: "Readers want primary sources; disagreement centers on free-tier behavior.",
      openQuestions: [{ text: "Does this affect EU routing?", anchorId: "news-001-c8" }],
    }),
    relatedSlugs: ["review-001", "compare-001", "qa-001"],
    trendingSlugs: ["debate-001", "list-001", "showcase-001"],
    categoryBody: newsBody,
  },
  {
    id: "t-review-001",
    slug: "review-001",
    category: "review",
    title: "30 days with Claude API for batch caption QA — the honest breakdown",
    body: "I pushed the API through daily caption QA for a 4-person content team. Below is what held up, what broke, and the criteria I scored against.",
    authorId: "u2",
    createdAt: iso(3, 2, 10),
    views: 9200,
    upvotes: 512,
    bookmarks: 98,
    tags: ["Review", "API", "Team"],
    aiSummary: "Hands-on review with weighted criteria; verdict recommended with minor latency caveats.",
    comments: threadComments("review-001", "u2"),
    insightRail: rail({ summary: "Community largely agrees on accuracy; debates latency under load." }),
    relatedSlugs: ["news-001", "compare-001"],
    trendingSlugs: ["launchpad-001", "gigs-001"],
    categoryBody: reviewBody,
  },
  {
    id: "t-compare-001",
    slug: "compare-001",
    category: "compare",
    title: "Head-to-head: three frontier APIs for weekly creator ops",
    body: "Same prompts, same eval harness, same budget cap. Use the scorecard to see how each option shifts if you weight speed vs accuracy.",
    authorId: "u3",
    createdAt: iso(3, 2, 11),
    views: 7400,
    upvotes: 410,
    bookmarks: 76,
    tags: ["Compare", "API", "Budget"],
    aiSummary: "Side-by-side table with community pick; MAX mode supports custom weights.",
    comments: threadComments("compare-001", "u3"),
    insightRail: rail({ summary: "Model A wins velocity; Model B wins compliance-heavy teams." }),
    relatedSlugs: ["review-001", "news-001"],
    trendingSlugs: ["list-001", "debate-001"],
    categoryBody: compareBody,
  },
  {
    id: "t-launch-001",
    slug: "launchpad-001",
    category: "launch-pad",
    title: "ClipSmith AI — beta waitlist open for creators drowning in rough cuts",
    body: "ClipSmith turns long talking-head takes into tight first cuts. Built for YouTube + podcast repurposing. Join the beta if you publish weekly and want your time back.",
    authorId: "u1",
    createdAt: iso(3, 1, 14),
    views: 5600,
    upvotes: 388,
    bookmarks: 120,
    tags: ["Launch", "Video", "Beta"],
    aiSummary: "Beta video tool focused on rough cuts; maker requests onboarding and pricing feedback.",
    comments: threadComments("launchpad-001", "u1"),
    insightRail: rail({ summary: "Early testers care about onboarding clarity and export reliability." }),
    relatedSlugs: ["showcase-001", "gigs-001"],
    trendingSlugs: ["news-001", "review-001"],
    categoryBody: launchBody,
  },
  {
    id: "t-debate-001",
    slug: "debate-001",
    category: "debate",
    title: "Motion: AI will make 80% of SaaS irrelevant in three years",
    body: "Structured debate — vote after reading the top arguments on both sides. Keep it evidence-forward; no personal swipes.",
    authorId: "u4",
    createdAt: iso(2, 28, 16),
    views: 15100,
    upvotes: 720,
    bookmarks: 54,
    tags: ["Debate", "SaaS", "Future"],
    aiSummary: "Split vote; strongest tension between agent consolidation vs regulated vertical software.",
    comments: threadComments("debate-001", "u4"),
    insightRail: rail({
      summary: "Both sides agree capability curves are steep; disagree on regulation and switching costs.",
      keyAgreements: debateBody.commonGround,
      openQuestions: [{ text: "Where is the real disagreement after accounting for regulation?", anchorId: "debate-001-c7" }],
    }),
    relatedSlugs: ["news-001", "list-001"],
    trendingSlugs: ["compare-001", "qa-001"],
    categoryBody: debateBody,
  },
  {
    id: "t-qa-001",
    slug: "qa-001",
    category: "qa",
    title: "Double Convex mutations on slow networks — how do you dedupe?",
    body: "I'm calling a mutation from a Server Action. On 3G testers I sometimes see duplicate rows. Error logs look clean. Full context in the structured block below.\n\n```ts\n// Example call site\nawait fetchMutation(api.items.create, { text });\n```",
    authorId: "u5",
    createdAt: iso(3, 2, 8),
    views: 3200,
    upvotes: 198,
    bookmarks: 45,
    tags: ["Q&A", "Convex", "Next.js"],
    aiSummary: "Solved thread: community converged on idempotency keys + server-side guards.",
    comments: threadComments("qa-001", "u5", { solutionId: "qa-001-c2" }),
    insightRail: rail({ summary: "Helpers suggest idempotency and disabling double-submit on slow links." }),
    relatedSlugs: ["news-001", "review-001"],
    trendingSlugs: ["launchpad-001", "gigs-001"],
    categoryBody: qaBody,
  },
  {
    id: "t-list-001",
    slug: "list-001",
    category: "list",
    title: "Curated: best AI tools for YouTube creators (2026 edition)",
    body: "This list enforces the criteria before the tools. If something is missing, propose additions that meet every checkbox.",
    authorId: "u2",
    createdAt: iso(3, 3, 9),
    views: 8800,
    upvotes: 502,
    bookmarks: 210,
    tags: ["List", "YouTube", "Tools"],
    aiSummary: "Ranked tools with explicit inclusion rules; MAX mode supports alternate sort lenses.",
    comments: threadComments("list-001", "u2"),
    insightRail: rail({ summary: "Readers want more audio + thumbnail picks under the stated caps." }),
    relatedSlugs: ["review-001", "compare-001"],
    trendingSlugs: ["showcase-001", "news-001"],
    categoryBody: listBody,
  },
  {
    id: "t-show-001",
    slug: "showcase-001",
    category: "showcase",
    title: "Dashboard v2 — calmer hierarchy for first-time analytics users",
    body: "Shipping a denser analytics home without losing approachability. Looking for surgical feedback on flow and visual hierarchy.",
    authorId: "u3",
    createdAt: iso(3, 2, 18),
    views: 4100,
    upvotes: 276,
    bookmarks: 62,
    tags: ["Showcase", "UX", "Dashboard"],
    aiSummary: "Visual showcase with explicit feedback tags; MAX supports themed comment grouping.",
    comments: threadComments("showcase-001", "u3").map((co, i) => {
      const themes = ["ux", "visual", "technical", "other"] as const;
      const row = { ...co, showcaseThemes: [themes[i % 4]] };
      if (co.id === "showcase-001-c3") {
        return { ...row, mediaPin: "48,36" };
      }
      return row;
    }),
    insightRail: rail({ summary: "Feedback clusters around information density vs discoverability." }),
    relatedSlugs: ["launchpad-001", "list-001"],
    trendingSlugs: ["gigs-001", "debate-001"],
    categoryBody: showcaseBody,
  },
  {
    id: "t-gigs-001",
    slug: "gigs-001",
    category: "gigs",
    title: "Contract: Senior AI workflow designer for weekly video pipeline",
    body: "We're hiring a contract workflow designer to harden our AI-assisted editing pipeline. Read the card for scope, skills, and how to apply.",
    authorId: "u1",
    createdAt: iso(3, 1, 11),
    views: 2900,
    upvotes: 94,
    bookmarks: 28,
    tags: ["Gigs", "Contract", "Video"],
    aiSummary: "Remote contract role with clear skills split; apply via modal (mock).",
    comments: threadComments("gigs-001", "u1").map((co, i) => ({
      ...co,
      gigsPartition: i % 2 === 0 ? "question" : "application",
      proofOfWorkSlugs: i === 1 ? ["showcase-001"] : undefined,
    })),
    insightRail: rail({ summary: "Candidates ask about hours and handoff format; posters want concise portfolios." }),
    relatedSlugs: ["qa-001", "launchpad-001"],
    trendingSlugs: ["review-001", "compare-001"],
    categoryBody: gigsBody,
  },
];

export function getDiscussionThreadBySlug(slug) {
  return discussionThreads.find((t) => t.slug === slug) ?? null;
}
