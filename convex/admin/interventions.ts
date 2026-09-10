/**
 * interventions — SLICE-P7A-03: CAP-407/408/409/410 + CAP-401 (shared-lease
 * orphan disposition).
 *
 * CAP-407 (quoted): "copy must include whatHappening + whatToDo + deep
 *   link (source-controlled routeKey only)." CAP-427 (quoted):
 *   "deepLinkRouteKey rejects arbitrary URLs; source-controlled keys only."
 * CAP-408 (quoted): ack "Scoped to Admin role." CAP-410 (quoted): snooze
 *   "Critical forbidden." Lifecycle (quoted): "open → acknowledged |
 *   snoozed → resolved." auditLog on 408/409/410 (home Entities).
 * CAP-401 (quoted): "20m lease / 5m renew / 60m max; shared across
 *   widgets; cross-widget same case = one lease" — the expiry sweep
 *   dispositions orphaned leases here (the moderation console owns the
 *   case-lease write itself, P7E-14).
 * Later System writers (P7A-04/05/06/07) CALL interventionCreateTx; they
 * do not fork the row shape.
 */

import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission } from "../lib/authz";
import { writeAudited, newCorrelationId } from "../lib/audit";
import { checkRateLimit } from "../lib/rateLimit";

/** The source-controlled deep-link route keys (CAP-427 — no arbitrary URLs). */
export const DEEP_LINK_ROUTE_KEYS = [
  "/admin/home", "/admin/moderation", "/admin/config", "/admin/roles",
  "/admin/support", "/admin/wiki", "/admin/readiness", "/admin/store",
  "/admin/resources", "/admin/curation", "/admin/affiliate-inventory", "/admin/audit",
] as const;

export function assertDeepLinkKey(key: string): void {
  if (!(DEEP_LINK_ROUTE_KEYS as readonly string[]).includes(key)) {
    throw new Error(`intervention.create: deepLinkRouteKey "${key}" is not a registered route key (CAP-427)`);
  }
}

async function requireAdministrator(ctx: any): Promise<Id<"users">> {
  const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
  if (!userId) throw new Error("interventions: authentication required");
  const roles = await assertAdminPermission(ctx);
  if (!roles.includes("administrator")) {
    throw new Error("interventions: Administrator required (CAP-408 scoped-to-Admin)");
  }
  return userId;
}

/** CAP-407 — the System create (plain logic; P7A-04/05/06/07 call this). */
export async function interventionCreateTx(ctx: any, input: {
  alertKey: string;
  severity: "critical" | "high" | "medium";
  title: string;
  whatHappening: string;
  whatToDo: string;
  deepLinkRouteKey: string;
  relatedIncidentId?: string;
}): Promise<Id<"adminInterventionAlerts">> {
  assertDeepLinkKey(input.deepLinkRouteKey);
  // One open alert per alertKey (idempotent re-fire)
  const existing = await ctx.db
    .query("adminInterventionAlerts")
    .withIndex("by_alertKey_status", (q: any) => q.eq("alertKey", input.alertKey).eq("status", "open"))
    .unique();
  if (existing) return existing._id;
  return (await ctx.db.insert("adminInterventionAlerts", {
    alertKey: input.alertKey,
    severity: input.severity,
    title: input.title,
    whatHappening: input.whatHappening,
    whatToDo: input.whatToDo,
    deepLinkRouteKey: input.deepLinkRouteKey,
    relatedIncidentId: input.relatedIncidentId,
    status: "open",
    createdAt: Date.now(),
  })) as Id<"adminInterventionAlerts">;
}

/** The operator-facing create (audited; administrator). */
export const create = mutation({
  args: {
    alertKey: v.string(),
    severity: v.union(v.literal("critical"), v.literal("high"), v.literal("medium")),
    title: v.string(),
    whatHappening: v.string(),
    whatToDo: v.string(),
    deepLinkRouteKey: v.string(),
  },
  returns: v.object({ alertId: v.id("adminInterventionAlerts") }),
  handler: async (ctx, args) => {
    const userId = await requireAdministrator(ctx);
    await checkRateLimit(ctx, "admin.write", { kind: "operator", value: userId });
    let alertId: Id<"adminInterventionAlerts"> | undefined;
    await writeAudited(ctx, async (actx) => {
      alertId = await interventionCreateTx(actx, args);
      return {
        actorId: userId, action: "intervention.create",
        target: `adminInterventionAlert:${alertId}`, prev: null,
        next: { severity: args.severity, title: args.title },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { alertId: alertId! };
  },
});

/** CAP-408 — Administrator ack. */
export const ack = mutation({
  args: { alertId: v.id("adminInterventionAlerts") },
  returns: v.object({ status: v.string() }),
  handler: async (ctx, args) => {
    const userId = await requireAdministrator(ctx);
    await checkRateLimit(ctx, "admin.write", { kind: "operator", value: userId });
    const alert = await ctx.db.get(args.alertId);
    if (!alert) throw new Error("intervention.ack: not found");
    if (alert.status !== "open") return { status: alert.status }; // idempotent
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.alertId, { status: "acknowledged", acknowledgedByUserId: userId, acknowledgedAt: Date.now() });
      return {
        actorId: userId, action: "intervention.ack",
        target: `adminInterventionAlert:${args.alertId}`,
        prev: { status: "open" }, next: { status: "acknowledged" },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { status: "acknowledged" };
  },
});

/** CAP-409 — resolve. */
export const resolve = mutation({
  args: { alertId: v.id("adminInterventionAlerts") },
  returns: v.object({ status: v.string() }),
  handler: async (ctx, args) => {
    const userId = await requireAdministrator(ctx);
    await checkRateLimit(ctx, "admin.write", { kind: "operator", value: userId });
    const alert = await ctx.db.get(args.alertId);
    if (!alert) throw new Error("intervention.resolve: not found");
    if (alert.status === "resolved") return { status: "resolved" }; // idempotent
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.alertId, { status: "resolved", resolvedAt: Date.now() });
      return {
        actorId: userId, action: "intervention.resolve",
        target: `adminInterventionAlert:${args.alertId}`,
        prev: { status: alert.status }, next: { status: "resolved" },
        correlationId: newCorrelationId(), reversible: false,
      };
    });
    return { status: "resolved" };
  },
});

/** CAP-410 — snooze ≤24h; CRITICAL FORBIDDEN (quoted). */
export const snooze = mutation({
  args: { alertId: v.id("adminInterventionAlerts"), until: v.number() },
  returns: v.object({ status: v.string() }),
  handler: async (ctx, args) => {
    const userId = await requireAdministrator(ctx);
    await checkRateLimit(ctx, "admin.write", { kind: "operator", value: userId });
    const alert = await ctx.db.get(args.alertId);
    if (!alert) throw new Error("intervention.snooze: not found");
    if (alert.severity === "critical") {
      throw new Error("intervention.snooze: critical alerts cannot be snoozed (CAP-410)");
    }
    const maxUntil = Date.now() + 24 * 3_600_000;
    if (args.until > maxUntil) throw new Error("intervention.snooze: max 24h (CAP-410)");
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.alertId, { status: "snoozed", snoozeUntil: args.until });
      return {
        actorId: userId, action: "intervention.snooze",
        target: `adminInterventionAlert:${args.alertId}`,
        prev: { status: alert.status }, next: { status: "snoozed", until: args.until },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { status: "snoozed" };
  },
});

/** CAP-401 — the shared-lease orphan sweep: expired moderation-case leases
 *  flip to triaged (the disposition CAP-328/400 name); P7E-14's own
 *  leaseExpire cron does the case write — THIS is the alert-side orphan
 *  check: snooze windows that elapsed re-open. */
export const sweepOrphans = internalMutation({
  args: {},
  returns: v.object({ reopened: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    const snoozed = await ctx.db
      .query("adminInterventionAlerts")
      .filter((q: any) => q.eq(q.field("status"), "snoozed"))
      .take(50);
    let reopened = 0;
    for (const alert of snoozed) {
      if (alert.snoozeUntil && alert.snoozeUntil < now) {
        await ctx.db.patch(alert._id, { status: "open" }); // elapsed snooze → back on the board
        reopened += 1;
      }
    }
    return { reopened };
  },
});
