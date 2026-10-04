import { describe, it, expect, afterEach } from "vitest";
import { convexTest } from "convex-test";
import schemaDefault from "../../convex/schema";
import * as legitimacy from "../../convex/jobs/legitimacy";
import * as recognition from "../../convex/jobs/recognition";
import * as removeMod from "../../convex/demoWorld/remove";
import * as importMembers from "../../convex/demoWorld/importMembers";
import * as generatedApi from "../../convex/_generated/api"; // module-root anchor for convex-test

/* CR-015 — index-prefix fixes (legitimacy.recompute discovery scan,
 * recognition.rollup aggregate scan) + exact removalStatus bulk count.
 * Note: convex-test does not validate index field order, so the pre-fix
 * violations are only observable on a real backend (both jobs errored on the
 * local deployment during P6 settle); these tests pin the POST-fix behavior.
 * The removalStatus case IS red/green: take(1000) capped the count at 1,000. */

const modules = {
  legitimacy,
  recognition,
  remove: removeMod,
  importMembers,
  "convex/_generated/api": generatedApi,
};

afterEach(() => {
  delete process.env.CONVEX_CLOUD_URL;
});

describe("CR-015 index fixes + exact bulk estimate", () => {
  it("legitimacy.recompute recomputes recent actors and writes scores; rollup completes; removalStatus counts past 1000 exactly", async () => {
    process.env.CONVEX_CLOUD_URL = "http://127.0.0.1:3210";
    const t = convexTest(schemaDefault, modules);

    // an active member (full canonical signup fields via the demo importer)
    // with a recent interaction event
    await t.mutation(importMembers.importMembers, {
      seq: 0, worldEnd: Date.now(),
      rows: [{ handle: "active15", name: "Active", email: "active15@demo.createconomy.invalid", bio: "b", joinOffsetMs: -90 * 86_400_000, verified: true }],
    });
    const userId = await t.mutation(async (ctx: any) => {
      const u = await ctx.db.query("users").withIndex("email", (q: any) => q.eq("email", "active15@demo.createconomy.invalid")).unique();
      await ctx.db.insert("rawEvents", {
        eventClass: "interaction", eventType: "comment.created",
        userId: u._id, sequenceInSession: 0, targetType: "post", targetId: "p",
        source: "direct", schemaVersion: 1,
        isAiPersona: false, isStaff: false, isPersona: false, isCountableAtWrite: true,
        occurredAt: Date.now() - 3_600_000, receivedAt: Date.now() - 3_600_000,
      });
      return u._id;
    });

    const out = await t.mutation(legitimacy.recompute, {});
    expect(out.recomputed).toBeGreaterThanOrEqual(1);
    const scores = await t.query(async (ctx: any) => ctx.db.query("legitimacyScores").collect());
    expect(scores.length).toBeGreaterThanOrEqual(1);
    expect(scores.some((s: any) => s.actorUserId === userId && typeof s.value === "number")).toBe(true);

    // rollup: no active season → early return {0,0}; the fixed aggregate scan
    // itself is exercised on the live backend (real season present there).
    const rolled = await t.mutation(recognition.rollup, {});
    expect(rolled).toEqual({ events: 0, projected: 0 });

    // exact bulk estimate beyond the old take(1000) cap (member import
    // registered 1 row itself — assert the delta)
    const before = await t.mutation(removeMod.removalStatus, {});
    await t.mutation(async (ctx: any) => {
      for (let i = 0; i < 1005; i++) {
        await ctx.db.insert("demoRegistry", { table: "cr015test", docId: `d${i}`, batch: "cr015:test" });
      }
    });
    const st = await t.mutation(removeMod.removalStatus, {});
    expect(st.registryRows).toBe(before.registryRows + 1005);
  });
});
