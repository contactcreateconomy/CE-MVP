/**
 * toolRatings — SLICE-P4-05: member rating submit/update/withdraw with
 * same-mutation aggregate deltas (R-AGG) + System auto-flag (CAP-533).
 *
 * CAP-112 Notes (quoted): "R-STAFF rejects personas + any privileged role
 * (server-side, 403 RATING_STAFF_FORBIDDEN); R-ONE rejects if active
 * exists; moderationStatus=passed on submit (reactive) unless auto-flag;
 * R-AGG delta applied same mutation; N/A increments neither sum nor count."
 * CAP-113 (quoted): "Prior→new eligible delta applied atomically."
 * CAP-117 (quoted): "Decrements aggregate." — the register names NO mutation
 * for withdraw (contract §4 Action 4 escalation); named `toolRatings.withdraw`
 * in-slice, flagged.
 * CAP-533 (quoted): "System flags on threshold breach (velocity/outlier
 * pattern), moderationCases targeting the toolRatings row … exact formula
 * deliberately unspecified" — the two patterns the note names are wired to
 * admin-configurable thresholds (defaults TBD per the register; tunable
 * post-launch). A held (auto-flagged) rating contributes NOTHING to the
 * aggregate (INV-1: only active+passed rows feed it).
 * CAP-119: rating writes reject on non-active tools — archived means
 * "aggregate frozen"; draft is not publicly ratable (fail-closed reading).
 *
 * Guard note (register-vs-contract tension, resolved in the contract's
 * favor and flagged in the session report): the tool-profile contract §1
 * gates rating submission on "M1 R-CUSTOMER-GUARD", but CAP-393's Notes
 * enumerate the applies-to keys WITHOUT a rating key. `rate_tool` was added
 * to PROTECTED_CAPABILITIES (authz.ts, dated comment) so the full guard
 * chain — restrictions, per-capability flag, eligibility — runs.
 *
 * toolRatings.moderate (CAP-114) is Phase 7 moderation-console territory —
 * NOT built here; the recompute (CAP-115) and drift monitor (CAP-116) live
 * in tools.ts (module-per-name discipline: tools.recomputeAggregate).
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertCustomerCapability, STAFF_ROLES, getConfigValue } from "./lib/authz";
import { writeAudited, newCorrelationId } from "./lib/audit";

/** bible l.354 — the four rating dimensions. */
export const DIMENSIONS = ["ease_of_use", "output_quality", "reliability", "value_for_money"] as const;
export type Dimension = (typeof DIMENSIONS)[number];

/** The eligible-rating score shape (mirrors toolRatings schema validators). */
export interface RatingScores {
  overallScore: number;
  dimensionScores: Record<Dimension, number | "not_applicable">;
}

const zeroDelta = () => ({
  ratingSum: 0,
  ratingCount: 0,
  dimensionSums: { ease_of_use: 0, output_quality: 0, reliability: 0, value_for_money: 0 } as Record<Dimension, number>,
  dimensionCounts: { ease_of_use: 0, output_quality: 0, reliability: 0, value_for_money: 0 } as Record<Dimension, number>,
});

/**
 * R-AGG delta core (the slice's precision item, unit-tested).
 *
 * Computes the aggregate delta for moving a rating from `prior` to `next`,
 * where null means "absent" (submit = null→next, withdraw = prior→null).
 * The CALLER masks ineligible sides to null — an update from a previously
 * passed rating to one that ends up held passes (prior, null), applying
 * only the removal delta; a held→passed moderation transition (CAP-114,
 * Phase 7) passes (null, next).
 *
 * N/A semantics (INV-3): a `not_applicable` dimension increments neither
 * its sum nor its count — on either side of the delta.
 */
export function aggDelta(prior: RatingScores | null, next: RatingScores | null) {
  const delta = zeroDelta();
  for (const side of [prior, next]) {
    if (!side) continue;
    const sign = side === prior ? -1 : 1;
    delta.ratingSum += sign * side.overallScore;
    delta.ratingCount += sign;
    for (const dim of DIMENSIONS) {
      const score = side.dimensionScores[dim];
      if (score === "not_applicable") continue; // neither sum nor count
      delta.dimensionSums[dim] += sign * score;
      delta.dimensionCounts[dim] += sign;
    }
  }
  return delta;
}

/** Aggregate-eligibility (INV-1 / CAP-114 exclusion rule, quoted):
 *  "held/removed/withdrawn excluded from aggregate regardless of score." */
export function isAggregateEligible(rating: { status: string; moderationStatus: string }): boolean {
  return rating.status === "active" && rating.moderationStatus === "passed";
}

/**
 * CAP-115 rebuild-from-scratch projection — fold ONLY eligible ratings in
 * (the same exclusion rule binds recompute). Pure; unit-tested.
 */
export function recomputeFromRatings(
  ratings: (RatingScores & { status: string; moderationStatus: string })[],
) {
  return ratings
    .filter((r) => isAggregateEligible(r))
    .reduce(
      (acc, r) => {
        acc.ratingSum += r.overallScore;
        acc.ratingCount += 1;
        for (const dim of DIMENSIONS) {
          const score = r.dimensionScores[dim];
          if (score === "not_applicable") continue;
          acc.dimensionSums[dim] += score;
          acc.dimensionCounts[dim] += 1;
        }
        return acc;
      },
      zeroDelta(),
    );
}

/**
 * CAP-533 auto-flag evaluation (pure). The register names exactly two
 * patterns — "rating velocity, outlier score pattern" — each wired to an
 * admin-configurable threshold (defaults TBD, deliberately tunable).
 *  - velocity: `recentSubmissions` on this tool within the trailing window
 *    ≥ velocityPerHour.
 *  - outlier: existing ratingCount > 0 AND |overallScore − current average|
 *    ≥ outlierAbsDeviation.
 */
export function shouldAutoFlag(input: {
  overallScore: number;
  currentRatingCount: number;
  currentRatingSum: number;
  recentSubmissions: number;
  velocityPerHour: number;
  outlierAbsDeviation: number;
}): { flag: boolean; reasonCode: "auto_rating_velocity" | "auto_rating_outlier" | null } {
  if (input.recentSubmissions >= input.velocityPerHour) {
    return { flag: true, reasonCode: "auto_rating_velocity" };
  }
  if (input.currentRatingCount > 0) {
    const avg = input.currentRatingSum / input.currentRatingCount;
    if (Math.abs(input.overallScore - avg) >= input.outlierAbsDeviation) {
      return { flag: true, reasonCode: "auto_rating_outlier" };
    }
  }
  return { flag: false, reasonCode: null };
}

/** R-STAFF (pure eligibility check — unit-tested).
 *  Personas cannot reach a mutation (no userId path); privileged-role
 *  members are REJECTED server-side, not UI-hidden (bible l.144). */
export function ratingActorEligibility(activeRoles: string[]): { allowed: boolean; reason?: string } {
  const privileged = activeRoles.find((r) => (STAFF_ROLES as readonly string[]).includes(r));
  if (privileged) {
    return { allowed: false, reason: `RATING_STAFF_FORBIDDEN: privileged role "${privileged}" cannot rate (R-STAFF)` };
  }
  return { allowed: true };
}

/** CAP-533 admin threshold surface — config-registry rows (defaults TBD per
 *  the register; seeded idempotent by P1-08's seed.bootstrap). */
export const AUTOFLAG_REGISTRY_ROWS = [
  {
    key: "tools.ratings.autoflag.velocityPerHour",
    module: "m5",
    valueType: "number" as const,
    default: 10,
    min: 1,
    max: 1000,
    editTier: "tier2" as const,
    blastRadius: "Auto-flag threshold: ratings per tool per hour before a new rating is flagged (CAP-533).",
    effectiveTiming: "immediate" as const,
    reversible: true,
    sealed: false,
  },
  {
    key: "tools.ratings.autoflag.outlierAbsDeviation",
    module: "m5",
    valueType: "number" as const,
    default: 3.5,
    min: 0.5,
    max: 4,
    editTier: "tier2" as const,
    blastRadius: "Auto-flag threshold: |score − community average| before a new rating is flagged (CAP-533).",
    effectiveTiming: "immediate" as const,
    reversible: true,
    sealed: false,
  },
];

const dimensionScoresValidator = v.object({
  ease_of_use: v.number(),
  output_quality: v.number(),
  reliability: v.number(),
  // E6: N/A only on value_for_money (args mirror the schema validator)
  value_for_money: v.union(v.number(), v.literal("not_applicable")),
});

/** Validate 1–5 integers (M5 §8 Limits: "overall + each dimension 1–5
 *  integer (no half)"). Throws with the field name. */
function assertScoreBounds(field: string, score: number): void {
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new Error(`${field}: expected integer 1-5, got ${score}`);
  }
}

function assertRatingShape(rating: RatingScores): void {
  assertScoreBounds("overallScore", rating.overallScore);
  for (const dim of DIMENSIONS) {
    const score = rating.dimensionScores[dim];
    if (score !== "not_applicable") assertScoreBounds(`dimensionScores.${dim}`, score);
  }
}

/** R-STAFF — reject any active privileged role (server-side). */
async function assertRatableActor(ctx: any): Promise<Id<"users">> {
  const userId = (await getAuthUserId(ctx)) as Id<"users">;
  if (!userId) throw new Error("toolRatings: authentication required");
  const assignments = await ctx.db
    .query("roleAssignments")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();
  const activeRoles = assignments.filter((a: any) => a.status === "active").map((a: any) => a.role);
  const eligibility = ratingActorEligibility(activeRoles);
  if (!eligibility.allowed) throw new Error(eligibility.reason!);
  return userId;
}

/** Common tool precondition — only ACTIVE tools are ratable (CAP-119:
 *  archived = aggregate frozen; draft = not publicly ratable). */
async function getRatableTool(ctx: any, toolId: Id<"tools">) {
  const tool = await ctx.db.get(toolId);
  if (!tool) throw new Error("toolRatings: tool not found");
  if (tool.status !== "active") {
    throw new Error(`toolRatings: tool is ${tool.status} — the community aggregate is frozen (CAP-119)`);
  }
  return tool;
}

/** CAP-533 — write the moderation case targeting the toolRatings row
 *  (polymorphic target per CAP-127 precedent; the queue-visibility layer). */
async function writeAutoFlagCase(
  actx: any,
  args: { ratingRowId: Id<"toolRatings">; toolId: Id<"tools">; reasonCode: string },
): Promise<void> {
  await actx.db.insert("moderationCases", {
    caseType: "spam_manipulation", // velocity/outlier = manipulation patterns
    targetType: "toolRatings",
    targetId: args.ratingRowId,
    policyFamily: "spam",
    severity: "s3_low",
    priority: 1,
    status: "open",
    reasonCode: args.reasonCode,
    policyVersion: "v1", // auto-flag mechanism version (CAP-533: tuning is post-launch)
    reporterCountDistinct: 0, // System flag, not a reporter cluster
    reporterClusterCount: 0,
    agingLevel: 0,
    createdAt: Date.now(),
  });
}

/** Trailing-window velocity input for CAP-533 (submissions on this tool in
 *  the last hour, INCLUDING the one being evaluated). */
async function recentSubmissionCount(ctx: any, toolId: Id<"tools">): Promise<number> {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const rows = await ctx.db
    .query("toolRatings")
    .withIndex("by_toolId", (q: any) => q.eq("toolId", toolId))
    .collect();
  return rows.filter((r: any) => r.createdAt >= oneHourAgo).length;
}

// ── CAP-112 — submit ──────────────────────────────────────────────────────

export const submit = mutation({
  args: {
    toolId: v.id("tools"),
    overallScore: v.number(),
    // mirror the toolRatings schema validators
    dimensionScores: dimensionScoresValidator,
    reviewText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // R-CUSTOMER-GUARD (contract §1) — full chain via the rate_tool key
    await assertCustomerCapability(ctx, "rate_tool");
    const userId = await assertRatableActor(ctx);
    const tool = await getRatableTool(ctx, args.toolId);
    assertRatingShape(args);

    if (args.reviewText !== undefined && args.reviewText.length > 2000) {
      throw new Error("reviewText: ≤2000 chars (M5 §8 Limits)");
    }

    // R-ONE — one ACTIVE per (userId, toolId); a withdrawn rating does not
    // block re-rating (OQ#9 unspecified — R-ONE guards active only)
    const existing = await ctx.db
      .query("toolRatings")
      .withIndex("by_toolId_userId", (q: any) => q.eq("toolId", args.toolId).eq("userId", userId))
      .collect();
    if (existing.some((r: any) => r.status === "active")) {
      throw new Error("R-ONE: an active rating already exists — use toolRatings.update");
    }

    // CAP-533 thresholds (registry-validated reads; defaults fail-safe high)
    const velocityPerHour = (await getConfigValue(ctx, "tools.ratings.autoflag.velocityPerHour")) as number;
    const outlierAbsDeviation = (await getConfigValue(ctx, "tools.ratings.autoflag.outlierAbsDeviation")) as number;
    const recentSubmissions = (await recentSubmissionCount(ctx, args.toolId)) + 1; // include self
    const autoFlag = shouldAutoFlag({
      overallScore: args.overallScore,
      currentRatingCount: tool.ratingCount,
      currentRatingSum: tool.ratingSum,
      recentSubmissions,
      velocityPerHour,
      outlierAbsDeviation,
    });

    return await writeAudited(ctx, async (actx) => {
      const moderationStatus = autoFlag.flag ? "held" : "passed"; // CAP-112: reactive unless auto-flag
      const ratingId = (await actx.db.insert("toolRatings", {
        toolId: args.toolId,
        userId,
        overallScore: args.overallScore,
        dimensionScores: args.dimensionScores,
        reviewText: args.reviewText,
        status: "active",
        moderationStatus,
        createdAt: Date.now(),
      })) as Id<"toolRatings">;

      // R-AGG — same mutation; a HELD rating contributes nothing (INV-1)
      if (moderationStatus === "passed") {
        const delta = aggDelta(null, args);
        await actx.db.patch(args.toolId, {
          ratingSum: tool.ratingSum + delta.ratingSum,
          ratingCount: tool.ratingCount + delta.ratingCount,
          dimensionSums: addDims(tool.dimensionSums, delta.dimensionSums),
          dimensionCounts: addDims(tool.dimensionCounts, delta.dimensionCounts),
        });
      }

      if (autoFlag.flag) {
        await writeAutoFlagCase(actx, { ratingRowId: ratingId, toolId: args.toolId, reasonCode: autoFlag.reasonCode! });
      }

      return {
        actorId: userId,
        action: "toolRatings.submit",
        target: `toolRatings:${ratingId}`,
        prev: null,
        next: { toolId: args.toolId, overallScore: args.overallScore, moderationStatus },
        correlationId: newCorrelationId(),
        reversible: true,
      };
    });
  },
});

// ── CAP-113 — update (prior→new eligible delta, atomically) ──────────────

export const update = mutation({
  args: {
    ratingId: v.id("toolRatings"),
    overallScore: v.number(),
    dimensionScores: dimensionScoresValidator,
    reviewText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertCustomerCapability(ctx, "rate_tool");
    const userId = await assertRatableActor(ctx);

    const rating = await ctx.db.get(args.ratingId);
    if (!rating) throw new Error("toolRatings.update: not found");
    if (rating.userId !== userId) throw new Error("toolRatings.update: not your rating");
    if (rating.status !== "active") throw new Error("toolRatings.update: rating is not active");

    const tool = await getRatableTool(ctx, rating.toolId);
    assertRatingShape(args);
    if (args.reviewText !== undefined && args.reviewText.length > 2000) {
      throw new Error("reviewText: ≤2000 chars (M5 §8 Limits)");
    }

    return await writeAudited(ctx, async (actx) => {
      const patch: Record<string, unknown> = {
        overallScore: args.overallScore,
        dimensionScores: args.dimensionScores,
        updatedAt: Date.now(),
      };
      if (args.reviewText !== undefined) patch.reviewText = args.reviewText;
      await actx.db.patch(args.ratingId, patch);

      // R-AGG — prior→new delta, masked by prior eligibility. Updates keep
      // moderationStatus=passed (the register ties auto-flag to submit only);
      // a held rating's edit therefore applies no delta on either side.
      const priorEligible = isAggregateEligible(rating) ? rating : null;
      const delta = aggDelta(priorEligible, args);
      await actx.db.patch(rating.toolId, {
        ratingSum: tool.ratingSum + delta.ratingSum,
        ratingCount: tool.ratingCount + delta.ratingCount,
        dimensionSums: addDims(tool.dimensionSums, delta.dimensionSums),
        dimensionCounts: addDims(tool.dimensionCounts, delta.dimensionCounts),
      });

      return {
        actorId: userId,
        action: "toolRatings.update",
        target: `toolRatings:${args.ratingId}`,
        prev: { overallScore: rating.overallScore },
        next: { overallScore: args.overallScore },
        correlationId: newCorrelationId(),
        reversible: true,
      };
    });
  },
});

// ── CAP-117 — withdraw (register-unnamed; flagged) ────────────────────────

export const withdraw = mutation({
  args: { ratingId: v.id("toolRatings") },
  handler: async (ctx, args) => {
    await assertCustomerCapability(ctx, "rate_tool");
    const userId = await assertRatableActor(ctx);

    const rating = await ctx.db.get(args.ratingId);
    if (!rating) throw new Error("toolRatings.withdraw: not found");
    if (rating.userId !== userId) throw new Error("toolRatings.withdraw: not your rating");
    if (rating.status !== "active") throw new Error("toolRatings.withdraw: rating is not active");

    const tool = await getRatableTool(ctx, rating.toolId);

    return await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.ratingId, { status: "withdrawn", updatedAt: Date.now() });

      // R-AGG decrement — only if the prior rating was feeding the aggregate
      const priorEligible = isAggregateEligible(rating) ? rating : null;
      const delta = aggDelta(priorEligible, null);
      await actx.db.patch(rating.toolId, {
        ratingSum: tool.ratingSum + delta.ratingSum,
        ratingCount: tool.ratingCount + delta.ratingCount,
        dimensionSums: addDims(tool.dimensionSums, delta.dimensionSums),
        dimensionCounts: addDims(tool.dimensionCounts, delta.dimensionCounts),
      });

      return {
        actorId: userId,
        action: "toolRatings.withdraw",
        target: `toolRatings:${args.ratingId}`,
        prev: { status: "active" },
        next: { status: "withdrawn" },
        correlationId: newCorrelationId(),
        reversible: false, // withdrawal is terminal for this row (re-rate = new row)
      };
    });
  },
});

function addDims(
  stored: Record<Dimension, number>,
  delta: Record<Dimension, number>,
): Record<Dimension, number> {
  return {
    ease_of_use: stored.ease_of_use + delta.ease_of_use,
    output_quality: stored.output_quality + delta.output_quality,
    reliability: stored.reliability + delta.reliability,
    value_for_money: stored.value_for_money + delta.value_for_money,
  };
}
