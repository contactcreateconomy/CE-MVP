/**
 * demoWorld/lib — shared helpers for the demo-world import surface (CR-011).
 *
 * Pattern sanctioned by `seed/demo.ts` (direct inserts; no auth, no rate
 * limiter, no classifier, no auditLog). Every entry point in this module
 * calls `assertLocalDeployment()` — the strong loopback allowlist — before
 * any write. Projections are never hand-scored: counters are exact tallies
 * of imported event rows and every score is computed by the platform's own
 * jobs (A5.1); buckets are exact event rollups (A5.2).
 */
import type { Id } from "../_generated/dataModel";
import { assertLocalDeployment } from "../seed/devGuard";

export function guard(): void {
  assertLocalDeployment();
}

/** Register a demo row in the same transaction it was inserted (CR-011). */
export async function register(
  ctx: any,
  table: string,
  docId: Id<any> | string,
  batch: string,
): Promise<void> {
  await ctx.db.insert("demoRegistry", { table, docId: docId as string, batch });
}

/** Batch helper — one batch id per import call keeps removal grouped. */
export function batchId(kind: string, seq: number): string {
  return `v1:${kind}:${String(seq).padStart(4, "0")}`;
}

/** Find a user by email (demo members + devtest are looked up this way). */
export async function findUserByEmail(ctx: any, email: string): Promise<Id<"users"> | null> {
  const row = await ctx.db.query("users").withIndex("email", (q: any) => q.eq("email", email)).unique();
  return (row?._id as Id<"users">) ?? null;
}

/** Find a tool row by slug (returns the tools id, not the slug). */
export async function findToolBySlug(ctx: any, slug: string): Promise<Id<"tools"> | null> {
  const row = await ctx.db.query("tools").withIndex("by_slug", (q: any) => q.eq("slug", slug)).unique();
  return (row?._id as Id<"tools">) ?? null;
}
