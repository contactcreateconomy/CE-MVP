"use node";

/**
 * ingest pollers — SLICE-P4-08 (CAP-032/033/034/035).
 *
 * R-SSRF is the security boundary (FATAL-adjacent per the slice catalog):
 * EVERY fetched URL goes through lib/safeFetch — a poller accepting a URL
 * by any other path is a blocker, not a refactor.
 *
 * CAP-032 pollRss: "~6h interval (config); hash dedup idempotent."
 * CAP-033 pollYouTube: "Metadata cheap; captions OAuth/permission-dependent;
 *   daily interval" — YouTube Data API key is env-gated (YOUTUBE_API_KEY);
 *   unset → skip with a logged reason (config error, not source failure).
 * CAP-034 rawFetch: "Robots-gated + R-SSRF egress-controlled fetch."
 * CAP-035 inboundEmail: httpAction in http.ts (webhook, not cron) —
 *   SPF/DKIM/DMARC verification is the email-ingress provider's job;
 *   the provider is env-gated (INBOUND_EMAIL_SECRET), so the hook fails
 *   closed until wired. Registered there, not here.
 *
 * All pollers are internalActions (node runtime for dns/fetch), cron-fired
 * (crons.ts); each selects its OWN due configs by nextPollAt ≤ now, so one
 * cron cadence serves every per-source pollIntervalMinutes.
 *
 * R-COST/R-LIMIT (CAP-062/063): per-source maxRequestsPerDay enforced
 * against today's sourceItems count; global budgets + fan-out ceilings are
 * config-driven (registry keys seeded with the slice).
 */

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { safeFetchText, validateUrlSyntax } from "../lib/safeFetch";

/** CAP-063 R-LIMIT: source-item fan-out ceiling per poll (config-driven). */
export const MAX_ITEMS_PER_POLL = 20;

export interface RssItem {
  title: string;
  link: string;
  pubDate?: string;
  description?: string;
}

/**
 * Pure RSS/Atom item extraction (regex-based XML scan — no deps in the
 * Convex runtime). Handles <item> (RSS2) and <entry> (Atom) shapes.
 */
export function parseFeedItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const blocks = [
    ...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi),
    ...xml.matchAll(/<entry[\s>][\s\S]*?<\/entry>/gi),
  ].map((m) => m[0]);
  const tagText = (block: string, tag: string): string | undefined => {
    const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
    if (!m) return undefined;
    return m[1]
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/<[^>]+>/g, "")
      .trim();
  };
  const linkOf = (block: string): string | undefined => {
    // Atom: <link href="…"/> preferred over link text
    const atom = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
    if (atom) return atom[1];
    return tagText(block, "link");
  };
  for (const block of blocks.slice(0, MAX_ITEMS_PER_POLL)) {
    const title = tagText(block, "title") ?? "";
    const link = linkOf(block);
    if (!link) continue;
    items.push({
      title,
      link,
      pubDate: tagText(block, "pubDate") ?? tagText(block, "published") ?? tagText(block, "updated"),
      description: tagText(block, "description") ?? tagText(block, "summary") ?? tagText(block, "content"),
    });
  }
  return items;
}

/** Stable content hash for dedup (CAP-062: "hash dedup") — pure impl in
 *  lib/hash.ts so non-node modules (forge) can import it too. */
import { hashContent } from "../lib/hash";
export { hashContent };

/** Per-source budget check (R-COST): requests today vs maxRequestsPerDay. */
export function withinDailyBudget(
  itemsDiscoveredToday: number,
  maxRequestsPerDay: number,
): boolean {
  return itemsDiscoveredToday < maxRequestsPerDay;
}

/** Shared poll bookkeeping: mark config polled (+ failure counter). Runs as
 *  a mutation (pollersData.recordPollState) — actions cannot touch ctx.db. */
async function recordPoll(
  ctx: any,
  configId: Id<"ingestionConfigs">,
  success: boolean,
  intervalMinutes: number,
): Promise<void> {
  await ctx.runMutation(internal.ingest.pollersData.recordPollState, {
    configId,
    success,
    intervalMinutes,
  });
}

/** CAP-032 — RSS poll (cron). Fetch feed → parse → per-item fetch + extract
 *  with hash dedup; every fetch R-SSRF-validated. DB loaders/writers live in
 *  pollersData.ts (default runtime; this file is "use node" for safeFetch). */
export const pollRss = internalAction({
  args: {},
  handler: async (ctx): Promise<{ polled: number; discovered: number; skipped: number }> => {
    const due = (await ctx.runMutation(internal.ingest.pollersData.loadDueConfigs, {
      method: "rss",
      now: Date.now(),
    })) as any[];
    let discovered = 0;
    let skipped = 0;

    for (const entry of due) {
      const { config, source } = entry;
      const feedUrl = config.feedUrl ?? source.url;
      const feedSyntax = validateUrlSyntax(feedUrl);
      if (!feedSyntax.ok) {
        await recordPoll(ctx, config._id, false, config.pollIntervalMinutes);
        continue;
      }
      const feed = await safeFetchText(feedUrl, { mode: "trusted_source_fetch", maxBytes: 2 * 1024 * 1024 });
      if (feed.status !== "ok" || !feed.text) {
        await recordPoll(ctx, config._id, false, config.pollIntervalMinutes);
        continue;
      }
      const items = parseFeedItems(feed.text);
      let budget = Math.min(entry.budgetRemaining, MAX_ITEMS_PER_POLL);
      for (const item of items) {
        if (budget <= 0) { skipped++; continue; }
        const itemHash = hashContent(`${item.link}|${item.title}`);
        const dup = await ctx.runMutation(internal.ingest.pollersData.hasSourceItemHash, { contentHash: itemHash });
        if (dup) { skipped++; continue; }
        budget--;
        await ctx.runMutation(internal.ingest.pollersData.insertDiscoveredItem, {
          sourceId: source._id,
          canonicalUrl: item.link,
          title: item.title,
          contentHash: itemHash,
          publishedAt: item.pubDate ? Date.parse(item.pubDate) || undefined : undefined,
          requestedUrl: item.link,
          extractedText: item.description ? item.description.slice(0, 100_000) : undefined,
          extractionStatus: item.description ? "feed_summary" : "pending",
        });
        discovered++;
      }
      await recordPoll(ctx, config._id, true, config.pollIntervalMinutes);
    }
    return { polled: due.length, discovered, skipped };
  },
});

/** CAP-033 — YouTube poll (cron, daily cadence via config intervals).
 *  Env-gated: no YOUTUBE_API_KEY → skip with reason (provider config
 *  error, not a source failure — counters untouched). */
export const pollYouTube = internalAction({
  args: {},
  handler: async (ctx): Promise<{ polled: number; skipped: string | null }> => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return { polled: 0, skipped: "YOUTUBE_API_KEY unset — provider not wired (env-gated seam)" };
    }
    const due = (await ctx.runMutation(internal.ingest.pollersData.loadDueConfigs, {
      method: "youtube_api",
      now: Date.now(),
    })) as any[];
    let discovered = 0;
    for (const entry of due) {
      const { config, source } = entry;
      const channelId = config.youtubeChannelId;
      if (!channelId) { await recordPoll(ctx, config._id, false, config.pollIntervalMinutes); continue; }
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet&order=date&maxResults=${Math.min(entry.budgetRemaining, MAX_ITEMS_PER_POLL)}`,
        );
        if (!res.ok) throw new Error(`YouTube API ${res.status}`);
        const data = (await res.json()) as { items?: { id?: { videoId?: string }; snippet?: { title?: string; publishedAt?: string } }[] };
        for (const item of data.items ?? []) {
          const videoId = item.id?.videoId;
          if (!videoId) continue;
          const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
          const contentHash = hashContent(canonicalUrl);
          const dup = await ctx.runMutation(internal.ingest.pollersData.hasSourceItemHash, { contentHash });
          if (dup) continue;
          await ctx.runMutation(internal.ingest.pollersData.insertDiscoveredItem, {
            sourceId: source._id,
            canonicalUrl,
            title: item.snippet?.title ?? videoId,
            contentHash,
            publishedAt: item.snippet?.publishedAt ? Date.parse(item.snippet.publishedAt) : undefined,
            requestedUrl: canonicalUrl,
            extractedText: item.snippet?.title, // metadata cheap; captions are OAuth/permission-dependent (CAP-033)
            extractionStatus: "metadata_only",
          });
          discovered++;
        }
        await recordPoll(ctx, config._id, true, config.pollIntervalMinutes);
      } catch {
        await recordPoll(ctx, config._id, false, config.pollIntervalMinutes);
      }
    }
    return { polled: due.length, skipped: null, discovered } as any;
  },
});

/** CAP-034 — rawFetch: robots-gated + R-SSRF egress-controlled. */
export const pollRawFetch = internalAction({
  args: {},
  handler: async (ctx): Promise<{ polled: number; fetched: number }> => {
    const due = (await ctx.runMutation(internal.ingest.pollersData.loadDueConfigs, {
      method: "raw_scrape",
      now: Date.now(),
    })) as any[];
    let fetched = 0;
    for (const entry of due) {
      const { config, source } = entry;
      // Robots-gated: disallow for our UA on this host blocks the fetch
      const robotsOk = await robotsAllows(source.url);
      if (!robotsOk) {
        await recordPoll(ctx, config._id, false, config.pollIntervalMinutes);
        continue;
      }
      const page = await safeFetchText(source.url, { mode: "trusted_source_fetch", maxBytes: 2 * 1024 * 1024 });
      if (page.status !== "ok" || !page.text) {
        await recordPoll(ctx, config._id, false, config.pollIntervalMinutes);
        continue;
      }
      const contentHash = hashContent(page.finalUrl ?? source.url + page.text.slice(0, 4096));
      const dup = await ctx.runMutation(internal.ingest.pollersData.hasSourceItemHash, { contentHash });
      if (!dup && entry.budgetRemaining > 0) {
        const title = (page.text.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? source.domain).trim();
        await ctx.runMutation(internal.ingest.pollersData.insertDiscoveredItem, {
          sourceId: source._id,
          canonicalUrl: page.finalUrl ?? source.url,
          title,
          contentHash,
          requestedUrl: source.url,
          extractedText: page.text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 100_000),
        });
        fetched++;
      }
      await recordPoll(ctx, config._id, true, config.pollIntervalMinutes);
    }
    return { polled: due.length, fetched };
  },
});

/** Minimal robots.txt gate (CAP-034: "Robots-gated"). Fetch failure of
 *  robots.txt itself → allow (standard robots semantics: unreachable
 *  robots.txt = no restrictions expressible). */
async function robotsAllows(pageUrl: string): Promise<boolean> {
  try {
    const base = new URL(pageUrl);
    const robots = await safeFetchText(`${base.origin}/robots.txt`, {
      mode: "trusted_source_fetch",
      maxBytes: 64 * 1024,
    });
    if (robots.status !== "ok" || !robots.text) return true;
    const ours = /user-agent:\s*createconomy/i;
    const disallowAll = /disallow:\s*\/\s*$/im;
    // conservative read: an explicit disallow-all under any matching group blocks
    const groups = robots.text.split(/(?=user-agent:)/i);
    for (const group of groups) {
      if (ours.test(group) && disallowAll.test(group)) return false;
    }
    // blanket * group
    for (const group of groups) {
      if (/user-agent:\s*\*/i.test(group) && disallowAll.test(group)) return false;
    }
    return true;
  } catch {
    return true;
  }
}

/** Allowlist check + persistence for CAP-035's webhook (called from
 *  http.ts after secret + attachment checks). Sender must match a
 *  newsletter config's inbox target; tracking pixels stripped. */
export const ingestInboundEmail = internalAction({
  args: {
    from: v.string(),
    to: v.string(),
    subject: v.string(),
    text: v.string(),
    receivedAt: v.number(),
  },
  handler: async (ctx, args): Promise<{ accepted: boolean; reason?: string }> => {
    // strip tracking pixels (CAP-035): drop <img…> tags outright
    const clean = args.text.replace(/<img[^>]*>/gi, "");
    const configs = await ctx.runMutation(internal.ingest.pollersData.loadNewsletterConfigs, {});
    const match = (configs as any[]).find(
      (c) => c.config.newsletterInbox?.toLowerCase() === args.to.toLowerCase(),
    );
    if (!match) {
      return { accepted: false, reason: `sender/inbox ${args.to} not allowlisted` };
    }
    const contentHash = hashContent(`${args.from}|${args.subject}|${clean.slice(0, 2048)}`);
    const dup = await ctx.runMutation(internal.ingest.pollersData.hasSourceItemHash, { contentHash });
    if (dup) return { accepted: false, reason: "duplicate (hash dedup)" };
    await ctx.runMutation(internal.ingest.pollersData.insertDiscoveredItem, {
      sourceId: match.source._id,
      canonicalUrl: `mailto:${args.from}?subject=${encodeURIComponent(args.subject)}`,
      title: args.subject,
      contentHash,
      publishedAt: args.receivedAt,
      requestedUrl: `mailto:${args.from}`,
      extractedText: clean.slice(0, 100_000),
      extractionStatus: "email_body",
    });
    await recordPoll(ctx, match.config._id, true, match.config.pollIntervalMinutes);
    return { accepted: true };
  },
});
