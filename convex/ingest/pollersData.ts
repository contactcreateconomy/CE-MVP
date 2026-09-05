/**
 * pollersData — the internal mutations backing the ingestion pollers
 * (SLICE-P4-08). Split from pollers.ts because Convex only allows actions
 * in the "use node" runtime that safeFetchText requires, while these DB
 * loaders/writers run on the default runtime. Referenced via
 * internal.ingest.pollersData.* from the poller actions in pollers.ts.
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/** Due-config loader (shared by all cron pollers). */
export const loadDueConfigs = internalMutation({
  args: { method: v.string(), now: v.number() },
  handler: async (ctx, { method, now }) => {
    const configs = await ctx.db.query("ingestionConfigs").collect();
    const due = [];
    for (const config of configs) {
      if (config.method !== method) continue;
      if (config.nextPollAt !== undefined && config.nextPollAt > now) continue;
      const source = await ctx.db.get(config.sourceId);
      if (!source || source.trustLevel === "blocked") continue; // H-SRC sibling: blocked sources don't poll
      const dayStart = new Date(now); dayStart.setUTCHours(0, 0, 0, 0);
      const todaysItems = await ctx.db
        .query("sourceItems")
        .withIndex("by_sourceId", (q: any) => q.eq("sourceId", config.sourceId))
        .collect();
      const discoveredToday = todaysItems.filter((i: any) => i.discoveredAt >= dayStart.getTime()).length;
      due.push({
        config,
        source,
        budgetRemaining: config.maxRequestsPerDay - discoveredToday,
      });
    }
    return due;
  },
});

/** Hash-dedup probe (CAP-062 "hash dedup idempotent"). */
export const hasSourceItemHash = internalMutation({
  args: { contentHash: v.string() },
  handler: async (ctx, { contentHash }) => {
    const existing = await ctx.db
      .query("sourceItems")
      .withIndex("by_contentHash", (q: any) => q.eq("contentHash", contentHash))
      .first();
    const extraction = await ctx.db
      .query("contentExtractions")
      .withIndex("by_contentHash", (q: any) => q.eq("contentHash", contentHash))
      .first();
    return Boolean(existing || extraction);
  },
});

/** Insert a discovered item + its extraction row (the poller's two Writes
 *  per CAP-032). Extraction body fetching is bounded; failures record the
 *  extraction with failureCode rather than dropping the item. */
export const insertDiscoveredItem = internalMutation({
  args: {
    sourceId: v.id("sources"),
    canonicalUrl: v.string(),
    title: v.string(),
    contentHash: v.string(),
    publishedAt: v.optional(v.number()),
    requestedUrl: v.optional(v.string()),
    extractedText: v.optional(v.string()),
    extractionStatus: v.optional(v.string()),
    failureCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("sourceItems", {
      sourceId: args.sourceId,
      canonicalUrl: args.canonicalUrl,
      title: args.title,
      publishedAt: args.publishedAt,
      contentHash: args.contentHash,
      discoveredAt: Date.now(),
      status: args.extractedText ? "extracted" : args.failureCode ? "failed_extraction" : "discovered",
    });
    await ctx.db.insert("contentExtractions", {
      sourceId: args.sourceId,
      requestedUrl: args.requestedUrl ?? args.canonicalUrl,
      resolvedUrl: args.requestedUrl ?? args.canonicalUrl,
      extractionStatus: args.extractionStatus ?? (args.extractedText ? "ok" : "pending"),
      extractedTitle: args.title,
      extractedText: args.extractedText,
      publishedAt: args.publishedAt,
      contentHash: args.contentHash,
      extractorVersion: "rss-poller/1",
      failureCode: args.failureCode,
      createdAt: Date.now(),
    });
  },
});

/** Newsletter-config loader for the inbound webhook. */
export const loadNewsletterConfigs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db.query("ingestionConfigs").collect();
    const out = [];
    for (const config of configs) {
      if (config.method !== "newsletter") continue;
      const source = await ctx.db.get(config.sourceId);
      if (!source) continue;
      out.push({ config, source });
    }
    return out;
  },
});

/** Shared poll bookkeeping: mark config polled (+ failure counter). Actions
 *  cannot touch ctx.db, so this runs as a mutation invoked from the poller
 *  actions' recordPoll wrapper. */
export const recordPollState = internalMutation({
  args: {
    configId: v.id("ingestionConfigs"),
    success: v.boolean(),
    intervalMinutes: v.number(),
  },
  handler: async (ctx, { configId, success, intervalMinutes }) => {
    const config = await ctx.db.get(configId);
    if (!config) return;
    await ctx.db.patch(configId, {
      lastPolledAt: Date.now(),
      nextPollAt: Date.now() + intervalMinutes * 60_000,
      lastSuccessAt: success ? Date.now() : config.lastSuccessAt,
      consecutiveFailures: success ? 0 : config.consecutiveFailures + 1,
    });
  },
});
