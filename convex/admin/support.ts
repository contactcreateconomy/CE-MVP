/**
 * support — SLICE-P7A-07/08: CAP-402/403/020/432 (quota grants) +
 * CAP-404/405/406 (timezone/note/summary; CAP-024 consumed as the
 * write-once rule; CAP-029 the masked-projection constraint).
 *
 * CAP-402 (quoted): "≤5 extra acquires · ≤7d · max 1 active/user · unique
 *   incident; rolling >3/90d → Admin intervention." NO permanent opsExempt.
 * CAP-020 (quoted): "30 / 1h per operator. Staff NOT rate-exempt."
 * CAP-432 (quoted): "quotaGrants >3/90d → Admin intervention" (rendered on
 *   Home, not this screen).
 * CAP-404 = the CANONICAL `support.timezone.fix` (quoted: "canonical
 *   mutation name … CAP-024 is the M1 backend-contract row … two layers,
 *   not duplication") — write-once (CAP-024) with audited correction.
 * R-CALENDAR (quoted): "grievance_india = Asia/Kolkata + India holidays;
 *   DMCA = US business days" — the IANA write + audit only; the holiday
 *   countdown stays F-33 (7-TRUST fence).
 * CAP-405 (quoted): note writes auditLog ONLY (no users note field on the
 *   bible — none invented).
 * CAP-406 (quoted): "Masked PII" — allowlist projection: standing,
 *   timezone, quota-grant summaries, open-case COUNTS, restriction
 *   PRESENCE. NEVER email/mobile/tokenIdentifier/raw case evidence
 *   (CAP-029, quoted). No access-audit on the read (OQ#3 — not silently
 *   added).
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission } from "../lib/authz";
import { writeAudited, newCorrelationId } from "../lib/audit";
import { checkRateLimit } from "../lib/rateLimit";
import { interventionCreateTx } from "./interventions";

async function requireSupportOperator(ctx: any): Promise<Id<"users">> {
  const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
  if (!userId) throw new Error("support: authentication required");
  const roles = await assertAdminPermission(ctx);
  // Narrow support_operator gate — an Administrator WITHOUT support_operator
  // cannot grant (V4: the actor set is register-backed, not a gap)
  if (!roles.includes("supportOperator")) {
    throw new Error("support: support_operator role required");
  }
  return userId;
}

/** CAP-402 quota.grant — ≤5 · ≤7d · max 1 active/user · unique incident. */
export const quotaGrant = mutation({
  args: {
    userId: v.id("users"),
    extraAcquires: v.number(),
    incidentId: v.id("operationalIncidents"),
    reason: v.string(),
  },
  returns: v.object({ grantId: v.id("quotaGrants") }),
  handler: async (ctx, args) => {
    const operatorId = await requireSupportOperator(ctx);
    // CAP-020: 30/1h per operator; staff NOT rate-exempt (quoted)
    await checkRateLimit(ctx, "support.action", { kind: "operator", value: operatorId });
    if (args.extraAcquires < 1 || args.extraAcquires > 5) {
      throw new Error("quota.grant: ≤5 extra acquires (CAP-402)");
    }
    // The incident must exist and be unique per grant (quoted)
    const incident = await ctx.db.get(args.incidentId);
    if (!incident) throw new Error("quota.grant: unknown incidentId");
    const dupIncident = await ctx.db
      .query("quotaGrants")
      .filter((q: any) => q.eq(q.field("incidentId"), args.incidentId))
      .take(5);
    if (dupIncident.length > 0) throw new Error("quota.grant: incident already granted (unique per grant)");
    // max 1 ACTIVE grant per user (quoted)
    const active = await ctx.db
      .query("quotaGrants")
      .withIndex("by_user_neutralizedAt", (q: any) => q.eq("userId", args.userId).eq("neutralizedAt", undefined))
      .take(10)
      .then((rows: any[]) => rows.filter((r) => !r.neutralizedAt && r.expiresAt > Date.now()));
    if (active.length > 0) throw new Error("quota.grant: max 1 active grant per user (CAP-402)");

    let grantId: Id<"quotaGrants"> | undefined;
    await writeAudited(ctx, async (actx) => {
      grantId = (await actx.db.insert("quotaGrants", {
        userId: args.userId,
        extraAcquires: args.extraAcquires,
        expiresAt: Date.now() + 7 * 24 * 3_600_000, // ≤7d (quoted)
        grantedByUserId: operatorId,
        reason: args.reason,
        incidentId: args.incidentId,
        createdAt: Date.now(),
      })) as Id<"quotaGrants">;
      return {
        actorId: operatorId, action: "support.quotaGrant",
        target: `quotaGrant:${grantId}`, prev: null,
        next: { userId: args.userId, extraAcquires: args.extraAcquires, incidentId: args.incidentId },
        reasonCode: args.reason, correlationId: newCorrelationId(), reversible: true,
      };
    });

    // CAP-432 (quoted): rolling >3 grants/90d → Admin intervention (Home)
    const ninetyDaysAgo = Date.now() - 90 * 24 * 3_600_000;
    const userGrants = await ctx.db
      .query("quotaGrants")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .take(20);
    const rolling = userGrants.filter((g: any) => g.createdAt > ninetyDaysAgo);
    if (rolling.length > 3) {
      await interventionCreateTx(ctx, {
        alertKey: `quota_grants_over_3:${args.userId}`,
        severity: "high",
        title: "Member exceeded 3 quota grants / 90 days",
        whatHappening: `Member ${args.userId} now has ${rolling.length} quota grants in the rolling 90-day window.`,
        whatToDo: "Review the grant history — repeated grants may indicate quota policy mismatch or abuse (CAP-432).",
        deepLinkRouteKey: "/admin/support",
      });
    }
    return { grantId: grantId! };
  },
});

/** CAP-403 quota.neutralize — sets neutralizedAt; no member notification
 *  (OQ#6 fenced — not built). */
export const quotaNeutralize = mutation({
  args: { grantId: v.id("quotaGrants") },
  returns: v.object({ neutralized: v.boolean() }),
  handler: async (ctx, args) => {
    const operatorId = await requireSupportOperator(ctx);
    await checkRateLimit(ctx, "support.action", { kind: "operator", value: operatorId });
    const grant = await ctx.db.get(args.grantId);
    if (!grant) throw new Error("quota.neutralize: not found");
    if (grant.neutralizedAt) return { neutralized: true }; // idempotent
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.grantId, { neutralizedAt: Date.now() });
      return {
        actorId: operatorId, action: "support.quotaNeutralize",
        target: `quotaGrant:${args.grantId}`, prev: { active: true },
        next: { neutralizedAt: Date.now() },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { neutralized: true };
  },
});

/** CAP-404 support.timezone.fix — the canonical mutation (never
 *  `timezone.correct`); write-once + audited correction (CAP-024). */
export const timezoneFix = mutation({
  args: { userId: v.id("users"), timezone: v.string(), reason: v.string() },
  returns: v.object({ fixed: v.boolean() }),
  handler: async (ctx, args) => {
    const operatorId = await requireSupportOperator(ctx);
    await checkRateLimit(ctx, "support.action", { kind: "operator", value: operatorId });
    // IANA shape check — no holiday calendar (F-33 fence)
    if (!/^[A-Za-z_]+\/[A-Za-z_+\-0-9]+$/.test(args.timezone)) {
      throw new Error("support.timezone.fix: an IANA zone id is required (e.g. Asia/Kolkata)");
    }
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("support.timezone.fix: user not found");
    const prior = (user as any).timezone ?? null;
    if (prior === args.timezone) return { fixed: true }; // no-op correction
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.userId, { timezone: args.timezone } as any);
      return {
        actorId: operatorId, action: "support.timezone.fix",
        target: `user:${args.userId}`, prev: { timezone: prior },
        next: { timezone: args.timezone },
        reasonCode: args.reason, correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { fixed: true };
  },
});

/** CAP-405 support.note.create — auditLog ONLY (no users note field). */
export const noteCreate = mutation({
  args: { userId: v.id("users"), note: v.string() },
  returns: v.object({ created: v.boolean() }),
  handler: async (ctx, args) => {
    const operatorId = await requireSupportOperator(ctx);
    await checkRateLimit(ctx, "support.action", { kind: "operator", value: operatorId });
    await writeAudited(ctx, async () => ({
      actorId: operatorId, action: "support.note.create",
      target: `user:${args.userId}`, prev: null,
      next: { note: args.note },
      correlationId: newCorrelationId(), reversible: false,
    }));
    return { created: true };
  },
});

/** CAP-406 support.userSummary — masked, allowlisted projection (CAP-029). */
export const userSummary = query({
  args: { userId: v.id("users") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const operatorId = await requireSupportOperator(ctx);
    void operatorId; // no access-audit on the read (OQ#3 — not silently added)
    const user = await ctx.db.get(args.userId);
    if (!user) return { state: "not_found" };

    // Open-case COUNTS (never raw evidence — CAP-029 quoted)
    const cases = await ctx.db
      .query("moderationCases")
      .withIndex("by_target_policyFamily_status", (q: any) =>
        q.eq("targetType", "user").eq("targetId", args.userId))
      .take(50)
      .catch(() => [] as any[]);
    const openCaseCount = cases.filter((c: any) => c.status === "open" || c.status === "triaged").length;

    // Quota-grant summaries (count + bounds, not contents)
    const grants = await ctx.db
      .query("quotaGrants")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .take(20);
    const activeGrants = grants.filter((g: any) => !g.neutralizedAt && g.expiresAt > Date.now()).length;

    // Restriction PRESENCE (never the restriction contents)
    const restrictions = await ctx.db
      .query("capabilityRestrictions")
      .withIndex("by_user_capability", (q: any) => q.eq("userId", args.userId))
      .take(20);
    const restrictedCapabilities = restrictions.filter((r: any) => !r.endsAt || r.endsAt > Date.now()).map((r: any) => r.capabilityKey);

    return {
      state: "ok",
      // The allowlist (OQ#2 fenced): standing, timezone, grant summaries,
      // case counts, restriction presence — NOTHING else
      standing: user.accountStanding ?? "good",
      timezone: (user as any).timezone ?? null,
      quotaGrants: { active: activeGrants, total: grants.length },
      openCaseCount,
      restrictedCapabilities,
      // NEVER in this projection (CAP-029, quoted): email, mobile,
      // tokenIdentifier, raw case evidence
    };
  },
});
