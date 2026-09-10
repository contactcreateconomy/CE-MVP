/**
 * signalSummary — SLICE-P7E-06: CAP-281.
 *
 * (quoted in full — the public binding lives in the P7E-09 read): "The
 *   public-facing 'Signals' number in the Reach·Signals·Awards triad is
 *   the **Active** count — the live/current measure. Total is the
 *   permanent historical record (not shown publicly as 'Signals');
 *   Pending is transitional and not shown publicly."
 * This cron WRITES all three (per user + per distribution — two views of
 *   one ledger, bible l.335). Decay (quoted): `clamp((90−days)/90,0,1)`.
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

const DAY_MS = 24 * 3_600_000;

export function activeDecay(daysAgo: number): number {
  return Math.min(1, Math.max(0, (90 - daysAgo) / 90));
}

async function summarizeAuthor(ctx: any, authorUserId: Id<"users">): Promise<{ total: number; active: number; pending: number }> {
  const rows = await ctx.db
    .query("signalLedger")
    .withIndex("by_author_state", (q: any) => q.eq("authorUserId", authorUserId))
    .take(500);
  const now = Date.now();
  let total = 0;
  let active = 0;
  let pending = 0;
  for (const row of rows) {
    if (row.entryType === "award" && row.state === "finalized") {
      total += row.signalValue;
      const daysAgo = (now - (row.finalizedAt ?? row.provisionalAt)) / DAY_MS;
      active += row.signalValue * activeDecay(daysAgo);
    } else if (row.state === "provisional" && row.entryType === "award") {
      pending += row.signalValue;
    } else if (row.entryType === "reversal" || row.entryType === "clawback") {
      // negative finalized entries net against the sums
      total += row.signalValue;
      active += row.signalValue; // conservative: reversals hit Active too
    }
  }
  return { total: Math.max(0, total), active: Math.max(0, active), pending: Math.max(0, pending) };
}

async function writeSummary(ctx: any, subjectType: "user" | "distribution", subjectId: string, sums: { total: number; active: number; pending: number }) {
  const existing = await ctx.db
    .query("signalSummary")
    .withIndex("by_subject", (q: any) => q.eq("subjectType", subjectType).eq("subjectId", subjectId))
    .unique();
  const patch = {
    totalSignals: sums.total,
    activeSignals: sums.active,
    pendingSignals: sums.pending,
    windowVersion: "decay90d.v1",
    computedAt: Date.now(),
  };
  if (existing) await ctx.db.patch(existing._id, patch);
  else await ctx.db.insert("signalSummary", { subjectType, subjectId, ...patch });
}

export const recompute = internalMutation({
  args: {},
  returns: v.object({ summarized: v.number() }),
  handler: async (ctx) => {
    // Authors with any ledger activity in the last 90d (bounded scan)
    const recent = await ctx.db
      .query("signalLedger")
      .withIndex("by_state_provisionalAt")
      .order("desc")
      .take(200);
    const all = await ctx.db.query("signalLedger").take(500);
    const authorIds = [...new Set([...recent, ...all].map((r: any) => r.authorUserId))] as Id<"users">[];
    let summarized = 0;
    for (const authorUserId of authorIds) {
      const sums = await summarizeAuthor(ctx, authorUserId);
      // Per-user view
      await writeSummary(ctx, "user", authorUserId, sums);
      // Per-distribution view: the owner's Distribution mirrors the user
      // summary (single-owner V1 — bible l.335 "two views of one ledger")
      const dist = await ctx.db
        .query("distributions")
        .withIndex("by_owner", (q: any) => q.eq("ownerUserId", authorUserId))
        .unique();
      if (dist) await writeSummary(ctx, "distribution", dist._id, sums);
      summarized += 1;
    }
    return { summarized };
  },
});
