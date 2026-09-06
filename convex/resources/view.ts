/**
 * view — SLICE-P6-08: CAP-211 — the sandboxed resource viewer
 * (/resources/[slug]/view).
 *
 * Contract (quoted): serve "only the platform-forged clean PDF artifact,
 *   never original user reference bytes" — the URL resolves the CURRENT
 *   resourceVersion's clean-bucket asset; quarantine keys are never
 *   reachable from this module. "View ≠ quota" (INV-6 / DEC-S15): the
 *   view path writes NO acquisition and NO ledger row (cross-tested vs
 *   P6-07). rawEvents: "view event only — NOT acquisitions" — the
 *   catalog-owned name resources.viewed (flagged; consent-free class).
 * Teaser content for anonymous is DEC-M10-VIEW-AUTH — FENCED: the
 *   anonymous branch renders an honest sign-in prompt, no invented
 *   page-count/first-page/watermark mechanics. Flag-off (OQ5):
 *   fail-closed — the route reports disabled, never the PDF.
 */

import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { captureEvent } from "../lib/events";

export const RESOURCE_VIEW_EVENT_ROW = {
  schemaVersion: 1,
  eventClass: "interaction" as const,
  ownerModule: "m10",
  description: "Member opens the sandboxed resource viewer (CAP-211)",
  captureMode: "same_mutation",
  piiClass: "none",
  consentGate: "strictly_necessary",
  signalEligible: false,
  s18Eligible: false,
  excludeStaff: false,
  excludePersonas: false,
  idempotencyScope: "none",
  retentionClass: "standard",
  posthogMirror: false,
  status: "active" as const,
  effectiveFrom: Date.now(),
  owner: "m10",
  eventName: "resources.viewed",
};

/** The viewer state: flag → resource → version → (member) clean URL.
 *  Anonymous gets the teaser branch (fenced content — a sign-in prompt). */
export const getViewerState = query({
  args: { slug: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const flag = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q: any) => q.eq("key", "resources.view.enabled"))
      .first();
    if (flag && flag.value === false) return { enabled: false }; // fail-closed (OQ5)

    const resource = await ctx.db
      .query("resources")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .unique();
    if (!resource || resource.status !== "published" || !resource.currentVersionId) return { enabled: true, notFound: true };

    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    const base = {
      enabled: true,
      title: resource.title,
      attributionLine: resource.attributionLine,
      forgeDisclosure: resource.forgeDisclosure,
    };
    if (!userId) {
      return { ...base, teaser: true }; // DEC-M10-VIEW-AUTH fenced — honest prompt only
    }
    const version = (await ctx.db.get(resource.currentVersionId)) as any;
    if (!version?.fileAssetId) return { ...base, notFound: true };
    // The acquisition gate: viewing requires the resource in the library
    // (view ≠ quota, but the viewer is a member benefit downstream of
    // acquire — the URL itself is the CAP-213 download surface's twin)
    const acquisition = await ctx.db
      .query("acquisitions")
      .withIndex("by_user_resource", (q: any) => q.eq("userId", userId).eq("resourceId", resource._id))
      .unique();
    if (!acquisition) return { ...base, requiresAcquisition: true };
    return { ...base, assetId: version.fileAssetId, teaser: false };
  },
});

/** The signed-URL fetch (mutation: getUrl) + the view event. The sandbox
 *  iframe + CSP live on the route; this returns the clean-bucket URL only. */
export const getViewUrl = mutation({
  args: { slug: v.string() },
  returns: v.object({ url: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("viewer: authentication required");
    const resource = await ctx.db
      .query("resources")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .unique();
    if (!resource?.currentVersionId) throw new Error("viewer: not found");
    const version = (await ctx.db.get(resource.currentVersionId)) as any;
    if (!version?.fileAssetId) throw new Error("viewer: no current clean artifact");
    const url = await ctx.storage.getUrl(version.fileAssetId);

    // View event ONLY (quoted) — never an acquisition, never quota
    await captureEvent(ctx, {
      eventType: "resources.viewed",
      schemaVersion: 1,
      eventClass: "interaction",
      userId,
      targetType: "session",
      targetId: resource._id,
      source: "direct",
      isStaff: false,
      isPersona: false,
      isCountableAtWrite: false,
    } as any);
    return { url: url ?? undefined };
  },
});
