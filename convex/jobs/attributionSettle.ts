/**
 * attribution settle — SLICE-P7E-04: CAP-276/277/278/279.
 *
 * CAP-276 (quoted): "attribution.settle finalizes provisional Signal
 *   (≤7-day window) or reverses."
 * CAP-277 (quoted): "Outcome refunded/invalidated → reversal entry (+
 *   cascade to dependents)" / "displayed Signals = max(Σ finalized, 0)".
 * CAP-278 (quoted): "Integrity confirmed → clawback entry (cascades
 *   downstream)" — plain logic + thin wrappers (no same-module
 *   internal self-reference).
 * CAP-279 (quoted): "V1 positional: ~85% author / ~15% commenter pool;
 *   commenter pool = journey-linked only (F2 fix)." The sealed key
 *   signal.attributionSplit lives HERE in code — never config-exposed,
 *   never returned (H5).
 * Append-only discipline: reversal/clawback are NEW rows (entryType),
 *   never rewrites of award rows.
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { currentSeasonTx } from "../signal/promoteDemote";

// Sealed constants (H5)
const AUTHOR_SHARE = 0.85;
const COMMENTER_SHARE = 0.15;
const COMMENTER_POOL_MAX = 10;
const SETTLE_WINDOW_DAYS = 7; // config key signal.settle.windowDays mirrors this (calibration_pending.v1)

/** CAP-279 — journey-linked commenters: commenters on the contribution
 *  BEFORE the outcome event (chronological journey), bounded pool. */
async function journeyCommenters(ctx: any, contributionId: string, before: number): Promise<Id<"users">[]> {
  if (!contributionId.startsWith("post:")) return [];
  const postId = contributionId.slice("post:".length);
  const comments = await ctx.db
    .query("comments")
    .withIndex("by_post_depth_created", (q: any) => q.eq("postId", postId).eq("depth", 0))
    .take(50);
  const authors = comments
    .filter((c: any) => c.createdAt <= before && c.authorType === "user")
    .map((c: any) => c.authorUserId as Id<"users">);
  return [...new Set<Id<"users">>(authors)].slice(0, COMMENTER_POOL_MAX);
}

/** Finalize one provisional row + write the positional split's commenter
 *  pool rows (CAP-279) — all in the same batch. */
async function finalizeTx(ctx: any, row: any, seasonId: Id<"signalSeasons">) {
  const now = Date.now();
  // The author's row keeps 85% of its provisional value as finalized
  const authorValue = row.signalValue * AUTHOR_SHARE;
  await ctx.db.patch(row._id, {
    state: "finalized",
    signalValue: authorValue,
    attributionModelVersion: "positional.v1",
    finalizedAt: now,
  });
  // Commenter pool: 15% split equally across journey-linked commenters
  // (the award row's meta.journey carries the target key, e.g. "post:<id>")
  const journey = (row as any).meta?.journey ?? "";
  const pool = await journeyCommenters(ctx, journey, row.provisionalAt);
  const eligible = pool.filter((u) => u !== row.authorUserId);
  if (eligible.length === 0) return;
  const each = (row.signalValue * COMMENTER_SHARE) / eligible.length;
  for (const commenter of eligible) {
    await ctx.db.insert("signalLedger", {
      contributionId: "split:" + row._id + ":" + commenter,
      contributionType: "comment",
      authorUserId: commenter,
      outcomeType: row.outcomeType,
      outcomeEventId: row.outcomeEventId,
      grossValue: row.signalValue * COMMENTER_SHARE,
      legitimacyFactor: 1, // already folded into the base at award; the split is positional
      confidenceFactor: row.confidenceFactor,
      attributionModelVersion: "positional.v1",
      outcomeDefinitionVersion: row.outcomeDefinitionVersion,
      signalValue: each,
      state: "finalized",
      entryType: "award",
      seasonId,
      provisionalAt: row.provisionalAt,
      finalizedAt: now,
    });
  }
}

/** attribution.settle cron — provisional rows past the window finalize. */
export const settle = internalMutation({
  args: {},
  returns: v.object({ finalized: v.number(), reversed: v.number() }),
  handler: async (ctx) => {
    const cutoff = Date.now() - SETTLE_WINDOW_DAYS * 24 * 3_600_000;
    const season = await currentSeasonTx(ctx); // derived — never a hardcoded season number
    if (!season) return { finalized: 0, reversed: 0 };
    const rows = await ctx.db
      .query("signalLedger")
      .withIndex("by_state_provisionalAt", (q: any) =>
        q.eq("state", "provisional").lte("provisionalAt", cutoff))
      .take(100);
    let finalized = 0;
    let reversed = 0;
    for (const row of rows) {
      // Reversal condition at settle: the anchor event was reversed after
      // the award (rawEvents.reversedAt) — otherwise finalize
      const anchor = await ctx.db.get(row.outcomeEventId as Id<"rawEvents">).catch(() => null);
      const anchorReversed = anchor && (anchor as any).reversedAt;
      if (anchorReversed) {
        await reverseTx(ctx, row._id, "outcome_reversed_at_settle");
        reversed += 1;
      } else {
        await finalizeTx(ctx, row, season._id);
        finalized += 1;
      }
    }
    return { finalized, reversed };
  },
});

/** CAP-277 — reversal entry: the original flips state=reversed and a NEW
 *  negative reversal row lands (append-only). Cascades to dependents =
 *  the split rows derived from this one. */
export async function reverseTx(ctx: any, ledgerId: Id<"signalLedger">, reason: string): Promise<void> {
  const row = await ctx.db.get(ledgerId);
  if (!row || row.state === "reversed" || row.state === "clawed_back") return;
  const now = Date.now();
  await ctx.db.patch(ledgerId, { state: "reversed", reversedAt: now });
  await ctx.db.insert("signalLedger", {
    contributionId: "reversal:" + ledgerId,
    contributionType: row.contributionType,
    authorUserId: row.authorUserId,
    outcomeType: row.outcomeType,
    outcomeEventId: row.outcomeEventId,
    grossValue: row.signalValue,
    legitimacyFactor: row.legitimacyFactor,
    confidenceFactor: row.confidenceFactor,
    attributionModelVersion: row.attributionModelVersion,
    outcomeDefinitionVersion: row.outcomeDefinitionVersion,
    signalValue: -row.signalValue, // displayed = max(Σ finalized, 0) (quoted)
    state: "finalized",
    entryType: "reversal",
    reversesLedgerId: ledgerId,
    seasonId: row.seasonId,
    provisionalAt: row.provisionalAt,
    finalizedAt: now,
    meta: { reason },
  });
  // Cascade: reverse the positional split rows derived from this award
  const splits = await ctx.db
    .query("signalLedger")
    .withIndex("by_contribution", (q: any) =>
      q.eq("contributionId", "split:" + ledgerId).eq("contributionType", "comment"))
    .take(COMMENTER_POOL_MAX);
  for (const split of splits) {
    if (split.state !== "finalized") continue;
    await ctx.db.patch(split._id, { state: "reversed", reversedAt: now });
    await ctx.db.insert("signalLedger", {
      contributionId: "reversal:" + split._id,
      contributionType: "comment",
      authorUserId: split.authorUserId,
      outcomeType: split.outcomeType,
      outcomeEventId: split.outcomeEventId,
      grossValue: split.signalValue,
      legitimacyFactor: 1,
      confidenceFactor: split.confidenceFactor,
      attributionModelVersion: "positional.v1",
      outcomeDefinitionVersion: split.outcomeDefinitionVersion,
      signalValue: -split.signalValue,
      state: "finalized",
      entryType: "reversal",
      reversesLedgerId: split._id,
      seasonId: split.seasonId,
      provisionalAt: split.provisionalAt,
      finalizedAt: now,
      meta: { reason: "cascade:" + reason },
    });
  }
}

/** CAP-278 — clawback on confirmed integrity: the neutralized actor's
 *  recent awards claw back (cascades to their split dependents). The
 *  M13 bridge (`m12.emitConfirmed`) calls into this — M13 never
 *  recomputes legitimacy; M12 owns the clawback (quoted). */
export async function clawbackTx(ctx: any, actorUserId: Id<"users">, windowMs: number): Promise<number> {
  const since = Date.now() - windowMs;
  const rows = await ctx.db
    .query("signalLedger")
    .withIndex("by_author_state", (q: any) => q.eq("authorUserId", actorUserId).eq("state", "finalized"))
    .take(100);
  let clawed = 0;
  for (const row of rows) {
    if ((row.finalizedAt ?? 0) < since) continue;
    await ctx.db.patch(row._id, { state: "clawed_back", reversedAt: Date.now() });
    await ctx.db.insert("signalLedger", {
      contributionId: "clawback:" + row._id,
      contributionType: row.contributionType,
      authorUserId: row.authorUserId,
      outcomeType: row.outcomeType,
      outcomeEventId: row.outcomeEventId,
      grossValue: row.signalValue,
      legitimacyFactor: row.legitimacyFactor,
      confidenceFactor: row.confidenceFactor,
      attributionModelVersion: row.attributionModelVersion,
      outcomeDefinitionVersion: row.outcomeDefinitionVersion,
      signalValue: -row.signalValue,
      state: "finalized",
      entryType: "clawback",
      reversesLedgerId: row._id,
      seasonId: row.seasonId,
      provisionalAt: row.provisionalAt,
      finalizedAt: Date.now(),
      meta: { reason: "integrity_confirmed" },
    });
    clawed += 1;
  }
  return clawed;
}

/** Thin internal wrapper for the M13 bridge (CAP-354) — P7E-15 calls
 *  this; never recomputes legitimacy. */
export const clawbackForActor = internalMutation({
  args: { actorUserId: v.id("users"), windowDays: v.optional(v.number()) },
  returns: v.object({ clawed: v.number() }),
  handler: async (ctx, args) => ({
    clawed: await clawbackTx(ctx, args.actorUserId, (args.windowDays ?? 90) * 24 * 3_600_000),
  }),
});
