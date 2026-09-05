/**
 * audit — SLICE-P1-06: shared append-only audit writer + fail-closed
 * composition pattern (CAP-426: "Privileged write fails if audit cannot
 * persist" — the privileged body runs INSIDE writeAudited, so an audit
 * failure rolls the whole mutation back; never log-and-continue).
 *
 * Bible l.248: auditLog is "never deletable — incl. by erasure"; this module
 * exposes NO update/delete path, and the table has no such indexes.
 *
 * Erasure contract (bible l.68): callers MUST NOT pass erased personal values
 * in `prev` — documented here; the enforcement point is each caller's erasure
 * flow (later phases).
 */

import type { MutationCtx } from "../_generated/server";

/** Mutation ctx (audit writes are always inside a mutation). */

export interface AuditEntry {
  /** Performing user (omit for System writers — cron/seeder). */
  actorId?: string;
  /** Acting role at write time, if role-scoped. */
  role?: string;
  action: string;
  /** Target descriptor, e.g. "post:abc123" or "config:feed.page_size". */
  target: string;
  /** Prior value (NEVER erased personal values — see erasure contract above). */
  prev?: unknown;
  /** New value. */
  next?: unknown;
  reasonCode?: string;
  /** Threads through nested calls: pass the caller's id, or generate when top-level. */
  correlationId: string;
  reversible?: boolean;
  justification?: string;
}

/** Append one audit row. Insert-only by construction. */
export async function writeAudit(ctx: MutationCtx, entry: AuditEntry): Promise<void> {
  await ctx.db.insert("auditLog", {
    actorId: entry.actorId,
    role: entry.role,
    action: entry.action,
    target: entry.target,
    prev: entry.prev ?? null,
    next: entry.next ?? null,
    reasonCode: entry.reasonCode,
    correlationId: entry.correlationId,
    reversible: entry.reversible ?? false,
    justification: entry.justification,
    createdAt: Date.now(),
  });
}

/**
 * Fail-closed composition: run a privileged body and its audit write as one
 * transaction. If EITHER throws, nothing persists (Convex mutations are
 * transactional). The P1-06 acceptance test makes the audit insert throw and
 * asserts the body's write is absent.
 */
export async function writeAudited(
  ctx: MutationCtx,
  body: (ctx: MutationCtx) => Promise<AuditEntry>,
): Promise<AuditEntry> {
  const entry = await body(ctx);
  await writeAudit(ctx, entry);
  return entry;
}

/** Convenience correlation id for top-level mutations (crypto-random). */
export function newCorrelationId(): string {
  return globalThis.crypto.randomUUID();
}
