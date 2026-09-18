import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { insertExtensionRow } from "../../convex/posts";

/**
 * insertExtensionRow — regression coverage for the screen-audit fix
 * (2026-09-18, CONTRACT-2-compose Wave 2). Exercises the plain-TS helper
 * directly (convex-test's `t.run`, real schema, no auth/gate chain) since
 * the full `posts.createPost` mutation needs `@convex-dev/auth` identity
 * wiring this repo's test suite does not yet establish — see AGENTS.md
 * §11 wiki note if that gap is later closed.
 *
 * Before this fix: the showcase branch inserted `postShowcases` WITHOUT
 * `approvalStatus` (a required, non-optional schema column) — every
 * showcase post create would have thrown at runtime the first time a real
 * user reached it. Never caught because the composer UI never sent
 * `projectUrl` and no test exercised this insert.
 */
function makeT() {
  return convexTest(schema, import.meta.glob("../../convex/**/*.*s"));
}

/** Minimal valid users row (schema requires the full bootstrap field set —
 *  same shape as tests/integration/backend.test.ts's seedUser). */
function seedUser(email: string) {
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
  } as any;
}

async function seedBasePost(ctx: any, type: string) {
  return await ctx.db.insert("posts", {
    authorType: "user",
    authorUserId: await ctx.db.insert("users", seedUser("author@x.test")),
    type,
    title: "t",
    body: "b",
    categoryId: type,
    toolIds: [],
    lifecycleStatus: "draft",
    moderationStatus: "not_required",
    visibility: "private",
    createdAt: 1,
  });
}

describe("insertExtensionRow (per-type extension row — CAP-086 1:1 invariant)", () => {
  it("showcase WITHOUT a projectUrl inserts approvalStatus='none' (schema requires the column)", async () => {
    const t = makeT();
    await t.run(async (ctx) => {
      const postId = await seedBasePost(ctx, "showcase");
      await insertExtensionRow(ctx, postId, { type: "showcase", body: "b", extensionData: {} });
      const row: any = await ctx.db
        .query("postShowcases")
        .withIndex("by_postId", (q: any) => q.eq("postId", postId))
        .unique();
      expect(row).not.toBeNull();
      expect(row.approvalStatus).toBe("none");
      expect(row.projectUrl).toBeUndefined();
    });
  });

  it("showcase WITH a projectUrl inserts approvalStatus='pending' (contract §3 State 7)", async () => {
    const t = makeT();
    await t.run(async (ctx) => {
      const postId = await seedBasePost(ctx, "showcase");
      await insertExtensionRow(ctx, postId, {
        type: "showcase",
        body: "b",
        projectUrl: "https://example.com/project",
        extensionData: {},
      });
      const row: any = await ctx.db
        .query("postShowcases")
        .withIndex("by_postId", (q: any) => q.eq("postId", postId))
        .unique();
      expect(row.approvalStatus).toBe("pending");
      expect(row.projectUrl).toBe("https://example.com/project");
    });
  });

  it("review stores toolId + dimension-derived verdictScore + pros/cons/verdictSummary", async () => {
    const t = makeT();
    await t.run(async (ctx) => {
      const postId = await seedBasePost(ctx, "review");
      await insertExtensionRow(ctx, postId, {
        type: "review",
        body: "b",
        dimensionScores: { ease_of_use: 4, output_quality: 5, reliability: 3, value_for_money: "not_applicable" },
        extensionData: { toolId: "tool_1", verdictSummary: "Solid.", pros: ["Fast"], cons: ["Pricey"] },
      });
      const row: any = await ctx.db
        .query("postReviews")
        .withIndex("by_postId", (q: any) => q.eq("postId", postId))
        .unique();
      expect(row.toolId).toBe("tool_1");
      expect(row.verdictScore).toBe(4); // (4+5+3)/3, N/A excluded
      expect(row.verdictSummary).toBe("Solid.");
      expect(row.pros).toEqual(["Fast"]);
      expect(row.cons).toEqual(["Pricey"]);
    });
  });

  it("compare stores toolIds (2-4) + qualitativeGrid", async () => {
    const t = makeT();
    await t.run(async (ctx) => {
      const postId = await seedBasePost(ctx, "compare");
      await insertExtensionRow(ctx, postId, {
        type: "compare",
        body: "b",
        toolIds: ["tool_1", "tool_2"],
        extensionData: { qualitativeGrid: "Use case: X" },
      });
      const row: any = await ctx.db
        .query("postCompares")
        .withIndex("by_postId", (q: any) => q.eq("postId", postId))
        .unique();
      expect(row.toolIds).toEqual(["tool_1", "tool_2"]);
      expect(row.qualitativeGrid).toBe("Use case: X");
    });
  });

  it("list stores mode + intro", async () => {
    const t = makeT();
    await t.run(async (ctx) => {
      const postId = await seedBasePost(ctx, "list");
      await insertExtensionRow(ctx, postId, {
        type: "list",
        body: "b",
        extensionData: { mode: "static_creator", intro: "Top picks" },
      });
      const row: any = await ctx.db
        .query("postLists")
        .withIndex("by_postId", (q: any) => q.eq("postId", postId))
        .unique();
      expect(row.mode).toBe("static_creator");
      expect(row.intro).toBe("Top picks");
    });
  });
});
