/**
 * resources — SLICE-P6-07: CAP-224/212/213/215/216/229/570/214/376/377 —
 * the /resources library: browse, acquire (quota), download (no quota).
 *
 * CAP-212 (quoted): "5/day · 20/week. user-local calendar, per DEC-S19
 *   (CONFIRMED). Concurrent double-get → one row." — acquisitions are
 *   unique (userId, resourceId); the ledger is atomic with acquire.
 * CAP-376 (quoted): "dayPeriodKey=YYYY-MM-DD local; weekPeriodKey ISO
 *   week Mon 00:00; fallback UTC." CAP-377 (quoted): "lazy reset inside
 *   acquire txn; no midnight cron" — the ledger resets when its window
 *   has rolled, INSIDE this transaction.
 * CAP-215 (quoted): "Server-side check, never trust client."
 * CAP-213 (quoted): "Abort mid-download does NOT reverse quota.
 *   Re-download ≠ quota." + the catalog's note: CAP-213's rawEvents
 *   omission is INTENTIONAL — no rawEvents write added.
 * CAP-229 (quoted): attribution line rendered on every card/download.
 * CAP-570 call-site (quoted): the SAME mutation appends the Journal row —
 *   an acquire whose ledger append throws rolls back (CAP-436/570).
 * INV-6 / DEC-S15 (quoted): "View ≠ acquisition; views never burn quota"
 *   — the browse/view paths write nothing (cross-tested in P6-08).
 * CAP-214 `resource.tagInPost` — the structured post↔resource token write
 *   (postResources join); the composer embed is P4-02's surface.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertCustomerCapability } from "./lib/authz";
import { appendActivity } from "./activity";

export const QUOTA_DAY = 5;
export const QUOTA_WEEK = 20;

/** CAP-376 — user-local calendar keys (DEC-S19). Pure + testable.
 *  dayKey = YYYY-MM-DD in the member's IANA zone; weekKey = ISO week
 *  (Mon 00:00) in the same zone; UTC fallback. */
export function quotaKeys(timezone: string | undefined, now: Date): { dayKey: string; weekKey: string } {
  let zone = "UTC";
  if (timezone) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: timezone });
      zone = timezone;
    } catch {
      zone = "UTC"; // fallback UTC (quoted)
    }
  }
  // en-CA gives YYYY-MM-DD
  const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  // ISO week Mon 00:00: derive the local weekday + offset back to Monday
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "short" }).format(now); // Sun..Sat
  const nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const localNoon = new Date(nowUtc + 12 * 3_600_000); // stable anchor within any zone
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daysFromMonday = (dayNames.indexOf(weekday) + 6) % 7; // Mon=0
  const monday = new Date(localNoon.getTime() - daysFromMonday * 24 * 3_600_000);
  const weekKey = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(monday);
  return { dayKey, weekKey };
}

async function publishedResource(ctx: any, resourceId: Id<"resources">): Promise<any> {
  const resource = await ctx.db.get(resourceId);
  if (!resource || resource.status !== "published") throw new Error("resources: not found or not published");
  return resource;
}

/** CAP-224 — the library browse (anonymous + member; flag-gated). */
export const listLibrary = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const flag = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q: any) => q.eq("key", "resources.library.enabled"))
      .first();
    if (flag && flag.value === false) return { enabled: false, items: [] };
    const rows = await ctx.db
      .query("resources")
      .withIndex("by_status", (q: any) => q.eq("status", "published"))
      .take(50);
    const items = [];
    for (const r of rows) {
      const version = r.currentVersionId ? await ctx.db.get(r.currentVersionId) : null;
      items.push({
        resourceId: r._id,
        title: r.title,
        slug: r.slug,
        attributionLine: r.attributionLine, // CAP-229 — rendered everywhere
        forgeDisclosure: r.forgeDisclosure,
        pageCount: version?.pageCount ?? null,
      });
    }
    return { enabled: true, items };
  },
});

/** The member's acquisition state for one resource (drives the UI). */
export const getAcquisitionState = query({
  args: { resourceId: v.id("resources") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return { acquired: false };
    const existing = await ctx.db
      .query("acquisitions")
      .withIndex("by_user_resource", (q: any) => q.eq("userId", userId).eq("resourceId", args.resourceId))
      .unique();
    return { acquired: Boolean(existing), acquisitionId: existing?._id ?? null };
  },
});

/** CAP-212 `resource.acquire` — one transaction: unique acquisition +
 *  lazily-reset ledger (CAP-377) + quota gate (CAP-215, server-side) +
 *  the CAP-570 Journal append. */
export const acquire = mutation({
  args: { resourceId: v.id("resources") },
  returns: v.object({ acquired: v.boolean(), alreadyAcquired: v.optional(v.boolean()), quotaDayKey: v.optional(v.string()), quotaWeekKey: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("resource.acquire: authentication required");
    await assertCustomerCapability(ctx, "resource_acquire"); // CAP-393 guard
    await publishedResource(ctx, args.resourceId);

    // Unique (userId, resourceId) — concurrent double-get → one row
    const existing = await ctx.db
      .query("acquisitions")
      .withIndex("by_user_resource", (q: any) => q.eq("userId", userId).eq("resourceId", args.resourceId))
      .unique();
    if (existing) {
      return { acquired: true, alreadyAcquired: true, quotaDayKey: existing.quotaDayKey, quotaWeekKey: existing.quotaWeekKey };
    }

    const user = await ctx.db.get(userId);
    const keys = quotaKeys(user?.timezone, new Date());

    // Ledger with LAZY reset inside this txn (CAP-377 — no midnight cron)
    let ledger = await ctx.db
      .query("resourceQuotaLedgers")
      .withIndex("by_user_day", (q: any) => q.eq("userId", userId).eq("dayKey", keys.dayKey))
      .unique();
    let usedDay = 0;
    let usedWeek = 0;
    if (ledger) {
      const rolledDay = ledger.dayKey !== keys.dayKey;
      const rolledWeek = ledger.weekKey !== keys.weekKey;
      usedDay = rolledDay ? 0 : ledger.acquisitionsUsedDay;
      usedWeek = rolledWeek ? 0 : ledger.acquisitionsUsedWeek;
    }

    // CAP-215 — the SERVER counts, never the client
    if (usedDay >= QUOTA_DAY) throw new Error(`resource.acquire: daily quota reached (${QUOTA_DAY}/day)`);
    if (usedWeek >= QUOTA_WEEK) throw new Error(`resource.acquire: weekly quota reached (${QUOTA_WEEK}/week)`);

    const now = Date.now();
    const resource = await ctx.db.get(args.resourceId);
    await ctx.db.insert("acquisitions", {
      userId,
      resourceId: args.resourceId,
      acquiredAt: now,
      quotaDayKey: keys.dayKey,
      quotaWeekKey: keys.weekKey,
    });
    if (ledger) {
      await ctx.db.patch(ledger._id, {
        dayKey: keys.dayKey,
        weekKey: keys.weekKey,
        acquisitionsUsedDay: usedDay + 1,
        acquisitionsUsedWeek: usedWeek + 1,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("resourceQuotaLedgers", {
        userId,
        dayKey: keys.dayKey,
        weekKey: keys.weekKey,
        acquisitionsUsedDay: 1,
        acquisitionsUsedWeek: 1,
        updatedAt: now,
      });
    }

    // CAP-570 call-site — SAME transaction (an append failure rolls the
    // acquire back; the quoted discipline)
    await appendActivity(ctx, {
      userId,
      eventType: "resource_acquired",
      targetType: "session",
      targetId: args.resourceId,
      summary: `Acquired the resource “${resource?.title ?? "resource"}”`,
      meta: {
        resourceId: { value: args.resourceId, privacy: "safe_for_public" },
      },
    });

    return { acquired: true, quotaDayKey: keys.dayKey, quotaWeekKey: keys.weekKey };
  },
});

/** CAP-213 `resource.download` — requires a prior acquisition; does NOT
 *  consume quota (quoted); records the download + schedules the CAP-216
 *  settlement; returns the storage URL (delivery from the clean bucket
 *  only — the viewer sandbox in P6-08 frames it). No rawEvents (the
 *  omission is intentional — quoted). */
export const download = mutation({
  args: { resourceId: v.id("resources") },
  returns: v.object({ url: v.string(), versionId: v.optional(v.id("resourceVersions")) }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("resource.download: authentication required");
    const resource = await publishedResource(ctx, args.resourceId);
    const acquisition = await ctx.db
      .query("acquisitions")
      .withIndex("by_user_resource", (q: any) => q.eq("userId", userId).eq("resourceId", args.resourceId))
      .unique();
    if (!acquisition) throw new Error("resource.download: acquire first (view ≠ acquisition)");

    const version = resource.currentVersionId ? ((await ctx.db.get(resource.currentVersionId)) as any) : null;
    if (!version?.fileAssetId) throw new Error("resource.download: no current clean artifact");

    const url = await ctx.storage.getUrl(version.fileAssetId);
    if (!url) throw new Error("resource.download: artifact unavailable");

    // The download row (integrityClass seeds the CAP-216 settlement; the
    // signed-URL TTL is Convex-storage-managed — 60s-class, flagged)
    await ctx.db.insert("downloads", {
      acquisitionId: acquisition._id,
      userId,
      resourceId: args.resourceId,
      resourceVersionId: version._id,
      downloadedAt: Date.now(),
      integrityClass: "pending_settlement",
    });
    return { url, versionId: version._id };
  },
});

/** CAP-214 `resource.tagInPost` — the structured post↔resource token
 *  (postResources join; relationType verbatim). Own-post only; the
 *  resource must be published. The composer embed consumes this write. */
export const tagInPost = mutation({
  args: {
    postId: v.id("posts"),
    resourceId: v.id("resources"),
    relationType: v.union(
      v.literal("mentions"), v.literal("explains"), v.literal("compares"),
      v.literal("uses"), v.literal("related"),
    ),
  },
  returns: v.object({ tagged: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("resource.tagInPost: authentication required");
    await assertCustomerCapability(ctx, "create_post");
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("resource.tagInPost: post not found");
    if (post.authorUserId !== userId) throw new Error("resource.tagInPost: only the post author tags resources");
    await publishedResource(ctx, args.resourceId);
    const existing = await ctx.db
      .query("postResources")
      .withIndex("by_postId", (q: any) => q.eq("postId", args.postId))
      .filter((q: any) => q.eq(q.field("resourceId"), args.resourceId))
      .first();
    if (existing) return { tagged: true }; // idempotent join
    await ctx.db.insert("postResources", {
      postId: args.postId,
      resourceId: args.resourceId,
      relationType: args.relationType,
      sortOrder: 0,
      createdAt: Date.now(),
    });
    return { tagged: true };
  },
});
