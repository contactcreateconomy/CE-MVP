/**
 * drip.release — SLICE-P7G-05: CAP-380 — the PRIMARY retention mechanism.
 *
 * (quoted, R-DRIP): "Soft-beta default `drip.itemsPerDay=1`; launch
 *   floor **40** banked; alert when scheduled supply < **14** days."
 *   Hourly UTC cron publishes due items at `drip.releaseHourUtc`.
 *   Notify intersecting interests — the copy is a SUPPLY ANNOUNCEMENT,
 *   never human activity/social proof. Batch 0 → NO notif (quoted).
 *   CAP-381 (P7A-06) is the <14d Home alert READING the scheduled supply
 *   this cron maintains — no second alert here.
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { notifyBatched } from "../notifications/batch";

const DEFAULT_ITEMS_PER_DAY = 1; // (quoted)
const DEFAULT_RELEASE_HOUR_UTC = 9; // config drip.releaseHourUtc (flagged default)
const LAUNCH_FLOOR = 40; // (quoted: banked — do not change)

/** The scheduled-supply read CAP-381 consumes (kept countable). */
export async function scheduledSupplyDays(ctx: any): Promise<number> {
  // v1: each scheduled batch = 1 day of supply at itemsPerDay=1
  const resources = await ctx.db
    .query("resources")
    .withIndex("by_status", (q: any) => q.eq("status", "scheduled"))
    .take(200)
    .catch(() => [] as any[]);
  return Math.floor(resources.length / DEFAULT_ITEMS_PER_DAY);
}

export const release = internalMutation({
  args: {},
  returns: v.object({ released: v.number(), batchId: v.optional(v.string()) }),
  handler: async (ctx) => {
    const now = new Date();
    const utcHour = now.getUTCHours();
    if (utcHour !== DEFAULT_RELEASE_HOUR_UTC) {
      // The hourly cron gates on the configured release hour (quoted)
      return { released: 0 };
    }

    // Publish due scheduled resources (FIFO by scheduledFor; fallback: oldest first)
    const scheduled = await ctx.db
      .query("resources")
      .withIndex("by_status", (q: any) => q.eq("status", "scheduled"))
      .take(50);
    if (scheduled.length === 0) return { released: 0 }; // batch 0 → no notif (quoted)

    const items = scheduled.slice(0, DEFAULT_ITEMS_PER_DAY);
    const batchId = `drip-${now.toISOString().slice(0, 10)}`;
    const already = await ctx.db
      .query("dripBatches")
      .withIndex("by_batchId", (q: any) => q.eq("batchId", batchId))
      .first();
    if (already) return { released: 0 }; // idempotent per day

    // Publish: resource status scheduled → published
    const tags = new Set<string>();
    for (const item of items) {
      await ctx.db.patch(item._id, { status: "published" } as any);
      for (const t of (item as any).tags ?? []) tags.add(String(t));
    }
    await ctx.db.insert("dripBatches", {
      batchId,
      releasedAt: Date.now(),
      resourceIds: items.map((i: any) => i._id) as Id<"resources">[],
      tags: [...tags],
      createdAt: Date.now(),
    });

    // Notify intersecting interests — supply-announcement copy ONLY
    // (quoted: "not human activity/social proof"). Interest match: the
    // resource tags → tag rows by slug → userInterests by tag. Bounded
    // scan; no intersections → no notif rows (batch ≠ 0 but honest
    // silence). One notification per recipient (dedupeKey = the batch).
    if (items.length > 0 && tags.size > 0) {
      const notified = new Set<string>();
      for (const slug of [...tags].slice(0, 5)) {
        const tag = await ctx.db
          .query("tags")
          .withIndex("by_slug", (q: any) => q.eq("slug", slug))
          .unique();
        if (!tag) continue;
        const interested = await ctx.db
          .query("userInterests")
          .filter((q: any) => q.eq(q.field("tagId"), tag._id))
          .take(50);
        for (const interest of interested) {
          if (notified.has(String(interest.userId))) continue;
          if (interest.removedAt) continue;
          notified.add(String(interest.userId));
          await notifyBatched(ctx, {
            recipientUserId: interest.userId,
            notificationType: "drip_batch",
            objectType: "drip_batch",
            objectId: batchId,
            actorUserId: null, // supply announcement — never a human actor
            dedupeScope: batchId, // one per batch (quoted)
          });
        }
      }
    }
    return { released: items.length, batchId };
  },
});
