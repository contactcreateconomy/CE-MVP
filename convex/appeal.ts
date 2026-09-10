/**
 * appeal — SLICE-P7T-04: CAP-340 — the MEMBER SUBMIT surface only.
 *
 * (quoted): "one/action; 14d content/30d terminate; max 2k chars; ≤3
 *   evidence refs; no URLs." Contract §1 (quoted): "This route submits
 *   the appeal; it does not decide it" — resolve/SLA are P7E-16.
 * Queue placement: the case flips to `appealed` → CAP-330's
 * "appeals near bound" band (P7E-14's orderKey already reads it).
 * Deadline-expiry is SERVER-rejected (OQ#3 mandatory); UI-disable is
 * additive. Sanction class for 14d/30d (OQ#1) distinguishes via the
 * moderationActions record: a terminate-class action starts the 30d
 * window — read from the existing action union, no new column.
 * No rawEvents (contract §5). Withdraw/amend: no CAP — not built.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { writeAudited, newCorrelationId } from "./lib/audit";

const CONTENT_DEADLINE_DAYS = 14;
const TERMINATE_DEADLINE_DAYS = 30;
const MAX_CHARS = 2000;
const MAX_EVIDENCE = 3;
const TERMINATE_ACTIONS = new Set(["sanction.terminate", "account.terminated"]);

export const submit = mutation({
  args: {
    actionId: v.id("moderationActions"),
    statement: v.string(),
    evidenceRefs: v.array(v.string()),
  },
  returns: v.object({ caseId: v.id("moderationCases"), status: v.string() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("appeal.submit: authentication required");

    const action = await ctx.db.get(args.actionId);
    if (!action) throw new Error("appeal.submit: unknown action");
    // not-owned: only the sanctioned member appeals
    const caseRow = await ctx.db.get(action.caseId);
    if (!caseRow) throw new Error("appeal.submit: case missing");
    // The action's TARGET user is the appellant — moderationActions rows
    // carry the ACTOR; the sanctioned user lives on the case's target
    // record. Ownership = the appellant is the case target's author.
    const target = await resolveCaseTarget(ctx, caseRow);
    if (!target || target !== userId) {
      throw new Error("appeal.submit: only the sanctioned member may appeal this action");
    }
    // already appealed (one per action)
    if (caseRow.status === "appealed") throw new Error("appeal.submit: already appealed");
    // not-appealable: strikes/restrictions inherit the code's appealable flag
    const code = await latestReasonCode(ctx, caseRow.reasonCode);
    if (code && code.appealable === false) throw new Error("appeal.submit: this action is not appealable");
    // statement bounds
    if (args.statement.trim().length === 0) throw new Error("appeal.submit: statement required");
    if (args.statement.length > MAX_CHARS) throw new Error(`appeal.submit: statement exceeds ${MAX_CHARS} chars`);
    // evidence refs: URL-free existing ids only (OQ#4), ≤3
    if (args.evidenceRefs.length > MAX_EVIDENCE) throw new Error(`appeal.submit: max ${MAX_EVIDENCE} evidence refs`);
    for (const ref of args.evidenceRefs) {
      if (/https?:\/\/|www\.|\bcom\b/i.test(ref)) {
        throw new Error("appeal.submit: URLs are not accepted — reference post/comment ids only");
      }
    }
    // deadline: 14d content / 30d terminate (server-reject mandatory)
    const isTerminate = TERMINATE_ACTIONS.has(action.action);
    const deadlineDays = isTerminate ? TERMINATE_DEADLINE_DAYS : CONTENT_DEADLINE_DAYS;
    if (Date.now() - action.createdAt > deadlineDays * 24 * 3_600_000) {
      throw new Error(`appeal.submit: the ${deadlineDays}-day appeal window has closed`);
    }

    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(action.caseId, { status: "appealed" });
      await actx.db.insert("moderationActions", {
        caseId: action.caseId,
        targetType: action.targetType,
        targetId: action.targetId,
        actorUserId: userId,
        actorRole: "member_appeal",
        action: "appeal.submitted",
        reasonCode: caseRow.reasonCode,
        policyVersion: caseRow.policyVersion,
        reversible: true,
        beforeState: caseRow.status,
        afterState: "appealed",
        idempotencyKey: `appeal:${args.actionId}`,
        appealDeadlineAt: action.createdAt + deadlineDays * 24 * 3_600_000,
        createdAt: Date.now(),
      });
      return {
        actorId: userId, action: "appeal.submit",
        target: `moderationAction:${args.actionId}`,
        prev: { status: caseRow.status }, next: { status: "appealed" },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { caseId: action.caseId, status: "appealed" };
  },
});

/** The appealable-action read for the member's route. */
export const myActions = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return { actions: [] };
    const rows = await ctx.db
      .query("moderationActions")
      .withIndex("by_actor_reasonCode", (q: any) => q.eq("actorUserId", userId))
      .take(50);
    const sanctionClass = rows.filter(
      (r: any) => r.actorRole !== "member_appeal" && String(r.action).startsWith("sanction"),
    );
    const out = [];
    for (const r of sanctionClass) {
      const caseRow = await ctx.db.get(r.caseId);
      const isTerminate = TERMINATE_ACTIONS.has(r.action);
      const deadlineDays = isTerminate ? TERMINATE_DEADLINE_DAYS : CONTENT_DEADLINE_DAYS;
      const deadlineAt = r.createdAt + deadlineDays * 24 * 3_600_000;
      out.push({
        actionId: r._id,
        action: r.action,
        caseStatus: caseRow?.status ?? "unknown",
        createdAt: r.createdAt,
        deadlineAt,
        windowOpen: Date.now() <= deadlineAt && caseRow?.status !== "appealed",
      });
    }
    return { actions: out };
  },
});

async function resolveCaseTarget(ctx: any, caseRow: any): Promise<Id<"users"> | null> {
  // The sanctioned user: derived from the case's target record author
  // (comment/post author) or, for user-targeted cases, the target id.
  if (caseRow.targetType === "user") return caseRow.targetId as Id<"users">;
  if (caseRow.targetType === "comment") {
    const c = await ctx.db.get(caseRow.targetId);
    return (c?.authorUserId as Id<"users">) ?? null;
  }
  if (caseRow.targetType === "post") {
    const p = await ctx.db.get(caseRow.targetId);
    return (p?.authorUserId as Id<"users">) ?? null;
  }
  return null;
}

async function latestReasonCode(ctx: any, code: string): Promise<any | null> {
  const rows = await ctx.db
    .query("policyReasonCodes")
    .withIndex("by_code_version", (q: any) => q.eq("code", code))
    .take(50);
  if (rows.length === 0) return null;
  return rows.reduce((a: any, b: any) => (b.version > a.version ? b : a));
}
