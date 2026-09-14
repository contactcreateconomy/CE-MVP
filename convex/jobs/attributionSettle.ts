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

/** SECURITY (scan round 2, finding 32): outcome anchors are FAMILY-PREFIXED
 *  ids — `rawEvents` table ids for event-driven families, but `cta:<clickId>`
 *  / `conv:<evidenceId>` for commerce families whose source rows live in
 *  OTHER tables. Settlement previously db.get()'d the prefixed string as a
 *  rawEvents id (always null → anchor checks silently passed). This resolver
 *  maps each anchor back to its source row and reports whether the outcome
 *  still qualifies (row gone / drifted / un-qualified → reversed). */
async function anchorOutcomeReversed(ctx: any, ledgerRow: any): Promise<boolean> {
  const anchor: string = String(ledgerRow.outcomeEventId ?? "");
  if (anchor.startsWith("cta:")) {
    const click = await ctx.db.get(anchor.slice(4) as Id<"storefrontClicks">).catch(() => null);
    if (!click) return true; // source row gone → the outcome no longer stands
    return click.qualification !== "qualified" || click.integrityStatus !== "settled";
  }
  if (anchor.startsWith("conv:")) {
    const ev = await ctx.db.get(anchor.slice(5) as Id<"salesEvidence">).catch(() => null);
    if (!ev) return true;
    return ev.status !== "network_verified";
  }
  if (anchor.startsWith("split:")) {
    // Split rows derive from an award — reversal cascades via
    // reversesLedgerId, never re-derived here.
    return false;
  }
  // Event-driven families: a rawEvents id.
  const event = await ctx.db.get(anchor as Id<"rawEvents">).catch(() => null);
  if (!event) return true; // anchor lost — treat as reversed (fail-closed)
  return Boolean((event as any).reversedAt);
}

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
      // Reversal condition at settle (finding 32): the anchor outcome was
      // reversed/drifted after the award — resolved BY FAMILY (rawEvents
      // rows, qualified clicks, verified evidence), not a blind rawEvents
      // lookup that silently passed for commerce anchors. Otherwise finalize.
      const anchorReversed = await anchorOutcomeReversed(ctx, row);
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
  // Cascade: reverse the positional split rows derived from this award.
  // SECURITY (scan round 2, finding 32): the insert key is
  // `split:<ledgerId>:<commenter>` (finalizeTx) but this lookup queried the
  // exact key `split:<ledgerId>` — NEVER matched, so cascades silently
  // no-oped. Index prefix-scan on contributionId retrieves every derived
  // split row regardless of commenter suffix.
  const splitPrefix = "split:" + ledgerId;
  const splits = (await ctx.db
    .query("signalLedger")
    .withIndex("by_contribution", (q: any) =>
      q.gte("contributionId", splitPrefix).lte("contributionId", splitPrefix + "\uffff"))
    .take(COMMENTER_POOL_MAX + 1))
    .filter((r: any) => r.contributionId.startsWith(splitPrefix));
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
    // SECURITY (scan round 2, finding 32): clawback previously skipped the
    // COMMENTER split rows derived from this award — a neutralized actor's
    // commentary pool kept the 15% positional credit. The cascade now
    // retracts them through the same prefix-scan reverseTx uses.
    const clawPrefix = "split:" + row._id;
    const splitRows = (await ctx.db
      .query("signalLedger")
      .withIndex("by_contribution", (q: any) =>
        q.gte("contributionId", clawPrefix).lte("contributionId", clawPrefix + "\uffff"))
      .take(COMMENTER_POOL_MAX + 1))
      .filter((r: any) => r.contributionId.startsWith(clawPrefix));
    for (const split of splitRows) {
      if (split.state !== "finalized") continue;
      await ctx.db.patch(split._id, { state: "clawed_back", reversedAt: Date.now() });
      await ctx.db.insert("signalLedger", {
        contributionId: "clawback:" + split._id,
        contributionType: split.contributionType,
        authorUserId: split.authorUserId,
        outcomeType: split.outcomeType,
        outcomeEventId: split.outcomeEventId,
        grossValue: split.signalValue,
        legitimacyFactor: split.legitimacyFactor,
        confidenceFactor: split.confidenceFactor,
        attributionModelVersion: split.attributionModelVersion,
        outcomeDefinitionVersion: split.outcomeDefinitionVersion,
        signalValue: -split.signalValue,
        state: "finalized",
        entryType: "clawback",
        reversesLedgerId: split._id,
        seasonId: split.seasonId,
        provisionalAt: split.provisionalAt,
        finalizedAt: Date.now(),
        meta: { reason: "cascade:integrity_confirmed" },
      });
      clawed += 1;
    }
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

/** SECURITY (scan round 2, finding 32): content revocation — the missing
 *  write-side trigger. Deleting (tombstoning) a comment or holding it for
 *  unsafe content now (1) marks every outcome rawEvent anchored to that
 *  comment `reversedAt` (the reversal trigger settle reads — previously
 *  written by NOBODY), and (2) immediately reverses any provisional or
 *  finalized award rows anchored on those events, cascading to their
 *  positional split rows via reverseTx. Settled Signal no longer survives
 *  deleted content. Idempotent: reverseTx no-ops non-final/non-provisional
 *  rows and already-reversed events are skipped. */
export async function reverseCommentOutcomes(ctx: any, commentId: string, reason: string): Promise<number> {
  const events = await ctx.db
    .query("rawEvents")
    .withIndex("by_target_eventClass", (q: any) =>
      q.eq("targetType", "comment").eq("targetId", commentId).eq("eventClass", "outcome"))
    .take(100);
  let reversed = 0;
  for (const event of events) {
    if ((event as any).reversedAt) continue;
    await ctx.db.patch(event._id, { reversedAt: Date.now(), reversalReason: reason } as any);
    // Retract awards anchored on this event (any state — provisional or
    // finalized; reverseTx is append-only and idempotent).
    const awards = await ctx.db
      .query("signalLedger")
      .withIndex("by_contribution", (q: any) => q.eq("contributionId", "outcome:" + event._id))
      .take(20);
    for (const award of awards) {
      await reverseTx(ctx, award._id, reason);
      reversed += 1;
    }
  }
  return reversed;
}
