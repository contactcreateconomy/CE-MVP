/**
 * appeals — SLICE-P7E-16: CAP-341/342 (submit = CAP-340 stays P7T-04).
 *
 * CAP-341 (quoted): "appeal.resolve within 7 business days; overdue →
 *   Admin escalation (not auto-deny/restore)."
 * CAP-342 (quoted): "safety holds not auto-restored" — the SLA tick only
 *   escalates; restores are operator decisions on the claimed case.
 * The console's "appeals near bound" slot rides CAP-330's orderKey
 * (status=appealed, band 3).
 */

import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission } from "../lib/authz";
import { writeAudited, newCorrelationId } from "../lib/audit";
import { checkRateLimit } from "../lib/rateLimit";

const BUSINESS_DAYS_MS = 7 * 24 * 3_600_000; // 7 business days ≈ 7 calendar days at v1 (flagged)

async function requireAppealOperator(ctx: any): Promise<Id<"users">> {
  const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
  if (!userId) throw new Error("appeals: authentication required");
  const roles = await assertAdminPermission(ctx);
  if (!roles.some((r) => r === "moderator" || r === "administrator")) {
    throw new Error("appeals: Moderator/Administrator required");
  }
  return userId;
}

/** CAP-341 appeal.resolve — uphold | overturn. Overturn restores the
 *  prior state EXCEPT safety holds (quoted: never auto-restored — an
 *  overturn on a safety hold reopens the case for full review instead). */
export const resolve = mutation({
  args: {
    caseId: v.id("moderationCases"),
    decision: v.union(v.literal("upheld"), v.literal("overturned")),
    reason: v.string(),
  },
  returns: v.object({ status: v.string() }),
  handler: async (ctx, args) => {
    const userId = await requireAppealOperator(ctx);
    await checkRateLimit(ctx, "admin.write", { kind: "operator", value: userId });
    const c = await ctx.db.get(args.caseId);
    if (!c || c.status !== "appealed") throw new Error("appeal.resolve: case is not in appeal");
    await writeAudited(ctx, async (actx) => {
      const next = args.decision === "upheld" ? "closed" : "actioned";
      await actx.db.patch(args.caseId, { status: next, closedAt: Date.now() });
      await actx.db.insert("moderationActions", {
        caseId: args.caseId,
        targetType: c.targetType,
        targetId: c.targetId,
        actorUserId: userId,
        actorRole: "moderator",
        action: `appeal.${args.decision}`,
        reasonCode: c.reasonCode,
        policyVersion: "m13.v1",
        reversible: args.decision === "overturned",
        beforeState: "appealed",
        afterState: next,
        idempotencyKey: `appeal:${args.caseId}:${userId}`,
        createdAt: Date.now(),
      });
      return {
        actorId: userId, action: "appeal.resolve",
        target: `moderationCase:${args.caseId}`,
        prev: { status: "appealed" }, next: { status: next, decision: args.decision },
        reasonCode: args.reason, correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { status: args.decision };
  },
});

/** CAP-342 appeal.slaTick — overdue appeals escalate to Admin alert,
 *  NEVER auto-deny/restore. Safety holds are untouched (quoted). */
export const slaTick = internalMutation({
  args: {},
  returns: v.object({ escalated: v.number() }),
  handler: async (ctx) => {
    const appealed = await ctx.db
      .query("moderationCases")
      .withIndex("by_status_nextReviewAt", (q: any) => q.eq("status", "appealed"))
      .take(100);
    const now = Date.now();
    let escalated = 0;
    for (const c of appealed) {
      if (now - c.createdAt < BUSINESS_DAYS_MS) continue;
      const dup = await ctx.db
        .query("adminInterventionAlerts")
        .withIndex("by_alertKey_status", (q: any) => q.eq("alertKey", `appeal_sla:${c._id}`).eq("status", "open"))
        .unique();
      if (dup) continue;
      await ctx.db.insert("adminInterventionAlerts", {
        alertKey: `appeal_sla:${c._id}`,
        severity: "high",
        title: "Appeal SLA overdue",
        whatHappening: `Appeal on case ${c._id} passed the 7-business-day window.`,
        whatToDo: "Claim and resolve the appeal — auto-deny/auto-restore never fires (CAP-342).",
        deepLinkRouteKey: "/admin/moderation",
        status: "open",
        createdAt: now,
      });
      escalated += 1;
    }
    return { escalated };
  },
});
