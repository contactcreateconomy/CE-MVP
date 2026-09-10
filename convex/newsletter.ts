/**
 * newsletter — SLICE-P7G-06: CAP-384/385/388/389.
 *
 * CAP-384 (quoted): "global overlay; single ask after first acquire only;
 *   unchecked; trigger-based copy 'No fixed schedule, no marketing';
 *   unsubscribe live BEFORE capture." Writes newsletterConsents.
 * CAP-385 (quoted): "terminal; never re-prompt; works pre-send."
 * CAP-388 (quoted): "Admin edits retention/activation levers on
 *   systemConfig (1–2 humans act Tuesday without deploy; audit)" — the
 *   M14 l.64 key set ONLY; no invented knobs; the existing /admin/config
 *   CAS path already audits (P3-07).
 * CAP-389 (quoted): "disable via config without deploy" — the tile
 *   disable key gates the read side.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

export const NEWSLETTER_COPY_VERSION = "trigger.v1"; // v1 = trigger-based (quoted)

/** The single-ask gate: the overlay shows ONLY after the first acquire
 *  and never once a consent row exists (any status). */
export const overlayState = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return { show: false };
    const existing = await ctx.db
      .query("newsletterConsents")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .take(1);
    if (existing.length > 0) return { show: false }; // never re-prompt (quoted)
    const acquires = await ctx.db
      .query("acquisitions")
      .filter((q: any) => q.eq(q.field("userId"), userId))
      .take(2);
    return { show: acquires.length >= 1 }; // after first acquire only (quoted)
  },
});

/** CAP-384 consent — the overlay's capture (unchecked default is the
 *  client's; the server records whatever was explicitly chosen). */
export const consent = mutation({
  args: { surface: v.string(), confirmed: v.boolean(), ipHash: v.optional(v.string()) },
  returns: v.object({ status: v.string() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("newsletter.consent: authentication required");
    const existing = await ctx.db
      .query("newsletterConsents")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .take(1);
    if (existing.length > 0) return { status: existing[0].status }; // single ask (quoted)
    // A declined ask still records terminal state — never re-prompt
    const status = args.confirmed ? "confirmed" : "unsubscribed";
    await ctx.db.insert("newsletterConsents", {
      userId,
      status: status as any,
      consentedAt: args.confirmed ? Date.now() : undefined,
      surface: args.surface,
      copyVersion: NEWSLETTER_COPY_VERSION,
      ipHash: args.ipHash,
      createdAt: Date.now(),
    });
    return { status };
  },
});

/** CAP-385 unsubscribe — terminal; works pre-send; never re-prompts. */
export const unsubscribe = mutation({
  args: {},
  returns: v.object({ status: v.string() }),
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("newsletter.unsubscribe: authentication required");
    const existing = await ctx.db
      .query("newsletterConsents")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .take(1);
    if (existing.length === 0) {
      // Pre-send safe (quoted): record terminal refusal with no prior consent
      await ctx.db.insert("newsletterConsents", {
        userId,
        status: "unsubscribed",
        surface: "unsubscribe_direct",
        copyVersion: NEWSLETTER_COPY_VERSION,
        unsubscribedAt: Date.now(),
        createdAt: Date.now(),
      });
      return { status: "unsubscribed" };
    }
    const row = existing[0];
    if (row.status === "unsubscribed") return { status: "unsubscribed" }; // idempotent
    await ctx.db.patch(row._id, { status: "unsubscribed", unsubscribedAt: Date.now() });
    return { status: "unsubscribed" };
  },
});
