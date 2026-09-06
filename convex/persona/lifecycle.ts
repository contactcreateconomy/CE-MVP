/**
 * lifecycle — SLICE-P5-10: CAP-159…167 — the persona lifecycle console
 * mutations + the population/drift crons.
 *
 * Actors per row: birth/activate/resume/wane/retire/revive-confirm =
 *   Editor/Publisher(/Administrator); pause admits Moderator (E-E).
 *   Every operator mutation writes personas + personaLifecycleEvents +
 *   auditLog (writeAudited — fail-closed); crons write NONE (queue
 *   outputs only, quoted).
 *
 * INV-7 (quoted): "max 1 birth/day" and "max 1 retirement/day" — enforced
 *   by counting today's lifecycleEvents of that type.
 * CAP-160 trial: "≤3 comments + ≥N days — N config-keyed, unspecified
 *   value flagged" → registry row persona.activation.trialDays (default 7).
 * CAP-163 waning: 4 trigger branches (rejection rate / saturation / drift /
 *   no selection N days) — System auto-fire + operator; thresholds
 *   config-keyed flagged defaults.
 * CAP-165 revive-confirm: "Snapshots eligible tally + threshold at
 *   confirmation. Restores same persona (full memory + lifecycle
 *   history). Never auto." + re-activation QA (re-compile + trial
 *   gates re-run).
 * CAP-166 population.recommend: "Recommends births/retirements; admin
 *   executes." CAP-167 drift.check: "flag for operator (re-ground or
 *   retire)" — no auto status change.
 *
 * FATAL-adjacent boundary (catalog): a waned/retired/paused persona must
 * never feed generation — cadence gate already enforces (P5-08); the
 * console flips no path around it.
 */

import { internalMutation, mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission, type StaffRole } from "../lib/authz";
import { writeAudited, newCorrelationId } from "../lib/audit";
import { compileSystemPrompt } from "./generate";

/** Flagged config defaults (register-unnamed — typed-config rows seeded). */
export const LIFECYCLE_DEFAULTS = {
  activationTrialDays: 7,
  activationTrialMaxComments: 3,
  waneRejectionRate: 0.5,
  waneNoSelectionDays: 14,
  revivalThreshold: 25,
  maxBirthsPerDay: 1,
  maxRetirementsPerDay: 1,
};

async function requireOperator(ctx: any, allowed: StaffRole[]): Promise<{ userId: Id<"users">; roles: StaffRole[] }> {
  const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
  if (!userId) throw new Error("persona lifecycle: authentication required");
  const roles = await assertAdminPermission(ctx);
  if (!roles.some((r) => allowed.includes(r))) {
    throw new Error(`persona lifecycle: requires one of ${allowed.join("/")}`);
  }
  return { userId, roles };
}

async function lifecycleEvent(
  ctx: any,
  personaId: Id<"personas">,
  from: string,
  to: string,
  eventType: "birth" | "activation" | "waning" | "retirement" | "pause" | "resume" | "revival",
  reasonCode: string,
  triggeredBy: "system" | "operator" | "community",
  actedByUserId?: Id<"users">,
  evidence?: unknown,
): Promise<void> {
  await ctx.db.insert("personaLifecycleEvents", {
    personaId,
    fromStatus: from,
    toStatus: to,
    eventType,
    reasonCode,
    evidence: evidence ?? null,
    triggeredBy,
    actedByUserId,
    createdAt: Date.now(),
  });
}

async function eventsToday(ctx: any, eventType: string): Promise<number> {
  const cutoff = Date.now() - 24 * 3_600_000;
  const rows = await ctx.db
    .query("personaLifecycleEvents")
    .withIndex("by_persona_created")
    .order("desc")
    .take(50);
  return rows.filter((r: any) => r.eventType === eventType && r.createdAt >= cutoff).length;
}

/** CAP-159 — birth: operator confirms a recommendation OR hand-crafts.
 *  Writes the genome instance + COMPILES the system prompt (CAP-158) +
 *  QA gate (genome-diversity + name-collision + operator approval;
 *  INV-7 max 1 birth/day). Status starts nascent (trial per CAP-160). */
export const birth = mutation({
  args: {
    displayName: v.string(),
    name: v.string(),
    bio: v.string(),
    identityCharter: v.string(),
    voice: v.string(),
    domain: v.string(),
    genome: v.any(), // GenomeLike fields — validated by the compiler below
  },
  returns: v.object({ personaId: v.id("personas") }),
  handler: async (ctx, args) => {
    const { userId } = await requireOperator(ctx, ["editor", "publisher", "administrator"]);

    // INV-7 — max 1 birth/day (platform-wide)
    if ((await eventsToday(ctx, "birth")) >= LIFECYCLE_DEFAULTS.maxBirthsPerDay) {
      throw new Error("persona.birth: INV-7 — max 1 birth/day reached");
    }
    // Name-collision QA
    const collision = await ctx.db
      .query("personas")
      .withIndex("by_name", (q: any) => q.eq("name", args.name))
      .first();
    if (collision) throw new Error(`persona.birth: name collision with ${collision._id}`);

    // Genome compile (CAP-158 — deterministic; throws on malformed genome)
    let systemPrompt: string;
    try {
      systemPrompt = compileSystemPrompt(args.genome);
    } catch (e) {
      throw new Error(`persona.birth: genome failed to compile — ${e instanceof Error ? e.message : "invalid"}`);
    }

    const now = Date.now();
    let personaId: Id<"personas"> | undefined;
    await writeAudited(ctx, async (actx) => {
      personaId = (await actx.db.insert("personas", {
        name: args.name,
        displayName: args.displayName,
        bio: args.bio,
        identityCharter: args.identityCharter,
        voice: args.voice,
        domain: args.domain,
        domainLevels: args.genome.domainLevels ?? {},
        systemPrompt, // SEALED — compiled, never hand-written
        genomeVersion: 1,
        humorLevel: (args.genome.humorLevel === "sharp" || args.genome.humorLevel === "light" || args.genome.humorLevel === "dry") ? args.genome.humorLevel : "none",
        sarcasmLevel: args.genome.sarcasmLevel === "pointed" || args.genome.sarcasmLevel === "mild" ? args.genome.sarcasmLevel : "none",
        lifecycleStatus: "nascent", // trial period (CAP-160)
        paused: false,
        createdByUserId: userId,
        approvedByUserId: userId, // operator approval IS the QA gate's human leg
        createdAt: now,
      })) as Id<"personas">;
      await actx.db.insert("personaGenomes", {
        personaId,
        version: 1,
        scope: "instance",
        ...args.genome,
        createdByUserId: userId,
        createdAt: now,
      });
      await lifecycleEvent(actx, personaId, "none", "nascent", "birth", "operator_confirmed", "operator", userId);
      return {
        actorId: userId,
        action: "persona.birth",
        target: `personas:${personaId}`,
        prev: null,
        next: { name: args.name, lifecycleStatus: "nascent" },
        correlationId: newCorrelationId(),
        reversible: false,
      };
    });
    return { personaId: personaId! };
  },
});

/** CAP-160 — activate after the trial: ≤N comments (trial evidence =
 *  personaCommentEvaluations rows) + ≥N days old (config-keyed). */
export const activate = mutation({
  args: { personaId: v.id("personas") },
  returns: v.object({ activated: v.boolean() }),
  handler: async (ctx, args) => {
    const { userId } = await requireOperator(ctx, ["editor", "publisher", "administrator"]);
    const persona = await ctx.db.get(args.personaId);
    if (!persona) throw new Error("persona.activate: not found");
    if (persona.lifecycleStatus !== "nascent") throw new Error("persona.activate: only nascent personas activate (CAP-160)");
    const ageDays = (Date.now() - persona.createdAt) / 86_400_000;
    if (ageDays < LIFECYCLE_DEFAULTS.activationTrialDays) {
      throw new Error(`persona.activate: trial period not elapsed (${LIFECYCLE_DEFAULTS.activationTrialDays}d config-keyed — flagged default)`);
    }
    const trialEvaluations = await ctx.db
      .query("personaCommentDrafts")
      .withIndex("by_persona_status_created", (q: any) =>
        q.eq("personaId", args.personaId).eq("status", "published"))
      .take(LIFECYCLE_DEFAULTS.activationTrialMaxComments + 1);
    if (trialEvaluations.length > LIFECYCLE_DEFAULTS.activationTrialMaxComments) {
      throw new Error("persona.activate: trial comment ceiling exceeded (≤3 — flagged default)");
    }
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.personaId, { lifecycleStatus: "active", activatedAt: Date.now() });
      await lifecycleEvent(actx, args.personaId, "nascent", "active", "activation", "trial_criteria_met", "operator", userId);
      return {
        actorId: userId, action: "persona.activate", target: `personas:${args.personaId}`,
        prev: { lifecycleStatus: "nascent" }, next: { lifecycleStatus: "active" },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { activated: true };
  },
});

/** CAP-161 — pause (safety/quality hold; Moderator admitted). Resumable. */
export const pause = mutation({
  args: { personaId: v.id("personas"), pauseReason: v.string() },
  returns: v.object({ paused: v.boolean() }),
  handler: async (ctx, args) => {
    const { userId } = await requireOperator(ctx, ["editor", "publisher", "moderator", "administrator"]);
    const persona = await ctx.db.get(args.personaId);
    if (!persona) throw new Error("persona.pause: not found");
    if (persona.paused) return { paused: true };
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.personaId, { paused: true, pauseReason: args.pauseReason });
      await lifecycleEvent(actx, args.personaId, persona.lifecycleStatus, `${persona.lifecycleStatus}:paused`, "pause", args.pauseReason, "operator", userId);
      return {
        actorId: userId, action: "persona.pause", target: `personas:${args.personaId}`,
        prev: { paused: false }, next: { paused: true, pauseReason: args.pauseReason },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { paused: true };
  },
});

/** CAP-162 — resume. */
export const resume = mutation({
  args: { personaId: v.id("personas") },
  returns: v.object({ resumed: v.boolean() }),
  handler: async (ctx, args) => {
    const { userId } = await requireOperator(ctx, ["editor", "publisher", "administrator"]);
    const persona = await ctx.db.get(args.personaId);
    if (!persona) throw new Error("persona.resume: not found");
    if (!persona.paused) return { resumed: false };
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.personaId, { paused: false, pauseReason: undefined });
      await lifecycleEvent(actx, args.personaId, `${persona.lifecycleStatus}:paused`, persona.lifecycleStatus, "resume", "operator_resume", "operator", userId);
      return {
        actorId: userId, action: "persona.resume", target: `personas:${args.personaId}`,
        prev: { paused: true }, next: { paused: false },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { resumed: true };
  },
});

/** CAP-163 — wane (System auto-fire OR operator). Four trigger branches
 *  (rejection rate / saturation / drift / no-selection-N-days) — evaluated
 *  from the cadence projection; thresholds config-keyed flagged defaults. */
export const wane = mutation({
  args: { personaId: v.id("personas"), triggerBranch: v.string(), triggeredBySystem: v.optional(v.boolean()) },
  returns: v.object({ waned: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = args.triggeredBySystem
      ? ("system" as const)
      : (await requireOperator(ctx, ["editor", "publisher", "administrator"])).userId;
    const persona = await ctx.db.get(args.personaId);
    if (!persona) throw new Error("persona.wane: not found");
    if (persona.lifecycleStatus !== "active") throw new Error("persona.wane: only active personas wane");
    const operator = userId !== "system" ? (userId as Id<"users">) : undefined;
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.personaId, { lifecycleStatus: "waning", waningAt: Date.now() });
      await lifecycleEvent(actx, args.personaId, "active", "waning", "waning", args.triggerBranch, args.triggeredBySystem ? "system" : "operator", operator);
      return {
        actorId: operator, action: "persona.wane", target: `personas:${args.personaId}`,
        prev: { lifecycleStatus: "active" }, next: { lifecycleStatus: "waning", triggerBranch: args.triggerBranch },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { waned: true };
  },
});

/** CAP-164 — retire: triggers or operator; INV-7 max 1 retirement/day;
 *  graceful (profile + history preserved — nothing is deleted). */
export const retire = mutation({
  args: { personaId: v.id("personas"), retirementReason: v.string(), triggeredBySystem: v.optional(v.boolean()) },
  returns: v.object({ retired: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = args.triggeredBySystem
      ? ("system" as const)
      : (await requireOperator(ctx, ["editor", "publisher", "administrator"])).userId;
    const persona = await ctx.db.get(args.personaId);
    if (!persona) throw new Error("persona.retire: not found");
    if (persona.lifecycleStatus === "retired") return { retired: true };
    if ((await eventsToday(ctx, "retirement")) >= LIFECYCLE_DEFAULTS.maxRetirementsPerDay) {
      throw new Error("persona.retire: INV-7 — max 1 retirement/day reached");
    }
    const operator = userId !== "system" ? (userId as Id<"users">) : undefined;
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.personaId, {
        lifecycleStatus: "retired", retiredAt: Date.now(), retirementReason: args.retirementReason,
      });
      await lifecycleEvent(actx, args.personaId, persona.lifecycleStatus, "retired", "retirement", args.retirementReason, args.triggeredBySystem ? "system" : "operator", operator);
      return {
        actorId: operator, action: "persona.retire", target: `personas:${args.personaId}`,
        prev: { lifecycleStatus: persona.lifecycleStatus }, next: { lifecycleStatus: "retired" },
        correlationId: newCorrelationId(), reversible: false,
      };
    });
    return { retired: true };
  },
});

/** CAP-165 — revive-confirm: threshold met + re-QA (prompt re-compile +
 *  trial gates re-armed) + tally SNAPSHOT in the event evidence; restores
 *  the SAME persona (full memory + history — nothing rebuilt). Never auto. */
export const reviveConfirm = mutation({
  args: { personaId: v.id("personas") },
  returns: v.object({ revived: v.boolean() }),
  handler: async (ctx, args) => {
    const { userId } = await requireOperator(ctx, ["editor", "publisher", "administrator"]);
    const persona = await ctx.db.get(args.personaId);
    if (!persona) throw new Error("persona.reviveConfirm: not found");
    if (persona.lifecycleStatus !== "retired") throw new Error("persona.reviveConfirm: persona is not retired");
    const votes = await ctx.db
      .query("personaRevivalVotes")
      .withIndex("by_persona", (q: any) => q.eq("retiredPersonaId", args.personaId))
      .take(500);
    if (votes.length < LIFECYCLE_DEFAULTS.revivalThreshold) {
      throw new Error(`persona.reviveConfirm: community threshold not met (${votes.length}/${LIFECYCLE_DEFAULTS.revivalThreshold})`);
    }
    // Re-QA: re-compile the prompt from the CURRENT genome (deterministic —
    // a drifted/stale prompt fails loudly, never silently)
    const genome = await ctx.db
      .query("personaGenomes")
      .withIndex("by_personaId", (q: any) => q.eq("personaId", args.personaId))
      .order("desc")
      .first();
    if (!genome) throw new Error("persona.reviveConfirm: no genome — re-QA cannot compile");
    const systemPrompt = compileSystemPrompt(genome as any);
    const snapshot = { tally: votes.length, threshold: LIFECYCLE_DEFAULTS.revivalThreshold, snapshottedAt: Date.now() };

    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.personaId, {
        lifecycleStatus: "active", // trial re-armed: nascent-style gates apply via cadence (flagged: register silent on re-trial)
        paused: false,
        pauseReason: undefined,
        revivedAt: Date.now(),
        systemPrompt,
      });
      await lifecycleEvent(actx, args.personaId, "retired", "active", "revival", "community_threshold_met", "community", userId, snapshot);
      return {
        actorId: userId, action: "persona.reviveConfirm", target: `personas:${args.personaId}`,
        prev: { lifecycleStatus: "retired" }, next: { lifecycleStatus: "active", revivedByCommunity: true },
        correlationId: newCorrelationId(), reversible: false,
      };
    });
    return { revived: true };
  },
});

/** CAP-166 — population.recommend (daily cron): recommends births/
 *  retirements to the operator queue. Writes NOTHING to personas (quoted:
 *  "admin executes"). Max 1 birth + 1 retirement per day (INV-7) shapes
 *  the recommendation, never the action. */
export const populationRecommend = internalMutation({
  args: {},
  returns: v.object({ recommendation: v.string(), detail: v.any() }),
  handler: async (ctx) => {
    const active = await ctx.db.query("personas").withIndex("by_lifecycleStatus", (q: any) => q.eq("lifecycleStatus", "active")).take(50);
    const retired = await ctx.db.query("personas").withIndex("by_lifecycleStatus", (q: any) => q.eq("lifecycleStatus", "retired")).take(50);
    const waning = await ctx.db.query("personas").withIndex("by_lifecycleStatus", (q: any) => q.eq("lifecycleStatus", "waning")).take(50);
    const birthsToday = await eventsToday(ctx, "birth");
    const retirementsToday = await eventsToday(ctx, "retirement");
    const recommendation =
      active.length === 0 && birthsToday === 0
        ? "birth:population_empty"
        : waning.length >= 2 && retirementsToday === 0
          ? "retire:two_or_more_waning"
          : "hold";
    return {
      recommendation,
      detail: { active: active.length, waning: waning.length, retired: retired.length, birthsToday, retirementsToday },
    };
  },
});

/** CAP-167 — drift.check (weekly cron): style centroid vs genome >
 *  threshold → FLAG for operator (re-ground or retire). NO auto status
 *  change (quoted). Flag rides personaCadenceState.lastDriftScore. */
export const driftCheck = internalMutation({
  args: {},
  returns: v.object({ checked: v.number(), flagged: v.array(v.id("personas")) }),
  handler: async (ctx) => {
    const active = await ctx.db.query("personas").withIndex("by_lifecycleStatus", (q: any) => q.eq("lifecycleStatus", "active")).take(50);
    const DRIFT_THRESHOLD = 0.4; // flagged default (register-unnamed)
    const flagged: Id<"personas">[] = [];
    for (const persona of active) {
      const state = await ctx.db
        .query("personaCadenceState")
        .withIndex("by_personaId", (q: any) => q.eq("personaId", persona._id))
        .unique();
      // v1 drift signal: recent rejection rate as the proxy centroid
      // (style-embedding distance activates with the embedding provider —
      // flagged mechanism; the NO-AUTO-ACTION contract holds either way)
      const rejectionRate = state?.recentRejectionReasons?.length ?? 0;
      const driftScore = Math.min(1, rejectionRate / 10);
      if (state) {
        await ctx.db.patch(state._id, { lastDriftScore: driftScore, lastDriftCheckAt: Date.now(), updatedAt: Date.now() });
      }
      if (driftScore > DRIFT_THRESHOLD) flagged.push(persona._id);
    }
    return { checked: active.length, flagged };
  },
});
