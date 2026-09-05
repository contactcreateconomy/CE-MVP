/**
 * editorial review — SLICE-P4-09: the review workspace's backend —
 * CAP-041 (candidate.review) + CAP-542 (per-claim confirm/reject) +
 * CAP-543 (manual draft edit with the FULL reset rule).
 *
 * THE ENTAILMENT LOOP IS THE INTEGRITY SPINE (FATAL-adjacent per the
 * slice catalog): 543 (edit) → 045 (re-qualify) → 542 (re-confirm) →
 * 043 (approve gate). Acceptance criteria are direct quotes; any
 * relaxation (e.g. partial reset) is a blocker.
 *
 * CAP-043 gate (quoted): "Must not be possible while any `draftClaimRef`
 *   on the candidate has `operatorConfirmed=false` or unset
 *   (server-enforced; UI disable is not sufficient)." — `canApprove` is
 *   that invariant as a pure function; the approve mutation itself is
 *   SLICE-P4-10 and MUST consume it.
 * CAP-542 (quoted via register): per-claim confirm/reject; "CAP-043 must
 *   not fire while any draftClaimRef … has operatorConfirmed=false/unset."
 *   Writes draftClaimRefs only — register names no auditLog (register-
 *   faithful, CAP-054 discipline).
 * CAP-543 (quoted): manual text edit on contentCandidates.draft, DISTINCT
 *   from CAP-042 regen (no GLM call, no generationRuns row); commit
 *   triggers CAP-045's re-qualify; "resets ALL draftClaimRefs.
 *   operatorConfirmed on this candidate to false … Prior confirmations do
 *   not survive the edit." Full reset, never surgical.
 *   CAP-045 (quoted): "Re-calls M3 qualify after any material edit" — via
 *   scheduler.runAfter(0, …) (only CAP-040 says "synchronously"; a
 *   mutation cannot runAction — flagged reading).
 *
 * Editor attempting Publisher actions: not this module's mutations (they
 * are P4-10); the role gate here admits editorial roles for review-side
 * actions only (Wave-4 minimal gate; M15 shell wraps at Wave 7).
 */

import { mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission } from "../lib/authz";
import { REGEN_ATTEMPTS_MAX } from "./decisions";

/** Editorial roles for review-side actions (CAP-041/542/543 Actor=Editor;
 *  Publisher/Administrator are senior per the role split). Exported for
 *  decisions.ts (P4-10) — one gate, not a fork. */
export async function assertEditorial(ctx: any): Promise<Id<"users">> {
  const roles = await assertAdminPermission(ctx);
  const ok = roles.some((r) => r === "editor" || r === "publisher" || r === "administrator");
  if (!ok) throw new Error("editorial: Editor role required (CAP-041/542/543)");
  const userId = (await getAuthUserId(ctx)) as Id<"users">;
  if (!userId) throw new Error("editorial: authentication required");
  return userId;
}

/**
 * CAP-043's gate as a pure function (unit-tested; P4-10's approve MUST
 * call this server-side — UI disable is not sufficient). An unset ref is
 * represented by absence from the confirmed set; false and unset both
 * block.
 */
export function canApprove(refs: { operatorConfirmed: boolean }[]): boolean {
  return refs.length > 0 && refs.every((r) => r.operatorConfirmed === true);
}

/**
 * CAP-543's reset as a pure function — the full-reset rule (any relaxation
 * is a blocker): every ref flips to false, regardless of what it was.
 */
export function resetAllConfirmations<T extends { operatorConfirmed: boolean }>(refs: T[]): (T & { operatorConfirmed: boolean })[] {
  return refs.map((r) => ({ ...r, operatorConfirmed: false }));
}

/** CAP-041 — candidate.review: the workspace's render read (Writes none).
 *  Editorially role-gated: review drafts/claims are not public reads. */
export const candidateReview = query({
  args: { candidateId: v.string() },
  handler: async (ctx, { candidateId }) => {
    await assertEditorial(ctx);
    const candidate = await ctx.db.get(candidateId as Id<"contentCandidates">);
    if (!candidate) return null;

    const claimRefs = await ctx.db
      .query("draftClaimRefs")
      .withIndex("by_candidate", (q: any) => q.eq("contentCandidateId", candidateId))
      .collect();

    // live rule results from the LATEST run (replay stream is CAP-085's)
    const runs = await ctx.db
      .query("qualificationRuns")
      .withIndex("by_candidate", (q: any) => q.eq("contentCandidateId", candidateId))
      .collect();
    const latestRun = runs.sort((a: any, b: any) => b.startedAt - a.startedAt)[0] ?? null;
    const ruleResults = latestRun
      ? (await ctx.db
          .query("qualificationRuleResults")
          .withIndex("by_run", (q: any) => q.eq("qualificationRunId", latestRun._id))
          .collect()).filter((r: any) => r.source === "live")
      : [];

    const similarityChecks = await ctx.db
      .query("similarityChecks")
      .withIndex("by_candidate", (q: any) => q.eq("contentCandidateId", candidateId))
      .collect();

    const candidateSources = await ctx.db
      .query("contentCandidateSources")
      .withIndex("by_candidate", (q: any) => q.eq("contentCandidateId", candidateId))
      .collect();

    // cited claims for the evidence pane
    const claimsByRef: Record<string, { claimText: string; evidenceText: string; claimType: string; confidence: number }[]> = {};
    for (const ref of claimRefs) {
      claimsByRef[ref._id] = [];
      for (const claimId of ref.sourceClaimIds) {
        const claim = await ctx.db.get(claimId);
        if (claim) {
          claimsByRef[ref._id].push({
            claimText: claim.claimText,
            evidenceText: claim.evidenceText,
            claimType: claim.claimType,
            confidence: claim.confidence,
          });
        }
      }
    }

    // CAP-042 regen affordance state (States C): attempts used on this
    // candidate's cluster lineage, exhausted at REGEN_ATTEMPTS_MAX.
    const regenAttemptsUsed = candidate.claimClusterId
      ? (await ctx.db
          .query("generationRuns")
          .withIndex("by_runType", (q: any) => q.eq("runType", "forge.draft"))
          .filter((q: any) => q.eq(q.field("inputRef"), candidate.claimClusterId))
          .collect()).length
      : 0;

    // P4-11 — publish-gate alert (OQ5) + social derivatives for published
    // candidates (export-only per DEC-O07)
    const draftAny = candidate.draft as any;
    const derivatives = draftAny?.publishedPostId
      ? await ctx.db
          .query("postSocialDerivatives")
          .withIndex("by_postId", (q: any) => q.eq("postId", draftAny.publishedPostId))
          .collect()
      : [];

    return {
      candidate,
      claimRefs: claimRefs.map((r: any) => ({
        _id: r._id,
        assertionText: r.assertionText,
        sourceClaimIds: r.sourceClaimIds,
        exactValidation: r.exactValidation ?? {},
        operatorConfirmed: r.operatorConfirmed,
        claims: claimsByRef[r._id] ?? [],
      })),
      latestRun,
      ruleResults,
      similarityChecks,
      candidateSources,
      approveGate: canApprove(claimRefs), // CAP-043 invariant surfaced for the UI's disabled affordance
      regen: { attemptsUsed: regenAttemptsUsed, attemptsMax: REGEN_ATTEMPTS_MAX, exhausted: regenAttemptsUsed >= REGEN_ATTEMPTS_MAX },
      publishGateFailure: draftAny?.lastPublishFailure ?? null,
      derivatives,
    };
  },
});

/** CAP-542 — per-claim entailment confirm/reject (register-unnamed → named
 *  `confirmClaimRef` in-slice, flagged). Writes draftClaimRefs only. */
export const confirmClaimRef = mutation({
  args: {
    refId: v.id("draftClaimRefs"),
    operatorConfirmed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const editorId = await assertEditorial(ctx);
    const ref = await ctx.db.get(args.refId);
    if (!ref) throw new Error("confirmClaimRef: draftClaimRef not found");

    // register-faithful: CAP-542's Writes name draftClaimRefs only — no auditLog
    await ctx.db.patch(args.refId, { operatorConfirmed: args.operatorConfirmed });
    void editorId;
    return { refId: args.refId, operatorConfirmed: args.operatorConfirmed };
  },
});

/** Refs loader for the reset (full-reset rule; exported for P4-10's
 *  approve gate to consume the same read). */
export const loadCandidateRefs = query({
  args: { candidateId: v.string() },
  handler: async (ctx, { candidateId }) => {
    await assertEditorial(ctx);
    return await ctx.db
      .query("draftClaimRefs")
      .withIndex("by_candidate", (q: any) => q.eq("contentCandidateId", candidateId))
      .collect();
  },
});

/**
 * CAP-543 — manual draft edit (register-unnamed → named `editDraft`
 * in-slice, flagged). One transaction: patch draft (bumped revision) +
 * reset ALL operatorConfirmed to false. CAP-045's re-qualify is scheduled
 * at zero delay (mutation → action bridge; "synchronously" is CAP-040's
 * word, not CAP-045's — flagged reading). NO auditLog write: CAP-543's
 * Writes column names contentCandidates + draftClaimRefs only, and the
 * contract §2 audit list (043/044/049/050/053/055) does not include 542 or
 * 543 — register-faithful, CAP-054 discipline.
 */
export const editDraft = mutation({
  args: {
    candidateId: v.id("contentCandidates"),
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const editorId = await assertEditorial(ctx);
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) throw new Error("editDraft: candidate not found");
    if (candidate.status !== "review") {
      throw new Error(`editDraft: candidate status ${candidate.status} ≠ review`);
    }
    if (!args.body.trim()) throw new Error("editDraft: body required");

    const refs = await ctx.db
      .query("draftClaimRefs")
      .withIndex("by_candidate", (q: any) => q.eq("contentCandidateId", args.candidateId))
      .collect();
    const nextRevision = Math.max(0, ...refs.map((r: any) => r.candidateRevision ?? 1)) + 1;

    // FULL RESET (CAP-543, quoted): prior confirmations do not survive the edit
    for (const ref of refs) {
      await ctx.db.patch(ref._id, { operatorConfirmed: false, candidateRevision: nextRevision });
    }
    await ctx.db.patch(args.candidateId, {
      draft: { ...(candidate.draft as object), title: args.title, body: args.body, candidateRevision: nextRevision },
    });

    // CAP-045: re-qualify after the material edit (scheduled — see header)
    await ctx.scheduler.runAfter(0, internal.qualify.orchestrator.run, {
      contentCandidateId: args.candidateId,
      candidateRevision: nextRevision,
    });

    void editorId;
    return { candidateId: args.candidateId, candidateRevision: nextRevision, resetRefs: refs.length };
  },
});

/** Queue read for the workspace list (status tabs + createdAt default —
 *  contract OQ#8's defaulted ordering). */
export const queueList = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, { status }) => {
    await assertEditorial(ctx);
    const rows = await ctx.db.query("contentCandidates").collect();
    return rows
      .filter((c: any) => !status || c.status === status)
      .sort((a: any, b: any) => b.createdAt - a.createdAt)
      .map((c: any) => ({
        _id: c._id,
        status: c.status,
        postType: c.postType,
        title: (c.draft as any)?.title ?? "(untitled)",
        overallResult: (c.evaluation as any)?.overallResult ?? null,
        createdAt: c.createdAt,
        // OQ5 outcome: publish-gate failures keep the candidate scheduled +
        // surface here (chosen + documented in publish.ts)
        publishGateFailure: (c.draft as any)?.lastPublishFailure ?? null,
      }));
  },
});
