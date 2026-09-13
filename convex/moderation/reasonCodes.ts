/**
 * reasonCodes — SLICE-P7E-10: CAP-358 (Admin edit → new version) +
 * CAP-429 (Founder policy-copy version bump, INV-M15-14). Same helper,
 * version-forward in the SAME table — never an in-place overwrite.
 *
 * CAP-358 (quoted): "Admin edits policyReasonCodes copy (new version
 *   record; historical unchanged)" / "Legal/Admin new version; never
 *   in-place overwrite."
 * CAP-429 (quoted): "Policy copy version bump … Versions forward; no
 *   in-place overwrite." Stamps a systemConfig pointer to the release
 *   label (the Writes column names systemConfig).
 * Cases store code+version at decision time (bible l.245, quoted) —
 *   decided-case rows are never touched by these writes.
 * Founder distinction (CAP-429 Actor=Founder): the platform models
 *   Founder as the bootstrapped first administrator (CAP-007; no founder
 *   marker field exists in the bible) — v1 gates administrator and flags
 *   the distinction (stop-and-report if a real founder flag is demanded).
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { writeAudited, newCorrelationId } from "../lib/audit";
import { assertAdminPermission } from "../lib/authz";

async function requirePolicyEditor(ctx: any): Promise<Id<"users">> {
  const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
  if (!userId) throw new Error("reasonCode: authentication required");
  const roles = await assertAdminPermission(ctx);
  if (!roles.includes("administrator")) {
    throw new Error("reasonCode: administrator required (CAP-358 Legal/Admin; CAP-429 Founder)");
  }
  return userId;
}

/** Shared version-forward writer: inserts the next version row carrying
 *  the edited copy; the previous row is deactivated, never re-edited. */
async function insertNextVersion(
  ctx: any,
  args: { code: string; userFacingTitle?: string; userFacingBody?: string; policyUrlAnchor?: string; appealable?: boolean },
) {
  const rows = await ctx.db
    .query("policyReasonCodes")
    .withIndex("by_code_version", (q: any) => q.eq("code", args.code))
    .take(200); // bounded — version history per code is small and append-only
  if (rows.length === 0) throw new Error(`reasonCode: unknown code "${args.code}"`);
  const latest = rows.reduce((a: any, b: any) => (b.version > a.version ? b : a));
  const nextVersion = latest.version + 1;
  const { _id, _creationTime, ...carry } = latest;
  await ctx.db.patch(latest._id, { active: false }); // superseded — immutable copy
  const newId = await ctx.db.insert("policyReasonCodes", {
    ...carry,
    userFacingTitle: args.userFacingTitle ?? latest.userFacingTitle,
    userFacingBody: args.userFacingBody ?? latest.userFacingBody,
    policyUrlAnchor: args.policyUrlAnchor ?? latest.policyUrlAnchor,
    appealable: args.appealable ?? latest.appealable,
    version: nextVersion,
    effectiveFrom: Date.now(),
    active: true,
  });
  return { code: args.code, version: nextVersion, id: newId as Id<"policyReasonCodes"> };
}

/** CAP-358 — Admin edits user-facing copy (new version; historical unchanged). */
export const editCopy = mutation({
  args: {
    code: v.string(),
    userFacingTitle: v.optional(v.string()),
    userFacingBody: v.optional(v.string()),
    policyUrlAnchor: v.optional(v.string()),
    appealable: v.optional(v.boolean()),
  },
  returns: v.object({ code: v.string(), version: v.number() }),
  handler: async (ctx, args) => {
    const userId = await requirePolicyEditor(ctx);
    const entry = await writeAudited(ctx, async (actx) => {
      const out = await insertNextVersion(actx, args);
      return {
        actorId: userId, action: "policy_reason_code.edit_copy",
        target: `policyReasonCode:${out.code}`, prev: null,
        next: { version: out.version },
        reasonCode: "CAP-358", correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { code: args.code, version: entry.next ? ((entry.next as any).version as number) : 0 };
  },
});

/** CAP-429 — Founder policy-copy version bump (INV-M15-14): bumps EVERY
 *  active code forward under one release label + stamps the pointer. */
export const founderBumpAll = mutation({
  args: { releaseLabel: v.string() },
  returns: v.object({ bumped: v.number(), releaseLabel: v.string() }),
  handler: async (ctx, args) => {
    const userId = await requirePolicyEditor(ctx);
    const entry = await writeAudited(ctx, async (actx) => {
      const active = await actx.db
        .query("policyReasonCodes")
        .filter((q: any) => q.eq(q.field("active"), true))
        .take(200); // bounded — seeded catalog is ~24 codes
      let bumped = 0;
      for (const row of active) {
        await insertNextVersion(actx, { code: row.code });
        bumped += 1;
      }
      await actx.db.insert("systemConfig", {
        key: "policy.copy.release",
        value: args.releaseLabel,
        valueType: "string",
        scope: "global",
        status: "active",
        updatedByUserId: userId,
        updatedAt: Date.now(),
      });
      return {
        actorId: userId, action: "policy_reason_code.founder_bump",
        target: "config:policy.copy.release", prev: null,
        next: { releaseLabel: args.releaseLabel, bumped },
        reasonCode: "CAP-429", correlationId: newCorrelationId(), reversible: false,
      };
    });
    return { bumped: ((entry.next as any)?.bumped ?? 0) as number, releaseLabel: args.releaseLabel };
  },
});

/** The Legal-namespace list on /admin/config: latest version per code.
 * SECURITY (scan 2026-09-13, finding 20): staff-gated — reason-code copy
 * is admin-console data. */
export const listLatest = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    await assertAdminPermission(ctx);
    const all = await ctx.db.query("policyReasonCodes").take(500); // small seeded catalog, bounded
    const latest = new Map<string, any>();
    for (const row of all) {
      const cur = latest.get(row.code);
      if (!cur || row.version > cur.version) latest.set(row.code, row);
    }
    return { codes: [...latest.values()].sort((a: any, b: any) => a.code.localeCompare(b.code)) };
  },
});
