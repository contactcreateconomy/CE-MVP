/**
 * dest-only visual QA fixtures — NOT seed.bootstrap (CAP-022 / R-FOUNDER:
 * bootstrap never creates users).
 *
 * Gate: DEMO_SEED_ENABLED=true AND not the production deployment.
 * Authors are display-only (no Convex Auth login). Founder keeps Google login.
 */
import { internalAction, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { canonicalSignupFields } from "../lib/founder";
import { normalizeHandle } from "../lib/handle";
import { ensurePostSeoMetaTx } from "../lib/distributionScores";

export const DEMO_EMAIL_DOMAIN = "demo.createconomy.invalid";
export const DEMO_TOOL_SLUG_PREFIX = "demo-";
export const PROD_DEPLOYMENT_SLUG = "energetic-kangaroo-55";
export const PROD_FORUM_HOST = "discuss.createconomy.com";

const CATEGORIES = [
  "ai-technology",
  "creator-business",
  "internet-culture",
  "digital-products",
  "future-of-work",
] as const;

const TYPES = [
  "review",
  "compare",
  "help",
  "spark",
  "debate",
  "list",
  "showcase",
] as const;

type PostType = (typeof TYPES)[number];

const MEMBERS: { handle: string; name: string; bio: string }[] = [
  { handle: "maya", name: "Maya Chen", bio: "Demo: indie tool reviewer in AI workflows." },
  { handle: "jordan", name: "Jordan Hale", bio: "Demo: runs a small creator studio." },
  { handle: "priya", name: "Priya Nair", bio: "Demo: compares writing stacks for clients." },
  { handle: "luca", name: "Luca Rossi", bio: "Demo: ships digital products on nights." },
  { handle: "amina", name: "Amina Okonkwo", bio: "Demo: documents future-of-work experiments." },
  { handle: "noah", name: "Noah Berg", bio: "Demo: asks the help questions others skip." },
  { handle: "sofia", name: "Sofia Alvarez", bio: "Demo: hosts debates on distribution." },
  { handle: "kenji", name: "Kenji Sato", bio: "Demo: curates ranked lists of stacks." },
  { handle: "elena", name: "Elena Popov", bio: "Demo: showcases side projects." },
  { handle: "samir", name: "Samir Haddad", bio: "Demo: sparks half-formed takes on purpose." },
];

const TOOLS: { slug: string; name: string; category: (typeof CATEGORIES)[number] }[] = [
  { slug: "demo-claude-code", name: "Demo Claude Code", category: "ai-technology" },
  { slug: "demo-cursor", name: "Demo Cursor", category: "ai-technology" },
  { slug: "demo-notion", name: "Demo Notion", category: "digital-products" },
  { slug: "demo-figma", name: "Demo Figma", category: "creator-business" },
  { slug: "demo-webflow", name: "Demo Webflow", category: "digital-products" },
  { slug: "demo-substack", name: "Demo Substack", category: "creator-business" },
  { slug: "demo-beehiiv", name: "Demo Beehiiv", category: "creator-business" },
  { slug: "demo-descript", name: "Demo Descript", category: "internet-culture" },
  { slug: "demo-kit", name: "Demo Kit", category: "creator-business" },
  { slug: "demo-framer", name: "Demo Framer", category: "digital-products" },
  { slug: "demo-linear", name: "Demo Linear", category: "future-of-work" },
  { slug: "demo-obsidian", name: "Demo Obsidian", category: "future-of-work" },
];

export function demoEmail(handle: string): string {
  return `${handle}@${DEMO_EMAIL_DOMAIN}`;
}

export function demoSeedBlockedReason(env: {
  DEMO_SEED_ENABLED?: string;
  CONVEX_CLOUD_URL?: string;
  CONVEX_SITE_URL?: string;
  SITE_URL?: string;
}): string | null {
  if (env.DEMO_SEED_ENABLED !== "true") {
    return "Set DEMO_SEED_ENABLED=true on the dest Convex deployment, run the seeder, then unset the flag.";
  }
  const haystack = `${env.CONVEX_CLOUD_URL ?? ""} ${env.CONVEX_SITE_URL ?? ""} ${env.SITE_URL ?? ""}`;
  if (haystack.includes(PROD_DEPLOYMENT_SLUG) || haystack.includes(PROD_FORUM_HOST)) {
    return "demoSeed: refused on production";
  }
  return null;
}

function assertAllowedEnv(): void {
  const reason = demoSeedBlockedReason({
    DEMO_SEED_ENABLED: process.env.DEMO_SEED_ENABLED,
    CONVEX_CLOUD_URL: process.env.CONVEX_CLOUD_URL,
    CONVEX_SITE_URL: process.env.CONVEX_SITE_URL,
    SITE_URL: process.env.SITE_URL,
  });
  if (reason) throw new Error(reason);
}

function zeroDims() {
  return { ease_of_use: 0, output_quality: 0, reliability: 0, value_for_money: 0 };
}

function titleFor(type: PostType, handle: string, n: number): string {
  return `Demo: ${type} from ${handle} (${n + 1})`;
}

function bodyFor(type: PostType, handle: string): string {
  return `Demo fixture by ${handle}. This ${type} exists so the forum and admin consoles have something to render. No outbound links.`;
}

async function listDemoUsers(ctx: { db: any }): Promise<any[]> {
  const out: any[] = [];
  for (const m of MEMBERS) {
    const row = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", demoEmail(m.handle)))
      .unique();
    if (row) out.push(row);
  }
  return out;
}

async function listDemoTools(ctx: { db: any }): Promise<any[]> {
  const out: any[] = [];
  for (const t of TOOLS) {
    const row = await ctx.db
      .query("tools")
      .withIndex("by_slug", (q: any) => q.eq("slug", t.slug))
      .unique();
    if (row) out.push(row);
  }
  return out;
}

async function insertExtension(
  ctx: { db: any },
  args: {
    postId: Id<"posts">;
    type: PostType;
    userId: Id<"users">;
    toolIds: string[];
    title: string;
    body: string;
  },
): Promise<void> {
  const { postId, type, userId, toolIds, title, body } = args;
  switch (type) {
    case "review":
      await ctx.db.insert("postReviews", {
        postId,
        toolId: toolIds[0] ?? "",
        verdictScore: 4,
        verdictSummary: "Demo: useful for the job, with the usual caveats.",
        pros: ["Fast once set up", "Fits a solo workflow"],
        cons: ["Docs assume you already know the stack"],
      });
      break;
    case "compare":
      await ctx.db.insert("postCompares", {
        postId,
        toolIds: toolIds.slice(0, 3),
        qualitativeGrid: { demo: true, note: "Qualitative only — not a scoreboard." },
      });
      break;
    case "spark":
      await ctx.db.insert("postSparks", { postId, statement: title });
      break;
    case "debate":
      await ctx.db.insert("postDebates", {
        postId,
        proposition: title,
        agreeCount: 3,
        disagreeCount: 2,
        abstainCount: 1,
      });
      break;
    case "list": {
      const listId = await ctx.db.insert("postLists", {
        postId,
        mode: "community_ranked",
        intro: "Demo ranked list — vote on the items.",
      });
      for (let i = 0; i < 4; i++) {
        await ctx.db.insert("postListItems", {
          postListId: listId,
          content: `Demo list item ${i + 1}`,
          createdByUserId: userId,
          voteCount: 4 - i,
          sortOrder: i,
          createdAt: Date.now(),
        });
      }
      break;
    }
    case "showcase":
      await ctx.db.insert("postShowcases", {
        postId,
        theThing: body,
        approvalStatus: "none",
      });
      break;
    case "help":
      await ctx.db.insert("postHelps", {
        postId,
        problemStatement: title,
        resolvedStatus: "open",
      });
      break;
  }
}

async function insertScore(
  ctx: { db: any },
  postId: Id<"posts">,
  now: number,
  userIndex: number,
  postIndex: number,
): Promise<{ publishedAt: number; replyCount: number; discussing: number }> {
  const ageHours = postIndex * 5 + userIndex;
  const publishedAt = now - ageHours * 3_600_000;
  const valuableWeighted = Math.max(0, (14 - postIndex) * 1.5 + userIndex * 0.4);
  const replyCount = postIndex % 3 === 0 ? 4 : postIndex % 2;
  const saveCount = postIndex % 4;
  const distinctCommenters = replyCount > 0 ? Math.min(6, 2 + (postIndex % 4)) : 0;
  const qualifiedReads = 8 + postIndex + userIndex;
  const integrityMultiplier = 1;
  const topPriorWeight = 5;
  const topPriorMean = 0.3;
  const denominator = valuableWeighted + topPriorWeight;
  const topScore =
    ((valuableWeighted * integrityMultiplier + topPriorMean * topPriorWeight) / denominator) *
    (1 + Math.min(0.5, distinctCommenters * 0.05));
  const engagement = valuableWeighted + replyCount + saveCount + qualifiedReads;
  const hotScore = engagement * Math.pow(2, -ageHours / 12);
  const lastEligibleInteractionAt = publishedAt + replyCount * 90_000;
  await ctx.db.insert("postDistributionScores", {
    postId,
    distributionQualityVersion: 1,
    topScore: Math.round(topScore * 1000) / 1000,
    hotScore: Math.round(hotScore * 1000) / 1000,
    trendScore: postIndex < 4 ? 2.4 - postIndex * 0.3 : 0,
    integrityMultiplier,
    valuableWeighted,
    distinctCommenters,
    replyCount,
    saveCount,
    qualifiedReads,
    returns7d: postIndex % 5,
    qualifiedExposureCount: qualifiedReads,
    explorationDeficit: Math.max(0, 20 - qualifiedReads),
    lastEligibleInteractionAt,
    scoreVersion: 1,
    computedAt: now,
  });
  return { publishedAt, replyCount, discussing: distinctCommenters };
}

async function insertComments(
  ctx: { db: any },
  args: {
    postId: Id<"posts">;
    authors: Id<"users">[];
    count: number;
    now: number;
  },
): Promise<Id<"comments">[]> {
  const ids: Id<"comments">[] = [];
  let parent: Id<"comments"> | undefined;
  for (let i = 0; i < args.count; i++) {
    const authorUserId = args.authors[i % args.authors.length]!;
    const depth = i === args.count - 1 && parent ? 1 : 0;
    const createdAt = args.now - (args.count - i) * 120_000;
    const commentId = (await ctx.db.insert("comments", {
      postId: args.postId,
      ...(depth === 1 && parent
        ? { parentCommentId: parent, replyToCommentId: parent, threadRootCommentId: parent }
        : {}),
      depth: depth as 0 | 1,
      authorType: "user",
      authorUserId,
      body: depth === 0
        ? `Demo comment ${i + 1}: adding a human take so the thread is not empty.`
        : "Demo reply: building on the comment above.",
      isQuestion: false,
      moderationStatus: "passed",
      lastActivityAt: createdAt,
      createdAt,
    })) as Id<"comments">;
    if (depth === 0) {
      await ctx.db.patch(commentId, { threadRootCommentId: commentId });
      parent = commentId;
    }
    await ctx.db.insert("commentScores", {
      commentId,
      valuableCount: i === 0 ? 3 : 1,
      replyCount: 0,
      distinctReplierCount: 0,
      saveCount: 0,
      contextSignalCount: 0,
      bestScore: i === 0 ? 1.2 : 0.4,
      liveScore: i === 0 ? 0.9 : 0.2,
      mostDiscussedScore: 0,
      rankVersion: 1,
      lastInteractionAt: createdAt,
      lastRankedAt: createdAt,
      dirty: false,
    });
    ids.push(commentId);
  }
  if (ids.length > 0) {
    await ctx.db.insert("threadStats", {
      postId: args.postId,
      humanCommentCount: ids.length,
      personaCommentCount: 0,
      topLevelCount: Math.max(1, ids.length - (args.count > 1 ? 1 : 0)),
      replyCount: args.count > 1 ? 1 : 0,
      humanParticipantCount: Math.min(args.authors.length, ids.length),
      unresolvedQuestionCount: 0,
      latestHumanCommentId: ids[ids.length - 1],
      latestActivityAt: args.now,
      threadRevision: ids.length,
      updatedAt: args.now,
    });
  }
  return ids;
}

export const assertAllowed = internalMutation({
  args: {},
  returns: v.null(),
  handler: async () => {
    assertAllowedEnv();
    return null;
  },
});

export const seedUsersAndTools = internalMutation({
  args: {},
  returns: v.object({ users: v.number(), tools: v.number(), createdUsers: v.number(), createdTools: v.number() }),
  handler: async (ctx) => {
    assertAllowedEnv();
    const now = Date.now();
    let createdUsers = 0;
    let createdTools = 0;

    for (const m of MEMBERS) {
      const email = demoEmail(m.handle);
      const existing = await ctx.db
        .query("users")
        .withIndex("email", (q: any) => q.eq("email", email))
        .unique();
      if (existing) continue;
      const username = normalizeHandle(m.handle);
      await ctx.db.insert("users", {
        ...canonicalSignupFields(email, m.name),
        handle: username,
        username,
        usernameNormalized: username,
        displayName: m.name,
        bio: m.bio,
        bootstrapState: "complete",
        postingEligibilityState: "eligible",
        basicProfileComplete: true,
        onboardingState: "activated",
        activationQuality: "standard",
        lastActiveAt: now,
        activationProgress: {
          emailVerified: true,
          mobileVerified: false,
          profileComplete: true,
          firstPostPublished: true,
          firstCommentPosted: true,
          firstReactionGiven: true,
          firstFollowMade: false,
        },
      });
      createdUsers += 1;
    }

    for (const t of TOOLS) {
      const existing = await ctx.db
        .query("tools")
        .withIndex("by_slug", (q: any) => q.eq("slug", t.slug))
        .unique();
      if (existing) continue;
      await ctx.db.insert("tools", {
        name: t.name,
        slug: t.slug,
        categoryIds: [t.category],
        officialUrl: `https://www.example.com/${t.slug}`,
        status: "active",
        ratingSum: 0,
        ratingCount: 0,
        dimensionSums: zeroDims(),
        dimensionCounts: zeroDims(),
      });
      createdTools += 1;
    }

    const users = await listDemoUsers(ctx);
    const tools = await listDemoTools(ctx);
    return { users: users.length, tools: tools.length, createdUsers, createdTools };
  },
});

export const seedUserContent = internalMutation({
  args: { userIndex: v.number() },
  returns: v.object({ handle: v.string(), posts: v.number(), skipped: v.boolean() }),
  handler: async (ctx, args) => {
    assertAllowedEnv();
    const member = MEMBERS[args.userIndex];
    if (!member) throw new Error(`demoSeed: userIndex ${args.userIndex} out of range`);
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", demoEmail(member.handle)))
      .unique();
    if (!user) throw new Error(`demoSeed: missing user ${member.handle}`);

    const existingPosts = await ctx.db
      .query("posts")
      .withIndex("by_author_type_authorUserId", (q: any) =>
        q.eq("authorType", "user").eq("authorUserId", user._id),
      )
      .take(20);
    const already = existingPosts.filter((p: any) => p.title?.startsWith("Demo:"));
    if (already.length >= 15) {
      return { handle: member.handle, posts: already.length, skipped: true };
    }

    const demoUsers = await listDemoUsers(ctx);
    const tools = await listDemoTools(ctx);
    const toolDocIds = tools.map((t: any) => t._id as string);
    const now = Date.now();
    let posts = 0;

    for (let n = 0; n < 15; n++) {
      const type = TYPES[n % TYPES.length]!;
      const title = titleFor(type, member.handle, n);
      if (already.some((p: any) => p.title === title)) continue;
      const body = bodyFor(type, member.handle);
      const categoryId = CATEGORIES[n % CATEGORIES.length]!;
      const pickedToolIds = [
        toolDocIds[n % toolDocIds.length],
        toolDocIds[(n + 3) % toolDocIds.length],
        toolDocIds[(n + 6) % toolDocIds.length],
      ].filter((id): id is string => Boolean(id));
      const createdAt = now - (n * 5 + args.userIndex) * 3_600_000;
      const postId = (await ctx.db.insert("posts", {
        authorType: "user",
        authorUserId: user._id,
        type,
        title,
        body,
        categoryId,
        toolIds: type === "review" || type === "compare" ? pickedToolIds.slice(0, type === "compare" ? 3 : 1) : [],
        lifecycleStatus: "published",
        moderationStatus: "passed",
        visibility: "public",
        publishedAt: createdAt,
        createdAt,
      })) as Id<"posts">;

      await insertExtension(ctx, {
        postId,
        type,
        userId: user._id,
        toolIds: pickedToolIds,
        title,
        body,
      });
      await ctx.db.insert("postRevisions", {
        postId,
        revisionNumber: 1,
        title,
        body,
        changeType: "create",
        changedByUserId: user._id,
        createdAt,
      });
      const scored = await insertScore(ctx, postId, now, args.userIndex, n);
      await ctx.db.patch(postId, { publishedAt: scored.publishedAt, createdAt: scored.publishedAt });
      await ensurePostSeoMetaTx(ctx, { postId, title, body, type, now: scored.publishedAt });

      const oneLiner = body.replace(/\s+/g, " ").slice(0, 140);
      let discussingCount = 0;
      let avatarUserIds: Id<"users">[] = [];
      if (n % 3 === 0) {
        const commentAuthors = demoUsers.map((u: any) => u._id as Id<"users">).filter((id: Id<"users">) => id !== user._id);
        const pool = commentAuthors.length > 0 ? commentAuthors : [user._id];
        const commentIds = await insertComments(ctx, {
          postId,
          authors: pool,
          count: scored.replyCount || 3,
          now,
        });
        discussingCount = commentIds.length;
        avatarUserIds = pool.slice(0, 3);
        if (type === "debate" && pool[0]) {
          await ctx.db.insert("debateVotes", {
            postId,
            userId: pool[0],
            choice: "agree",
            createdAt: now,
          });
        }
        if (commentIds[0] && pool[1]) {
          await ctx.db.insert("commentReactions", {
            userId: pool[1],
            commentId: commentIds[0],
            reactionType: "valuable",
            weightAtCast: 1,
            createdAt: now,
          });
        }
      }
      await ctx.db.insert("cardSummaries", {
        postId,
        oneLiner,
        generationRunId: "demo-seed",
        supportingClaimIds: [],
        groundingStatus: "insufficient",
        stale: false,
        avatarUserIds,
        discussingCount,
        createdAt: scored.publishedAt,
      });
      posts += 1;
    }

    await ctx.db.patch(user._id, { postCount: 15, approvedCommentCount: 8, lastActiveAt: now });
    return { handle: member.handle, posts, skipped: false };
  },
});

export const seedChromeAndQueues = internalMutation({
  args: {},
  returns: v.object({
    hero: v.number(),
    featured: v.number(),
    vibing: v.number(),
    waitlist: v.number(),
    cases: v.number(),
    candidates: v.number(),
    alerts: v.number(),
  }),
  handler: async (ctx) => {
    assertAllowedEnv();
    const now = Date.now();
    const demoUsers = await listDemoUsers(ctx);
    const staff = (await ctx.db.query("users").take(40)).find((u: any) => u.isStaff === true);
    const firstUser = demoUsers[0];
    if (!firstUser) throw new Error("demoSeed: no demo users");

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author_type_authorUserId", (q: any) =>
        q.eq("authorType", "user").eq("authorUserId", firstUser._id),
      )
      .take(20);
    const demoPosts = posts.filter((p: any) => p.title?.startsWith("Demo:") && p.lifecycleStatus === "published");

    let hero = 0;
    for (let i = 0; i < Math.min(6, demoPosts.length); i++) {
      const post = demoPosts[i]!;
      const existing = await ctx.db
        .query("heroSlots")
        .withIndex("by_slotOrder", (q: any) => q.eq("slotOrder", i))
        .first();
      if (existing?.status === "active" && existing.postId === post._id) {
        hero += 1;
        continue;
      }
      if (existing) continue;
      await ctx.db.insert("heroSlots", {
        slotOrder: i,
        postId: post._id,
        headlineOverride: post.title,
        ctaLabel: "Read the demo",
        startAt: now - 60_000,
        endAt: now + 14 * 24 * 3_600_000,
        desktopEnabled: true,
        mobileEnabled: true,
        status: "active",
        disclosureClass: i === 0 ? "community_top" : "editorial",
        createdAt: now,
      });
      hero += 1;
    }

    let featured = 0;
    if (staff && demoPosts[0] && demoPosts[1]) {
      for (const [i, post] of [demoPosts[0], demoPosts[1]].entries()) {
        const existing = await ctx.db
          .query("vibingFeatured")
          .withIndex("by_postId", (q: any) => q.eq("postId", post._id))
          .first();
        if (existing) {
          featured += 1;
          continue;
        }
        await ctx.db.insert("vibingFeatured", {
          postId: post._id,
          label: i === 0 ? "Demo featured" : "Demo pick",
          startAt: now - 60_000,
          endAt: now + 7 * 24 * 3_600_000,
          status: "active",
          approvedByUserId: staff._id,
          createdAt: now,
        });
        featured += 1;
      }
    }

    let vibing = 0;
    for (const post of demoPosts.slice(0, 6)) {
      const existing = await ctx.db
        .query("vibingTrends")
        .withIndex("by_object", (q: any) => q.eq("objectType", "post").eq("objectId", post._id))
        .unique();
      if (!existing) {
        await ctx.db.insert("vibingTrends", {
          objectType: "post",
          objectId: post._id,
          trendScore: 4 - vibing * 0.3,
          velocity: 1.2,
          acceleration: 0.4,
          distinctHumanCount: 5,
          interactionTypeCount: 3,
          integrityMultiplier: 1,
          enteredAt: now,
          status: "trending",
        });
        await ctx.db.insert("vibingHooks", {
          objectType: "post",
          objectId: post._id,
          hookText: post.title,
          valence: "informational",
          groundingStatus: "insufficient",
          entailment: "insufficient",
          supportingSpans: [],
          opposingSpans: [],
          generationRunId: "demo-seed",
          stale: false,
          createdAt: now,
        });
      }
      vibing += 1;
    }

    const podiumExisting = await ctx.db
      .query("leaderboardProjections")
      .withIndex("by_category_window", (q: any) => q.eq("category", "overall").eq("window", "h24"))
      .unique();
    if (!podiumExisting) {
      await ctx.db.insert("leaderboardProjections", {
        category: "overall",
        window: "h24",
        projectionVersion: 1,
        entries: [],
        minThresholdMet: false,
        computedAt: now,
      });
    }

    let waitlist = 0;
    for (let i = 1; i <= 8; i++) {
      const email = `waitlist-${i}@${DEMO_EMAIL_DOMAIN}`;
      const emailNormalized = email.toLowerCase();
      const existing = await ctx.db
        .query("waitlistEntries")
        .withIndex("by_emailNormalized", (q: any) => q.eq("emailNormalized", emailNormalized))
        .unique();
      if (existing) {
        waitlist += 1;
        continue;
      }
      await ctx.db.insert("waitlistEntries", {
        email,
        emailNormalized,
        status: "waiting",
        createdAt: now - i * 86_400_000,
      });
      waitlist += 1;
    }

    let cases = 0;
    const caseTargets = demoPosts.slice(0, 4);
    for (const [i, post] of caseTargets.entries()) {
      const existing = await ctx.db
        .query("moderationCases")
        .withIndex("by_target_policyFamily_status", (q: any) =>
          q.eq("targetType", "post").eq("targetId", post._id).eq("policyFamily", "quality_guidelines").eq("status", "open"),
        )
        .first();
      if (existing) {
        cases += 1;
        continue;
      }
      await ctx.db.insert("moderationCases", {
        caseType: i === 0 ? "ugc_conduct" : "ugc_safety",
        targetType: "post",
        targetId: post._id,
        policyFamily: "quality_guidelines",
        severity: i === 0 ? "s2_medium" : "s3_low",
        priority: i === 0 ? 2 : 3,
        status: "open",
        reasonCode: i === 0 ? "low_substance" : "off_topic_uncertain",
        policyVersion: "m13.v1",
        reporterCountDistinct: 1,
        reporterClusterCount: 1,
        agingLevel: 0,
        createdAt: now - i * 3_600_000,
      });
      cases += 1;
    }

    let candidates = 0;
    const existingCandidates = await ctx.db.query("contentCandidates").take(40);
    const demoCandidateTitles = new Set(
      existingCandidates
        .filter((c: any) => String((c.draft ?? {}).title ?? "").startsWith("Demo:"))
        .map((c: any) => (c.draft ?? {}).title),
    );
    for (let i = 0; i < 3; i++) {
      const title = `Demo: editorial candidate ${i + 1}`;
      if (demoCandidateTitles.has(title)) {
        candidates += 1;
        continue;
      }
      await ctx.db.insert("contentCandidates", {
        status: "review",
        postType: i === 0 ? "news" : "review",
        draft: {
          title,
          body: "Demo candidate staged for the editorial queue. Not GLM-forged.",
          categoryId: CATEGORIES[i]!,
          candidateRevision: 1,
        },
        evaluation: { overallResult: "pass", evaluatedAt: now },
        createdAt: now - i * 3_600_000,
      });
      candidates += 1;
    }

    let alerts = 0;
    for (const spec of [
      {
        alertKey: "demo.moderation.backlog",
        severity: "medium" as const,
        title: "Demo: moderation backlog is a fixture",
        whatHappening: "Four demo cases sit on the shared queue so /admin/moderation is clickable.",
        whatToDo: "Open the queue, claim one case, then wipe demo data when done.",
        deepLinkRouteKey: "/admin/moderation",
      },
      {
        alertKey: "demo.editorial.review",
        severity: "high" as const,
        title: "Demo: editorial review fixtures",
        whatHappening: "Three demo candidates are in review without calling GLM.",
        whatToDo: "Open /admin/editorial and inspect the queue, then wipe demo data.",
        deepLinkRouteKey: "/admin/resources",
      },
    ]) {
      const existing = await ctx.db
        .query("adminInterventionAlerts")
        .withIndex("by_alertKey_status", (q: any) => q.eq("alertKey", spec.alertKey).eq("status", "open"))
        .unique();
      if (existing) {
        alerts += 1;
        continue;
      }
      await ctx.db.insert("adminInterventionAlerts", {
        ...spec,
        status: "open",
        createdAt: now,
      });
      alerts += 1;
    }

    return { hero, featured, vibing, waitlist, cases, candidates, alerts };
  },
});

const seedResultValidator = v.object({
  users: v.number(),
  tools: v.number(),
  perUser: v.array(v.object({ handle: v.string(), posts: v.number(), skipped: v.boolean() })),
  chrome: v.object({
    hero: v.number(),
    featured: v.number(),
    vibing: v.number(),
    waitlist: v.number(),
    cases: v.number(),
    candidates: v.number(),
    alerts: v.number(),
  }),
});

type SeedResult = {
  users: number;
  tools: number;
  perUser: Array<{ handle: string; posts: number; skipped: boolean }>;
  chrome: {
    hero: number;
    featured: number;
    vibing: number;
    waitlist: number;
    cases: number;
    candidates: number;
    alerts: number;
  };
};

export const seed = internalAction({
  args: {},
  returns: seedResultValidator,
  handler: async (ctx): Promise<SeedResult> => {
    await ctx.runMutation(internal.dev.demoSeed.assertAllowed, {});
    const base = await ctx.runMutation(internal.dev.demoSeed.seedUsersAndTools, {});
    const perUser: SeedResult["perUser"] = [];
    for (let i = 0; i < MEMBERS.length; i++) {
      perUser.push(await ctx.runMutation(internal.dev.demoSeed.seedUserContent, { userIndex: i }));
    }
    const chrome = await ctx.runMutation(internal.dev.demoSeed.seedChromeAndQueues, {});
    return { users: base.users, tools: base.tools, perUser, chrome };
  },
});

async function deleteQuery(
  ctx: { db: any },
  table: string,
  index: string,
  apply: (q: any) => any,
): Promise<number> {
  const rows = await ctx.db.query(table).withIndex(index, apply).take(64);
  for (const row of rows) await ctx.db.delete(row._id);
  return rows.length;
}

async function wipePostTree(ctx: { db: any }, postId: Id<"posts">): Promise<void> {
  const comments = await ctx.db
    .query("comments")
    .withIndex("by_post_depth_created", (q: any) => q.eq("postId", postId).eq("depth", 0))
    .take(40);
  const replies = await ctx.db
    .query("comments")
    .withIndex("by_post_depth_created", (q: any) => q.eq("postId", postId).eq("depth", 1))
    .take(40);
  for (const c of [...replies, ...comments]) {
    await deleteQuery(ctx, "commentScores", "by_comment", (q: any) => q.eq("commentId", c._id));
    await deleteQuery(ctx, "commentReactions", "by_comment_type", (q: any) => q.eq("commentId", c._id).eq("reactionType", "valuable"));
    await deleteQuery(ctx, "commentSaves", "by_comment", (q: any) => q.eq("commentId", c._id));
    const cases = await ctx.db
      .query("moderationCases")
      .withIndex("by_target_policyFamily_status", (q: any) =>
        q.eq("targetType", "comment").eq("targetId", c._id).eq("policyFamily", "quality_guidelines").eq("status", "open"),
      )
      .take(8);
    for (const row of cases) await ctx.db.delete(row._id);
    await ctx.db.delete(c._id);
  }

  await deleteQuery(ctx, "debateVotes", "by_postId", (q: any) => q.eq("postId", postId));
  await deleteQuery(ctx, "threadStats", "by_postId", (q: any) => q.eq("postId", postId));
  await deleteQuery(ctx, "postReviews", "by_postId", (q: any) => q.eq("postId", postId));
  await deleteQuery(ctx, "postCompares", "by_postId", (q: any) => q.eq("postId", postId));
  await deleteQuery(ctx, "postSparks", "by_postId", (q: any) => q.eq("postId", postId));
  await deleteQuery(ctx, "postDebates", "by_postId", (q: any) => q.eq("postId", postId));
  const lists = await ctx.db.query("postLists").withIndex("by_postId", (q: any) => q.eq("postId", postId)).take(4);
  for (const list of lists) {
    const items = await ctx.db
      .query("postListItems")
      .withIndex("by_postListId_sortOrder", (q: any) => q.eq("postListId", list._id))
      .take(16);
    for (const item of items) {
      await deleteQuery(ctx, "listItemVotes", "by_item", (q: any) => q.eq("postListItemId", item._id));
      await ctx.db.delete(item._id);
    }
    await ctx.db.delete(list._id);
  }
  await deleteQuery(ctx, "postShowcases", "by_postId", (q: any) => q.eq("postId", postId));
  await deleteQuery(ctx, "postHelps", "by_postId", (q: any) => q.eq("postId", postId));
  const revs = await ctx.db
    .query("postRevisions")
    .withIndex("by_postId_revisionNumber", (q: any) => q.eq("postId", postId))
    .take(8);
  for (const r of revs) await ctx.db.delete(r._id);
  await deleteQuery(ctx, "postSeoMeta", "by_postId", (q: any) => q.eq("postId", postId));
  await deleteQuery(ctx, "postDistributionScores", "by_postId", (q: any) => q.eq("postId", postId));
  await deleteQuery(ctx, "cardSummaries", "by_postId", (q: any) => q.eq("postId", postId));
  await deleteQuery(ctx, "feedExplorationState", "by_postId", (q: any) => q.eq("postId", postId));
  const cases = await ctx.db
    .query("moderationCases")
    .withIndex("by_target_policyFamily_status", (q: any) =>
      q.eq("targetType", "post").eq("targetId", postId).eq("policyFamily", "quality_guidelines").eq("status", "open"),
    )
    .take(8);
  for (const row of cases) await ctx.db.delete(row._id);
  const featured = await ctx.db.query("vibingFeatured").withIndex("by_postId", (q: any) => q.eq("postId", postId)).take(4);
  for (const row of featured) await ctx.db.delete(row._id);
  const trends = await ctx.db
    .query("vibingTrends")
    .withIndex("by_object", (q: any) => q.eq("objectType", "post").eq("objectId", postId))
    .take(4);
  for (const row of trends) await ctx.db.delete(row._id);
  const hooks = await ctx.db
    .query("vibingHooks")
    .withIndex("by_object", (q: any) => q.eq("objectType", "post").eq("objectId", postId))
    .take(4);
  for (const row of hooks) await ctx.db.delete(row._id);
  await ctx.db.delete(postId);
}

export const wipeUserContent = internalMutation({
  args: { userIndex: v.number() },
  returns: v.object({ handle: v.string(), posts: v.number() }),
  handler: async (ctx, args) => {
    assertAllowedEnv();
    const member = MEMBERS[args.userIndex];
    if (!member) throw new Error(`demoWipe: userIndex ${args.userIndex} out of range`);
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", demoEmail(member.handle)))
      .unique();
    if (!user) return { handle: member.handle, posts: 0 };
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author_type_authorUserId", (q: any) =>
        q.eq("authorType", "user").eq("authorUserId", user._id),
      )
      .take(30);
    const demoPosts = posts.filter((p: any) => p.title?.startsWith("Demo:"));
    for (const post of demoPosts) await wipePostTree(ctx, post._id);
    return { handle: member.handle, posts: demoPosts.length };
  },
});

export const wipeChromeAndQueues = internalMutation({
  args: {},
  returns: v.object({ waitlist: v.number(), candidates: v.number(), alerts: v.number() }),
  handler: async (ctx) => {
    assertAllowedEnv();
    for (let slotOrder = 0; slotOrder < 10; slotOrder++) {
      const slot = await ctx.db
        .query("heroSlots")
        .withIndex("by_slotOrder", (q: any) => q.eq("slotOrder", slotOrder))
        .first();
      if (slot && String(slot.headlineOverride ?? "").startsWith("Demo:")) {
        await ctx.db.delete(slot._id);
      }
    }
    let waitlist = 0;
    for (let i = 1; i <= 8; i++) {
      const emailNormalized = `waitlist-${i}@${DEMO_EMAIL_DOMAIN}`;
      const row = await ctx.db
        .query("waitlistEntries")
        .withIndex("by_emailNormalized", (q: any) => q.eq("emailNormalized", emailNormalized))
        .unique();
      if (row) {
        await ctx.db.delete(row._id);
        waitlist += 1;
      }
    }
    let candidates = 0;
    const allCandidates = await ctx.db.query("contentCandidates").take(80);
    for (const c of allCandidates) {
      if (String((c.draft as any)?.title ?? "").startsWith("Demo:")) {
        await ctx.db.delete(c._id);
        candidates += 1;
      }
    }
    let alerts = 0;
    for (const key of ["demo.moderation.backlog", "demo.editorial.review"]) {
      const row = await ctx.db
        .query("adminInterventionAlerts")
        .withIndex("by_alertKey_status", (q: any) => q.eq("alertKey", key).eq("status", "open"))
        .unique();
      if (row) {
        await ctx.db.delete(row._id);
        alerts += 1;
      }
    }
    return { waitlist, candidates, alerts };
  },
});

export const wipeUsersAndTools = internalMutation({
  args: {},
  returns: v.object({ users: v.number(), tools: v.number() }),
  handler: async (ctx) => {
    assertAllowedEnv();
    let users = 0;
    for (const m of MEMBERS) {
      const row = await ctx.db
        .query("users")
        .withIndex("email", (q: any) => q.eq("email", demoEmail(m.handle)))
        .unique();
      if (!row) continue;
      const priv = await ctx.db.query("privateUserData").withIndex("by_user", (q: any) => q.eq("userId", row._id)).unique();
      if (priv) await ctx.db.delete(priv._id);
      await ctx.db.delete(row._id);
      users += 1;
    }
    let tools = 0;
    for (const t of TOOLS) {
      const row = await ctx.db.query("tools").withIndex("by_slug", (q: any) => q.eq("slug", t.slug)).unique();
      if (!row) continue;
      await ctx.db.delete(row._id);
      tools += 1;
    }
    return { users, tools };
  },
});

const wipeResultValidator = v.object({
  perUser: v.array(v.object({ handle: v.string(), posts: v.number() })),
  chrome: v.object({
    waitlist: v.number(),
    candidates: v.number(),
    alerts: v.number(),
  }),
  identities: v.object({ users: v.number(), tools: v.number() }),
});

type WipeResult = {
  perUser: Array<{ handle: string; posts: number }>;
  chrome: { waitlist: number; candidates: number; alerts: number };
  identities: { users: number; tools: number };
};

export const wipe = internalAction({
  args: {},
  returns: wipeResultValidator,
  handler: async (ctx): Promise<WipeResult> => {
    await ctx.runMutation(internal.dev.demoSeed.assertAllowed, {});
    const perUser: WipeResult["perUser"] = [];
    for (let i = 0; i < MEMBERS.length; i++) {
      perUser.push(await ctx.runMutation(internal.dev.demoSeed.wipeUserContent, { userIndex: i }));
    }
    const chrome = await ctx.runMutation(internal.dev.demoSeed.wipeChromeAndQueues, {});
    const identities = await ctx.runMutation(internal.dev.demoSeed.wipeUsersAndTools, {});
    return { perUser, chrome, identities };
  },
});
