import type { MutationCtx } from "../../_generated/server";

import { categoryRows } from "./catalog";

/** Idempotent: inserts missing and syncs existing `forumCategories` rows to match the catalog. */
export async function insertMissingForumCategories(
  ctx: MutationCtx,
): Promise<{ inserted: number; skipped: number; updated: number }> {
  let inserted = 0;
  let skipped = 0;
  let updated = 0;
  for (const c of categoryRows) {
    const existing = await ctx.db
      .query("forumCategories")
      .withIndex("by_key", (q) => q.eq("key", c.key))
      .unique();
    if (existing) {
      const changed =
        existing.name !== c.name ||
        existing.icon !== c.icon ||
        existing.description !== c.description ||
        existing.primaryColor !== c.primaryColor ||
        existing.lockedByDefault !== c.lockedByDefault ||
        existing.pointsToUnlock !== c.pointsToUnlock;
      if (changed) {
        await ctx.db.patch(existing._id, {
          name: c.name,
          icon: c.icon,
          description: c.description,
          primaryColor: c.primaryColor,
          lockedByDefault: c.lockedByDefault,
          pointsToUnlock: c.pointsToUnlock,
        });
        updated++;
      } else {
        skipped++;
      }
      continue;
    }
    await ctx.db.insert("forumCategories", { ...c });
    inserted++;
  }
  return { inserted, skipped, updated };
}
