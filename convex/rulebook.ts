/**
 * rulebook — SLICE-P4-06: M3 qualification-rulebook backend + deploy seed.
 *
 * CAP-536: "System seeds qualificationRules with baked default threshold
 *   values at deploy time … Runs once at deploy/migration, not
 *   user-triggered. Without this, /admin/rulebook renders empty at first
 *   launch." deploySeed is idempotent-by-ruleKey and NEVER patches existing
 *   rows — rules hold admin-tuned LIVE values a re-run must not clobber.
 *
 *   The tunable seed set is the FIVE consolidated rule rows every
 *   authoritative enumeration names (register E1/E2 stamps CAP-068/070/071/
 *   072/074; inventory §4; contract §2). CAP-536's original "7 tunable rows"
 *   was a stale count — corrected 7→5 by founder ruling 2026-09-05 (P4-06
 *   session); register row + bible revisions log annotated same date.
 *
 * CAP-084: "Bounded ranges validated; out-of-bounds → reject; audited."
 *   E1: bounds validation reads configKeyRegistry (authoritative min/max/
 *   type per key); qualificationRules holds live values only. Wave-3 E5:
 *   minimal admin auth gate (administrator role check) now; the M15 shell
 *   wraps at Wave 7. Writes qualificationRules + auditLog ONLY — never
 *   systemConfig/configKeyRegistry (sealed-keys zero-intersection, CAP-394;
 *   belt-and-braces sealed-key reject below).
 *
 * CAP-085: listRules (list branch — no write) + calibrate (internal; the
 *   replay EXECUTION is SLICE-P4-07's qualify orchestrator — this slice
 *   wires the admin trigger to the internal stub interface per the slice
 *   catalog). E4: "Actor remains System (the replay execution), triggered
 *   by an admin action — intentional, not a mismatch."
 *
 * CAP-537: add/edit calibrationExamples (the labeled set calibrate replays)
 *   — "distinct action from triggering calibrate"; administrator, audited.
 *
 * In-slice choices (register-silent, flagged): ruleVersion bumps on every
 * accepted edit (update-in-place — OQ#2); severity seeded "high" for hard
 * rules (no M3 literal set defined); threshold registry-key names under the
 * rulebook.* namespace; baked numeric defaults are calibration-pending
 * placeholders (DECISIONS-LOCKED #11 ethos — tunable, no hardcoded magic in
 * evaluators); H-DUP windowDays named here (window size named nowhere —
 * contract OQ). CAP-019's 60/1m admin.write limiter rides the pending
 * @convex-dev/rate-limiter install (DEV-HANDOFF #3), like every Phase-4
 * mutation.
 */

import { mutation, query, internalMutation, internalQuery, internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission, validateAgainstRegistry, _registryRow, SEALED_KEYS } from "./lib/authz";
import { writeAudited, newCorrelationId } from "./lib/audit";

/** The 8 active post types (bible l.351 — 8 active of the 10-literal enum). */
export const ACTIVE_POST_TYPES = [
  "news", "review", "compare", "help", "spark", "debate", "list", "showcase",
] as const;

/**
 * E1 bounds rows — configKeyRegistry entries for every NUMERIC rulebook
 * threshold (H-TYPE is structural per E2 — no numeric bounds row). Key
 * names are in-slice choices under the rulebook.* namespace; defaults are
 * calibration-pending placeholders (tunable without code changes).
 * NOTE: unlike other registry keys, NO systemConfig live row is seeded —
 * E1 keeps live values in qualificationRules.thresholdConfig, and a
 * systemConfig row would be a phantom second source.
 */
export const RULEBOOK_REGISTRY_ROWS = [
  { key: "rulebook.hquote.maxQuoteWords", module: "m3", valueType: "number" as const, default: 40, min: 5, max: 200, editTier: "tier2" as const, blastRadius: "H-QUOTE: max words per quoted span; over-cap quotes re-enter H-SIM.", effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  { key: "rulebook.hquote.maxQuotesPerPost", module: "m3", valueType: "number" as const, default: 5, min: 1, max: 20, editTier: "tier2" as const, blastRadius: "H-QUOTE: max exempt quotes per post.", effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  { key: "rulebook.hquote.maxQuotedBodyPct", module: "m3", valueType: "number" as const, default: 20, min: 0, max: 100, editTier: "tier2" as const, blastRadius: "H-QUOTE: max % of body that may be quoted.", effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  { key: "rulebook.hsim.semanticCosine", module: "m3", valueType: "number" as const, default: 0.28, min: 0, max: 1, editTier: "tier2" as const, blastRadius: "H-SIM semantic: cosine similarity fail threshold (M3 worked-example value; calibration-pending).", effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  { key: "rulebook.hdup.threshold", module: "m3", valueType: "number" as const, default: 0.85, min: 0, max: 1, editTier: "tier2" as const, blastRadius: "H-DUP: duplicate similarity threshold over the recent window.", effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  { key: "rulebook.hdup.windowDays", module: "m3", valueType: "number" as const, default: 30, min: 1, max: 365, editTier: "tier2" as const, blastRadius: "H-DUP: recent-window size (named here; unnamed in spec — contract OQ).", effectiveTiming: "immediate" as const, reversible: true, sealed: false },
  { key: "rulebook.hcat.confidence", module: "m3", valueType: "number" as const, default: 0.6, min: 0, max: 1, editTier: "tier2" as const, blastRadius: "H-CAT: category confidence threshold (below it with no override → fail).", effectiveTiming: "immediate" as const, reversible: true, sealed: false },
];

/** H-TYPE structural default (E2 mapping, verbatim): per-type required
 *  fields. Spark's statement cap (≤280 chars per CAP-186) is evaluator
 *  behavior, not a list entry. */
export const H_TYPE_DEFAULT: Record<string, string[]> = {
  news: ["source"],
  review: ["tool", "verdict"],
  compare: ["tools_2_to_4"],
  debate: ["proposition"],
  list: ["items"],
  showcase: ["metadata"],
  help: ["problemStatement"],
  spark: ["statement"],
};

/**
 * CAP-536's seed set — the five consolidated tunable rows with baked
 * defaults (see module header for the "7" reconciliation flag).
 * ruleKey naming: the register's rule names; H-SIM's semantic layer only
 * (the consolidated CAP-070 row; surface-layer thresholds join via P4-07's
 * evaluator if the founder's 7th/8th rows are confirmed).
 */
export const SEED_RULES = [
  {
    ruleKey: "H-QUOTE", ruleClass: "hard" as const, severity: "high", enabled: true,
    thresholdConfig: {
      "rulebook.hquote.maxQuoteWords": 40,
      "rulebook.hquote.maxQuotesPerPost": 5,
      "rulebook.hquote.maxQuotedBodyPct": 20,
    },
    applicablePostTypes: [...ACTIVE_POST_TYPES],
  },
  {
    ruleKey: "H-SIM-semantic", ruleClass: "hard" as const, severity: "high", enabled: true,
    thresholdConfig: { "rulebook.hsim.semanticCosine": 0.28 },
    applicablePostTypes: [...ACTIVE_POST_TYPES],
  },
  {
    ruleKey: "H-DUP", ruleClass: "hard" as const, severity: "high", enabled: true,
    thresholdConfig: { "rulebook.hdup.threshold": 0.85, "rulebook.hdup.windowDays": 30 },
    applicablePostTypes: [...ACTIVE_POST_TYPES],
  },
  {
    ruleKey: "H-CAT", ruleClass: "hard" as const, severity: "high", enabled: true,
    thresholdConfig: { "rulebook.hcat.confidence": 0.6 },
    applicablePostTypes: [...ACTIVE_POST_TYPES],
  },
  {
    ruleKey: "H-TYPE", ruleClass: "hard" as const, severity: "high", enabled: true,
    thresholdConfig: { requiredFieldsByType: H_TYPE_DEFAULT }, // structural (E2) — not numeric
    applicablePostTypes: [...ACTIVE_POST_TYPES],
  },
];

/** CAP-536 — deploy seeder. Runs once at deploy/migration (CLI: `npx convex
 *  run rulebook/deploySeed`), NOT user-triggered; idempotent skip-if-exists
 *  (never patches — live values are admin-tuned). */
export const deploySeed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const results: string[] = [];
    for (const def of SEED_RULES) {
      const existing = await ctx.db
        .query("qualificationRules")
        .withIndex("by_ruleKey", (q: any) => q.eq("ruleKey", def.ruleKey))
        .unique();
      if (existing) {
        results.push(`${def.ruleKey}: skipped (live values preserved)`);
        continue;
      }
      await ctx.db.insert("qualificationRules", {
        ...def,
        ruleVersion: 1,
        updatedAt: Date.now(),
      });
      results.push(`${def.ruleKey}: seeded`);
    }
    return results;
  },
});

/** CAP-085 list branch — rules + recent-run context. No writes. */
export const listRules = query({
  args: {},
  handler: async (ctx) => {
    const rules = await ctx.db.query("qualificationRules").collect();
    const recentRuns = await ctx.db
      .query("qualificationRuns")
      .withIndex("by_candidate")
      .order("desc")
      .take(10);
    return { rules, recentRuns };
  },
});

/** Wave-3 E5 minimal gate — administrator role check (M15 shell wraps at
 *  Wave 7). CAP-084/537 Actor=administrator. */
async function assertAdministrator(ctx: any): Promise<Id<"users">> {
  const roles = await assertAdminPermission(ctx);
  if (!roles.includes("administrator")) {
    throw new Error("rulebook: administrator role required (CAP-084/537; Wave-3 E5 minimal gate)");
  }
  const userId = (await getAuthUserId(ctx)) as Id<"users">;
  if (!userId) throw new Error("rulebook: authentication required");
  return userId;
}

/**
 * CAP-084 threshold validation (pure, unit-tested):
 *  - numeric entries must have a configKeyRegistry bounds row; out-of-bounds
 *    → reject (E1);
 *  - `requiredFieldsByType` is the H-TYPE structural config (E2) — validated
 *    structurally (types ⊆ 8 active, fields non-empty lists), not numerically;
 *  - sealed economy keys can never pass (belt-and-braces).
 * Returns the normalized thresholdConfig or throws.
 */
export function validateThresholdConfig(
  proposed: Record<string, unknown>,
  registryByKey: Record<string, { valueType: string; min?: number; max?: number; default: unknown }>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(proposed)) {
    if ((SEALED_KEYS as readonly string[]).includes(key)) {
      throw new Error(`setRuleConfig: sealed key "${key}" can never be a rulebook threshold (CAP-394)`);
    }
    if (key === "requiredFieldsByType") {
      validateHTypeConfig(value as Record<string, unknown>);
      out[key] = value;
      continue;
    }
    const registry = registryByKey[key];
    if (!registry) {
      throw new Error(`setRuleConfig: no configKeyRegistry bounds row for "${key}" (E1: registry is the authoritative bounds owner)`);
    }
    out[key] = validateAgainstRegistry(key, value, registry);
  }
  return out;
}

/** E2 structural validation for H-TYPE's per-type required-field list. */
function validateHTypeConfig(config: Record<string, unknown>): void {
  if (!config || typeof config !== "object") {
    throw new Error("setRuleConfig: H-TYPE thresholdConfig.requiredFieldsByType must be an object");
  }
  const active = new Set<string>(ACTIVE_POST_TYPES);
  for (const [type, fields] of Object.entries(config)) {
    if (!active.has(type)) {
      throw new Error(`setRuleConfig: unknown post type "${type}" in requiredFieldsByType (8 active types only)`);
    }
    if (!Array.isArray(fields) || fields.length === 0 || !fields.every((f) => typeof f === "string")) {
      throw new Error(`setRuleConfig: requiredFieldsByType["${type}"] must be a non-empty string[] (E2 structural contract)`);
    }
  }
}

/** CAP-084 — enable/disable a rule and/or tune its thresholdConfig. */
export const setRuleConfig = mutation({
  args: {
    ruleKey: v.string(),
    enabled: v.optional(v.boolean()),
    // Live values; validated against configKeyRegistry bounds (E1) in-handler
    thresholdConfig: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const adminId = await assertAdministrator(ctx);

    const rule = await ctx.db
      .query("qualificationRules")
      .withIndex("by_ruleKey", (q: any) => q.eq("ruleKey", args.ruleKey))
      .unique();
    if (!rule) throw new Error(`setRuleConfig: rule "${args.ruleKey}" not found`);

    let validatedConfig: Record<string, unknown> | undefined;
    if (args.thresholdConfig !== undefined) {
      // E1: bounds read from configKeyRegistry — build the lookup for the
      // keys under validation (read-only; never written).
      const registryByKey: Record<string, any> = {};
      for (const key of Object.keys(args.thresholdConfig)) {
        const row = await _registryRow(ctx, key);
        if (row) registryByKey[key] = row;
      }
      validatedConfig = validateThresholdConfig(args.thresholdConfig, registryByKey);
    }

    return await writeAudited(ctx, async (actx) => {
      const patch: Record<string, unknown> = {
        updatedByUserId: adminId,
        updatedAt: Date.now(),
        // OQ#2 in-slice choice: bump ruleVersion on every accepted edit
        ruleVersion: rule.ruleVersion + 1,
      };
      if (args.enabled !== undefined) patch.enabled = args.enabled;
      if (validatedConfig !== undefined) patch.thresholdConfig = validatedConfig;
      await actx.db.patch(rule._id, patch);

      return {
        actorId: adminId,
        role: "administrator",
        action: "rulebook.setRuleConfig",
        target: `qualificationRule:${rule.ruleKey}`,
        prev: { enabled: rule.enabled, thresholdConfig: rule.thresholdConfig, ruleVersion: rule.ruleVersion },
        next: { enabled: args.enabled ?? rule.enabled, thresholdConfig: validatedConfig ?? rule.thresholdConfig, ruleVersion: rule.ruleVersion + 1 },
        correlationId: newCorrelationId(),
        reversible: true,
      };
    });
  },
});

// ── CAP-537 — calibration labeled-set curation ────────────────────────────

/** Valid labels reference real rules (replay runs per ruleKey). */
async function assertKnownRuleKeys(ctx: any, labels: Record<string, unknown>): Promise<void> {
  for (const ruleKey of Object.keys(labels)) {
    const rule = await ctx.db
      .query("qualificationRules")
      .withIndex("by_ruleKey", (q: any) => q.eq("ruleKey", ruleKey))
      .unique();
    if (!rule) throw new Error(`calibrationExamples: unknown ruleKey "${ruleKey}" in expectedOutcome`);
  }
}

export const addCalibrationExample = mutation({
  args: {
    candidateSnapshot: v.any(), // frozen candidate content (contentCandidates ref or payload — P4-08 lands the table)
    expectedOutcome: v.record(v.string(), v.union(v.literal("pass"), v.literal("fail"))),
  },
  handler: async (ctx, args) => {
    const adminId = await assertAdministrator(ctx);
    await assertKnownRuleKeys(ctx, args.expectedOutcome);
    if (!args.candidateSnapshot || typeof args.candidateSnapshot !== "object") {
      throw new Error("calibrationExamples: candidateSnapshot required (frozen candidate content)");
    }

    return await writeAudited(ctx, async (actx) => {
      const id = await actx.db.insert("calibrationExamples", {
        candidateSnapshot: args.candidateSnapshot,
        expectedOutcome: args.expectedOutcome,
        addedByUserId: adminId,
        addedAt: Date.now(),
      });
      return {
        actorId: adminId,
        role: "administrator",
        action: "rulebook.addCalibrationExample",
        target: `calibrationExample:${id}`,
        prev: null,
        next: { ruleKeys: Object.keys(args.expectedOutcome) },
        correlationId: newCorrelationId(),
        reversible: true,
      };
    });
  },
});

export const editCalibrationExample = mutation({
  args: {
    exampleId: v.id("calibrationExamples"),
    expectedOutcome: v.record(v.string(), v.union(v.literal("pass"), v.literal("fail"))),
  },
  handler: async (ctx, args) => {
    const adminId = await assertAdministrator(ctx);
    const example = await ctx.db.get(args.exampleId);
    if (!example) throw new Error("calibrationExamples: not found");
    await assertKnownRuleKeys(ctx, args.expectedOutcome);

    return await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.exampleId, { expectedOutcome: args.expectedOutcome });
      return {
        actorId: adminId,
        role: "administrator",
        action: "rulebook.editCalibrationExample",
        target: `calibrationExample:${args.exampleId}`,
        prev: { expectedOutcome: example.expectedOutcome },
        next: { expectedOutcome: args.expectedOutcome },
        correlationId: newCorrelationId(),
        reversible: true,
      };
    });
  },
});

/** Calibration-set read for the console. */
export const listCalibrationExamples = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("calibrationExamples")
      .withIndex("by_addedAt")
      .order("desc")
      .take(100);
  },
});

// ── CAP-085 — calibrate replay (execution owned by SLICE-P4-07) ──────────

/**
 * rulebook.calibrate — internalAction (the register's §9 name; execution is
 * the P4-07 replay path — vectorSearch/classifier seams need action
 * context). E4: replays calibrationExamples' snapshots against the current
 * rule config, writing qualificationRuleResults with source=replay —
 * segregated from CAP-083's immutable live stream.
 */
export const calibrate = internalAction({
  args: {},
  handler: async (ctx: any): Promise<{ replayed: number; drifted: number }> => {
    return await ctx.runAction(internal.qualify.orchestrator.replay, {});
  },
});

/** Caller's active staff roles (internalQuery — the action gate's db read). */
export const _callerStaffRoles = internalQuery({
  args: {},
  handler: async (ctx: any): Promise<string[]> => {
    const userId = ctx.auth?.userId ?? (await ctx.auth?.getUserId?.());
    if (!userId) return [];
    const assignments = await ctx.db
      .query("roleAssignments")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();
    return assignments.filter((a: any) => a.status === "active").map((a: any) => a.role);
  },
});

/**
 * The admin trigger (E4: "admin initiates, system executes and writes") —
 * public ACTION (the replay's seams are action-only), administrator-gated,
 * invoking the P4-07 replay path. No auditLog write: CAP-085's Writes name
 * qualificationRuleResults only (register-faithful, CAP-054 discipline).
 */
export const triggerCalibrate = action({
  args: {},
  handler: async (ctx: any): Promise<{ replayed: number; drifted: number }> => {
    const roles = await ctx.runQuery(internal.rulebook._callerStaffRoles, {});
    if (!(roles as string[]).includes("administrator")) {
      throw new Error("rulebook: administrator role required (CAP-085 trigger; Wave-3 E5 minimal gate)");
    }
    return await ctx.runAction(internal.qualify.orchestrator.replay, {});
  },
});
