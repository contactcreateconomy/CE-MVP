/**
 * editorial decisions — SLICE-P4-10: the decision surface on the review
 * workspace — CAP-043 approve · CAP-044 reject · CAP-054 schedule ·
 * CAP-042 regen.
 *
 * CAP-043 gate (quoted): "M3 latest run pass + operator approval (INV-2,
 *   no auto-publish)." — approve flips status ONLY; publish is P4-11.
 * CAP-044 (quoted): "rejectionReason is the retained legal-audit record
 *   (non-deletable). auditLog.reasonCode/justification is a separate
 *   generic trail — not a duplicate, not a substitute."
 * CAP-042 (quoted): "GLM ≤3 attempts/candidate" + exhausted state.
 * CAP-054 flag (quoted): "no auditLog write in register (Open Questions)"
 *   — schedule ships register-faithful; do not silently add the audit write.
 *
 * persona.regenComment (CAP-048) is FENCED to Phase 5: the persona tables
 * are M8-owned (P5-08 builds the spine; P5-11 the review queue). Flagged,
 * not silently cut.
 *
 * Regen runs as a mutation bridging to the forge.draft internal ACTION via
 * scheduler.runAfter(0, …) — the same flagged reading review.ts uses for
 * CAP-543→CAP-045 (mutations cannot runAction; role gates need ctx.db).
 */

import { mutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission } from "../lib/authz";
import { writeAudited, newCorrelationId } from "../lib/audit";
import { canApprove, assertEditorial } from "./review";

/** Publisher-level decisions (CAP-043/044/054 Actor=Publisher;
 *  Administrator is senior per the role split). */
export async function assertPublisher(ctx: any): Promise<Id<"users">> {
  const roles = await assertAdminPermission(ctx);
  if (!roles.some((r) => r === "publisher" || r === "administrator")) {
    throw new Error("editorial: Publisher role required (CAP-043/044/054)");
  }
  const userId = (await getAuthUserId(ctx)) as Id<"users">;
  if (!userId) throw new Error("editorial: authentication required");
  return userId;
}

/** CAP-043 — approve. Fail-closed on any unconfirmed ref (CAP-542 via
 *  canApprove), on a non-review status (CAP-041), and on anything but a
 *  passing latest qualification run (CAP-040). Writes status only — INV-2,
 *  no auto-publish. */
export const candidateApprove = mutation({
  args: { candidateId: v.id("contentCandidates") },
  handler: async (ctx, args) => {
    const publisherId = await assertPublisher(ctx);

    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) throw new Error("candidate.approve: not found");
    if (candidate.status !== "review") {
      throw new Error(`candidate.approve: status "${candidate.status}" ≠ review (CAP-041)`);
    }

    // CAP-542/043 — the server-side gate (UI disable is not sufficient)
    const refs = await ctx.db
      .query("draftClaimRefs")
      .withIndex("by_candidate", (q: any) => q.eq("contentCandidateId", args.candidateId))
      .collect();
    if (!canApprove(refs)) {
      throw new Error("candidate.approve: fail-closed — unconfirmed draftClaimRefs remain (CAP-043/CAP-542)");
    }

    // CAP-040/043 — M3 latest run must pass
    const runs = await ctx.db
      .query("qualificationRuns")
      .withIndex("by_candidate", (q: any) => q.eq("contentCandidateId", args.candidateId))
      .collect();
    const latestRun = runs.sort((a: any, b: any) => b.startedAt - a.startedAt)[0];
    if (!latestRun) {
      throw new Error("candidate.approve: no qualification run exists (CAP-040: qualify must run first)");
    }
    if (latestRun.overallResult !== "pass") {
      throw new Error(`candidate.approve: latest run overallResult=${latestRun.overallResult} (CAP-043: M3 latest run pass required)`);
    }

    return await writeAudited(ctx, async (actx) => {
      // operatorId stamps the approver — persistPublish's postRevisions row
      // needs changedByUserId (bible l.77: required) and the editorial
      // publish's user provenance is this approval.
      await actx.db.patch(args.candidateId, { status: "approved", operatorId: publisherId });
      return {
        actorId: publisherId,
        role: "publisher",
        action: "editorial.candidate.approve",
        target: `contentCandidate:${args.candidateId}`,
        prev: { status: candidate.status },
        next: { status: "approved" },
        correlationId: newCorrelationId(),
        reversible: true,
      };
    });
  },
});

/** CAP-044 — reject. Terminal-for-revision; records preserved (no deletes);
 *  rejectionReason is REQUIRED and is the candidate's own retained
 *  legal-audit record — the auditLog row is the generic trail, not a
 *  substitute (quoted rule honored: both are written, for different
 *  purposes). */
export const candidateReject = mutation({
  args: { candidateId: v.id("contentCandidates"), rejectionReason: v.string() },
  handler: async (ctx, args) => {
    const publisherId = await assertPublisher(ctx);

    const reason = args.rejectionReason.trim();
    if (!reason) throw new Error("candidate.reject: rejectionReason is required (CAP-044)");

    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) throw new Error("candidate.reject: not found");
    // Terminal-for-revision acts on pre-decision states (review primarily;
    // drafting included — a draft the operator won't advance. Post-approval
    // states are publish-lifecycle, owned by P4-11.)
    if (candidate.status !== "review" && candidate.status !== "drafting") {
      throw new Error(`candidate.reject: cannot reject from "${candidate.status}" (terminal-for-revision acts on review/drafting)`);
    }

    return await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.candidateId, { status: "rejected", rejectionReason: reason });
      return {
        actorId: publisherId,
        role: "publisher",
        action: "editorial.candidate.reject",
        target: `contentCandidate:${args.candidateId}`,
        prev: { status: candidate.status },
        next: { status: "rejected" },
        reasonCode: "editorial.rejected",
        justification: reason,
        correlationId: newCorrelationId(),
        reversible: true,
      };
    });
  },
});

/** CAP-054 — schedule. Records the fire-time (draft.scheduledFor — the
 *  status-enum pattern mirrors personaCommentDrafts.scheduledFor) and flips
 *  the status. NO auditLog write — the register row for CAP-054 names none
 *  (Open Questions flag, register-faithful). P4-11 arms the scheduler and
 *  adds the sweeper that also covers candidates scheduled before it
 *  landed. */
export const candidateSchedule = mutation({
  args: { candidateId: v.id("contentCandidates"), fireAt: v.number() },
  handler: async (ctx, args) => {
    await assertPublisher(ctx);

    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) throw new Error("candidate.schedule: not found");
    if (candidate.status !== "approved") {
      throw new Error(`candidate.schedule: status "${candidate.status}" ≠ approved (schedule acts on approved candidates)`);
    }
    const now = Date.now();
    if (args.fireAt <= now) {
      throw new Error("candidate.schedule: fireAt must be in the future");
    }

    await ctx.db.patch(args.candidateId, {
      status: "scheduled",
      draft: { ...(candidate.draft as Record<string, unknown>), scheduledFor: args.fireAt },
    });
    // P4-11 — arm the time-fired publish (the sweeper cron is the
    // missed-fire backstop, incl. rows scheduled before this wiring)
    await ctx.scheduler.runAfter(args.fireAt - now, internal.editorial.publish.publishCandidate, {
      candidateId: args.candidateId,
    });
    return { status: "scheduled", fireAt: args.fireAt };
  },
});

/** CAP-042 — regen. Editor action re-invoking forge.draft on the SAME
 *  cluster (priors retained: each attempt is its own generationRun + the
 *  prior candidates stay in the queue). Exhausted at 3 attempts per
 *  candidate lineage (runs with runType=forge.draft on the cluster).
 *  Bridged via scheduler.runAfter(0, …) — the CAP-543→045 precedent. */
export const REGEN_ATTEMPTS_MAX = 3;

export const candidateRegen = mutation({
  args: { candidateId: v.id("contentCandidates") },
  handler: async (ctx, args) => {
    await assertEditorial(ctx);

    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) throw new Error("candidate.regen: not found");
    if (candidate.status !== "review" && candidate.status !== "drafting") {
      throw new Error(`candidate.regen: cannot regen from "${candidate.status}"`);
    }
    const clusterId = candidate.claimClusterId;
    if (!clusterId) throw new Error("candidate.regen: candidate has no claimClusterId");

    // CAP-042 — attempts counted across the cluster lineage (each forge
    // run's inputRef is the cluster; the candidate entity is the lineage)
    const attempts = await ctx.db
      .query("generationRuns")
      .withIndex("by_runType", (q: any) => q.eq("runType", "forge.draft"))
      .filter((q: any) => q.eq(q.field("inputRef"), clusterId))
      .collect();
    if (attempts.length >= REGEN_ATTEMPTS_MAX) {
      throw new Error(`candidate.regen: exhausted — ${attempts.length}/${REGEN_ATTEMPTS_MAX} GLM attempts on this candidate lineage (CAP-042)`);
    }

    await ctx.scheduler.runAfter(0, internal.forge.draft, { clusterId });
    return { scheduled: true, attemptsUsed: attempts.length + 1, attemptsMax: REGEN_ATTEMPTS_MAX };
  },
});
