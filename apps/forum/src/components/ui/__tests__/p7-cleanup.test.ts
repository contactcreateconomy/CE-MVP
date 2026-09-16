 
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P7-CLEANUP acceptance tests — legacy retirement + canonical
 * tightening (00-TRANSITION closeout). Criteria (a)-(c) + (e) from the
 * slice catalog; (d) is this suite + tsc/build themselves. */

const repoRoot = join(__dirname, "../../../../../..");
const convexRoot = join(repoRoot, "convex");
const forumSrc = join(repoRoot, "apps/forum/src");
const read = (root: string, rel: string) => readFileSync(join(root, rel), "utf8");

const schemaSrc = read(convexRoot, "schema.ts");
const authSrc = read(convexRoot, "auth.ts");
const storeSeedSrc = read(convexRoot, "store/seed.ts");
const seedSrc = read(convexRoot, "seed.ts");

const usersSlice = schemaSrc.split("users: defineTable({")[1].split('.index("email"')[0];
const roleSlice = schemaSrc
  .split("roleAssignments: defineTable({")[1]
  .split('.index("by_user"')[0];

const LEGACY_TABLES = [
  "forumPosts", "forumPostComments", "forumProfiles", "memberships",
  "forumNotifications", "forumReports", "forumModActions",
  "forumAnalyticsEvents", "forumDailyStats", "forumFeedCache",
  "forumCategoryPayloads", "forumCategories", "forumRichThreads",
  "forumFavorites", "forumUpvotes", "forumCampaigns", "forumLeaderboard",
  "forumVibingItems", "forumUserSettings", "forumHeroSlides",
  "forumWriteBuckets", "forumCounterShards",
];

/** Walk non-test .ts/.tsx sources under root, skipping generated/vendor dirs.
 * Test files are excluded: this suite quotes the forbidden tokens itself. */
function walk(root: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(root)) {
    if (entry === "_generated" || entry === "node_modules" || entry.startsWith("."))
      continue;
    const full = join(root, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (/\.test\.tsx?$/.test(entry)) continue;
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

describe("SLICE-P7-CLEANUP criterion (a) — zero legacy references", () => {
  it("no source file under convex/ or apps/forum/src references a legacy table", () => {
    // Word-boundary match: the canonical distributionMemberships table
    // contains the substring but is never the legacy memberships table.
    const patterns = LEGACY_TABLES.map(
      (t) => new RegExp(t === "memberships" ? "\\bmemberships\\b" : `\\b${t}\\b`),
    );
    const files = [...walk(convexRoot), ...walk(forumSrc)];
    expect(files.length).toBeGreaterThan(50);
    const offenders: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      for (const re of patterns) {
        if (re.test(src)) offenders.push(`${f}: ${re.source}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("convex/forum module directory is deleted", () => {
    expect(existsSync(join(convexRoot, "forum"))).toBe(false);
  });
});

describe("SLICE-P7-CLEANUP criterion (b) — users tightened to bible-required", () => {
  it("core canonical fields are schema-required (no v.optional)", () => {
    for (const f of [
      "emailVerified: v.boolean()",
      "mobileVerified: v.boolean()",
      "mobileVerifiedAt: v.number()",
      'accountStatus: v.union(v.literal("active"), v.literal("deleted"))',
      "analyticsSubjectId: v.string()",
      'bootstrapState: v.union(v.literal("pending_context"), v.literal("complete"))',
      "leaderboardOptOut: v.boolean()",
      "displayName: v.string()",
      "avatarAssetId: v.string()",
      "bio: v.string()",
      "postCount: v.number()",
      "approvedCommentCount: v.number()",
      "createdAt: v.number()",
      "lastActiveAt: v.number()",
      "basicProfileComplete: v.boolean()",
      "rulesAcceptedVersion: v.string()",
      "profileVersion: v.number()",
      "completionBadges: v.array(v.string())",
      "coachCardsShownCount: v.number()",
      "checklistStepsShownMax: v.number()",
      "activationProgress: v.object({",
    ]) {
      expect(usersSlice).toContain(f);
    }
  });

  it("tokenIdentifier is the one documented exception (still optional)", () => {
    expect(usersSlice).toContain("tokenIdentifier: v.optional(v.string())");
  });

  it("the auth Password profile inserts the full canonical set at signup", () => {
    const founderSrc = read(convexRoot, "lib/founder.ts");
    expect(authSrc).toContain("canonicalSignupFields");
    for (const f of [
      'accountStatus: "active" as const',
      'bootstrapState: "pending_context" as const',
      "analyticsSubjectId: crypto.randomUUID()",
      "postingEligibilityState: \"basic_incomplete\" as const",
      "activationProgress: {",
      "firstFollowMade: false",
    ]) {
      expect(founderSrc).toContain(f);
    }
  });

  it("store/seed reserved identity + seed backfill carry the canonical set", () => {
    expect(storeSeedSrc).toContain("analyticsSubjectId: crypto.randomUUID()");
    expect(storeSeedSrc).toContain('bootstrapState: "complete"');
    expect(seedSrc).toContain("export const backfillCanonicalUsers");
  });
});

describe("SLICE-P7-CLEANUP criterion (c) — roleAssignments required on insert", () => {
  it("role/scopeType/status/grantedAt are non-optional validators", () => {
    expect(roleSlice).toContain("role: v.union(");
    expect(roleSlice).toContain("scopeType: v.union(");
    expect(roleSlice).toContain("status: v.union(");
    expect(roleSlice).toContain("grantedAt: v.number()");
    for (const f of [
      "role: v.optional",
      "scopeType: v.optional",
      "status: v.optional",
      "grantedAt: v.optional",
    ]) {
      expect(roleSlice).not.toContain(f);
    }
  });
});

describe("SLICE-P7-CLEANUP criterion (e) — P1-01a deviation comment removed", () => {
  it("the coexistence-window deviation block is gone from schema.ts", () => {
    expect(schemaSrc).not.toContain("coexistence window");
    expect(schemaSrc).not.toContain("inserts bare users");
    expect(schemaSrc).toContain("SLICE-P7-CLEANUP 2026-09-10");
  });
});
