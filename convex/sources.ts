/**
 * sources — SLICE-P4-08: the Source Console backend (CAP-538 list +
 * CAP-031 register/edit + minimal block/unblock).
 *
 * CAP-538: "the table-load query … without it the console has nothing to
 * render" — sources rows + the latest ingestionConfigs row per source
 * (health columns are display-side joins; CAP-538's Reads column is
 * `sources` only — the join rides the same public surface).
 *
 * CAP-031 (register-unnamed — contract OQ#1): named `sourceUpsert`
 * in-slice, flagged. Actor column = Publisher (trigger text adds Admin) —
 * gate: publisher OR administrator (Wave-4 minimal role check; M15 shell
 * wraps at Wave 7). Writes sources + ingestionConfigs + auditLog
 * (fail-closed via writeAudited, CAP-426).
 *
 * R-SSRF ingress (CAP-061, quoted): "HTTPS-only; reject private/reserved/
 * link-local/loopback/cloud-metadata IPs; revalidate IP each redirect hop;
 * cap redirects + size; block creds + nonstandard ports. Validated at
 * registration AND each fetch." Registration-time validation splits in
 * two: SYNTACTIC checks (https/creds/port) run in the mutation (pure);
 * DNS+IP resolution needs node runtime → `validateSourceUrl` (public
 * action, Publisher-gated) runs the full check and the console calls it
 * before upsert. Every FETCH re-validates via safeFetch regardless.
 *
 * Config edit semantics (contract OQ#2) resolved in-slice: a config edit
 * APPENDS a new ingestionConfigs row (">1 config over time" is history)
 * and the previous row is left intact; the latest row by createdAt wins.
 *
 * Block/unblock (Wave-4 E2): trustLevel including `blocked`; the CAP-059
 * takedown fields exist on the entity but are NOT written here.
 */

import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission } from "./lib/authz";
import { writeAudited, newCorrelationId } from "./lib/audit";
import { validateUrlSyntax, safeFetch } from "./lib/safeFetch";

/** CAP-031 Actor=Publisher; trigger adds Admin. */
async function assertPublisherOrAdmin(ctx: any): Promise<Id<"users">> {
  const roles = await assertAdminPermission(ctx);
  if (!roles.includes("publisher") && !roles.includes("administrator")) {
    throw new Error("sources: Publisher/Admin role required (CAP-031)");
  }
  const userId = (await getAuthUserId(ctx)) as Id<"users">;
  if (!userId) throw new Error("sources: authentication required");
  return userId;
}

/** CAP-538 — the console table load. */
export const listSources = query({
  args: {},
  handler: async (ctx) => {
    const sources = await ctx.db.query("sources").collect();
    const withHealth = [];
    for (const source of sources) {
      const configs = await ctx.db
        .query("ingestionConfigs")
        .withIndex("by_sourceId", (q: any) => q.eq("sourceId", source._id))
        .collect();
      const latest = configs.sort((a: any, b: any) => b.createdAt - a.createdAt)[0] ?? null;
      withHealth.push({
        _id: source._id,
        url: source.url,
        domain: source.domain,
        trustLevel: source.trustLevel,
        createdAt: source.createdAt,
        config: latest && {
          method: latest.method,
          feedUrl: latest.feedUrl,
          youtubeChannelId: latest.youtubeChannelId,
          newsletterInbox: latest.newsletterInbox,
          pollIntervalMinutes: latest.pollIntervalMinutes,
          lastPolledAt: latest.lastPolledAt,
          lastSuccessAt: latest.lastSuccessAt,
          nextPollAt: latest.nextPollAt,
          consecutiveFailures: latest.consecutiveFailures,
          maxRequestsPerDay: latest.maxRequestsPerDay,
          robotsStatus: latest.robotsStatus,
          rightsBasis: latest.rightsBasis,
          termsReviewStatus: latest.termsReviewStatus,
        },
      });
    }
    return withHealth;
  },
});

/** Registration-time full R-SSRF validation (DNS + IP) — action-only (node
 *  dns). The console calls this before upsert; the mutation independently
 *  enforces the syntactic layer so no path skips it. */
export const validateSourceUrl = action({
  args: { url: v.string() },
  handler: async (_ctx, { url }): Promise<{ ok: boolean; reason?: string; domain?: string }> => {
    const syntax = validateUrlSyntax(url);
    if (!syntax.ok) return { ok: false, reason: syntax.reason };
    const probe = await safeFetch(url, { mode: "trusted_source_fetch", maxBytes: 64 * 1024 });
    if (probe.status === "blocked" || probe.status === "error") {
      return { ok: false, reason: probe.reason ?? `${probe.status} (R-SSRF ingress)` };
    }
    return { ok: true, domain: new URL(url).hostname };
  },
});

const METHOD_VALUES = ["rss", "youtube_api", "newsletter", "raw_scrape", "operator_paste"] as const;

const configFieldsValidator = v.object({
  method: v.union(...METHOD_VALUES.map((m) => v.literal(m))),
  feedUrl: v.optional(v.string()),
  youtubeChannelId: v.optional(v.string()),
  newsletterInbox: v.optional(v.string()),
  pollIntervalMinutes: v.number(),
  maxRequestsPerDay: v.number(),
  robotsStatus: v.string(),
  rightsBasis: v.string(),
  termsReviewStatus: v.string(),
});

/** Method-dependent field presence (contract §3: which optional fields the
 *  form exposes per method). */
function validateConfigFields(config: {
  method: string;
  feedUrl?: string;
  youtubeChannelId?: string;
  newsletterInbox?: string;
}): void {
  const required: Record<string, string | undefined> = {
    rss: config.feedUrl,
    youtube_api: config.youtubeChannelId,
    newsletter: config.newsletterInbox,
  };
  const need = required[config.method];
  if (need === undefined) {
    throw new Error(`sourceUpsert: method ${config.method} requires its method-specific field (contract §3)`);
  }
  if (config.method === "rss" || config.method === "youtube_api") {
    if (config.feedUrl !== undefined) {
      const syntax = validateUrlSyntax(config.feedUrl);
      if (!syntax.ok) throw new Error(`sourceUpsert: feedUrl ${syntax.reason}`);
    }
  }
}

/** CAP-031 — register/edit (register-unnamed; named sourceUpsert, flagged).
 *  Edit semantics: sources row updated in place; config edits APPEND. */
export const sourceUpsert = mutation({
  args: {
    sourceId: v.optional(v.id("sources")), // absent = register
    url: v.string(),
    trustLevel: v.union(v.literal("approved"), v.literal("blocked"), v.literal("conditional")),
    config: v.optional(configFieldsValidator),
  },
  handler: async (ctx, args) => {
    const actorId = await assertPublisherOrAdmin(ctx);

    // R-SSRF syntactic layer — enforced in the mutation, no path skips it
    const syntax = validateUrlSyntax(args.url);
    if (!syntax.ok) throw new Error(`sourceUpsert: ${syntax.reason}`);
    const domain = new URL(args.url).hostname;
    if (args.config) validateConfigFields(args.config);

    return await writeAudited(ctx, async (actx) => {
      let sourceId = args.sourceId;
      if (!sourceId) {
        sourceId = (await actx.db.insert("sources", {
          url: args.url,
          domain,
          trustLevel: args.trustLevel,
          createdAt: Date.now(),
        })) as Id<"sources">;
      } else {
        await actx.db.patch(sourceId, { url: args.url, domain, trustLevel: args.trustLevel });
      }

      if (args.config) {
        // APPEND (history preserved — ">1 config over time"); latest wins.
        await actx.db.insert("ingestionConfigs", {
          sourceId,
          ...args.config,
          consecutiveFailures: 0,
          nextPollAt: Date.now(),
          createdAt: Date.now(),
        });
      }

      return {
        actorId,
        role: "publisher",
        action: "sources.upsert",
        target: `source:${sourceId}`,
        prev: null,
        next: { url: args.url, trustLevel: args.trustLevel, config: args.config ? args.config.method : undefined },
        correlationId: newCorrelationId(),
        reversible: true,
      };
    });
  },
});

/** Wave-4 E2 — minimal block/unblock toggle (trustLevel including blocked;
 *  CAP-059's takedown workflow is Wave 7 and is NOT written here). */
export const setTrustLevel = mutation({
  args: {
    sourceId: v.id("sources"),
    trustLevel: v.union(v.literal("approved"), v.literal("blocked"), v.literal("conditional")),
  },
  handler: async (ctx, args) => {
    const actorId = await assertPublisherOrAdmin(ctx);
    const source = await ctx.db.get(args.sourceId);
    if (!source) throw new Error("sources.setTrustLevel: not found");

    return await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.sourceId, { trustLevel: args.trustLevel });
      return {
        actorId,
        role: "publisher",
        action: "sources.setTrustLevel",
        target: `source:${args.sourceId}`,
        prev: { trustLevel: source.trustLevel },
        next: { trustLevel: args.trustLevel },
        correlationId: newCorrelationId(),
        reversible: true,
      };
    });
  },
});
