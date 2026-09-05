// Static seed data for content page sandbox — no Convex, no DB.
// When connecting to the real platform, replace these imports with Convex query results.

export type StanceTag = "question" | "answer" | "story" | "critique" | "supportive" | "resource";
export type RoleTag = "creator" | "moderator" | "top-contributor" | "verified-buyer" | "new";

export interface SeedAuthor {
  id: string;
  name: string;
  handle: string;
  initials: string;
  role: RoleTag;
  badges: string[];
  verified: boolean;
  bio: string;
  followers: number;
  following: number;
  rating: number;
  location?: string;
  joinedMonthsAgo: number;
}

export interface SeedProduct {
  id: string;
  title: string;
  description: string;
  price: number;
}

export interface SeedAITheme {
  id: string;
  name: string;
  count: number;
  description: string;
}

export interface SeedRelatedThread {
  id: string;
  title: string;
  authorName: string;
  authorHandle: string;
  replies: number;
}

export interface SeedSparklinePoint {
  hour: number;
  value: number;
}

export interface SeedThread {
  id: string;
  title: string;
  author: SeedAuthor;
  publishedAt: string;
  updatedAt: string;
  category: string | null;
  tags: string[];
  body: string;
  stats: {
    views: number;
    saves: number;
    reactions: number;
    impact: number;
    comments: number;
    shares: number;
    viewersNow: number;
    repliesToday: number;
    uniqueContributors: number;
  };
  aiTakeaways: string[];
  aiThemes: SeedAITheme[];
  creatorProducts: SeedProduct[];
  relatedThreads: SeedRelatedThread[];
  sparkline: SeedSparklinePoint[];
  liveSession?: {
    title: string;
    scheduledAt: string;
    attendees: number;
  };
}

export interface SeedComment {
  id: string;
  author: SeedAuthor;
  body: string;
  publishedAt: string;
  likes: number;
  upvotes: number;
  stance: StanceTag;
  aiThemes: string[];
  isKey: boolean;
  aiSummary?: string;
  isQuestion?: boolean;
  isAnswer?: boolean;
  questionId?: string;
  timelineLabel?: string;
  replies?: SeedComment[];
}

// ─── Authors ────────────────────────────────────────────────────────────────

const MAYA: SeedAuthor = {
  id: "maya",
  name: "Maya Chen",
  handle: "@mayabuilds",
  initials: "MC",
  role: "creator",
  badges: ["Verified", "Top Seller", "Lv 12"],
  verified: true,
  bio: "Full-time creator & digital product strategist. Helping email creators monetize their audience with proven funnels.",
  followers: 24300,
  following: 47,
  rating: 4.9,
  location: "LA, PS",
  joinedMonthsAgo: 18,
};

const JORDAN: SeedAuthor = {
  id: "jordan",
  name: "Jordan Lee",
  handle: "@jordanlee_",
  initials: "JL",
  role: "top-contributor",
  badges: ["Top Contributor", "Verified"],
  verified: true,
  bio: "Growth operator. I test things so you don't have to.",
  followers: 8400,
  following: 312,
  rating: 4.7,
  joinedMonthsAgo: 24,
};

const ALEX: SeedAuthor = {
  id: "alex",
  name: "Alex Starkis",
  handle: "@alexstarkis",
  initials: "AS",
  role: "new",
  badges: [],
  verified: false,
  bio: "Trying to build my first digital product.",
  followers: 120,
  following: 89,
  rating: 0,
  joinedMonthsAgo: 2,
};

const SAM: SeedAuthor = {
  id: "sam",
  name: "Sam Torres",
  handle: "@samtorres",
  initials: "ST",
  role: "top-contributor",
  badges: ["Top Contributor"],
  verified: false,
  bio: "Creator coach. 500+ students.",
  followers: 11200,
  following: 204,
  rating: 4.5,
  joinedMonthsAgo: 30,
};

const PRIYA: SeedAuthor = {
  id: "priya",
  name: "Priya Sharma",
  handle: "@priyasharma",
  initials: "PS",
  role: "verified-buyer",
  badges: ["Verified Buyer"],
  verified: false,
  bio: "Content creator in the beauty space.",
  followers: 3200,
  following: 180,
  rating: 0,
  joinedMonthsAgo: 8,
};

const DEV: SeedAuthor = {
  id: "dev",
  name: "Dev Patel",
  handle: "@devpatel_io",
  initials: "DP",
  role: "top-contributor",
  badges: ["Top Contributor", "Verified Buyer"],
  verified: true,
  bio: "SaaS founder. Always optimizing.",
  followers: 6700,
  following: 95,
  rating: 4.8,
  joinedMonthsAgo: 20,
};

const LENA: SeedAuthor = {
  id: "lena",
  name: "Lena Kovač",
  handle: "@lenakovac",
  initials: "LK",
  role: "new",
  badges: [],
  verified: false,
  bio: "Just started my creator journey.",
  followers: 210,
  following: 540,
  rating: 0,
  joinedMonthsAgo: 1,
};

const MARCO: SeedAuthor = {
  id: "marco",
  name: "Marco Reyes",
  handle: "@marcoreyes",
  initials: "MR",
  role: "top-contributor",
  badges: ["Top Contributor"],
  verified: false,
  bio: "Email marketer. 7 years, 3 exits.",
  followers: 15600,
  following: 77,
  rating: 4.9,
  joinedMonthsAgo: 36,
};

const NINA: SeedAuthor = {
  id: "nina",
  name: "Nina Walsh",
  handle: "@ninawalsh",
  initials: "NW",
  role: "new",
  badges: [],
  verified: false,
  bio: "Freelance designer pivoting to digital products.",
  followers: 560,
  following: 230,
  rating: 0,
  joinedMonthsAgo: 4,
};

const JAMES: SeedAuthor = {
  id: "james",
  name: "James Okafor",
  handle: "@jamesokafor",
  initials: "JO",
  role: "verified-buyer",
  badges: ["Verified Buyer"],
  verified: false,
  bio: "Fitness coach monetizing my knowledge online.",
  followers: 4100,
  following: 155,
  rating: 0,
  joinedMonthsAgo: 11,
};

const SOFIA: SeedAuthor = {
  id: "sofia",
  name: "Sofia Blanco",
  handle: "@sofiablanco",
  initials: "SB",
  role: "new",
  badges: [],
  verified: false,
  bio: "Student. Building in public.",
  followers: 88,
  following: 410,
  rating: 0,
  joinedMonthsAgo: 3,
};

const RYAN: SeedAuthor = {
  id: "ryan",
  name: "Ryan Koh",
  handle: "@ryankoh",
  initials: "RK",
  role: "top-contributor",
  badges: ["Top Contributor", "Verified"],
  verified: true,
  bio: "Productized service owner. Ex-agency.",
  followers: 9800,
  following: 130,
  rating: 4.6,
  joinedMonthsAgo: 28,
};

// ─── Thread ──────────────────────────────────────────────────────────────────

export const seedThread: SeedThread = {
  id: "seed-thread-001",
  title: "How I Grew from 0 to 10K Followers in 90 Days Using Only Short-Form Video Funnels",
  author: MAYA,
  publishedAt: "2026-04-10T09:00:00Z",
  updatedAt: "2026-04-24T14:33:00Z",
  category: "case-study",
  tags: [
    "Short-Form Video",
    "Growth Strategy",
    "Email Funnels",
    "Digital Products",
    "Case Study",
    "Notion",
    "CapCut",
    "ConvertKit",
    "Gumroad",
  ],
  body: `Over the past 90 days, I ran an experiment: could I build a meaningful audience from scratch using only short-form video as my top of funnel?

**The Setup:**
I created a new account with zero followers. No paid ads, no cross-promotion from my main account. Pure organic growth using a systematic approach.

**The Strategy (3 Phases):**

Phase 1 (Days 1–30): Hook Library
I spent the first week building a library of 50 hooks based on trending formats in my niche. Each hook was tested across 3 platforms simultaneously. Key insight: hooks that start with a controversial statement got 3× more saves.

Phase 2 (Days 31–60): Funnel Integration
Once I identified top-performing content formats, I added clear CTAs pointing to a free resource (a Notion template). This is where the magic happened — my email list grew from 0 to 2,400 in 30 days.

Phase 3 (Days 61–90): Monetization Loop
With an engaged email list, I launched a $27 mini-course. 340 sales in the first week. But more importantly, buyers became my best content amplifiers.

**Key Numbers:**
- 10,247 followers (across 3 platforms)
- 2,400 email subscribers
- $9,180 revenue from mini-course
- 47 collaboration requests
- Average 45 min/day content creation time

**What I'd do differently:** Start the email funnel from day 1, not day 31. Those first 30 days of content had no capture mechanism.

Happy to answer any questions about the specific tactics, tools, or frameworks I used.`,
  stats: {
    views: 16400,
    saves: 2300,
    reactions: 892,
    impact: 94,
    comments: 28,
    shares: 318,
    viewersNow: 12,
    repliesToday: 8,
    uniqueContributors: 34,
  },
  aiTakeaways: [
    "Built 10K followers in 90 days using a 3-phase organic strategy",
    "Hook libraries with controversial openers drove 3× more saves",
    "Email funnel integration started at day 31 — author recommends starting day 1",
    "Mini-course at $27 generated $9,180 in first week from 340 sales",
    "Buyers became organic content amplifiers, creating a growth loop",
    "Cross-platform posting (3 platforms) was key to maximizing reach",
  ],
  aiThemes: [
    {
      id: "pricing",
      name: "Pricing Strategy",
      count: 34,
      description: "Discussions around the $27 price point and funnel monetization tactics",
    },
    {
      id: "implementation",
      name: "Implementation Tips",
      count: 52,
      description: "Step-by-step advice, tool recommendations, and workflow breakdowns",
    },
    {
      id: "cases",
      name: "Case Studies",
      count: 24,
      description: "Real-world results from creators who applied similar strategies",
    },
    {
      id: "tools",
      name: "Tools & Stack",
      count: 16,
      description: "CapCut, ConvertKit, Notion, Gumroad — what works and what to skip",
    },
  ],
  creatorProducts: [
    {
      id: "prod-1",
      title: "The Hook Library Blueprint",
      description: "50 proven hook templates across 8 content categories, tested across TikTok, Reels, and Shorts.",
      price: 27,
    },
    {
      id: "prod-2",
      title: "60-Day Funnel Playbook",
      description: "Step-by-step system for building your audience flywheel from zero using short-form video.",
      price: 47,
    },
  ],
  relatedThreads: [
    {
      id: "rel-1",
      title: "Email Sequences That Actually Convert for Small Creators",
      authorName: "mayabuilds",
      authorHandle: "@mayabuilds",
      replies: 46,
    },
    {
      id: "rel-2",
      title: "My Honest Review of Every Short-Form Tool in 2026",
      authorName: "tecknick",
      authorHandle: "@tecknick",
      replies: 156,
    },
    {
      id: "rel-3",
      title: "Why Most Creator Funnels Fail (And How to Fix Yours)",
      authorName: "growthdose",
      authorHandle: "@growthdose",
      replies: 73,
    },
    {
      id: "rel-4",
      title: "Case Study: $0 to $56K MRR with Digital Templates",
      authorName: "kategrove",
      authorHandle: "@kategrove",
      replies: 140,
    },
  ],
  sparkline: [
    { hour: 0, value: 2 }, { hour: 1, value: 3 }, { hour: 2, value: 1 },
    { hour: 3, value: 4 }, { hour: 4, value: 6 }, { hour: 5, value: 8 },
    { hour: 6, value: 12 }, { hour: 7, value: 10 }, { hour: 8, value: 9 },
    { hour: 9, value: 14 }, { hour: 10, value: 18 }, { hour: 11, value: 22 },
  ],
  liveSession: {
    title: "Short-Form Funnels Deep Dive — Live Q&A with Maya",
    scheduledAt: "2026-04-27T18:00:00Z",
    attendees: 142,
  },
};

// ─── Comments ────────────────────────────────────────────────────────────────

export const seedComments: SeedComment[] = [
  {
    id: "c1",
    author: JORDAN,
    body: "Incredible, Maya. I started something similar but stalled at Phase 2. My biggest question: how did you decide which hooks to keep vs. drop after testing? Was there a specific metric threshold?",
    publishedAt: "2026-04-10T10:14:00Z",
    likes: 47,
    upvotes: 89,
    stance: "question",
    aiThemes: ["implementation"],
    isKey: true,
    isQuestion: true,
    aiSummary: "Asks for specific metrics used to evaluate hook performance across platforms.",
    replies: [
      {
        id: "c1r1",
        author: MAYA,
        body: "Great question. I used a 48-hour rule: if a video didn't hit 500 views AND 10% save rate within 48 hours, I killed the hook format. The save rate actually mattered more than views — high saves = high-intent audience.",
        publishedAt: "2026-04-10T11:02:00Z",
        likes: 112,
        upvotes: 203,
        stance: "answer",
        aiThemes: ["implementation"],
        isKey: true,
        isAnswer: true,
        questionId: "c1",
        aiSummary: "Maya explains the 48-hour/500-view/10%-save-rate framework for hook evaluation.",
      },
    ],
  },
  {
    id: "c2",
    author: ALEX,
    body: "I'm going to push back a bit here. $9,180 from 10K followers sounds impressive, but what were the actual costs? Time investment, tools, any paid boosts at all? '$45/day' doesn't account for the strategy time, hook research, or email sequence writing. I'd love to see a more honest breakdown.",
    publishedAt: "2026-04-10T12:30:00Z",
    likes: 34,
    upvotes: 61,
    stance: "critique",
    aiThemes: ["pricing"],
    isKey: true,
    aiSummary: "Challenges the ROI framing, requesting a full cost breakdown including time investment.",
    replies: [
      {
        id: "c2r1",
        author: MAYA,
        body: "Fair point, Alex. Full transparency:\n- Tools: ~$65/mo (CapCut Pro + ConvertKit lite tier + Notion free)\n- Strategy time: ~20 hours upfront before day 1\n- Email sequence writing: ~8 hours total\n- The 45 min/day is actual content production + posting\n\nSo the real 'cost' is about 28 hours of non-content work. Still think it's worth it for the ROI.",
        publishedAt: "2026-04-10T13:15:00Z",
        likes: 98,
        upvotes: 177,
        stance: "answer",
        aiThemes: ["pricing", "tools"],
        isKey: true,
        isAnswer: true,
        questionId: "c2",
        aiSummary: "Maya breaks down full costs: $65/mo tools, 28 hours non-content work total.",
      },
    ],
  },
  {
    id: "c3",
    author: SAM,
    body: "This is exactly what I needed to read. I just started my creator journey last week. Quick question: do you think this strategy works for niches outside of marketing/business? I'm in the fitness space.",
    publishedAt: "2026-04-10T14:00:00Z",
    likes: 28,
    upvotes: 52,
    stance: "question",
    aiThemes: ["implementation"],
    isKey: false,
    isQuestion: true,
    replies: [
      {
        id: "c3r1",
        author: MAYA,
        body: "100% yes for fitness. The hook library principle is platform-agnostic. Fitness niches actually see higher save rates on instructional hooks ('Do this not that' format). Your CTAs will be different — maybe a free workout plan or macro calculator instead of a Notion template — but the funnel logic is identical.",
        publishedAt: "2026-04-10T14:45:00Z",
        likes: 56,
        upvotes: 94,
        stance: "answer",
        aiThemes: ["implementation"],
        isKey: false,
        isAnswer: true,
        questionId: "c3",
      },
    ],
  },
  {
    id: "c4",
    author: PRIYA,
    body: "I actually bought Maya's mini-course and can confirm — the hook library template alone was worth the $27. I've been using it for 3 weeks now and my save rate went from 2% to 8%. Results so far:\n- 1,200 new followers (from 300)\n- 340 email subs\n- Haven't monetized yet but building toward it",
    publishedAt: "2026-04-10T15:22:00Z",
    likes: 143,
    upvotes: 218,
    stance: "story",
    aiThemes: ["cases", "pricing"],
    isKey: true,
    aiSummary: "Verified buyer reports 2%→8% save rate improvement and 1,200 new followers in 3 weeks.",
    timelineLabel: "First verified result",
  },
  {
    id: "c5",
    author: DEV,
    body: "For anyone looking to replicate this, here's my tool stack recommendation:\n1. Content creation: CapCut\n2. Email: ConvertKit (free up to 1k subs, then switch to Beehiiv)\n3. Landing page: Carrd ($19/yr) — don't overthink this\n4. Analytics: Substack analytics + a simple Notion dashboard\n5. Scheduling: Buffer free tier for 3 platforms\n\nTotal cost: ~$65/mo to start. Don't let the tool cost be your excuse.",
    publishedAt: "2026-04-10T16:05:00Z",
    likes: 201,
    upvotes: 334,
    stance: "resource",
    aiThemes: ["tools", "implementation"],
    isKey: true,
    aiSummary: "Comprehensive tool stack with costs — CapCut, ConvertKit, Carrd, Buffer for ~$65/mo total.",
    timelineLabel: "Tool stack breakdown",
  },
  {
    id: "c6",
    author: LENA,
    body: "This thread changed how I think about content. I've been posting randomly for 6 months with no strategy. Starting the hook library exercise tonight. Will report back in 30 days.",
    publishedAt: "2026-04-10T17:00:00Z",
    likes: 67,
    upvotes: 88,
    stance: "supportive",
    aiThemes: ["implementation"],
    isKey: false,
  },
  {
    id: "c7",
    author: MARCO,
    body: "The email funnel timing insight is gold. I see this mistake constantly with the creators I coach — they build an audience and then try to bolt on email later. The capture mechanism has to be there from day 1. Maya's retrospective is rare in its honesty.",
    publishedAt: "2026-04-10T18:30:00Z",
    likes: 89,
    upvotes: 134,
    stance: "supportive",
    aiThemes: ["implementation"],
    isKey: true,
    aiSummary: "Experienced coach validates the email-from-day-1 lesson as a systemic mistake among creators.",
  },
  {
    id: "c8",
    author: NINA,
    body: "Question about the Notion template CTA — was it gated behind email signup only, or did you offer a no-signup preview? I'm wondering if the preview drives more signups through social proof before asking for the email.",
    publishedAt: "2026-04-10T19:45:00Z",
    likes: 31,
    upvotes: 55,
    stance: "question",
    aiThemes: ["implementation"],
    isKey: false,
    isQuestion: true,
    replies: [
      {
        id: "c8r1",
        author: MAYA,
        body: "Email-gated only. I tested a preview version in week 3 — conversions actually dropped 15%. My theory: the preview removed the curiosity gap. People saw enough and felt satisfied without entering their email. Full gate worked better for my audience.",
        publishedAt: "2026-04-10T20:22:00Z",
        likes: 77,
        upvotes: 109,
        stance: "answer",
        aiThemes: ["implementation"],
        isKey: false,
        isAnswer: true,
        questionId: "c8",
      },
    ],
  },
  {
    id: "c9",
    author: JAMES,
    body: "As a fitness creator with 4K followers I've been scared to try short-form because I thought my audience was more 'long-form loyal.' This thread is making me rethink. The key insight for me: short-form is the TOP of funnel, not the product itself. The product is still the deep content. That reframe helped.",
    publishedAt: "2026-04-11T08:10:00Z",
    likes: 156,
    upvotes: 211,
    stance: "story",
    aiThemes: ["implementation", "cases"],
    isKey: true,
    aiSummary: "Key reframe: short-form is top-of-funnel, not the end product — validated for long-form niches.",
  },
  {
    id: "c10",
    author: SOFIA,
    body: "Hi! Completely new here. Is the hook library something I can start building even before I have an audience or product? Or do I need social proof to make the hooks land?",
    publishedAt: "2026-04-11T09:30:00Z",
    likes: 12,
    upvotes: 24,
    stance: "question",
    aiThemes: ["implementation"],
    isKey: false,
    isQuestion: true,
    replies: [
      {
        id: "c10r1",
        author: JORDAN,
        body: "Start now. Social proof comes from the hook, not the other way around. Hooks that say 'I tested 50 things and found X' don't need you to already be known — the specificity is what earns trust on cold audiences.",
        publishedAt: "2026-04-11T10:05:00Z",
        likes: 44,
        upvotes: 72,
        stance: "answer",
        aiThemes: ["implementation"],
        isKey: false,
        isAnswer: true,
        questionId: "c10",
      },
    ],
  },
  {
    id: "c11",
    author: RYAN,
    body: "One thing I'd add from running productized services: the 'buyer as amplifier' flywheel Maya describes is real, but it only works if your product delivers fast wins. If your $27 product takes 30+ days to show results, buyers won't evangelize it. Make sure the first win is achievable in under a week.",
    publishedAt: "2026-04-11T11:00:00Z",
    likes: 178,
    upvotes: 267,
    stance: "resource",
    aiThemes: ["pricing", "implementation"],
    isKey: true,
    aiSummary: "Critical add-on: buyer flywheel requires fast wins (under 1 week) for organic amplification to work.",
  },
  {
    id: "c12",
    author: ALEX,
    body: "Follow-up to my earlier critique: I actually tried Maya's hook framework for 2 weeks. I'll admit I was wrong to be skeptical. Week 1: flat. Week 2: one hook hit 22K views. My saves jumped from 1.2% to 6.8%. The controversial opener format is real.",
    publishedAt: "2026-04-11T13:00:00Z",
    likes: 233,
    upvotes: 389,
    stance: "story",
    aiThemes: ["cases", "implementation"],
    isKey: true,
    aiSummary: "Earlier skeptic reports 1.2%→6.8% save rate after 2 weeks applying the hook framework.",
    timelineLabel: "Critic's results — Day 14",
  },
  {
    id: "c13",
    author: SAM,
    body: "For anyone overwhelmed by the tool stack: start with just your phone camera, free CapCut, and a free ConvertKit account. The tools are not the bottleneck. The hooks are the bottleneck. Don't let tool paralysis stop you from starting.",
    publishedAt: "2026-04-11T14:30:00Z",
    likes: 198,
    upvotes: 312,
    stance: "resource",
    aiThemes: ["tools", "implementation"],
    isKey: true,
    aiSummary: "Counter to tool complexity: phone + free CapCut + free ConvertKit is sufficient to start.",
  },
  {
    id: "c14",
    author: MARCO,
    body: "The Phase 2 → Phase 3 transition is where most creators stall. They get the audience but delay the offer because they feel 'not ready.' Maya's 60-day timeline forced her to ship. What was your internal signal that you were ready to launch the mini-course?",
    publishedAt: "2026-04-11T16:00:00Z",
    likes: 55,
    upvotes: 84,
    stance: "question",
    aiThemes: ["pricing"],
    isKey: false,
    isQuestion: true,
    replies: [
      {
        id: "c14r1",
        author: MAYA,
        body: "Honestly? I wasn't ready. I had 3 people DM me asking 'is there a paid version of this content?' That was my signal. I built the mini-course in 4 days, pre-sold it to my email list 10 days before it was done, and used the pre-sale money ($1,800) as proof it was worth finishing.",
        publishedAt: "2026-04-11T17:00:00Z",
        likes: 312,
        upvotes: 476,
        stance: "story",
        aiThemes: ["pricing"],
        isKey: true,
        isAnswer: true,
        questionId: "c14",
        aiSummary: "Maya launched before being 'ready' — triggered by 3 DMs, pre-sold for $1,800 before finishing.",
        timelineLabel: "Mini-course origin story",
      },
    ],
  },
  {
    id: "c15",
    author: NINA,
    body: "I just created my hook library doc using Maya's template. Took me 3 hours. Already feel 10× more confident about what to post next week. Thank you for making this real and actionable rather than vague 'post consistently' advice.",
    publishedAt: "2026-04-12T09:00:00Z",
    likes: 88,
    upvotes: 121,
    stance: "supportive",
    aiThemes: ["implementation"],
    isKey: false,
  },
  {
    id: "c16",
    author: JAMES,
    body: "For fitness creators specifically: I tested the 'controversial opener' hook format this week. My hook was 'Stop doing cardio first thing in the morning (here's what to do instead).' 43K views, 8.9% save rate, 1,100 email signups from one video. This is not a drill.",
    publishedAt: "2026-04-12T11:30:00Z",
    likes: 445,
    upvotes: 667,
    stance: "story",
    aiThemes: ["cases", "implementation"],
    isKey: true,
    aiSummary: "Fitness creator: controversial hook → 43K views, 8.9% saves, 1,100 email signups from 1 video.",
    timelineLabel: "Breakout fitness result",
  },
  {
    id: "c17",
    author: DEV,
    body: "What's the best way to handle platform diversification at scale? Maya mentioned 3 platforms — at what point does managing 3 simultaneously become unmanageable, and how do you prioritize which platform gets the most energy?",
    publishedAt: "2026-04-12T14:00:00Z",
    likes: 39,
    upvotes: 66,
    stance: "question",
    aiThemes: ["implementation"],
    isKey: false,
    isQuestion: true,
    replies: [
      {
        id: "c17r1",
        author: MAYA,
        body: "My rule: create once (full quality), distribute three times (native upload, no watermark). Never edit per platform unless data tells me to. At 90 days I was spending maybe 8 min extra per video for the two additional platforms. It only becomes unmanageable if you're customizing for each.",
        publishedAt: "2026-04-12T14:50:00Z",
        likes: 134,
        upvotes: 199,
        stance: "answer",
        aiThemes: ["implementation"],
        isKey: true,
        isAnswer: true,
        questionId: "c17",
        aiSummary: "Create once, distribute 3× natively with no watermark — 8 extra minutes per video.",
      },
    ],
  },
  {
    id: "c18",
    author: LENA,
    body: "Day 30 update as promised! I applied the hook library method and started posting daily. My numbers:\n- 387 new followers\n- 12% average save rate (was 2% before)\n- 220 email subscribers\n- No product yet, but I have 3 people who asked me to make one\n\nThe method works. Just requires consistency.",
    publishedAt: "2026-04-14T10:00:00Z",
    likes: 289,
    upvotes: 421,
    stance: "story",
    aiThemes: ["cases", "implementation"],
    isKey: true,
    aiSummary: "30-day check-in: 387 followers, 12% save rate, 220 subs — consistent application confirmed method works.",
    timelineLabel: "Day 30 community result",
  },
  {
    id: "c19",
    author: RYAN,
    body: "I want to flag something I haven't seen discussed: this strategy assumes content creation is your core activity. For service providers or freelancers who need to also deliver client work, 45 min/day + 20 hours upfront is not trivial. Has anyone adapted this to a 'creator on the side' context with less bandwidth?",
    publishedAt: "2026-04-14T12:00:00Z",
    likes: 167,
    upvotes: 244,
    stance: "critique",
    aiThemes: ["implementation"],
    isKey: true,
    aiSummary: "Important caveat: strategy assumes content is primary work — may not scale for service providers with limited bandwidth.",
  },
  {
    id: "c20",
    author: SOFIA,
    body: "I know this might be a basic question, but: do you recommend starting all 3 platforms at once, or mastering one first and then expanding? I feel like doing 3 at once will stretch me too thin.",
    publishedAt: "2026-04-15T08:30:00Z",
    likes: 21,
    upvotes: 38,
    stance: "question",
    aiThemes: ["implementation"],
    isKey: false,
    isQuestion: true,
    replies: [
      {
        id: "c20r1",
        author: SAM,
        body: "Master one first. Seriously. Pick TikTok or Reels — whichever your audience is on — and get your first 1K there. Once you have a content rhythm that works, the copy-paste to a second platform takes 10 min. Spreading across 3 before you have a working hook formula is a great way to burn out.",
        publishedAt: "2026-04-15T09:15:00Z",
        likes: 78,
        upvotes: 112,
        stance: "answer",
        aiThemes: ["implementation"],
        isKey: false,
        isAnswer: true,
        questionId: "c20",
      },
    ],
  },
];

// ─── Spark (minimal mode sandbox) ────────────────────────────────────────────
// Uncategorized free-form posts — short body, no category, no product funnel UI.

export const seedSparkThread: SeedThread = {
  id: "seed-spark-001",
  title: "Good morning everyone — shipping a tiny thing today.",
  author: ALEX,
  publishedAt: "2026-04-26T08:02:00Z",
  updatedAt: "2026-04-26T08:02:00Z",
  category: null,
  tags: [],
  body: `Not tied to a category today. Just wanted to say hi, share that I'm finally publishing the landing page I’ve been “almost done” with for two weeks, and see who else is building in public this week.

If you’re procrastinating on a small launch: this is your sign to hit publish. 🚀`,
  stats: {
    views: 420,
    saves: 12,
    reactions: 56,
    impact: 22,
    comments: 5,
    shares: 3,
    viewersNow: 4,
    repliesToday: 5,
    uniqueContributors: 5,
  },
  aiTakeaways: [],
  aiThemes: [
    {
      id: "implementation",
      name: "Momentum",
      count: 3,
      description: "Quick morale and shipping mindset",
    },
    {
      id: "tools",
      name: "Build in public",
      count: 2,
      description: "Casual progress updates",
    },
  ],
  creatorProducts: [],
  relatedThreads: [],
  sparkline: [
    { hour: 0, value: 1 },
    { hour: 1, value: 2 },
    { hour: 2, value: 3 },
    { hour: 3, value: 2 },
    { hour: 4, value: 4 },
  ],
};

export const seedSparkComments: SeedComment[] = [
  {
    id: "s1",
    author: JORDAN,
    body: "Morning! What are you shipping — landing only or a full checkout?",
    timelineLabel: "Thread opens — first question",
    publishedAt: "2026-04-26T08:08:00Z",
    likes: 8,
    upvotes: 14,
    stance: "question",
    aiThemes: ["implementation"],
    isKey: true,
    isQuestion: true,
    aiSummary: "Asks scope of the launch (page vs payments).",
    replies: [
      {
        id: "s1r1",
        author: ALEX,
        body: "Landing + waitlist for now. Payment next weekend if anyone actually signs up 😅",
        publishedAt: "2026-04-26T08:19:00Z",
        likes: 12,
        upvotes: 18,
        stance: "answer",
        aiThemes: ["implementation"],
        isKey: true,
        isAnswer: true,
        questionId: "s1",
        aiSummary: "MVP is landing + waitlist; monetization deferred.",
      },
    ],
  },
  {
    id: "s2",
    author: SAM,
    body: "Love this energy. Publish messy — you can iterate in public.",
    publishedAt: "2026-04-26T08:31:00Z",
    likes: 15,
    upvotes: 22,
    stance: "supportive",
    aiThemes: ["tools"],
    isKey: true,
    aiSummary: "Encourages shipping over perfection.",
  },
  {
    id: "s3",
    author: PRIYA,
    body: "Same boat. I’m posting my pricing page today even though the copy feels cringe.",
    publishedAt: "2026-04-26T09:02:00Z",
    likes: 6,
    upvotes: 9,
    stance: "story",
    aiThemes: ["tools"],
    isKey: false,
  },
  {
    id: "s4",
    author: DEV,
    body: "If you want a 2-min sanity check before you hit publish, drop the link.",
    publishedAt: "2026-04-26T09:45:00Z",
    likes: 11,
    upvotes: 16,
    stance: "resource",
    aiThemes: ["implementation"],
    isKey: false,
  },
];
