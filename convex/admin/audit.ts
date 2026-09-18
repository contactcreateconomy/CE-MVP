/**
 * admin/audit — SLICE-P3-11: filtered query + audited export + Founder spot-check.
 *
 * CAP-421: "Never delete auditLog (cold archive OK)." CAP-422: "Export
 * itself audited" — export must fail-closed if the export-audit write fails.
 * CAP-357: "no dual-control theatre" (spot-check logs itself — OQ1,
 * taken as intentional, verbatim flag preserved).
 */

import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { assertAdminPermission, assertFounder, resolveAuthUserId } from "../lib/authz";
import { writeAudited, newCorrelationId } from "../lib/audit";

/** CONTRACT-7-admin-audit §1 (verbatim): "Actors: administrator, Founder"
 *  for CAP-421/422 — NOT the CAP-390 broad shell-entry gate (any staff
 *  role), which `assertAdminPermission` alone enforces. Screen audit
 *  2026-09-18: this module previously only called the broad gate, so any
 *  staff role (editor/moderator/etc.) could read/export the full audit
 *  log. "Administrator" is the broader of the two named actors, so it
 *  already covers Founder (a Founder is always also an administrator —
 *  see `lib/authz.ts` `isFounder`). */
async function requireAdministrator(ctx: any) {
  const roles = await assertAdminPermission(ctx);
  if (!roles.includes("administrator")) {
    throw new Error("admin.audit: administrator (Founder) role required");
  }
}

/** CAP-421 — filtered audit query. Filter fields per contract §3 A:
 *  actor / action / target / time / env / correlation. Cursor-paginated. */
export const auditQuery = query({
  args: {
    actorId: v.optional(v.string()),
    action: v.optional(v.string()),
    targetType: v.optional(v.string()),
    correlationId: v.optional(v.string()),
    before: v.optional(v.number()),
    after: v.optional(v.number()),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.object({ rows: v.array(v.any()), cursor: v.union(v.string(), v.null()), hasMore: v.boolean() }),
  handler: async (ctx, args) => {
    await requireAdministrator(ctx);
    const limit = Math.min(args.limit ?? 50, 200);

    let q = ctx.db.query("auditLog").withIndex("by_action_createdAt", (q: any) => {
      if (args.action) q = q.eq("action", args.action);
      return q;
    }).order("desc");

    const rows: any[] = [];
    let cursor: string | null = null;
    for await (const row of q) {
      // Apply non-index filters
      if (args.actorId && row.actorId !== args.actorId) continue;
      if (args.correlationId && row.correlationId !== args.correlationId) continue;
      if (args.before && row.createdAt >= args.before) continue;
      if (args.after && row.createdAt <= args.after) continue;
      if (args.targetType && !String(row.target).startsWith(args.targetType)) continue;
      rows.push(row);
      if (rows.length >= limit) break;
    }
    return { rows, cursor: null, hasMore: rows.length === limit }; // cursor pagination via Convex .paginate() at consumer wiring
  },
});

/** CAP-422 — export as an audited action (fail-closed on its own audit write).
 *  Fenced (contract OQ2): format/destination/row-limit unspecified.
 *  v1 = server-generated JSON behind a confirm modal. */
export const auditExport = mutation({
  args: {
    filters: v.optional(v.any()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireAdministrator(ctx);
    // The actor is derived server-side, never client-supplied (screen
    // audit 2026-09-18 — `actorId: v.id("users")` previously let any
    // caller attribute the export to a different user in the audit trail).
    const actorId = await resolveAuthUserId(ctx);
    if (!actorId) throw new Error("admin.audit: authentication required");
    // The export-audit write itself is the fail-closed gate: if writeAudited
    // throws (e.g., auditLog insert fails), the whole mutation rolls back
    // and NO export is produced.
    return await writeAudited(ctx, async (actx) => {
      const rows = await actx.db.query("auditLog").order("desc").take(1000);
      const data = JSON.stringify(rows, null, 2);
      return {
        actorId,
        action: "audit.export",
        target: "auditLog:export",
        prev: null,
        next: { rowCount: rows.length, filters: args.filters ?? "all", format: "json" },
        reasonCode: "export",
        correlationId: newCorrelationId(),
        reversible: false,
        justification: `Exported ${rows.length} audit rows`,
        // The exported data rides alongside the audit entry (not in prev/next
        // — audit trail records the action, the export itself is returned)
        ...({ exportedData: data }),
      };
    });
  },
});

/** CAP-357 — Founder monthly spot-check record.
 *  "no dual-control theatre" — one Founder records the check; it logs
 *  itself. Screen audit 2026-09-18: unlike CAP-421/422 above (whose
 *  "administrator, Founder" actor line is satisfied by any administrator),
 *  this capability names the Founder specifically as a single-person
 *  accountability act — `assertFounder` requires the derived Founder,
 *  not merely any administrator. */
export const spotCheck = mutation({
  args: {
    notes: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const actorId = await assertFounder(ctx);
    return await writeAudited(ctx, async (actx) => {
      return {
        actorId,
        action: "audit.spotCheck",
        target: "auditLog:spotCheck",
        prev: null,
        next: { notes: args.notes, checkedAt: new Date().toISOString() },
        reasonCode: "monthly-spot-check",
        correlationId: newCorrelationId(),
        reversible: false,
      };
    });
  },
});
