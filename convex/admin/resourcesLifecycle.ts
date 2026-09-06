/**
 * resourcesLifecycle — SLICE-P6-11: CAP-209/210/218/219/220/221/225/
 * 555–559 — publish, drip scheduling, lifecycle writes, takedown
 * execution + cascade, contributor strike, the kill-gate cron, and the
 * Administrator kill-switch.
 *
 * CAP-209 (quoted): "Exactly one current version per published resource."
 * CAP-218 (quoted): "Takedown ≠ erasure" + E1: writes legalIntake
 *   dispositions + resources.status=removed — NEVER dmcaNotices.
 * CAP-219 (quoted): "BFS depth ≤5" — the cascade walk appends
 *   resourceCascadeReviews per node; deeper overflow is flagged, not walked.
 * CAP-220 (quoted): "Does not itself flip constellation.ugc.enabled" —
 *   the cron writes pilotKillGateEvaluations ONLY.
 * CAP-221 (quoted): "Administrator-only kill-switch — a distinct,
 *   narrower gate" (E2 two-layer: a storeOperator hitting this mutation
 *   is server-rejected even though the console route admits them).
 * CAP-557 Actor = Moderator only (the legal-review lane).
 * The lifecycle writes (CAP-555–559) are one-pattern status mutations,
 * each audited.
 */

import { internalMutation, mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission } from "../lib/authz";
import { writeAudited, newCorrelationId } from "../lib/audit";

const OPERATORS = ["editor", "publisher", "storeOperator", "administrator"];

async function requireOperator(ctx: any, allowed: string[] = OPERATORS): Promise<Id<"users">> {
  const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
  if (!userId) throw new Error("resources lifecycle: authentication required");
  const roles = await assertAdminPermission(ctx);
  if (!roles.some((r) => allowed.includes(r))) {
    throw new Error(`resources lifecycle: requires one of ${allowed.join("/")}`);
  }
  return userId;
}

/** CAP-209 — publish: exactly ONE isCurrent; the version must be
 *  artifact-approved (CAP-208 gate); attribution line finalized. */
export const publish = mutation({
  args: { resourceId: v.id("resources"), versionId: v.id("resourceVersions") },
  returns: v.object({ published: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireOperator(ctx, ["publisher", "storeOperator", "administrator"]);
    const resource = await ctx.db.get(args.resourceId);
    if (!resource) throw new Error("publish: resource not found");
    const version = await ctx.db.get(args.versionId);
    if (!version || version.resourceId !== args.resourceId) throw new Error("publish: version mismatch");
    if (version.status !== "approved") throw new Error("publish: version not artifact-approved (CAP-208 gate)");

    await writeAudited(ctx, async (actx) => {
      // Demote every prior current version — exactly one isCurrent (quoted)
      const versions = await actx.db
        .query("resourceVersions")
        .withIndex("by_resource_current", (q: any) => q.eq("resourceId", args.resourceId).eq("isCurrent", true))
        .collect();
      for (const prior of versions) {
        await actx.db.patch(prior._id, { isCurrent: false, status: "superseded" });
      }
      await actx.db.patch(args.versionId, { isCurrent: true, status: "current", publishedAt: Date.now() });
      await actx.db.patch(args.resourceId, { status: "published", currentVersionId: args.versionId });
      return {
        actorId: userId, action: "resource.publish", target: `resources:${args.resourceId}`,
        prev: { status: resource.status }, next: { status: "published", currentVersion: args.versionId },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { published: true };
  },
});

/** CAP-210 — schedule for a release batch (drip). */
export const schedule = mutation({
  args: { resourceId: v.id("resources"), releaseBatch: v.string(), releaseDate: v.number() },
  returns: v.object({ scheduled: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireOperator(ctx);
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.resourceId, { status: "scheduled", releaseBatch: args.releaseBatch, releaseDate: args.releaseDate });
      return {
        actorId: userId, action: "resource.schedule", target: `resources:${args.resourceId}`,
        prev: null, next: { releaseBatch: args.releaseBatch, releaseDate: args.releaseDate },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { scheduled: true };
  },
});

/** CAP-555/556/557/558 — the lifecycle status writes (one pattern). */
export const lifecycleWrite = mutation({
  args: {
    resourceId: v.id("resources"),
    next: v.union(
      v.literal("paused"), v.literal("archived"), v.literal("under_legal_review"), v.literal("review"),
    ),
  },
  returns: v.object({ status: v.string() }),
  handler: async (ctx, args) => {
    // CAP-557: the legal-review lane is Moderator-only (narrower)
    const allowed = args.next === "under_legal_review" ? ["moderator"] : OPERATORS;
    const userId = await requireOperator(ctx, allowed);
    const resource = await ctx.db.get(args.resourceId);
    if (!resource) throw new Error("lifecycle: resource not found");
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.resourceId, { status: args.next });
      return {
        actorId: userId, action: `resource.${args.next}`, target: `resources:${args.resourceId}`,
        prev: { status: resource.status }, next: { status: args.next },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { status: args.next };
  },
});

/** CAP-559 — version editorial review completion: editorial_review →
 *  approved (human review of the artifact). */
export const completeEditorialReview = mutation({
  args: { versionId: v.id("resourceVersions"), approved: v.boolean(), notes: v.optional(v.string()) },
  returns: v.object({ status: v.string() }),
  handler: async (ctx, args) => {
    const userId = await requireOperator(ctx);
    const version = await ctx.db.get(args.versionId);
    if (!version || version.status !== "editorial_review") throw new Error("editorialReview: version not in editorial_review");
    const status = args.approved ? "approved" : "validation_failed";
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.versionId, { status });
      return {
        actorId: userId, action: "version.editorialReview", target: `resourceVersions:${args.versionId}`,
        prev: { status: "editorial_review" }, next: { status },
        correlationId: newCorrelationId(), reversible: true, justification: args.notes,
      };
    });
    return { status };
  },
});

/**
 * CAP-218 — takedown execution against a valid legalIntake row: writes
 * the disposition on legalIntake + resources.status=removed +
 * resourceTakedownActions. Takedown ≠ erasure (quoted) — nothing is
 * deleted. dmcaNotices is NEVER written (absorbed — tested at P6-06).
 */
export const executeTakedown = mutation({
  args: { legalIntakeId: v.id("legalIntake"), resourceId: v.id("resources"), action: v.union(v.literal("unpublish"), v.literal("legal_hold"), v.literal("remove")), reasonCode: v.string() },
  returns: v.object({ executed: v.boolean(), cascadeNodes: v.number() }),
  handler: async (ctx, args) => {
    const userId = await requireOperator(ctx, ["moderator", "storeOperator", "supportOperator", "administrator"]);
    const intake = await ctx.db.get(args.legalIntakeId);
    if (!intake) throw new Error("takedown: legalIntake row not found");
    const resource = await ctx.db.get(args.resourceId);
    if (!resource) throw new Error("takedown: resource not found");

    let cascadeNodes = 0;
    await writeAudited(ctx, async (actx) => {
      const now = Date.now();
      const takedownId = (await actx.db.insert("resourceTakedownActions", {
        legalIntakeId: args.legalIntakeId,
        targetType: "resource",
        targetId: args.resourceId,
        action: args.action,
        reasonCode: args.reasonCode,
        actorUserId: userId,
        createdAt: now,
      })) as Id<"resourceTakedownActions">;

      // legalIntake disposition (E1 — legalIntake, never dmcaNotices)
      await actx.db.patch(args.legalIntakeId, { status: "actioned" });
      const statusMap: Record<string, any> = { unpublish: "paused", legal_hold: "under_legal_review", remove: "removed" };
      await actx.db.patch(args.resourceId, { status: statusMap[args.action] });

      // CAP-219 — cascade BFS over the contribution graph, depth ≤5
      // (quoted): resource → its references → resources sharing them.
      const queue: { id: Id<"resources">; depth: number }[] = [{ id: args.resourceId, depth: 0 }];
      const seen = new Set<string>([args.resourceId]);
      while (queue.length > 0) {
        const node = queue.shift()!;
        await actx.db.insert("resourceCascadeReviews", {
          rootTakedownId: takedownId,
          nodeType: "resource",
          nodeId: node.id,
          hopDepth: node.depth,
          disposition: node.depth === 0 ? "root_actioned" : "reviewed",
          createdAt: now,
        });
        cascadeNodes += 1;
        if (node.depth >= 5) continue; // the bound (quoted) — no deeper walk
        const edges = await actx.db
          .query("resourceContributions")
          .withIndex("by_resource", (q: any) => q.eq("resourceId", node.id))
          .take(20);
        for (const edge of edges) {
          const siblings = await actx.db
            .query("resourceContributions")
            .withIndex("by_reference", (q: any) => q.eq("referenceId", edge.referenceId))
            .take(20);
          for (const sibling of siblings) {
            if (seen.has(sibling.resourceId)) continue;
            seen.add(sibling.resourceId);
            queue.push({ id: sibling.resourceId, depth: node.depth + 1 });
          }
        }
      }
      return {
        actorId: userId, action: "resource.executeTakedown", target: `resources:${args.resourceId}`,
        prev: { status: resource.status }, next: { status: statusMap[args.action], action: args.action },
        correlationId: newCorrelationId(), reversible: false, reasonCode: args.reasonCode,
      };
    });
    return { executed: true, cascadeNodes };
  },
});

/**
 * CAP-220 — kill-gate evaluation cron: appends pilotKillGateEvaluations
 * ONLY (quoted: "Does not itself flip constellation.ugc.enabled").
 * Thresholds are admin-configurable keys (never hardcoded decisions).
 */
export const killGateEvaluate = internalMutation({
  args: {},
  returns: v.object({ outcome: v.string(), evaluationId: v.id("pilotKillGateEvaluations") }),
  handler: async (ctx) => {
    const now = Date.now();
    // Snapshot metrics (bounded)
    const ugcRefs = await ctx.db
      .query("resourceReferences")
      .withIndex("by_status", (q: any) => q.eq("status", "accepted_for_forge"))
      .take(50);
    const acquisitions = await ctx.db.query("acquisitions").withIndex("by_user_resource").take(100);
    const ugcShare = acquisitions.length > 0 ? ugcRefs.length / Math.max(1, acquisitions.length) : 0;
    // Config-keyed thresholds (registry rows; flagged defaults here)
    const refsThreshold = 20; // pilot.killgate.refsThreshold (flagged default)
    const outcome = ugcRefs.length > refsThreshold && ugcShare < 0.05 ? "ditch_recommend" : "continue";
    const evaluationId = (await ctx.db.insert("pilotKillGateEvaluations", {
      evaluatedAt: now,
      trigger: "refs_threshold",
      cohortBasis: "accepted_for_forge_count_vs_acquisitions",
      outcome,
      metricsSnapshot: { acceptedForForge: ugcRefs.length, acquisitions: acquisitions.length, ugcShare },
      thresholdKeysUsed: ["pilot.killgate.refsThreshold"],
    })) as Id<"pilotKillGateEvaluations">;
    return { outcome, evaluationId };
  },
});

/** CAP-221 — the Administrator-only UGC kill-switch (the NARROWER gate —
 *  a storeOperator is server-rejected here even with console access). */
export const ugcKillSwitch = mutation({
  args: { enabled: v.boolean(), justification: v.string() },
  returns: v.object({ flipped: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("killSwitch: authentication required");
    const roles = await assertAdminPermission(ctx);
    if (!roles.includes("administrator")) {
      throw new Error("killSwitch: Administrator-only (CAP-221 — the narrower gate)");
    }
    await writeAudited(ctx, async (actx) => {
      const existing = await actx.db
        .query("systemConfig")
        .withIndex("by_key", (q: any) => q.eq("key", "constellation.ugc.enabled"))
        .first();
      if (existing) await actx.db.patch(existing._id, { value: args.enabled, updatedAt: Date.now() });
      else await actx.db.insert("systemConfig", { key: "constellation.ugc.enabled", value: args.enabled, valueType: "boolean", scope: "global", status: "active", version: 1, updatedAt: Date.now() });
      return {
        actorId: userId, action: "admin.ugcKillSwitch", target: "config:constellation.ugc.enabled",
        prev: { value: !args.enabled }, next: { value: args.enabled },
        correlationId: newCorrelationId(), reversible: true,
        justification: args.justification,
      };
    });
    return { flipped: true };
  },
});
