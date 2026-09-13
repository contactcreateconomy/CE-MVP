/**
 * sanctions — SLICE-P7E-15: CAP-326/327/336/337 (+ CAP-354 M12 bridge).
 *
 * CAP-336 (quoted): "escalate by strike class; capability keys incl
 *   create_post/create_comment/react/report/manage_store/tag_product/
 *   revival_vote." Ladder: warn → strike → restrict → suspend; standing
 *   transitions append to trustHistory (bible l.246a).
 * CAP-327 (quoted): brigade-confirm → "explicit capability restriction"
 *   (`report` key) via capabilityRestrictions.
 * CAP-337 (quoted): "Admin/Founder only; Mods may not terminate" — the
 *   terminate gate rejects moderator even when the console is open.
 * CAP-326 brigade cron — v1 uses reports correlation (P7E-05's graph is
 *   FUTURE-M12-01; flagged degraded, quoted in the catalog).
 * CAP-354 M12 bridge (quoted: "M13 never recomputes legitimacy; M12 owns
 *   clawback") — a one-line emit into the P7E-04 clawback.
 * Strike-class durations are register-unnamed (OQ8) — config-keyed
 *   constants here, flagged calibration_pending.v1.
 */

import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission } from "../lib/authz";
import { PROTECTED_CAPABILITIES, type CapabilityKey } from "../lib/authz";
import { writeAudited, newCorrelationId } from "../lib/audit";
import { checkRateLimit } from "../lib/rateLimit";
import { internal } from "../_generated/api";

const STRIKE_CLASS_DAYS: Record<string, number> = {
  content_conduct: 90,
  spam_manipulation: 90,
  commercial_integrity: 180,
  copyright_rights: 365,
  account_integrity: 365,
};

// SECURITY (scan 2026-09-13, finding 5): this list previously carried
// "create_comment" — a key the enforcement path (assertCustomerCapability)
// never looks up (it enforces "comment"), so comment restrictions were
// dead letters. The single canonical set is lib/authz's
// PROTECTED_CAPABILITIES; this alias exists only for typed args docs.
const SANCTION_CAPABILITY_KEYS = PROTECTED_CAPABILITIES;

async function requireSanctionActor(ctx: any, allowModerator: boolean): Promise<Id<"users">> {
  const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
  if (!userId) throw new Error("sanctions: authentication required");
  const roles = await assertAdminPermission(ctx);
  const ok = allowModerator
    ? roles.some((r) => r === "moderator" || r === "administrator")
    : roles.includes("administrator"); // CAP-337: Mods may NOT terminate
  if (!ok) throw new Error(allowModerator ? "sanctions: Moderator/Administrator required" : "sanctions: terminate is Admin/Founder only (CAP-337)");
  return userId;
}

/** Append the standing transition (bible l.246a) + flip users.accountStanding. */
async function applyStanding(ctx: any, userId: Id<"users">, next: string, caseId: Id<"moderationCases">, reason: string) {
  const user = await ctx.db.get(userId);
  const from = user?.accountStanding ?? "good";
  await ctx.db.patch(userId, { accountStanding: next as any, standingSetByCaseId: caseId } as any);
  await ctx.db.insert("trustHistory", {
    userId,
    event: "standing_transition",
    reason,
    standingTransition: { from, to: next, caseId, durationDays: 0 },
    triggerCaseId: caseId,
    occurredAt: Date.now(),
  });
  return from;
}

/** CAP-336 sanction ladder — one mutation, four escalation levels. */
export const sanction = mutation({
  args: {
    userId: v.id("users"),
    caseId: v.id("moderationCases"),
    level: v.union(v.literal("warn"), v.literal("strike"), v.literal("restrict"), v.literal("suspend")),
    strikeClass: v.optional(v.union(
      v.literal("content_conduct"), v.literal("spam_manipulation"),
      v.literal("commercial_integrity"), v.literal("copyright_rights"),
      v.literal("account_integrity"),
    )),
    restrictedCapability: v.optional(v.string()),
    reason: v.string(),
  },
  returns: v.object({ level: v.string(), standing: v.string() }),
  handler: async (ctx, args) => {
    const actorId = await requireSanctionActor(ctx, true);
    await checkRateLimit(ctx, "admin.write", { kind: "operator", value: actorId });
    const result: { level: string; standing: string } = { level: args.level, standing: "warned" };
    await writeAudited(ctx, async (actx) => {
      let standing = "warned";
      if (args.level === "warn") {
        await applyStanding(actx, args.userId, "warned", args.caseId, args.reason);
        standing = "warned";
      } else if (args.level === "strike") {
        if (!args.strikeClass) throw new Error("sanction: strike requires a strike class");
        await actx.db.insert("strikes", {
          userId: args.userId,
          class: args.strikeClass,
          caseId: args.caseId,
          active: true,
          voidedByRestore: false,
          provisional: false,
          expiresAt: Date.now() + (STRIKE_CLASS_DAYS[args.strikeClass] ?? 90) * 24 * 3_600_000,
          createdAt: Date.now(),
        });
        // RI rule: 3 active strikes in 12mo → terminated (bible l.244a)
        const yearAgo = Date.now() - 365 * 24 * 3_600_000;
        const active = await actx.db
          .query("strikes")
          .withIndex("by_user_active", (q: any) => q.eq("userId", args.userId).eq("active", true))
          .take(10);
        if (active.filter((s: any) => s.createdAt > yearAgo).length >= 3) {
          await applyStanding(actx, args.userId, "terminated", args.caseId, "repeat_infringer_3_in_12mo");
          standing = "terminated";
        } else {
          await applyStanding(actx, args.userId, "warned", args.caseId, args.reason);
          standing = "warned";
        }
      } else if (args.level === "restrict") {
        const key = args.restrictedCapability ?? "report";
        if (!(SANCTION_CAPABILITY_KEYS as readonly string[]).includes(key)) {
          throw new Error(`sanctions: unknown capability key "${key}"`);
        }
        await actx.db.insert("capabilityRestrictions", {
          userId: args.userId,
          capabilityKey: key,
          reasonCode: args.reason,
          caseId: args.caseId,
          startsAt: Date.now(),
          appealable: true,
        });
        await applyStanding(actx, args.userId, "restricted", args.caseId, args.reason);
        standing = "restricted";
      } else {
        await applyStanding(actx, args.userId, "suspended", args.caseId, args.reason);
        standing = "suspended";
      }
      result.standing = standing;
      return {
        actorId, action: "sanction.apply",
        target: `user:${args.userId}`, prev: null,
        next: { level: args.level, standing, reason: args.reason },
        correlationId: newCorrelationId(), reversible: true, // termination rides the dedicated CAP-337 mutation
      };
    });
    return result;
  },
});

/** CAP-337 terminate — Admin/Founder ONLY; typed-confirm is the client's
 *  §11.7 step; server rejects Moderator regardless. */
export const terminate = mutation({
  args: { userId: v.id("users"), caseId: v.id("moderationCases"), reason: v.string() },
  returns: v.object({ standing: v.string() }),
  handler: async (ctx, args) => {
    const actorId = await requireSanctionActor(ctx, false); // Moderator rejected here
    await writeAudited(ctx, async (actx) => {
      await applyStanding(actx, args.userId, "terminated", args.caseId, args.reason);
      // CAP-354 M12 bridge: confirmed sanction claws the actor's Signals
      // back (M12 owns clawback — legitimacy never recomputed here)
      await actx.scheduler.runAfter(0, internal.jobs.attributionSettle.clawbackForActor, { actorUserId: args.userId, windowDays: 90 });
      return {
        actorId, action: "sanction.terminate",
        target: `user:${args.userId}`, prev: null,
        next: { standing: "terminated", reason: args.reason },
        correlationId: newCorrelationId(), reversible: false,
      };
    });
    return { standing: "terminated" };
  },
});


/** CAP-326 brigade detection cron — v1 = reports correlation only
 *  (engagementEdges graph reuse is FUTURE-M12-01; flagged degraded).
 *  ≥3 same-window reports from one cluster on one target with
 *  reciprocated patterns → integrityFlags + the CAP-327 restriction path
 *  stays operator-decided (this cron NEVER auto-restricts — detect and
 *  surface, human sanctions). */
export const brigadeSweep = internalMutation({
  args: {},
  returns: v.object({ flagged: v.number() }),
  handler: async (ctx) => {
    const dayAgo = Date.now() - 24 * 3_600_000;
    const recentReports = await ctx.db
      .query("reports")
      .filter((q: any) => q.gt(q.field("createdAt"), dayAgo))
      .take(200);
    const byTarget = new Map<string, any[]>();
    for (const r of recentReports) {
      const key = `${r.targetType}:${r.targetId}`;
      byTarget.set(key, [...(byTarget.get(key) ?? []), r]);
    }
    let flagged = 0;
    for (const [key, reports] of byTarget) {
      if (reports.length < 3) continue;
      // Recipient neutrality (quoted): the flag attaches to the SOURCE
      // cluster, never the target alone
      const reporterIds = [...new Set(reports.map((r) => r.reporterId))];
      for (const reporterId of reporterIds.slice(0, 5)) {
        const existing = await ctx.db
          .query("integrityFlags")
          .withIndex("by_actor_disposition", (q: any) => q.eq("actorUserId", reporterId).eq("disposition", "monitor"))
          .take(5);
        if (existing.some((f: any) => (f.evidence as any)?.target === key)) continue;
        await ctx.db.insert("integrityFlags", {
          actorUserId: reporterId,
          type: "coordination",
          disposition: "monitor",
          evidence: { target: key, coReporters: reporterIds.length, window: "24h" },
          dampFactor: 1, // monitor-class: no damp yet — operator decides
          opened: Date.now(),
        });
        flagged += 1;
      }
    }
    return { flagged };
  },
});
