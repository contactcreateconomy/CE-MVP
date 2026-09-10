/**
 * report — SLICE-P7E-12: CAP-324/325.
 *
 * CAP-324 (quoted): "many reports → one open case per target+policyFamily
 *   +window" (the l.239 dedupe; volume ≠ guilt). Target = the COMMENT
 *   (H6 — settled, not re-litigated).
 * CAP-325 (quoted): "verified 10/24h, 30/7d; critical ≤5/hr mechanical."
 *   The `report` set (CAP-021 literals) enforces 10/d + 30/w; the
 *   critical ≤5/hr limit rides this module's rate set addition.
 * Inventory "ENTITY UNCLEAR must not propagate" (contract §1, quoted):
 *   the intake takes a policyFamily from the bible enum ONLY — the
 *   reporter never picks a free-form entity.
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertCustomerCapability } from "../lib/authz";
import { checkRateLimit } from "../lib/rateLimit";
import { openCaseDeduped, findOpenCase } from "./autoGate";

export const REPORT_POLICY_FAMILIES = [
  "spam", "harassment_abuse", "misinformation",
  "copyright_ip", "legal_other", "quality_guidelines", "safety_illegal",
] as const;

const REASON_BY_FAMILY: Record<string, string> = {
  spam: "report_spam",
  harassment_abuse: "report_harassment",
  misinformation: "report_misinformation",
  copyright_ip: "report_copyright",
  legal_other: "merchant_complaint",
  quality_guidelines: "report_off_topic",
  safety_illegal: "report_illegal",
};

/** CAP-324 report.submit — comment target; deduped case attach. */
export const submit = mutation({
  args: {
    commentId: v.id("comments"),
    policyFamily: v.union(
      v.literal("spam"), v.literal("harassment_abuse"), v.literal("misinformation"),
      v.literal("copyright_ip"), v.literal("legal_other"),
      v.literal("quality_guidelines"), v.literal("safety_illegal"),
    ),
  },
  returns: v.object({ caseId: v.id("moderationCases"), alreadyReported: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("report.submit: authentication required");
    // R-GATE — the `report` capability key (member, verified)
    await assertCustomerCapability(ctx, "report");
    // CAP-325: verified 10/24h + 30/7d (CAP-021 set) …
    await checkRateLimit(ctx, "report", { kind: "user", value: userId });
    // … and critical-class ≤5/hr (safety_illegal never floods the queue)
    if (args.policyFamily === "safety_illegal") {
      await checkRateLimit(ctx, "report.critical", { kind: "user", value: userId });
    }

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("report.submit: comment not found");

    const reasonCode = REASON_BY_FAMILY[args.policyFamily];
    const dedupeKey = `${args.commentId}:${args.policyFamily}:${userId}`;

    // One open case per target+policyFamily+window (l.239 + CAP-324) —
    // severity by family; safety_illegal = s0 fastest SLA (quoted)
    const severity =
      args.policyFamily === "safety_illegal" ? "s0_critical"
      : args.policyFamily === "harassment_abuse" || args.policyFamily === "copyright_ip" ? "s1_high"
      : args.policyFamily === "quality_guidelines" ? "s3_low"
      : "s2_medium";

    let caseRow = await findOpenCase(ctx, "comment", args.commentId, args.policyFamily);
    const alreadyReported = Boolean(caseRow);
    if (!caseRow) {
      const caseId = await openCaseDeduped(ctx, {
        targetType: "comment",
        targetId: args.commentId,
        policyFamily: args.policyFamily,
        caseType: args.policyFamily === "copyright_ip" ? "dmca" : "ugc_conduct",
        severity,
        reasonCode,
      });
      caseRow = { _id: caseId };
      // The reporter count is DISTINCT members, not report volume
      await ctx.db.patch(caseId, { reporterCountDistinct: 1, reporterClusterCount: 1 });
    }

    // The immutable intake row (bible l.240)
    await ctx.db.insert("reports", {
      targetType: "comment",
      targetId: args.commentId,
      reporterId: userId,
      reasonCode,
      reporterTrustAtTime: comment.moderationStatus === "passed" ? "member" : "unknown",
      dedupeKey,
      caseId: caseRow._id,
      severityHint: severity,
      status: "open",
      createdAt: Date.now(),
    });
    return { caseId: caseRow._id, alreadyReported };
  },
});
