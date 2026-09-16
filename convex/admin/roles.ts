/**
 * admin/roles — SLICE-P3-09: RBAC assignment + UI revoke + Second-Founder.
 * SLICE-P3-10: ops-coverage slots + single-person ack + escalation.
 *
 * CAP-413 roles.assign (Founder-only) · CAP-564 roles.revoke (admin/Founder,
 * last-active guardrail) · CAP-008 Second-Founder (env-scoped, Tier-3 flip)
 * · CAP-414-417 ops coverage (upsert, ack, vacant alert, after-hours escalation).
 */

import { internalMutation, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission, AdminAuthzError } from "../lib/authz";
import { writeAudited, newCorrelationId } from "../lib/audit";
import { ensureFounderPrivileges, FOUNDER_EMAIL, isFounderEmail } from "../lib/founder";

/** CAP-413 — Founder-only role assignment. */
export const rolesAssign = mutation({
  args: {
    userId: v.id("users"),
    // Mirrors the schema's role literal union — Convex validates at the
    // boundary, TypeScript gets the correct narrowed type (no cast needed)
    role: v.union(
      v.literal("member"), v.literal("editor"), v.literal("publisher"),
      v.literal("moderator"), v.literal("store_operator"),
      v.literal("support_operator"), v.literal("administrator"),
    ),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    // SECURITY (scan 2026-09-13, finding 11): "Founder-only" was enforced
    // as ANY administrator — every admin could mint admins. Founder is the
    // bootstrapped FIRST administrator (CAP-007's earliest active
    // administrator assignment — the same derivation as CAP-429/analytics),
    // derived from the session; the audit actor is the session actor.
    const actorId = (await getAuthUserId(ctx)) as Id<"users">;
    if (!actorId) throw new AdminAuthzError("NOT_STAFF", "roles.assign: authentication required");
    const roles = await assertAdminPermission(ctx);
    if (!roles.includes("administrator")) {
      throw new AdminAuthzError("NOT_STAFF", "roles.assign is Founder-only (CAP-413).");
    }
    const admins = await ctx.db
      .query("roleAssignments")
      .filter((q: any) => q.eq(q.field("role"), "administrator"))
      .take(50);
    const first = admins
      .filter((a: any) => a.status === "active")
      .sort((a: any, b: any) => a.grantedAt - b.grantedAt)[0];
    const isFounder = Boolean(first && first.userId === actorId);
    if (!isFounder) {
      throw new AdminAuthzError("NOT_STAFF", "roles.assign is Founder-only (CAP-413) — the bootstrapped first administrator.");
    }

    return await writeAudited(ctx, async (actx) => {
      const id = await actx.db.insert("roleAssignments", {
        userId: args.userId, role: args.role, scopeType: "global" as const,
        status: "active", grantedByUserId: actorId, grantedAt: Date.now(),
      });
      return { actorId, action: "roles.assign", target: `roleAssignment:${id}`, prev: null, next: { userId: args.userId, role: args.role }, reasonCode: args.reason, correlationId: newCorrelationId(), reversible: true };
    });
  },
});

/** CAP-564 — UI revoke with last-active-Founder/Administrator guardrail. */
export const rolesRevoke = mutation({
  args: {
    // Typed as the table's Id — db.get() returns Doc<"roleAssignments"> | null
    // (narrowed to one table, no union-of-all-tables, no cast needed)
    assignmentId: v.id("roleAssignments"),
    actorId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const actorRoles = await assertAdminPermission(ctx);
    if (!actorRoles.includes("administrator")) {
      throw new AdminAuthzError("NOT_STAFF", "roles.revoke requires administrator or Founder.");
    }

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.status !== "active") throw new Error("roles.revoke: assignment not found or already revoked.");

    // Guardrail: reject revoking the last active Founder/Administrator
    if (assignment.role === "administrator") {
      const allAdmins = await ctx.db
        .query("roleAssignments")
        .withIndex("by_role_status", (q: any) => q.eq("role", "administrator").eq("status", "active"))
        .collect();
      if (allAdmins.length <= 1) {
        throw new Error("roles.revoke: cannot revoke the last active Administrator (guardrail).");
      }
    }

    return await writeAudited(ctx, async (actx) => {
      await actx.db.patch(assignment._id, { status: "revoked", revokedAt: Date.now() });
      return { actorId: args.actorId, action: "roles.revoke", target: `roleAssignment:${args.assignmentId}`, prev: { role: assignment.role, status: "active" }, next: { role: assignment.role, status: "revoked" }, reasonCode: args.reason, correlationId: newCorrelationId(), reversible: true };
    });
  },
});

/** CAP-008 — Second-Founder gate. Env-scoped founder_bootstrap_completed
 *  systemConfig key write via the Tier-3 config path. Preview ≠ production. */
export const secondFounderFlip = mutation({
  args: {
    actorId: v.id("users"),
    environment: v.union(v.literal("preview"), v.literal("production")),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const actorRoles = await assertAdminPermission(ctx);
    if (!actorRoles.includes("administrator")) throw new Error("secondFounderFlip: Administrator required.");
    return await writeAudited(ctx, async (actx) => {
      const key = `founder_bootstrap_completed.${args.environment}`;
      const existing = await actx.db.query("systemConfig").withIndex("by_key", (q: any) => q.eq("key", key)).first();
      if (existing) {
        await actx.db.patch(existing._id, { value: true, version: (existing.version ?? 0) + 1, updatedAt: Date.now(), reason: args.reason });
      } else {
        await actx.db.insert("systemConfig", { key, value: true, valueType: "boolean", scope: "global", status: "active", version: 1, updatedAt: Date.now(), reason: args.reason });
      }
      return { actorId: args.actorId, action: "secondFounder.flip", target: `config:${key}`, prev: false, next: true, reasonCode: args.reason, correlationId: newCorrelationId(), reversible: false };
    });
  },
});

// ═══════════════════════════════════════════════════════════════════════
// SLICE-P3-10 — Ops coverage
// ═══════════════════════════════════════════════════════════════════════

export const OPS_SLOT_ENUM = [
  "editor_primary", "editor_backup",
  "publisher_primary", "publisher_backup",
  "persona_publisher",
  "moderator_primary", "moderator_backup",
  "after_hours_escalation",
  "store_operator_primary",
  "support_owner", "support_channel",
] as const;

/** CAP-416 — ops slot upsert. */
export const opsUpsert = mutation({
  args: {
    // Mirrors OPS_SLOT_ENUM — Convex validates at the boundary
    slot: v.union(
      v.literal("editor_primary"), v.literal("editor_backup"),
      v.literal("publisher_primary"), v.literal("publisher_backup"),
      v.literal("persona_publisher"),
      v.literal("moderator_primary"), v.literal("moderator_backup"),
      v.literal("after_hours_escalation"),
      v.literal("store_operator_primary"),
      v.literal("support_owner"), v.literal("support_channel"),
    ),
    userId: v.id("users"),
    actorId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdminPermission(ctx);
    return await writeAudited(ctx, async (actx) => {
      const id = await actx.db.insert("opsAssignments", { slot: args.slot, userId: args.userId, status: "filled", updatedAt: Date.now() });
      return { actorId: args.actorId, action: "opsAssignments.upsert", target: `opsAssignment:${id}`, prev: null, next: { slot: args.slot, userId: args.userId }, reasonCode: args.reason, correlationId: newCorrelationId(), reversible: true };
    });
  },
});

/** CAP-415 — single-person acknowledgement. Required before beta when
 *  only one human per critical slot. */
export const opsAck = mutation({
  args: {
    slot: v.union(
      v.literal("editor_primary"), v.literal("editor_backup"),
      v.literal("publisher_primary"), v.literal("publisher_backup"),
      v.literal("persona_publisher"),
      v.literal("moderator_primary"), v.literal("moderator_backup"),
      v.literal("after_hours_escalation"),
      v.literal("store_operator_primary"),
      v.literal("support_owner"), v.literal("support_channel"),
    ),
    actorId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdminPermission(ctx);
    return await writeAudited(ctx, async (actx) => {
      const existing = await actx.db.query("opsAssignments").withIndex("by_slot", (q: any) => q.eq("slot", args.slot)).first();
      if (existing) {
        await actx.db.patch(existing._id, { status: "single_person_acknowledged", updatedAt: Date.now() });
      }
      return { actorId: args.actorId, action: "opsCoverage.ack", target: `opsAssignment:${args.slot}`, prev: "filled", next: "single_person_acknowledged", reasonCode: args.reason, correlationId: newCorrelationId(), reversible: true };
    });
  },
});

/** Read query — list all assignments for the matrix UI. */
export const listAssignments = query({
  args: {},
  handler: async (ctx) => {
    await assertAdminPermission(ctx);
    return await ctx.db.query("roleAssignments").collect();
  },
});

export const listOpsAssignments = query({
  args: {},
  handler: async (ctx) => {
    await assertAdminPermission(ctx);
    return await ctx.db.query("opsAssignments").collect();
  },
});


/**
 * CAP-007 — grantFounder: CLI bootstrap of the FIRST administrator
 * (P2-AUTH-CUTOVER). Internal by design. Grants every staff role so the
 * founder can open every admin widget (support_operator-only routes included).
 * Refuses when a *different* user is already an active administrator unless
 * FORCE_FOUNDER_REGRANT=true. Idempotent for the same user.
 */
export const grantFounder = internalMutation({
  args: { userId: v.id("users"), email: v.optional(v.string()) },
  returns: v.object({
    already: v.boolean(),
    granted: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("grantFounder: user not found");
    if (args.email && user.email !== args.email) {
      throw new Error(`grantFounder: user email "${user.email}" ≠ supplied "${args.email}" — refusing`);
    }

    const existingRows = await ctx.db
      .query("roleAssignments")
      .withIndex("by_role_status", (q) =>
        q.eq("role", "administrator").eq("status", "active"),
      )
      .take(50);
    const selfAdmin = existingRows.filter((r: any) => r.status === "active" && r.userId === args.userId);
    const otherAdmin = existingRows.some(
      (r: any) => r.status === "active" && r.userId !== args.userId,
    );
    if (otherAdmin && process.env.FORCE_FOUNDER_REGRANT !== "true") {
      throw new Error("grantFounder: an active administrator already exists — use roles.assign (CAP-413)");
    }

    const result = await ensureFounderPrivileges(ctx, args.userId);
    if (selfAdmin.length > 0 && result.already) {
      return { already: true, granted: [] };
    }
    await ctx.db.insert("auditLog", {
      action: "admin.roles.grantFounder",
      target: `user:${args.userId}`,
      next: { userId: args.userId, roles: result.granted, email: user.email ?? null },
      reasonCode: "founder_bootstrap",
      correlationId: newCorrelationId(),
      reversible: true,
      createdAt: Date.now(),
    });
    return result;
  },
});

/** Look up the documented founder email and grant every staff role. */
export const grantFounderByEmail = internalMutation({
  args: { email: v.optional(v.string()) },
  returns: v.object({
    ok: v.boolean(),
    reason: v.optional(v.string()),
    already: v.optional(v.boolean()),
    granted: v.optional(v.array(v.string())),
    userId: v.optional(v.id("users")),
  }),
  handler: async (ctx, args) => {
    const email = (args.email ?? FOUNDER_EMAIL).trim().toLowerCase();
    if (!isFounderEmail(email)) {
      return { ok: false, reason: "email_not_founder" };
    }
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    if (!user) {
      return { ok: false, reason: "no_user" };
    }
    const result = await ensureFounderPrivileges(ctx, user._id);
    if (!result.already) {
      await ctx.db.insert("auditLog", {
        action: "admin.roles.grantFounderByEmail",
        target: `user:${user._id}`,
        next: { userId: user._id, roles: result.granted, email },
        reasonCode: "founder_bootstrap",
        correlationId: newCorrelationId(),
        reversible: true,
        createdAt: Date.now(),
      });
    }
    return { ok: true, userId: user._id, ...result };
  },
});

/** Step-4/5 verification read (FOUNDER-BOOTSTRAP): active administrators. */
export const countActiveAdmins = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("roleAssignments")
      .filter((q: any) => q.eq(q.field("role"), "administrator"))
      .collect();
    return rows.filter((r: any) => r.status === "active").length;
  },
});
