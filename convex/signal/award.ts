/**
 * signal award — SLICE-P7E-03: CAP-272/273/274/275/280/285.
 *
 * bible l.334 (quoted): "Value not actions — outcomes only; never
 *   posting/reacting/login/completion." Event weights (CAP-272 Notes,
 *   quoted): "view 0.3 / reaction 1 / reply 1.5 / comment 2 /
 *   completion 2.5 / save 3 / CTA 10 / conversion 25" — these are
 *   QUALIFIED-OUTCOME evidence weights. The sealed key
 *   `signal.eventWeights` lives HERE in code (sealed = absent from the
 *   config editor and from every query response — H5).
 * CAP-274 (quoted): "bare view/reaction with no downstream outcome =
 *   ZERO Signal (AC-10)." — only eventClass=outcome rows award.
 * CAP-273 (quoted): "provisional Signal row @80% computed value … ×
 *   actor legitimacy (INV-2)."
 * CAP-275 (quoted): CTA gate — "eligible human, once/user/target/window,
 *   dwell, not self, not datacenter" + "constants calibrated on first
 *   ~100 conversions" → the P6-17/P6-18 qualification machinery is the
 *   gate (qualified clicks only, subid dictionary fail-closed).
 * CAP-280: confidence damping — v1 saturating lower bound
 *   (volume/(volume+K), K=10 calibration_pending.v1) standing in for
 *   betaBinomialLowerBound until outcome-volume data exists; flagged.
 * CAP-285 (quoted): "Suspected event shadow-damped (still ticks visible
 *   counter, fractional weight); actor never told (no gaming gradient)."
 *
 * Attribution split (CAP-279, quoted: "V1 positional: ~85% author /
 *   ~15% commenter pool; journey-linked only") is applied at SETTLE
 *   (jobs/attributionSettle.ts) — the award row is the author's
 *   provisional credit; the sealed key signal.attributionSplit lives in
 *   code there, same discipline.
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { snapshotLegitimacy } from "../jobs/legitimacy";
import { currentSeasonTx } from "./promoteDemote";

// ── Sealed constants (never config-exposed, never returned; H5) ──
export const SEALED_EVENT_WEIGHTS = {
  view: 0.3, reaction: 1, reply: 1.5, comment: 2,
  completion: 2.5, save: 3, cta: 10, conversion: 25,
} as const;
const PROVISIONAL_SHARE = 0.8; // CAP-273 "@80%"
const CONFIDENCE_K = 10; // CAP-280 saturating volume constant (calibration_pending.v1)
const PER_ACTOR_TARGET_CAP = 3; // CAP-274 per-(actor,target) cap per window (unnamed → flagged default)
const CAP_WINDOW_MS = 7 * 24 * 3_600_000;
/** CAP-285 fractional weight for rawEvent-level suspicion booleans
 *  (suspectedAutomation/suspectedCoordination carry no stored factor —
 *  integrityFlags own the per-actor number). Register-unnamed → flagged
 *  default, calibration_pending.v1. */
const SUSPECTED_EVENT_DAMP = 0.4;

/** The outcome event families the sweep consumes. Map: eventType →
 *  weight family. `completion` (2.5) has no emitter at MVP-1 — absent
 *  from the map until one exists (honest, not invented). Views (0.3)
 *  are exposure-class and can never award alone (CAP-274, quoted). */
const OUTCOME_FAMILIES: Record<string, keyof typeof SEALED_EVENT_WEIGHTS> = {
  "comment.created": "comment",
  "comment.reacted": "reaction",
  upvote_given: "reaction",
  "comment.saved": "save",
  "comment.signaled": "save",
};

export type AwardOutcome = {
  outcomeType: string;
  weightFamily: keyof typeof SEALED_EVENT_WEIGHTS;
  outcomeEventId: string; // family-prefixed anchor: rawEvents id, cta:<clickId>, or conv:<evidenceId>
  awardeeId: Id<"users">;
  actorId: Id<"users"> | null;
  contributionId: string;
  contributionType: "post" | "comment";
  grossValue: number;
  suspected: boolean; // CAP-285 shadow-damp
  dampFactor: number;
};

/** CAP-273/280/285 — the provisional award computation (pure). */
export function computeProvisional(input: {
  grossValue: number;
  legitimacyFactor: number;
  confidenceInput: { volume: number };
  suspected: boolean;
  dampFactor: number;
}) {
  const confidenceFactor = input.confidenceInput.volume / (input.confidenceInput.volume + CONFIDENCE_K); // CAP-280 v1
  const base = input.grossValue * PROVISIONAL_SHARE * input.legitimacyFactor * confidenceFactor;
  const signalValue = input.suspected ? base * input.dampFactor : base; // CAP-285 fractional weight
  return { confidenceFactor, signalValue };
}

/** CAP-285 — the effective fractional weight (pure). The actor-level damp
 *  disposition's own dampFactor (schema l.341) binds when present — the
 *  detector owns the number; otherwise a suspected rawEvent takes the
 *  flagged default. Never 1 when suspicion exists: suspected events must
 *  actually earn fractional Signal, not full Signal. */
export function effectiveDamp(
  gate: { suspected: boolean; dampFactor: number },
  eventSuspected: boolean,
): number {
  if (gate.dampFactor < 1) return gate.dampFactor; // actor-level flag wins (strongest binds)
  return eventSuspected ? SUSPECTED_EVENT_DAMP : 1;
}

/** Integrity + dedupe + per-cap gate (CAP-274). Returns null = no award.
 *  `networkAttested` (verified conversions) skips the actor-class gates —
 *  the network's postback/subid evidence IS the qualification; seller-side
 *  fraud stays clawback's (CAP-278) jurisdiction. */
export async function passesOutcomeGate(
  ctx: any,
  input: { actorId: Id<"users"> | null; awardeeId: Id<"users">; targetKey: string; outcomeEventId: Id<"rawEvents">; actorIsStaffOrPersona: boolean; networkAttested?: boolean },
): Promise<{ suspected: boolean; dampFactor: number } | null> {
  if (!input.networkAttested) {
    // not self (CAP-275 discipline applies to human-actor families)
    if (!input.actorId || input.actorId === input.awardeeId) return null;
    // staff/persona actors never award Signal (bible: personas/staff excluded everywhere)
    if (input.actorIsStaffOrPersona) return null;
  }
  // dedupe: one ledger row per outcome event
  const dup = await ctx.db
    .query("signalLedger")
    .withIndex("by_contribution", (q: any) =>
      q.eq("contributionId", "outcome:" + input.outcomeEventId).eq("contributionType", "post"))
    .first();
  if (dup) return null;
  // integrity: damp/neutralize dispositions on the ACTOR (recipient
  // neutrality — the awardee is never penalized for inbound suspicion)
  let dampFactor = 1;
  let suspected = false;
  if (input.actorId) {
    const flags = await ctx.db
      .query("integrityFlags")
      .withIndex("by_actor_disposition", (q: any) => q.eq("actorUserId", input.actorId).eq("disposition", "damp"))
      .take(5);
    const neutralized = await ctx.db
      .query("integrityFlags")
      .withIndex("by_actor_disposition", (q: any) => q.eq("actorUserId", input.actorId).eq("disposition", "neutralize"))
      .first();
    if (neutralized) return null; // neutralized actors' events stop crediting
    // CAP-285 (quoted): "Suspected event shadow-damped (still ticks visible
    // counter, fractional weight)" — an open damp disposition on the ACTOR
    // damps every event they feed by the flag's own dampFactor (schema
    // l.341); the strongest open flag binds. The award still ticks (never
    // dropped), the actor is never told (no gaming gradient).
    if (flags.length > 0) {
      suspected = true;
      dampFactor = Math.min(...flags.map((f: any) => f.dampFactor));
    }
    const capWindowStart = Date.now() - CAP_WINDOW_MS;
    const actorLedger = await ctx.db
      .query("signalLedger")
      .withIndex("by_author_state", (q: any) => q.eq("authorUserId", input.awardeeId))
      .take(100);
    const capped = actorLedger.filter(
      (r: any) => r.provisionalAt >= capWindowStart && (r as any).meta?.actorTarget === `${input.actorId}:${input.targetKey}`,
    );
    if (capped.length >= PER_ACTOR_TARGET_CAP) return null;
  }
  // network-attested (no human actor): dedupe-only pass
  return { suspected, dampFactor };
}

/** The System award entry (plain logic — thin wrappers avoid the
 *  same-module internal self-reference circularity). */
export async function awardFromOutcomeTx(ctx: any, out: AwardOutcome, seasonId: Id<"signalSeasons">): Promise<Id<"signalLedger"> | null> {
  // network-attested conversions have no human actor — legitimacy of the
  // SELLER applies; human families use the actor snapshot (CAP-284)
  const legitimacyFactor = out.actorId
    ? await snapshotLegitimacy(ctx, out.actorId)
    : await snapshotLegitimacy(ctx, out.awardeeId);
  const volume = await ctx.db
    .query("signalLedger")
    .withIndex("by_author_state", (q: any) => q.eq("authorUserId", out.awardeeId))
    .take(100);
  const { confidenceFactor, signalValue } = computeProvisional({
    grossValue: out.grossValue,
    legitimacyFactor,
    confidenceInput: { volume: volume.length },
    suspected: out.suspected,
    dampFactor: out.dampFactor,
  });
  const id = (await ctx.db.insert("signalLedger", {
    contributionId: "outcome:" + out.outcomeEventId, // dedupe anchor on the event
    contributionType: "post",
    authorUserId: out.awardeeId,
    outcomeType: out.outcomeType,
    outcomeEventId: out.outcomeEventId,
    grossValue: out.grossValue,
    legitimacyFactor,
    confidenceFactor,
    attributionModelVersion: "positional.v1",
    outcomeDefinitionVersion: 1,
    signalValue,
    state: "provisional",
    entryType: "award",
    seasonId,
    provisionalAt: Date.now(),
    meta: { actorTarget: `${out.actorId}:${out.contributionId}`, journey: out.contributionId },
  })) as Id<"signalLedger">;
  return id;
}

/** The award sweep cron: scans recent outcome-class rawEvents and the
 *  qualified-CTA / verified-conversion sources, then awards. */
export const sweep = internalMutation({
  args: {},
  returns: v.object({ awarded: v.number(), skipped: v.number() }),
  handler: async (ctx) => {
    const season = await currentSeasonTx(ctx); // derived — never a hardcoded season number
    if (!season) return { awarded: 0, skipped: 0 }; // no season = no ledger (fail-closed)

    const since = Date.now() - 24 * 3_600_000;
    let awarded = 0;
    let skipped = 0;

    // 1. Event-driven outcome families
    for (const [eventType, family] of Object.entries(OUTCOME_FAMILIES)) {
      const events = await ctx.db
        .query("rawEvents")
        .withIndex("by_eventType_time", (q: any) => q.eq("eventType", eventType).gte("occurredAt", since))
        .take(100);
      for (const event of events) {
        const awardeeId = event.authorUserId as Id<"users"> | undefined;
        const actorId = event.userId as Id<"users"> | null;
        if (!awardeeId) { skipped += 1; continue; }
        // SECURITY (scan round 2, finding 31): reaction replay — only NEW
        // positive transitions award. The emitter now writes
        // isCountableAtWrite=false for removals/negatives, and the sweep
        // independently re-checks the event payload so an old (or forged)
        // row can never credit a toggle-off or a negative reaction.
        if (eventType === "comment.reacted") {
          const removed = (event as any).removed === true;
          const negative = (event as any).reactionType === "negative";
          if (removed || negative || event.isCountableAtWrite === false) { skipped += 1; continue; }
        }
        // Findings 31/33 discipline: held/tombstoned comments award nothing
        // (the content the Signal is derived from is not live).
        if (event.targetType === "comment") {
          const target = await ctx.db.get(event.targetId as Id<"comments">).catch(() => null);
          if (!target || target.deletedAt || (target as any).moderationStatus === "held") { skipped += 1; continue; }
        }
        const gate = await passesOutcomeGate(ctx, {
          actorId,
          awardeeId,
          targetKey: `${event.targetType}:${event.targetId}`,
          outcomeEventId: event._id,
          actorIsStaffOrPersona: Boolean(event.isAiPersona) || Boolean((event as any).reactorIsStaff),
        });
        if (!gate) { skipped += 1; continue; }
        // CAP-285: rawEvent-level suspicion also shadow-damps (fractional
        // weight — full Signal for a suspected event was the dead-factor bug)
        const eventSuspected = Boolean(event.suspectedAutomation) || Boolean(event.suspectedCoordination);
        const suspected = gate.suspected || eventSuspected;
        const dampFactor = effectiveDamp(gate, eventSuspected);
        await awardFromOutcomeTx(ctx, {
          outcomeType: eventType,
          weightFamily: family,
          outcomeEventId: event._id,
          awardeeId, actorId,
          contributionId: `${event.targetType}:${event.targetId}`,
          contributionType: "post",
          grossValue: SEALED_EVENT_WEIGHTS[family],
          suspected,
          dampFactor,
        }, season._id);
        awarded += 1;
      }
    }

    // 2. CAP-275 qualified-CTA outcomes — the storefrontClicks
    //    qualification machinery is the gate (dwell/once-per-window live
    //    in the P6-17 record + P6-18 settle); only settled qualified
    //    clicks credit CTA weight.
    const clicks = await ctx.db
      .query("storefrontClicks")
      .withIndex("by_link_occurred")
      .order("desc")
      .take(50);
    for (const click of clicks) {
      if (click.qualification !== "qualified" || click.integrityStatus !== "settled") continue;
      const product = click.storefrontProductId ? await ctx.db.get(click.storefrontProductId) : null;
      const store: any = product ? await ctx.db.get(product.storefrontId) : null;
      if (!store) { skipped += 1; continue; }
      const gate = await passesOutcomeGate(ctx, {
        actorId: (click.actorUserId ?? null) as Id<"users"> | null,
        awardeeId: store.ownerUserId,
        targetKey: "storefront:" + store._id,
        outcomeEventId: ("cta:" + click._id) as Id<"rawEvents">,
        actorIsStaffOrPersona: false,
      });
      if (!gate) { skipped += 1; continue; }
      await awardFromOutcomeTx(ctx, {
        outcomeType: "store.buy_click_qualified",
        weightFamily: "cta",
        outcomeEventId: "cta:" + click._id, // family-prefixed anchor (table varies)
        awardeeId: store.ownerUserId,
        actorId: (click.actorUserId ?? null) as Id<"users"> | null,
        contributionId: "storefront:" + store._id,
        contributionType: "post",
        grossValue: SEALED_EVENT_WEIGHTS.cta,
        suspected: gate.suspected,
        dampFactor: gate.dampFactor,
      }, season._id);
      awarded += 1;
    }

    // 3. Verified conversions — network-verified evidence only (CAP-525's
    //    two-field rule means self_report NEVER reaches here)
    const evidence = await ctx.db
      .query("salesEvidence")
      .withIndex("by_promoter")
      .take(50);
    for (const ev of evidence) {
      if (ev.status !== "network_verified") continue;
      const product: any = await ctx.db.get(ev.storefrontProductId);
      const store: any = product ? await ctx.db.get(product.storefrontId) : null;
      if (!store) { skipped += 1; continue; }
      const gate = await passesOutcomeGate(ctx, {
        actorId: null,
        awardeeId: store.ownerUserId,
        targetKey: "storefront:" + store._id,
        outcomeEventId: ("conv:" + ev._id) as Id<"rawEvents">,
        actorIsStaffOrPersona: false,
        networkAttested: true, // postback/subid evidence IS the qualification
      });
      if (!gate) { skipped += 1; continue; }
      await awardFromOutcomeTx(ctx, {
        outcomeType: "store.conversion_verified",
        weightFamily: "conversion",
        outcomeEventId: "conv:" + ev._id, // family-prefixed anchor
        awardeeId: store.ownerUserId,
        actorId: null, // network-side; seller legitimacy applies
        contributionId: "storefront:" + store._id,
        contributionType: "post",
        grossValue: SEALED_EVENT_WEIGHTS.conversion,
        suspected: false,
        dampFactor: 1,
      }, season._id);
      awarded += 1;
    }
    return { awarded, skipped };
  },
});
