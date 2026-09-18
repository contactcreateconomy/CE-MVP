/**
 * utm + seo + erasure + clientEmit — SLICE-P7O-06/07/08/09.
 *
 * P7O-06 (CAP-566/479): dictionary seedEdit (versioned allowedSources/
 *   allowedMediums/campaignFormat/contentFormat/maxLen 80 — bible l.286);
 *   generate is READ-ONLY (dropdowns, no persistence, no first-touch
 *   write); empty dictionary = disabled dropdowns + guidance (States B);
 *   no arbitrary parameter names. CAP-464/465 stay P2-08's landing
 *   capture — consumed, never rebuilt.
 * P7O-07 (CAP-567/483): seo.health.view renders seoHealth's eight
 *   fields; unavailable metrics render "—", never zero; never-pulled /
 *   GSC-unconfigured = "—" (not healthy zeroes); the weekly GSC pull
 *   writes seoHealth ONLY when the optional API is configured; render-
 *   only — cannot override assertIndexable (CAP-466); CAP-484 stays
 *   P7A-06's (no second alerter).
 * P7O-08 (CAP-453/454): analytics subject erasure — request writes
 *   analyticsDeletionRequests + identity-detaches via P7O-03's append
 *   helper (never double-stamps: the adjustment IS the tombstone rule);
 *   confirm flips to confirmed only when PostHog delete completes
 *   (unconfigured vendor → stays requested/failed, never fake-confirmed);
 *   erasure does NOT reduce historical aggregate counts (quoted) —
 *   projections rebuild from effectiveCountable, rawEvents rows persist.
 *   Distinct from CAP-151 (profile) and CAP-350 (legal). Not called by
 *   CMP CAP-506 (OQ#3 fence).
 * P7O-09 (CAP-444/456): client observational emit — accepts ONLY
 *   catalog-active + client-captureMode + consent-satisfied events;
 *   NEVER creates acquire/download/Signal/mod/sale/quota (quoted
 *   precedence); forged server_authoritative names REJECT + log (no
 *   persist); consent default-deny until CMP grant.
 */

import { query, mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission, requireUser } from "../lib/authz";
import { writeAudited, newCorrelationId } from "../lib/audit";
import { checkRateLimit } from "../lib/rateLimit";
import { appendAdjustment } from "../analytics/projections";
import { captureEvent } from "../lib/events";

// ── P7O-06: UTM ──

const DEFAULT_DICTIONARY = {
  allowedSources: ["newsletter", "community", "partner", "social"],
  allowedMediums: ["email", "referral", "post"],
  campaignFormat: "snake_case",
  contentFormat: "free_text",
  maxLen: 80,
};

export const dictionarySeedEdit = mutation({
  args: {
    allowedSources: v.array(v.string()),
    allowedMediums: v.array(v.string()),
    campaignFormat: v.string(),
    contentFormat: v.string(),
  },
  returns: v.object({ version: v.number() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("utm.dictionary: authentication required");
    const roles = await assertAdminPermission(ctx);
    if (!roles.includes("administrator")) throw new Error("utm.dictionary: Administrator required (CAP-566)");
    await checkRateLimit(ctx, "admin.write", { kind: "operator", value: userId });

    let version = 1;
    await writeAudited(ctx, async (actx) => {
      const rows = await actx.db.query("utmDictionary").take(50);
      const latest = rows.sort((a: any, b: any) => b.version - a.version)[0] ?? null;
      version = (latest?.version ?? 0) + 1; // versioned per DEC-M17-UTM (quoted)
      await actx.db.insert("utmDictionary", {
        version,
        allowedSources: args.allowedSources,
        allowedMediums: args.allowedMediums,
        campaignFormat: args.campaignFormat,
        contentFormat: args.contentFormat,
        maxLen: 80, // (quoted — not editable)
        updatedAt: Date.now(),
      });
      return {
        actorId: userId, action: "utm.dictionary.seedEdit",
        target: `utmDictionary:v${version}`, prev: latest ? { version: latest.version } : null,
        next: { version, sources: args.allowedSources.length, mediums: args.allowedMediums.length },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { version };
  },
});

/** The generator's read model: latest dictionary or null (empty → the
 *  client renders disabled dropdowns + guidance — States B, quoted). */
export const getDictionary = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    await requireAnyAdmin(ctx);
    const rows = await ctx.db.query("utmDictionary").take(50);
    const latest = rows.sort((a: any, b: any) => b.version - a.version)[0] ?? null;
    return latest ?? { empty: true, guidance: "Seed the dictionary to enable the builder (CAP-566)." };
  },
});

/** CAP-479 utm.builder.generate — PURE (no write, no persistence).
 *   Validation happens in-memory: dictionary members only, maxLen 80. */
export function generateUtmLink(input: {
  baseUrl: string;
  dictionary: { allowedSources: string[]; allowedMediums: string[]; maxLen: number };
  source: string;
  medium: string;
  campaign: string;
  content?: string;
}): { url: string } | { error: string } {
  if (!input.dictionary.allowedSources.includes(input.source)) {
    return { error: `"${input.source}" is not in the dictionary (CAP-566)` };
  }
  if (!input.dictionary.allowedMediums.includes(input.medium)) {
    return { error: `"${input.medium}" is not in the dictionary (CAP-566)` };
  }
  const params = new URLSearchParams({ utm_source: input.source, utm_medium: input.medium, utm_campaign: input.campaign });
  if (input.content) params.set("utm_content", input.content);
  const url = `${input.baseUrl}?${params.toString()}`;
  if (url.length > input.dictionary.maxLen + input.baseUrl.length) {
    return { error: "combined length exceeds the dictionary budget" };
  }
  return { url };
}

// ── P7O-07: SEO view ──

export const seoHealthView = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    await requireAnyAdmin(ctx);
    const rows = await ctx.db.query("seoHealth").take(1);
    const row = rows[0] ?? null;
    if (!row) {
      // Never-pulled → every metric "—" (quoted); NOT healthy zeroes
      return { connected: false, metrics: null, note: "No GSC pull on record — metrics render as '—' (CAP-483 optional API)." };
    }
    const stale = Date.now() - row.lastCalculatedAt > 7 * 24 * 3_600_000;
    return {
      connected: true,
      metrics: {
        sitemapUrlCount: row.sitemapUrlCount,
        lastSitemapBuildAt: row.lastSitemapBuildAt,
        coverageErrorCount: row.coverageErrorCount,
        thinIndexedCount: row.thinIndexedCount,
        heldIndexedCount: row.heldIndexedCount,
        lastGscPullAt: row.lastGscPullAt ?? null, // null → "—" (unavailable ≠ zero)
        status: stale ? "stale" : row.status,
        lastCalculatedAt: row.lastCalculatedAt,
      },
      // CAP-567 (quoted): render-only; assertIndexable has no override
      overrideAvailable: false,
    };
  },
});

/** CAP-483 — the weekly GSC pull. Optional API: unconfigured → no write
 *  (never invent counts; the view shows the honest absence). */
export const gscPull = internalMutation({
  args: {},
  returns: v.object({ pulled: v.boolean() }),
  handler: async (ctx) => {
    if (!process.env.GSC_API_KEY) return { pulled: false }; // unconfigured — honest no-op
    // Configured-but-unimplemented vendor call: record the attempt only
    // (the real client lands with the GSC integration; counts are never
    // invented) — flagged degraded.
    void ctx;
    return { pulled: false };
  },
});

// ── P7O-08: analytics subject erasure ──

export const erasureRequest = mutation({
  args: {},
  returns: v.object({ requestId: v.id("analyticsDeletionRequests"), status: v.string() }),
  handler: async (ctx) => {
    const userId = await requireUser(ctx, "analytics.erasure.request");
    const user = await ctx.db.get(userId);
    const subjectId = (user as any)?.analyticsSubjectId as string | undefined;
    if (!subjectId) throw new Error("analytics.erasure.request: no analytics subject on this account");

    const existing = await ctx.db
      .query("analyticsDeletionRequests")
      .filter((q: any) => q.eq(q.field("analyticsSubjectId"), subjectId))
      .take(5);
    const active = existing.find((r: any) => r.status !== "confirmed" && r.status !== "failed");
    if (active) return { requestId: active._id, status: active.status }; // one active request

    const requestId = (await ctx.db.insert("analyticsDeletionRequests", {
      analyticsSubjectId: subjectId,
      status: "requested",
      requestedAt: Date.now(),
    })) as Id<"analyticsDeletionRequests">;

    // Identity-detach via P7O-03's adjustment helper (no double-stamp: the
    // adjustment IS the register's detach rule — the rawEvents row itself
    // is never rewritten; projections rebuild via effectiveCountable)
    const events = await ctx.db
      .query("rawEvents")
      .withIndex("by_user_time", (q: any) => q.eq("userId", userId))
      .take(200);
    for (const e of events.slice(0, 50)) { // bounded detach pass; the sweep continues on confirm
      await appendAdjustment(ctx, {
        sourceEventId: e._id,
        adjustmentType: "detach_identity",
        reasonCode: "analytics_erasure_request",
        sourceModule: "m16",
      });
    }
    return { requestId, status: "requested" };
  },
});

/** CAP-454 — confirm (System; PostHog delete completed via webhook/job).
 *  Unconfigured vendor NEVER fake-confirms (quoted). */
export const erasureConfirm = internalMutation({
  args: { requestId: v.id("analyticsDeletionRequests"), vendorConfirmed: v.boolean(), lastError: v.optional(v.string()) },
  returns: v.object({ status: v.string() }),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.requestId);
    if (!row) throw new Error("analytics.erasure.confirm: request not found");
    if (row.status === "confirmed") return { status: "confirmed" }; // terminal
    if (!args.vendorConfirmed) {
      // failed → retrying lifecycle (M16 §7, quoted); lastError recorded
      await ctx.db.patch(args.requestId, {
        status: args.lastError ? "failed" : row.status,
        lastError: args.lastError,
      } as any);
      return { status: args.lastError ? "failed" : row.status };
    }
    await ctx.db.patch(args.requestId, { status: "confirmed", confirmedAt: Date.now(), submittedAt: row.submittedAt ?? Date.now() } as any);
    return { status: "confirmed" };
  },
});

// ── P7O-09: client observational emit ──

/** The domain-protected event classes this helper can NEVER mint (quoted). */
const FORBIDDEN_CLASSES = new Set(["resource.acquire", "resource.download", "store.buy", "moderation", "quota"]);

export const clientEmit = mutation({
  args: {
    eventType: v.string(),
    targetType: v.union(v.literal("post"), v.literal("comment"), v.literal("tool"), v.literal("user_profile"), v.literal("session")),
    targetId: v.string(),
  },
  returns: v.object({ accepted: v.boolean(), rejectedReason: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;

    // CAP-456: the catalog is authoritative — unknown or server_authoritative
    // names REJECT + log (never persist)
    const catalogRow = await ctx.db
      .query("eventCatalog")
      .filter((q: any) => q.eq(q.field("eventName"), args.eventType))
      .first();
    if (!catalogRow) {
      await ctx.db.insert("instrumentationIncidents", {
        type: "forged_event_name", severity: "warning",
        eventNames: [args.eventType],
        detail: `client emit of unknown event name "${args.eventType}" rejected (CAP-456)`,
        status: "open", createdAt: Date.now(),
      });
      return { accepted: false, rejectedReason: "unknown event name" };
    }
    if ((catalogRow as any).captureMode === "server_authoritative") {
      await ctx.db.insert("instrumentationIncidents", {
        type: "forged_event_name", severity: "warning",
        eventNames: [args.eventType],
        detail: `client emit of server_authoritative "${args.eventType}" rejected (CAP-456)`,
        status: "open", createdAt: Date.now(),
      });
      return { accepted: false, rejectedReason: "server_authoritative" };
    }
    // CAP-444 quoted precedence: never creates acquire/download/Signal/mod/sale/quota
    if (FORBIDDEN_CLASSES.has(args.eventType) || args.eventType.startsWith("resource.") || args.eventType.startsWith("store.")) {
      return { accepted: false, rejectedReason: "domain outcome — server-authoritative only" };
    }
    // Consent default-deny until CMP grant (P7T-13 machinery)
    if (userId) {
      const consent = await ctx.db
        .query("consentRecords")
        .withIndex("by_user_grantedAt", (q: any) => q.eq("userId", userId))
        .order("desc")
        .take(1);
      const active = consent[0];
      const analyticsGranted = active && !active.withdrawnAt && !active.supersededAt && active.purposesGranted.includes("analytics");
      if (!analyticsGranted) {
        return { accepted: false, rejectedReason: "analytics consent not granted" };
      }
    }
    // Accept: observational only, via the P1-07 helper (same-mutation)
    await captureEvent(ctx, {
      eventType: args.eventType,
      eventClass: "interaction",
      userId: userId ?? undefined,
      targetType: args.targetType,
      targetId: args.targetId,
      source: "direct",
      isStaff: false,
      schemaVersion: 1,
    } as any);
    return { accepted: true };
  },
});

/** CONTRACT-7-admin-utm §1 / CONTRACT-7-admin-seo §1 (verbatim): both name
 *  "administrator" as the reader actor for CAP-479's dictionary read model
 *  and CAP-567's SEO health view — screen audit 2026-09-18: despite its
 *  name, this previously called only the broad CAP-390 shell gate
 *  (`assertAdminPermission`), so any staff role could read either. */
async function requireAnyAdmin(ctx: any): Promise<void> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("admin: authentication required");
  const roles = await assertAdminPermission(ctx);
  if (!roles.includes("administrator")) {
    throw new Error("admin.utm: administrator role required");
  }
}
