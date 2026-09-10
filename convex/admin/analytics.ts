/**
 * analytics dash — SLICE-P7O-02: CAP-463/449/451/452/458/459 (+ fold-in
 * renders 439/440/443/461).
 *
 * CAP-463 (quoted): "7 cards; lastCalculatedAt + definitionVersion +
 *   freshness visible; P0 decisions must not use PostHog counts."
 * CAP-449 (quoted): "Always `n% (x/y)`; if denom < 25 →
 *   sampleStatus=directional."
 * CAP-459 (quoted): "Labeled 'cohort incomplete'; not zero-catastrophe."
 * CAP-451 (quoted): Signal card "totals/trends/broad category only —
 *   never event-weight-resolvable breakdown."
 * CAP-452 (quoted): Founder-only record; stores metricSnapshots +
 *   projectionDefinitionVersion + catalogVersion. Administrator may VIEW,
 *   never record.
 * CAP-458: L08 incomplete → honest cohort label. CAP-443 untrusted → the
 *   PostHog viz label (no mirror exists at soft beta — Convex alone).
 * Weekly decisions append-only (M16 §7); no rawEvents from this screen.
 */

import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission } from "../lib/authz";
import { writeAudited, newCorrelationId } from "../lib/audit";

const SEVEN_CARDS = [
  "l08_core", "s18_core", "activation_inline",
  "commerce_library", "commerce_affiliate", "commerce_store", "signal_card",
] as const;

async function requireFounderOrAdmin(ctx: any): Promise<{ userId: Id<"users">; isFounder: boolean }> {
  const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
  if (!userId) throw new Error("analytics: authentication required");
  const roles = await assertAdminPermission(ctx);
  if (!roles.includes("administrator")) {
    throw new Error("analytics: Administrator/Founder required (CAP-463)");
  }
  // Founder = the bootstrapped FIRST administrator (CAP-007: the earliest
  // granted administrator assignment; no founder marker field exists —
  // same flagged derivation as CAP-429)
  const admins = await ctx.db
    .query("roleAssignments")
    .filter((q: any) => q.eq(q.field("role"), "administrator"))
    .take(50);
  const first = admins
    .filter((a: any) => a.status === "active")
    .sort((a: any, b: any) => a.grantedAt - b.grantedAt)[0];
  return { userId, isFounder: Boolean(first && first.userId === userId) };
}

export const founderDashboard = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    await requireFounderOrAdmin(ctx);
    const projections = await ctx.db.query("analyticsProjections").take(50);
    const byKey = new Map<string, any>();
    for (const p of projections) {
      const cur = byKey.get(p.projectionKey);
      if (!cur || p.lastCalculatedAt > cur.lastCalculatedAt) byKey.set(p.projectionKey, p);
    }
    const incidents = await ctx.db
      .query("instrumentationIncidents")
      .withIndex("by_status", (q: any) => q.eq("status", "open"))
      .take(10);
    const reconcile = await ctx.db
      .query("analyticsReconcileResults")
      .withIndex("by_ranAt")
      .order("desc")
      .first();

    const signalSummary = await ctx.db.query("signalSummary").take(200);
    const totalActive = signalSummary.reduce((a: number, r: any) => a + r.activeSignals, 0);

    return {
      cards: SEVEN_CARDS.map((key) => {
        const p = byKey.get(key);
        if (key === "signal_card") {
          return {
            card: key,
            // CAP-451 (quoted): totals/trends/broad category ONLY
            metrics: { totalActiveSignalsPlatform: Math.round(totalActive * 10) / 10, breakdown: "sealed" },
            sampleStatus: "directional",
            freshness: "complete",
            lastCalculatedAt: Date.now(),
            definitionVersion: 1,
          };
        }
        if (!p) {
          // CAP-459 (quoted): "cohort incomplete" — never a fake zero cliff
          return { card: key, state: "cohort_incomplete", label: "Cohort incomplete — no projection yet" };
        }
        return {
          card: key,
          metrics: p.metrics,
          sampleStatus: p.sampleStatus, // directional at denom < 25 (quoted)
          freshness: p.freshness,
          lastCalculatedAt: p.lastCalculatedAt,
          definitionVersion: p.definitionVersion,
        };
      }),
      instrumentationIncidents: incidents.map((i: any) => ({ type: i.type, detail: i.detail, severity: i.severity })),
      reconcileStatus: reconcile?.status ?? "no_mirror", // CAP-443 render; absent mirror ≠ failure
    };
  },
});

/** CAP-452 — record the weekly decision (FOUNDER ONLY; administrator
 *  rejected). Append-only (M16 §7: recorded — no edit/delete path). */
export const recordWeeklyDecision = mutation({
  args: {
    decision: v.string(),
    nextAction: v.string(),
    reviewDate: v.number(),
    evidence: v.optional(v.any()),
  },
  returns: v.object({ decisionId: v.id("analyticsWeeklyDecisions") }),
  handler: async (ctx, args) => {
    const { userId, isFounder } = await requireFounderOrAdmin(ctx);
    if (!isFounder) throw new Error("recordWeeklyDecision: Founder only (CAP-452)");
    const now = Date.now();
    const weekStart = now - 7 * 24 * 3_600_000;

    let decisionId: Id<"analyticsWeeklyDecisions"> | undefined;
    await writeAudited(ctx, async (actx) => {
      // metricSnapshots: the CURRENT projections (frozen at decision time)
      const projections = await actx.db.query("analyticsProjections").take(50);
      const catalog = await actx.db.query("eventCatalog").take(100);
      decisionId = (await actx.db.insert("analyticsWeeklyDecisions", {
        periodStart: weekStart,
        periodEnd: now,
        decision: args.decision,
        evidence: args.evidence ?? {},
        metricSnapshots: projections, // (quoted: stores metricSnapshots)
        projectionDefinitionVersion: 1,
        catalogVersion: catalog.length,
        ownerUserId: userId,
        nextAction: args.nextAction,
        reviewDate: args.reviewDate,
        createdAt: now,
      })) as Id<"analyticsWeeklyDecisions">;
      return {
        actorId: userId, action: "analytics.recordWeeklyDecision",
        target: `analyticsWeeklyDecision:${decisionId}`, prev: null,
        next: { decision: args.decision, nextAction: args.nextAction },
        correlationId: newCorrelationId(), reversible: false, // append-only (M16 §7)
      };
    });
    return { decisionId: decisionId! };
  },
});
