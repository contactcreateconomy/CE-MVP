/**
 * FEED-U2 — feed.list / getChrome additive payload (CR-010 slice) against the
 * real schema + real query code (convex-test). Seeds one published post per
 * type with its extension row, stored cover + avatar, a best comment and
 * participants, then reads the feed as a signed-in viewer.
 *
 * WRITE_WIRE_PAYLOAD=1 also writes the captured payload to
 * apps/forum/src/app/(app)/lab/feed/wire-payload.json (lab proof that the
 * adapter + display components render real query output; D-012: lab only).
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";

const makeT = () => convexTest(schema, import.meta.glob("../../convex/**/*.*s"));

function user(email: string, extra: Record<string, unknown> = {}) {
  return {
    email, createdAt: 1, emailVerified: false, mobileVerified: false,
    mobileVerifiedAt: 0, accountStatus: "active", accountStanding: "good",
    trustTier: "t1", analyticsSubjectId: "a-" + email, bootstrapState: "complete",
    leaderboardOptOut: false, postingEligibilityState: "eligible",
    profileVisibility: "public", displayName: "T", avatarAssetId: "", bio: "",
    postCount: 0, approvedCommentCount: 0, lastActiveAt: 1, suspendedAt: 0,
    suspendedReason: "", deletedAt: 0, basicProfileComplete: true,
    rulesAcceptedVersion: "", rulesAcceptedAt: 0, legalAgeAssertedVersion: "",
    legalAgeAssertedAt: 0, profileVersion: 1, completionBadges: [],
    onboardingState: "activated", coachCardsShownCount: 0,
    checklistStepsShownMax: 0, coachDismissed: [],
    activationProgress: { emailVerified: false, mobileVerified: false,
      profileComplete: true, firstPostPublished: false, firstCommentPosted: false,
      firstReactionGiven: false, firstFollowMade: false },
    ...extra,
  } as any;
}

const score = (postId: any, i: number) => ({
  postId, distributionQualityVersion: 1, topScore: 10 - i, hotScore: 10 - i, trendScore: i === 0 ? 1 : 0,
  integrityMultiplier: 1, valuableWeighted: 18 + i, distinctCommenters: 3, replyCount: 24 - i, saveCount: 2,
  qualifiedReads: 40, returns7d: 0, qualifiedExposureCount: 0, explorationDeficit: 0, lastEligibleInteractionAt: 1000 - i,
  scoreVersion: 1, computedAt: 1,
});
const tool = (name: string, ratingSum: number, ratingCount: number) => ({
  name, slug: name.toLowerCase(), categoryIds: [], officialUrl: "https://example.com", status: "active",
  ratingSum, ratingCount,
  dimensionSums: { ease_of_use: 0, output_quality: 0, reliability: 0, value_for_money: 0 },
  dimensionCounts: { ease_of_use: 0, output_quality: 0, reliability: 0, value_for_money: 0 },
  pricing: "$20/mo",
});

async function seed(t: ReturnType<typeof makeT>) {
  const png = new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" });
  const coverId = await t.run((ctx: any) => ctx.storage.store(png));
  const avatarId = await t.run((ctx: any) => ctx.storage.store(png));
  return t.run(async (ctx: any) => {
    const author = await ctx.db.insert("users", user("rachel@x.test", { displayName: "Rachel Moore", username: "rachel", avatarAssetId: avatarId }));
    const viewer = await ctx.db.insert("users", user("viewer@x.test", { displayName: "Viewer", username: "viewer" }));
    const lina = await ctx.db.insert("users", user("lina@x.test", { displayName: "Lina Park", username: "lina" }));
    const types = ["review", "debate", "help", "list", "showcase", "news", "compare", "spark"] as const;
    const ids: Record<string, any> = {};
    for (const [i, type] of types.entries()) {
      const postId = await ctx.db.insert("posts", {
        authorType: "user", authorUserId: author, type, title: `A ${type} post`, body: "Body text", categoryId: type,
        toolIds: [], lifecycleStatus: "published", moderationStatus: "passed", visibility: "public", createdAt: 1, publishedAt: 1,
      });
      ids[type] = postId;
      await ctx.db.insert("postDistributionScores", score(postId, i));
      await ctx.db.insert("postSeoMeta", {
        postId, seoTitle: "t", seoDescription: "d", slug: `a-${type}`, keywords: [], canonicalUrl: `/discussions/a-${type}`,
        structuredDataType: "article", manuallyEdited: false, generatedAt: 1, ...(type === "review" ? { ogImageAssetId: coverId } : {}),
      });
    }
    // best comment + participants on the review
    const comment = await ctx.db.insert("comments", {
      postId: ids.review, depth: 0, authorType: "user", authorUserId: lina, body: "the handoff checklist alone saved me a week",
      isQuestion: false, moderationStatus: "passed", lastActivityAt: 1, createdAt: 1,
    });
    await ctx.db.insert("cardSummaries", {
      postId: ids.review, oneLiner: "Six months in", generationRunId: "r", supportingClaimIds: [], groundingStatus: "insufficient",
      stale: false, createdAt: 1, runningCommentRef: { commentId: comment, frozenAt: 1 }, avatarUserIds: [lina, author], discussingCount: 24,
    });
    // facets
    const cursor = await ctx.db.insert("tools", tool("Cursor", 44, 10));
    await ctx.db.insert("postReviews", { postId: ids.review, toolId: cursor, verdictScore: 4, pros: ["Fast multi-file edits"], cons: ["Usage caps"] });
    await ctx.db.insert("postDebates", { postId: ids.debate, proposition: "AI posts need a label", agreeCount: 62, disagreeCount: 38, abstainCount: 4 });
    const answer = await ctx.db.insert("comments", {
      postId: ids.help, depth: 0, authorType: "user", authorUserId: lina, body: "Dedupe on the charge id", isQuestion: false,
      moderationStatus: "passed", lastActivityAt: 1, createdAt: 1,
    });
    await ctx.db.insert("postHelps", { postId: ids.help, problemStatement: "Zapier double-fires", resolvedStatus: "resolved", acceptedCommentId: answer, acceptedByUserId: author });
    const list = await ctx.db.insert("postLists", { postId: ids.list, mode: "community_ranked", intro: "Stack" });
    for (const [j, [content, votes]] of ([["Framer", 128], ["Tally", 94], ["Make", 71], ["Notion", 12]] as const).entries()) {
      await ctx.db.insert("postListItems", { postListId: list, content, createdByUserId: author, voteCount: votes, sortOrder: j, createdAt: 1 });
    }
    await ctx.db.insert("postShowcases", { postId: ids.showcase, theThing: "An onboarding pipeline", projectUrl: "https://x.test", approvalStatus: "approved" });
    await ctx.db.insert("postNews", { postId: ids.news, sourceOfTruthUrl: "https://www.theverge.com/a", keyClaims: ["Chapter search for every channel"] });
    await ctx.db.insert("postCompares", { postId: ids.compare, toolIds: [cursor], qualitativeGrid: {} });
    await ctx.db.insert("saves", { userId: viewer, postId: ids.review, createdAt: 1 });
    for (const [i, [type, label]] of ([["spark", "Spark"], ["news", "News"], ["review", "Review"], ["compare", "Compare"], ["debate", "Debate"], ["help", "Help"], ["list", "List"], ["showcase", "Showcase"]] as const).entries()) {
      await ctx.db.insert("postTypeConfig", { type, state: "active", sortOrder: i, label, updatedAt: 1 });
    }
    // chrome
    await ctx.db.insert("heroSlots", {
      slotOrder: 0, postId: ids.review, startAt: 0, endAt: Date.now() + 86_400_000, desktopEnabled: true, mobileEnabled: false,
      status: "active", disclosureClass: "community_top", createdAt: 1, ctaLabel: "Open discussion",
    });
    await ctx.db.insert("vibingTrends", {
      objectType: "post", objectId: ids.debate, trendScore: 5, velocity: 1, acceleration: 1, distinctHumanCount: 512,
      interactionTypeCount: 3, integrityMultiplier: 1, enteredAt: 1, status: "trending",
    });
    return { viewer, ids };
  });
}

const cardOf = (page: any[], type: string) => page.find((c) => c.type === type);

describe("feed.list additive payload (FEED-U2)", () => {
  it("cards carry author, cover, best comment, participants, facets and viewer state from real rows", async () => {
    const t = makeT();
    const { viewer } = await seed(t);
    const res: any = await t.withIdentity({ subject: `${viewer}|s1` }).query(api.feed.list, { sortMode: "top" });
    expect(res.page.length).toBe(8);

    const review = cardOf(res.page, "review");
    expect(review.author).toMatchObject({ name: "Rachel Moore", handle: "rachel", kind: "user" });
    expect(review.author.avatarUrl).toMatch(/^https?:\/\//);
    expect(review.coverImage).toMatch(/^https?:\/\//);
    expect(review.bestComment).toEqual({ author: "lina", body: "the handoff checklist alone saved me a week" });
    expect(review.participants.map((p: any) => p.handle)).toEqual(["lina", "rachel"]);
    expect(review.facet).toMatchObject({ kind: "review", tool: { name: "Cursor", price: "$20/mo" }, verdict: 4, community: 4.4, pro: "Fast multi-file edits", con: "Usage caps" });
    expect(review.viewer).toEqual({ saved: true });

    expect(cardOf(res.page, "help").facet).toMatchObject({ kind: "help", problem: "Zapier double-fires", resolved: true, resolvedBy: "lina" });
    expect(cardOf(res.page, "list").facet).toEqual({ kind: "list", items: [{ label: "Framer", votes: 128 }, { label: "Tally", votes: 94 }, { label: "Make", votes: 71 }], more: 1 });
    expect(cardOf(res.page, "showcase").facet).toEqual({ kind: "showcase", thing: "An onboarding pipeline", linkApproved: true });
    expect(cardOf(res.page, "news").facet).toEqual({ kind: "news", claim: "Chapter search for every channel", domain: "theverge.com" });
    expect(cardOf(res.page, "compare").facet).toEqual({ kind: "compare", tools: [{ name: "Cursor", community: 4.4 }] });
    expect(cardOf(res.page, "spark").facet).toBeNull();
    // no source → nothing (D-012)
    expect(cardOf(res.page, "spark").bestComment).toBeNull();
    expect(cardOf(res.page, "spark").participants).toEqual([]);

    if (process.env.WRITE_WIRE_PAYLOAD === "1") {
      const chrome = await t.withIdentity({ subject: `${viewer}|s1` }).query(api.feed.getChrome, {});
      writeFileSync(
        join(__dirname, "../../apps/forum/src/app/(app)/lab/feed/wire-payload.json"),
        JSON.stringify({ capturedFrom: "tests/integration/feed-u2-payload.test.ts (convex-test, real feed.list + getChrome)", list: res, chrome }, null, 2) + "\n",
      );
    }
  });

  it("debate split stays hidden until the viewer votes (L-29)", async () => {
    const t = makeT();
    const { viewer, ids } = await seed(t);
    const asViewer = t.withIdentity({ subject: `${viewer}|s1` });
    let res: any = await asViewer.query(api.feed.list, { sortMode: "top" });
    expect(cardOf(res.page, "debate").facet).toEqual({ kind: "debate", votes: 100, viewerVote: null, agreePct: null });
    await t.run((ctx: any) => ctx.db.insert("debateVotes", { postId: ids.debate, userId: viewer, choice: "disagree", createdAt: 1 }));
    res = await asViewer.query(api.feed.list, { sortMode: "top" });
    expect(cardOf(res.page, "debate").facet).toEqual({ kind: "debate", votes: 100, viewerVote: "disagree", agreePct: 62 });
  });

  it("guests get no viewer state and no split", async () => {
    const t = makeT();
    await seed(t);
    const res: any = await t.query(api.feed.list, { sortMode: "hot" });
    expect(cardOf(res.page, "review").viewer).toEqual({});
    expect(cardOf(res.page, "debate").facet.agreePct).toBeNull();
  });
});

describe("getChrome additive payload (FEED-U2)", () => {
  it("hero frames carry summary + type + cover; post trends carry title + slug + type", async () => {
    const t = makeT();
    await seed(t);
    const chrome: any = await t.query(api.feed.getChrome, {});
    expect(chrome.hero[0]).toMatchObject({ title: "A review post", summary: "Six months in", type: "review", isCommunityTop: true, slug: "a-review" });
    expect(chrome.hero[0].coverImage).toMatch(/^https?:\/\//);
    expect(chrome.vibing[0]).toMatchObject({ title: "A debate post", slug: "a-debate", postType: "debate", humans: 512 });
  });

  it("L-85 — hero mediaUrl falls back to the post's cover when the slot has none", async () => {
    const t = makeT();
    await seed(t);
    const chrome: any = await t.query(api.feed.getChrome, {});
    // the seeded slot carries no mediaAssetId; the review post has a stored cover
    expect(chrome.hero[0].mediaUrl).toMatch(/^https?:\/\//);
    expect(chrome.hero[0].mediaUrl).toBe(chrome.hero[0].coverImage);
  });
});
