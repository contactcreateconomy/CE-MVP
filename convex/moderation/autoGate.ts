/**
 * autoGate — SLICE-P7E-11: CAP-321/322/323 + CAP-102 — the NAMED M13
 * auto-gate wired onto post/comment submit.
 *
 * CAP-321 (quoted): "deterministic checks → pass/hold/hard reject
 *   (URL/dup)." CAP-322 (quoted): the optional classifier "cannot
 *   sanction (INV-4)" — classifier outcomes only pass/hold here, never
 *   strike/restrict. CAP-323 (quoted): "never fail-open; aged release
 *   never applies (C1)" — classifier-unavailable holds carry
 *   autoReleaseEligible=false.
 * CAP-102 (quoted): "Repeated attempts → route to moderation queue
 *   (held)" — URL-OBFUSCATION attempts (R-URL's plain-URL block lives in
 *   posts/comments; this gate catches the obfuscated forms) count per
 *   actor; a repeat holds the content + opens a case.
 * Not a replacement (quoted from the catalog): P4-02 R-URL and P5-02
 *   CAP-154 stay; this is the M13 case-visibility layer they lacked as a
 *   named CAP. Double-hold is structurally impossible: the l.239 dedupe
 *   (one OPEN case per target+policyFamily+window) gates every case open.
 */

import type { Id } from "../_generated/dataModel";

export type GateDecision = "pass" | "hold" | "hard_reject";

/** Obfuscated-URL patterns (CAP-102's class — the plain URL check is
 *  R-URL in posts.ts/comments.ts; these are the evasion forms). */
const OBFUSCATION_PATTERNS: RegExp[] = [
  /\bh[tx]{2}ps?:\/\//i, // hxxp:// htps://
  /\b[\w-]+\s*(?:\[|\()\s*\.\s*(?:\]|\))\s*(?:com|net|org|io|ai|co|dev|app)\b/i, // example[.]com
  /\b[\w.-]+\s+dot\s+(?:com|net|org|io|ai|co|dev|app)\b/i, // example dot com
  /\u200b|\u200d|\ufeff/, // zero-width invisibles
];

export function detectObfuscation(body: string): boolean {
  return OBFUSCATION_PATTERNS.some((re) => re.test(body));
}

/** The one-open-case dedupe (bible l.239, quoted: "Many → one open case
 *  per target+policyFamily+window; volume ≠ guilt"). */
export async function findOpenCase(ctx: any, targetType: string, targetId: string, policyFamily: string): Promise<any | null> {
  return ctx.db
    .query("moderationCases")
    .withIndex("by_target_policyFamily_status", (q: any) =>
      q.eq("targetType", targetType).eq("targetId", targetId).eq("policyFamily", policyFamily).eq("status", "open"))
    .unique();
}

/** Open a case through the dedupe (returns the existing open case when
 *  one exists — never a second row). */
export async function openCaseDeduped(ctx: any, input: {
  targetType: string;
  targetId: string;
  policyFamily: string;
  caseType: string;
  severity: "s0_critical" | "s1_high" | "s2_medium" | "s3_low";
  reasonCode: string;
  autoReleaseEligible?: boolean;
}): Promise<Id<"moderationCases">> {
  const existing = await findOpenCase(ctx, input.targetType, input.targetId, input.policyFamily);
  if (existing) return existing._id;
  return (await ctx.db.insert("moderationCases", {
    caseType: input.caseType as any,
    targetType: input.targetType,
    targetId: input.targetId,
    policyFamily: input.policyFamily as any,
    severity: input.severity,
    priority: { s0_critical: 0, s1_high: 1, s2_medium: 2, s3_low: 3 }[input.severity],
    status: "open",
    reasonCode: input.reasonCode,
    policyVersion: "m13.v1",
    autoReleaseEligible: input.autoReleaseEligible ?? false,
    reporterCountDistinct: 0,
    reporterClusterCount: 0,
    agingLevel: 0,
    createdAt: Date.now(),
  })) as Id<"moderationCases">;
}

/** CAP-102 — count the actor's prior obfuscation actions (the repeat
 *  detector; moderationActions.by_actor index). */
export async function priorObfuscations(ctx: any, userId: Id<"users">): Promise<number> {
  const rows = await ctx.db
    .query("moderationActions")
    .withIndex("by_actor_reasonCode", (q: any) => q.eq("actorUserId", userId).eq("reasonCode", "url_obfuscation"))
    .take(20);
  return rows.length;
}

/** The gate body. Deterministic only — no classifier call inside (the
 *  classifier seam stays at the call-sites' existing P5-02 stack). */
export async function autoGateTx(
  ctx: any,
  input: { kind: "post" | "comment"; userId: Id<"users">; targetId: string; body: string },
): Promise<{ decision: GateDecision; reasonCode?: string; caseId?: Id<"moderationCases"> }> {
  // 1. URL obfuscation (CAP-102): first hit = hold + case; repeats harden
  const obfuscated = detectObfuscation(input.body);
  if (obfuscated) {
    const priors = await priorObfuscations(ctx, input.userId);
    const caseId = await openCaseDeduped(ctx, {
      targetType: input.kind,
      targetId: input.targetId,
      policyFamily: "spam_manipulation",
      caseType: "spam_manipulation",
      severity: priors >= 1 ? "s1_high" : "s2_medium",
      reasonCode: "url_obfuscation",
    });
    await ctx.db.insert("moderationActions", {
      caseId,
      targetType: input.kind,
      targetId: input.targetId,
      actorUserId: input.userId,
      actorRole: "system_auto_gate",
      action: priors >= 1 ? "auto_gate_hard_reject" : "auto_gate_hold",
      reasonCode: "url_obfuscation",
      policyVersion: "m13.v1",
      reversible: true,
      beforeState: "submitted",
      afterState: priors >= 1 ? "hard_rejected" : "held",
      idempotencyKey: `autogate:${input.targetId}`,
      createdAt: Date.now(),
    });
    // CAP-102 (quoted): repeated → held in the moderation queue
    return { decision: priors >= 1 ? "hard_reject" : "hold", reasonCode: "url_obfuscation", caseId };
  }

  // 2. Velocity (CAP-321's velocity class): ≥3 auto-holds on this actor
  //    in 24h → the next submit holds with velocity_burst (no sanction —
  //    CAP-322: the gate cannot sanction, only hold/reject)
  const dayAgo = Date.now() - 24 * 3_600_000;
  const recentHolds = await ctx.db
    .query("moderationActions")
    .withIndex("by_actor_reasonCode", (q: any) => q.eq("actorUserId", input.userId))
    .take(50);
  const holds = recentHolds.filter(
    (a: any) => a.createdAt > dayAgo && String(a.action).startsWith("auto_gate_") && a.afterState === "held",
  );
  if (holds.length >= 3) {
    const caseId = await openCaseDeduped(ctx, {
      targetType: input.kind,
      targetId: input.targetId,
      policyFamily: "spam_manipulation",
      caseType: "spam_manipulation",
      severity: "s2_medium",
      reasonCode: "velocity_burst",
    });
    await ctx.db.insert("moderationActions", {
      caseId,
      targetType: input.kind,
      targetId: input.targetId,
      actorUserId: input.userId,
      actorRole: "system_auto_gate",
      action: "auto_gate_hold",
      reasonCode: "velocity_burst",
      policyVersion: "m13.v1",
      reversible: true,
      beforeState: "submitted",
      afterState: "held",
      idempotencyKey: `autogate:${input.targetId}`,
      createdAt: Date.now(),
    });
    return { decision: "hold", reasonCode: "velocity_burst", caseId };
  }

  return { decision: "pass" };
}
