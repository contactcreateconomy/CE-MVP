import { describe, it, expect, afterEach } from "vitest";
import { convexTest } from "convex-test";
import schemaDefault from "../../convex/schema";
import * as legitimacy from "../../convex/jobs/legitimacy";
import * as importMembers from "../../convex/demoWorld/importMembers";
import * as generatedApi from "../../convex/_generated/api";

/* CR-012 (the missing test): createdAt is the signup-time field
 * (canonicalSignupFields); _creationTime cannot be backdated (Convex strips
 * it from inserts), so it is ~now for imported corpora. account_age must
 * derive from createdAt — a 90-day-old member scores ~0.5 (90/180), not ~0.
 * RED (pre-CR-012 code reading _creationTime): account_age ≈ days(now-now)/180
 * ≈ 0. GREEN: ≈ 0.5. */

const modules = {
  legitimacy,
  importMembers,
  "convex/_generated/api": generatedApi,
};

afterEach(() => {
  delete process.env.CONVEX_CLOUD_URL;
});

describe("CR-012 account_age from backdated createdAt", () => {
  it("imported member with 90-day-old createdAt gets account_age ≈ 0.5, not ≈ 0", async () => {
    process.env.CONVEX_CLOUD_URL = "http://127.0.0.1:3210";
    const t = convexTest(schemaDefault, modules);

    // canonical signup fields via the demo importer; joinOffsetMs −90d backdates createdAt
    await t.mutation(importMembers.importMembers, {
      seq: 0, worldEnd: Date.now(),
      rows: [{ handle: "aged90", name: "Aged", email: "aged90@demo.createconomy.invalid", bio: "b", joinOffsetMs: -90 * 86_400_000, verified: true }],
    });
    const userId = await t.mutation(async (ctx: any) => {
      const u = await ctx.db.query("users").withIndex("email", (q: any) => q.eq("email", "aged90@demo.createconomy.invalid")).unique();
      expect(u.createdAt).toBeLessThan(Date.now() - 89 * 86_400_000); // backdated (CR-012 field)
      expect(Date.now() - u._creationTime).toBeLessThan(60_000); // creation time is ~now
      await ctx.db.insert("rawEvents", {
        eventClass: "interaction", eventType: "comment.created",
        userId: u._id, sequenceInSession: 0, targetType: "post", targetId: "p",
        source: "direct", schemaVersion: 1,
        isAiPersona: false, isStaff: false, isPersona: false, isCountableAtWrite: true,
        occurredAt: Date.now() - 3_600_000, receivedAt: Date.now() - 3_600_000,
      });
      return u._id;
    });

    await t.mutation(legitimacy.recompute, {});
    const row = await t.query(async (ctx: any) =>
      await ctx.db.query("legitimacyScores").withIndex("by_actor", (q: any) => q.eq("actorUserId", userId)).unique(),
    );
    expect(row).not.toBeNull();
    expect(row.componentScores.account_age).toBeGreaterThanOrEqual(0.45); // ~90/180
    expect(row.componentScores.account_age).toBeLessThanOrEqual(0.55);
  });
});
