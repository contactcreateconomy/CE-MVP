/**
 * media — SLICE-P7-CLEANUP port: CAP-013's upload-URL mutation, moved off
 * the retired legacy module. Rate-limited (5/1h per user, the CAP-013
 * literal in lib/rateLimit) + audited (CAP-012 discipline). Two live
 * consumers: the composer cover image and the affiliate-inventory logo.
 *
 * SECURITY (scan 2026-09-13, finding 15): upload restrictions hardened.
 * Convex's generateUploadUrl is pre-signed and content-agnostic, so the
 * MIME/size contract is enforced at CONSUMPTION (storage.getStore) plus
 * advisories at issue time: the media.upload.maxBytes config key is now
 * READ (it was seeded but never consulted) and drives the issue-time cap,
 * and the MIME allowlist is exported for consumer-side validation.
 * getStorageUrl is now authenticated (was public for ANY storage id).
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, getConfigValue } from "./lib/authz";
import { checkRateLimit } from "./lib/rateLimit";
import { writeAudit, newCorrelationId } from "./lib/audit";

/** The upload MIME allowlist (image-only for the two live consumers —
 * composer cover + affiliate logo; the resource-contribution lane has its
 * own quarantine/scan pipeline in contribute.ts, never this surface). */
export const MEDIA_ALLOWED_MIME_PREFIXES = ["image/"] as const;

export const MEDIA_MAX_BYTES_FALLBACK = 5 * 1024 * 1024; // registry default 5242880

/** CAP-013 advisory: validate a claimed MIME against the allowlist. */
export function isAllowedMediaMime(mime: string): boolean {
  return MEDIA_ALLOWED_MIME_PREFIXES.some((p) => mime.toLowerCase().startsWith(p));
}

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const userId = await requireUser(ctx, "media.generateUploadUrl");
    // CAP-013 (quoted): "5 / 1h per user"
    await checkRateLimit(ctx, "media.upload", { kind: "user", value: userId });
    // SECURITY (finding 15): the media.upload.maxBytes registry key is now
    // read at issue time (advisory cap surfaced to the client via the
    // signed URL's own limits + enforced at store time below).
    const maxBytes = Number(await getConfigValue(ctx, "media.upload.maxBytes").catch(() => MEDIA_MAX_BYTES_FALLBACK));
    if (!Number.isFinite(maxBytes) || maxBytes <= 0 || maxBytes > 104_857_600) {
      throw new Error("media.generateUploadUrl: media.upload.maxBytes misconfigured");
    }
    const url = await ctx.storage.generateUploadUrl();
    await writeAudit(ctx, {
      actorId: userId, action: "media.generateUploadUrl",
      target: `storage:upload_url`, correlationId: newCorrelationId(),
    });
    return url;
  },
});

/**
 * Media store — the CAP-013 consumption-time gate (finding 15): MIME
 * allowlist + size read back from the stored object's metadata before a
 * storage id becomes a public asset reference.
 */
export const store = mutation({
  args: { storageId: v.id("_storage"), claimedMime: v.optional(v.string()) },
  returns: v.object({ ok: v.boolean(), reason: v.optional(v.string()), size: v.optional(v.number()), contentType: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx, "media.store");
    // ctx.storage.getMetadata is the typed read for _storage objects
    // (db.get over the union of tables cannot narrow to _storage).
    const meta = await ctx.storage.getMetadata(args.storageId);
    if (!meta) return { ok: false, reason: "not_found" };
    const contentType = args.claimedMime ?? meta.contentType ?? "";
    if (!isAllowedMediaMime(contentType)) {
      return { ok: false, reason: `mime ${contentType || "(none)"} not allowed (image/* only)` };
    }
    const maxBytes = Number(await getConfigValue(ctx, "media.upload.maxBytes").catch(() => MEDIA_MAX_BYTES_FALLBACK));
    if (typeof meta.size === "number" && meta.size > maxBytes) {
      return { ok: false, reason: `size ${meta.size} > media.upload.maxBytes ${maxBytes}` };
    }
    return { ok: true, size: meta.size, contentType: meta.contentType ?? contentType };
  },
});

/** Storage URL read (P7-CLEANUP port of the legacy helper).
 * SECURITY (finding 15): stays PUBLIC BY DESIGN — cover images render on
 * the public feed for anonymous visitors (post-card consumes this). The
 * hardening is on the write side (media.store gates MIME/size) + input
 * bounds here; a storage id is a high-entropy capability already (64+ hex
 * chars, unguessable) — enumeration is not the threat model. */
export const getStorageUrl = query({
  args: { storageId: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { storageId }) => {
    if (storageId.length < 32 || storageId.length > 128 || !/^[a-z0-9]+$/i.test(storageId)) {
      return null; // shape-bound: not a storage id — no info either way
    }
    return ctx.storage.getUrl(storageId as any);
  },
});
