// @ts-nocheck
/* Convex seed — loose typing */

const categoryKeys = [
  "news",
  "review",
  "compare",
  "qa",
  "spark",
  "debate",
  "list",
  "showcase",
  "launch-pad",
  "gigs",
];

const imagePool = [
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=675&fit=crop",
  "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=675&fit=crop",
  "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&h=675&fit=crop",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=675&fit=crop",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=675&fit=crop",
  "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1200&h=675&fit=crop",
  "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&h=675&fit=crop",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=675&fit=crop",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=675&fit=crop",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=675&fit=crop",
  "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=1200&h=675&fit=crop",
  "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=1200&h=675&fit=crop",
];

const categoryPromptMap = {
  news: [
    "Claude 4 workflow updates creators should not miss",
    "Open model launches this week and what actually matters",
    "AI policy shifts every solo founder should track",
    "The benchmark chart everyone is misreading",
    "Real product updates from top creator AI tools",
  ],
  review: [
    "30-day teardown of creator AI stacks",
    "I audited tool quality across 120 production prompts",
    "Honest review of long-context models for teams",
    "What broke after week two in paid production",
    "Speed vs quality review for daily publishing",
  ],
  compare: [
    "Claude vs GPT for viral post drafting",
    "Gemini vs Claude for long-form scripting",
    "Perplexity vs ChatGPT for trend research",
    "AI video tools compared for short-form hooks",
    "Agent builders head-to-head for creators",
  ],
  "launch-pad": [
    "How we packaged AI services into a premium offer",
    "Launch week checklist for AI creator products",
    "Pricing ladders that converted in under 14 days",
    "Turning one prompt system into a paid bundle",
    "From zero audience to first 50 customers",
  ],
  debate: [
    "Are AI-generated visuals lowering creative standards?",
    "Should creators disclose AI in every post?",
    "Is speed killing originality in AI-first workflows?",
    "Do open models beat closed models for businesses?",
    "Will prompt engineering remain a durable skill?",
  ],
  qa: [
    "Need help fixing hallucinations in sales copy",
    "How to stop repetitive outputs in content agents",
    "Best way to structure reusable prompt libraries",
    "How to onboard team members to one AI stack",
    "Workflow advice for multilingual content",
  ],
  list: [
    "Top AI creator tools under $50/month",
    "My 10 must-have automation prompts",
    "Best communities for AI creators right now",
    "Top no-code tools for AI content ops",
    "Ranking visual generation models for social",
  ],
  showcase: [
    "Built an AI briefing dashboard for daily trends",
    "My automated carousel generator in production",
    "Shipped a voice clone workflow with QA gates",
    "AI thumbnail pipeline that doubled CTR",
    "From prompt to publish in under 20 minutes",
  ],
  gigs: [
    "Hiring AI workflow designer for media team",
    "Looking for prompt engineer for ad creative",
    "Need AI editor for YouTube script team",
    "Seeking automation specialist for creator ops",
    "Freelance gig for an AI strategy sprint",
  ],
};

const userIds = ["u1", "u2", "u3", "u4", "u5"];

export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function discussionThreadToPostShape(thread, coverIndex) {
  return {
    slug: thread.slug,
    title: thread.title,
    summary: thread.aiSummary,
    body: thread.body,
    coverImage: imagePool[coverIndex % imagePool.length],
    category: thread.category,
    authorSeedKey: thread.authorId,
    upvotes: thread.upvotes,
    commentsCount: thread.comments.length,
    views: thread.views,
    createdAt: new Date(thread.createdAt).getTime(),
    trending: "hot",
    locked: false,
    isRichThread: true,
  };
}

export function makeGeneratedPostShape(category, categoryIndex, itemIndex) {
  const prompts = categoryPromptMap[category];
  const prompt = prompts[itemIndex % prompts.length];
  const sequence = categoryIndex * 10 + itemIndex + 1;
  const title = prompt;
  const createdAt = new Date(
    Date.UTC(2026, 1, 28 - (sequence % 12), 18 - (itemIndex % 7), (itemIndex * 11) % 60),
  );

  return {
    legacyKey: `p${sequence}`,
    slug: slugify(`${category}-${title}`),
    title,
    summary:
      "Practical field notes from creator workflows with metrics, trade-offs, and what to apply this week.",
    body:
      "Detailed community post with examples, implementation notes, and discussion prompts for creators using AI in production.",
    coverImage: imagePool[(sequence - 1) % imagePool.length],
    category,
    authorSeedKey: userIds[(sequence - 1) % userIds.length],
    upvotes: 180 + sequence * 17,
    commentsCount: 28 + ((sequence * 9) % 140),
    views: 4200 + sequence * 460,
    createdAt: createdAt.getTime(),
    trending: itemIndex % 3 === 0 ? "hot" : itemIndex % 3 === 1 ? "recent" : "evergreen",
    // DAU-locked types (launch-pad, gigs) are seeded locked-by-state; debate is never locked (spec correction 2026-08-31).
    locked: (category === "launch-pad" || category === "gigs") && itemIndex > 7,
    isRichThread: false,
  };
}

export function allGeneratedPostShapes(discussionThreads) {
  const fromThreads = discussionThreads.map((thread, index) => discussionThreadToPostShape(thread, index));
  const generated = categoryKeys.flatMap((category, categoryIndex) =>
    Array.from({ length: 10 }, (_, itemIndex) => makeGeneratedPostShape(category, categoryIndex, itemIndex)),
  );
  return [...fromThreads, ...generated];
}
