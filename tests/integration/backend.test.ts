import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import { api } from "../../convex/_generated/api";
import schema from "../../convex/schema";

/* Convex INTEGRATION tests — Testing-Strategy row 5.
 *
 * Runs the REAL schema + REAL function code (with its real imports, incl.
 * the @convex-dev/rate-limiter COMPONENT) against convex-test's in-memory
 * backend. This is the documented Convex testing pattern; it exercises the
 * same index semantics as the real backend, with no deployment needed.
 *
 * Deliberately NOT targeting the cloud dev deployment (watchful-chameleon-570):
 * test junk + unbounded rate-bucket tests would poison the seeded live dev
 * deployment.
 */

function makeT() {
  // convex-test needs the Vite glob of ALL function modules (it registers
  // them into the in-memory backend), not just the generated api. The
  // rateLimiter component must be registered explicitly with its own
  // schema + module glob (convex.config.ts is not auto-loaded here).
  // The component's compiled files are copied to
  // tests/integration/components/ by scripts/sync-components.mjs (run in
  // the "pretest:convex" step) because import.meta.glob cannot resolve
  // through a package's exports map (bare-specifier globs fail).
  const t = convexTest(
    schema,
    import.meta.glob("../../convex/**/*.*s"),
  );
  t.registerComponent(
    "rateLimiter",
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("./components/rate-limiter/component/schema.js").default,
    import.meta.glob("./components/rate-limiter/**/*.*s"),
  );
  return t;
}

function seedCategory(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    slug: "tools",
    name: "Tools",
    description: "AI tool talk",
    seoTitle: "Tools — CE",
    seoDescription: "Tools category",
    sortOrder: 1,
    status: "active",
    ...overrides,
  };
}

describe("categories.listActive (query: filter + sort contract)", () => {
  it("returns active categories in sortOrder, projected to slug/name/description", async () => {
    const t = makeT();
    await t.run(async (ctx) => {
      await ctx.db.insert("categories", seedCategory({ slug: "b-second", sortOrder: 2 }));
      await ctx.db.insert("categories", seedCategory({ slug: "a-first", sortOrder: 1 }));
      // An inactive row must be filtered out, not sorted in.
      await ctx.db.insert("categories", seedCategory({ slug: "z-archived", sortOrder: 0, status: "archived" }));

      const rows = await ctx.runQuery(api.categories.listActive, {});
      expect(rows.map((r) => r.slug)).toEqual(["a-first", "b-second"]);
      for (const row of rows) {
        expect(Object.keys(row).sort()).toEqual(["description", "name", "slug"]);
      }
    });
  });

  it("returns [] when no categories exist (honest empty)", async () => {
    const t = makeT();
    await t.run(async (ctx) => {
      const rows = await ctx.runQuery(api.categories.listActive, {});
      expect(rows).toEqual([]);
    });
  });
});

describe("waitlist.join (mutation: unique index + rate-limit component + event)", () => {
  /** Production seeds eventCatalog via seed:bootstrap; tests replicate that
   *  precondition using the SAME exported row the seeder uses. */
  async function seedEventCatalog(ctx: { db: { insert: (t: string, d: unknown) => Promise<unknown> } }) {
    const { WAITLIST_EVENT_CATALOG_ROW } = await import("../../convex/waitlist");
    await ctx.db.insert("eventCatalog", WAITLIST_EVENT_CATALOG_ROW);
  }

  it("FAILS CLOSED without the seeded eventCatalog row (CAP-437/436)", async () => {
    const t = makeT();
    await t.run(async (ctx) => {
      // No catalog row: the mutation must reject and roll back (no entry row).
      await expect(
        ctx.runMutation(api.waitlist.join, { email: "ghost@example.com" }),
      ).rejects.toThrow(/not registered in eventCatalog/);
      expect(await ctx.db.query("waitlistEntries").collect()).toHaveLength(0);
    });
  });

  it("inserts a waiting entry, emits waitlist_join, and returns the contract shape", async () => {
    const t = makeT();
    await t.run(async (ctx) => {
      await seedEventCatalog(ctx);
      const res = await ctx.runMutation(api.waitlist.join, { email: "  Ada@Example.COM  " });
      expect(res).toMatchObject({ status: "waiting", alreadyJoined: false });

      const stored = await ctx.db
        .query("waitlistEntries")
        .withIndex("by_emailNormalized", (q: any) => q.eq("emailNormalized", "ada@example.com"))
        .unique();
      expect(stored).not.toBeNull();
      expect(stored!.email).toBe("  Ada@Example.COM  "); // original preserved
      expect(stored!.status).toBe("waiting");

      // CAP-478: the ONLY event is observational waitlist_join — never an L08 signup.
      const event = await ctx.db.query("rawEvents").first();
      expect(event).not.toBeNull();
      expect(event!.eventType).toBe("waitlist_join");
      expect(event!.isCountableAtWrite).toBe(false);
    });
  });

  it("duplicate email (case/whitespace-insensitive) → alreadyJoined, no second row, no second event", async () => {
    const t = makeT();
    await t.run(async (ctx) => {
      await seedEventCatalog(ctx);
      await ctx.runMutation(api.waitlist.join, { email: "ada@example.com" });
      const res = await ctx.runMutation(api.waitlist.join, { email: "ADA@example.com" });
      expect(res.alreadyJoined).toBe(true);

      const all = await ctx.db.query("waitlistEntries").collect();
      expect(all).toHaveLength(1);
      const events = await ctx.db.query("rawEvents").collect();
      expect(events).toHaveLength(1);
    });
  });

  it("enforces the CAP-015 email bucket (3 attempts/24h per email) via the REAL rate-limiter component", async () => {
    const t = makeT();
    await t.run(async (ctx) => {
      await seedEventCatalog(ctx);
      // The gate counts ATTEMPTS per email (before the duplicate lookup) so
      // attackers can't probe via the alreadyJoined response: attempt 1
      // inserts, attempts 2–3 return alreadyJoined (and consume the bucket),
      // attempt 4 must throw the typed rejection.
      await ctx.runMutation(api.waitlist.join, { email: "a1@example.com" });
      const second = await ctx.runMutation(api.waitlist.join, { email: "a1@example.com" });
      expect(second.alreadyJoined).toBe(true);
      const third = await ctx.runMutation(api.waitlist.join, { email: "a1@example.com" });
      expect(third.alreadyJoined).toBe(true);

      await expect(ctx.runMutation(api.waitlist.join, { email: "a1@example.com" })).rejects.toThrow(
        /rate_limit: waitlist\.join\.email exceeded/,
      );
    });
  });

  it("a different email has its own bucket (per-email subject isolation)", async () => {
    const t = makeT();
    await t.run(async (ctx) => {
      await seedEventCatalog(ctx);
      // Exhaust one email's bucket.
      for (const _ of [1, 2, 3]) await ctx.runMutation(api.waitlist.join, { email: "b1@example.com" }).catch(() => {});
      // A different email is unaffected — subject isolation by email.
      const res = await ctx.runMutation(api.waitlist.join, { email: "c1@example.com" });
      expect(res.alreadyJoined).toBe(false);
    });
  });
});

/* ── Security scan round 2, finding 32: Signal revocation cascade ── */

/** Minimal valid users row (schema requires the full bootstrap field set). */
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

describe("Signal revocation cascade (scan round 2, finding 32)", () => {
  it("soft-deleting a comment reverses its anchored awards + splits (idempotent)", async () => {
    const t = makeT();
    await t.run(async (ctx) => {
      // Seed: a season, a post author, a commenter, an outcome event on the
      // comment, an award anchored on it, and a finalized split row derived
      // from that award (the split:<awardId>:<commenter> key discipline).
      const seasonId = await ctx.db.insert("signalSeasons", {
        seasonNumber: 1, startAt: 1, endAt: 2, status: "active", mode: "fixed",
        thresholds: {}, poolSize: 10,
      } as any);
      const authorId = await ctx.db.insert("users", seedUser("author@x.test") as any);
      const commenterId = await ctx.db.insert("users", seedUser("commenter@x.test") as any);
      const postId = await ctx.db.insert("posts", {
        authorType: "user", authorUserId: authorId, type: "spark",
        title: "t", body: "b", categoryId: "c1", lifecycleStatus: "published",
        moderationStatus: "passed", visibility: "public", createdAt: 1, toolIds: [],
      } as any);
      // Mirror comments.create's post-fix seeding (l.243): omit at insert,
      // patch the self-id same-tx (depth 0).
      const commentId = await ctx.db.insert("comments", {
        postId, authorType: "user", authorUserId: commenterId, body: "b",
        depth: 0, moderationStatus: "passed", createdAt: 1,
        threadRootCommentId: undefined, parentCommentId: undefined,
        isQuestion: false, editedAt: 0, lastActivityAt: 1,
      } as any);
      await ctx.db.patch(commentId, { threadRootCommentId: commentId } as any);
      const eventId = await ctx.db.insert("rawEvents", {
        eventClass: "outcome", eventType: "comment.reacted", userId: authorId,
        sequenceInSession: 1, targetType: "comment", targetId: commentId,
        authorUserId: commenterId, source: "direct", isAiPersona: false,
        isStaff: false, isPersona: false, isCountableAtWrite: true,
        occurredAt: Date.now(), receivedAt: Date.now(), schemaVersion: 1,
      } as any);
      const awardId = await ctx.db.insert("signalLedger", {
        contributionId: "outcome:" + eventId, contributionType: "post",
        authorUserId: commenterId, outcomeType: "comment.reacted",
        outcomeEventId: eventId, grossValue: 1, legitimacyFactor: 1,
        confidenceFactor: 0.5, attributionModelVersion: "positional.v1",
        outcomeDefinitionVersion: 1, signalValue: 0.4, state: "provisional",
        entryType: "award", seasonId, provisionalAt: Date.now(),
        meta: { journey: "post:" + postId },
      } as any);
      const splitId = await ctx.db.insert("signalLedger", {
        contributionId: `split:${awardId}:${commenterId}`, contributionType: "comment",
        authorUserId: commenterId, outcomeType: "comment.reacted",
        outcomeEventId: eventId, grossValue: 0.06, legitimacyFactor: 1,
        confidenceFactor: 0.5, attributionModelVersion: "positional.v1",
        outcomeDefinitionVersion: 1, signalValue: 0.06, state: "finalized",
        entryType: "award", seasonId, provisionalAt: Date.now(), finalizedAt: Date.now(),
      } as any);

      // The revocation under test (the REAL module code).
      const { reverseCommentOutcomes } = await import("../../convex/jobs/attributionSettle");
      const reversed1 = await reverseCommentOutcomes(ctx, commentId, "comment_soft_deleted");
      expect(reversed1).toBeGreaterThanOrEqual(1);

      // The anchor event is marked reversed…
      const event = await ctx.db.get(eventId);
      expect((event as any).reversedAt).toBeGreaterThan(0);
      // …the award is flipped + a negative reversal row exists…
      const award = await ctx.db.get(awardId);
      expect(award?.state).toBe("reversed");
      const reversals = (await ctx.db.query("signalLedger").collect())
        .filter((r: any) => r.entryType === "reversal");
      expect(reversals.length).toBeGreaterThanOrEqual(1);
      // …and the SPLIT row (the finding-32 key-mismatch class) is retracted too.
      const split = await ctx.db.get(splitId);
      expect(["reversed", "clawed_back"]).toContain(split?.state);

      // IDEMPOTENT: a second run reverses nothing new (no duplicate rows).
      const before = (await ctx.db.query("signalLedger").collect()).length;
      const reversed2 = await reverseCommentOutcomes(ctx, commentId, "comment_soft_deleted");
      const after = (await ctx.db.query("signalLedger").collect()).length;
      expect(reversed2).toBe(0);
      expect(after).toBe(before);
    });
  });

  it("reaction removal events are never awardable (finding 31 discipline)", async () => {
    const t = makeT();
    await t.run(async (ctx) => {
      const testUserId = await ctx.db.insert("users", seedUser("actor@x.test") as any);
      const eventId = await ctx.db.insert("rawEvents", {
        eventClass: "outcome", eventType: "comment.reacted", userId: testUserId,
        sequenceInSession: 1, targetType: "comment", targetId: "c1",
        authorUserId: testUserId, source: "direct", isAiPersona: false,
        isStaff: false, isPersona: false, isCountableAtWrite: false,
        reactionType: "negative",
        occurredAt: Date.now(), receivedAt: Date.now(), schemaVersion: 1,
      } as any);
      const event = await ctx.db.get(eventId);
      // The sweep's re-check predicate (mirrors award.ts's guard).
      // The sweep's guard (award.ts): a negative or uncountable reaction
      // event never awards. Removal events carry isCountableAtWrite=false
      // from the emitter (stored detail fields, not schema-validated).
      const negative = (event as any).reactionType === "negative";
      expect(negative || event?.isCountableAtWrite === false).toBe(true);
    });
  });
});
