import { describe, it, expect, afterEach, vi } from "vitest";
import { convexTest } from "convex-test";
import schemaDefault from "../../convex/schema";
import * as legitimacy from "../../convex/jobs/legitimacy";
import * as importMembers from "../../convex/demoWorld/importMembers";
import * as generatedApi from "../../convex/_generated/api"; // module-root anchor for convex-test

/* Legitimacy self-chaining recompute (post-final-run fix): the cron only
 * STARTS a bounded 40-actor slice; while stale actors remain the slice
 * schedules its own continuation (scheduler.runAfter, small delay) until the
 * scan set is empty. A platformHealth lease guards against duplicate chains.
 * RED (pre-fix): one recompute scores exactly 40 and never schedules — the
 * other 80 stay unscored. GREEN: the chain drains all 120. */

const modules = {
  legitimacy,
  // real module path (registry prefix comes from the _generated key) — the
  // self-scheduling runAfter resolves the continuation through it
  "convex/jobs/legitimacy": () => Promise.resolve(legitimacy),
  importMembers,
  "convex/_generated/api": generatedApi,
};

afterEach(() => {
  delete process.env.CONVEX_CLOUD_URL;
  vi.useRealTimers();
});

describe("legitimacy recompute self-chaining", () => {
  it("120 stale actors → all scored after the chain; duplicate external starts are guarded", async () => {
    process.env.CONVEX_CLOUD_URL = "http://127.0.0.1:3210";
    vi.useFakeTimers();
    const t = convexTest(schemaDefault, modules);

    // 120 members with canonical signup fields, each with a recent interaction
    // event (their legitimacy rows do not exist → all stale for the scan)
    const rows = Array.from({ length: 120 }, (_, i) => ({
      handle: `chain${i}`, name: `Chain ${i}`, email: `chain${i}@demo.createconomy.invalid`,
      bio: "b", joinOffsetMs: -90 * 86_400_000, verified: true,
    }));
    await t.mutation(importMembers.importMembers, { seq: 0, worldEnd: Date.now(), rows });
    await t.mutation(async (ctx: any) => {
      const users = await ctx.db.query("users").collect();
      const demo = users.filter((u: any) => String(u.email).startsWith("chain"));
      expect(demo.length).toBe(120);
      for (const u of demo) {
        await ctx.db.insert("rawEvents", {
          eventClass: "interaction", eventType: "comment.created",
          userId: u._id, sequenceInSession: 0, targetType: "post", targetId: `p${u._id}`,
          source: "direct", schemaVersion: 1,
          isAiPersona: false, isStaff: false, isPersona: false, isCountableAtWrite: true,
          occurredAt: Date.now() - 3_600_000, receivedAt: Date.now() - 3_600_000,
        });
      }
    });

    // cron start: first bounded slice only
    const first = await t.mutation(legitimacy.recompute, {});
    expect(first.recomputed).toBe(40);

    // while the chain holds the lease, an external start must not duplicate it
    const duplicate = await t.mutation(legitimacy.recompute, {});
    expect(duplicate.recomputed).toBe(0);

    // drain the self-scheduled chain (fake time advances past each runAfter delay)
    await t.finishAllScheduledFunctions(() => vi.advanceTimersByTime(5_000));

    const scores = await t.query(async (ctx: any) => ctx.db.query("legitimacyScores").collect());
    expect(scores.length).toBe(120);
  });
});
