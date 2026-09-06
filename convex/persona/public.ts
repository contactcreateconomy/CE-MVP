/**
 * public — SLICE-P5-09: CAP-179/180/176/177/181 — the public persona
 * surfaces: /personas roster + persona profile + revival voting.
 *
 * CAP-180 E-H (quoted): "public query projection is bound to the genome
 *   public-safe allowlist … Sealed genome fields (exact prompt template,
 *   generation weights/parameters, internal rules, compiled
 *   `systemPrompt`) MUST NEVER appear in any public-facing query
 *   response." — every projection here is an explicit allowlist (never
 *   a spread of the row); "how this AI thinks" copy = identityCharter
 *   ONLY, never raw genome.
 * CAP-179: roster by lifecycle section (active / newly-arrived / waning
 *   / retired — "newly-arrived" is a display grouping over nascent,
 *   mapping flagged per contract OQ) + the human-vs-AI counter computed
 *   server-side from authorType (never names), personas excluded from
 *   human counts (CAP-434).
 * CAP-176 (quoted gates): "M7 posting trust tier + min account age; not
 *   staff/persona; rate-limited" + CAP-393 guard (assertCustomerCapability
 *   `revival_vote`) + Unique (userId, personaId) + "Brigading →
 *   suspicious spikes flagged" (a flagged note on the tally — detection
 *   is P7E moderation's; not invented here). Revival NEVER auto-fires —
 *   CAP-165 operator confirm is P5-10.
 * CAP-177: tally (votes exist; threshold config-keyed — flagged default).
 */

import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertCustomerCapability } from "../lib/authz";
import { checkRateLimit } from "../lib/rateLimit";

/** The E-H public-safe persona projection — the allowlist, nothing else. */
function publicPersona(p: any) {
  return {
    id: p._id,
    displayName: p.displayName,
    avatarAssetId: p.avatarAssetId ?? null,
    bio: p.bio,
    voice: p.voice,
    domain: p.domain,
    domainLevels: p.domainLevels,
    humorLevel: p.humorLevel,
    sarcasmLevel: p.sarcasmLevel, // labels only
    lifecycleStatus: p.lifecycleStatus,
    paused: p.paused,
  };
}

async function engagementCount(ctx: any, personaId: Id<"personas">): Promise<number> {
  const rows = await ctx.db
    .query("personaEngagements")
    .withIndex("by_personaId", (q: any) => q.eq("personaId", personaId))
    .take(200);
  return rows.length; // published-track-record count (bounded; approximation flagged)
}

/** CAP-179 — the Population page roster + server-computed counter. */
export const listRoster = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const all = await ctx.db.query("personas").withIndex("by_lifecycleStatus").order("desc").take(100);
    const sections = { active: [], newlyArrived: [], waning: [], retired: [] } as Record<string, any[]>;
    for (const p of all) {
      const card = { ...publicPersona(p), trackRecordCount: await engagementCount(ctx, p._id) };
      if (p.lifecycleStatus === "active") sections.active.push(card);
      else if (p.lifecycleStatus === "nascent") sections.newlyArrived.push(card); // display grouping — flagged mapping
      else if (p.lifecycleStatus === "waning") sections.waning.push(card);
      else if (p.lifecycleStatus === "retired") sections.retired.push(card);
      // draft personas are NOT public (population honesty starts at nascent) — flagged
    }

    // Human-vs-AI counter — server-side from authorType (CAP-434: personas
    // excluded from human counts); bounded recent window (v1: last 200)
    const recent = await ctx.db
      .query("comments")
      .withIndex("by_post_depth_created")
      .order("desc")
      .take(200);
    let human = 0;
    let ai = 0;
    for (const c of recent) {
      if (c.authorType === "user") human += 1;
      else if (c.authorType === "persona") ai += 1;
    }
    return { sections, counter: { human, ai } };
  },
});

/** CAP-180 — the persona profile (allowlist projection + track record +
 *  public lifecycle history). identityCharter is the "how this AI thinks"
 *  source; the genome is NEVER read into any returned field. */
export const getPersonaProfile = query({
  args: { personaId: v.id("personas") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const p = await ctx.db.get(args.personaId);
    if (!p || p.lifecycleStatus === "draft") return null; // drafts are not public
    const engagements = await ctx.db
      .query("personaEngagements")
      .withIndex("by_personaId", (q: any) => q.eq("personaId", args.personaId))
      .take(20);
    const trackRecord = [];
    for (const e of engagements) {
      if (!e.commentId) continue;
      const comment = await ctx.db.get(e.commentId);
      if (comment && !comment.deletedAt) {
        const seo = await ctx.db
          .query("postSeoMeta")
          .withIndex("by_postId", (q: any) => q.eq("postId", comment.postId))
          .unique();
        trackRecord.push({
          commentId: comment._id,
          postId: comment.postId,
          slug: seo?.slug ?? null,
          stanceSummary: e.stanceSummary,
          publishedAt: e.publishedAt ?? comment.createdAt,
        });
      }
    }
    const history = await ctx.db
      .query("personaLifecycleEvents")
      .withIndex("by_persona_created", (q: any) => q.eq("personaId", args.personaId))
      .order("desc")
      .take(12);
    return {
      ...publicPersona(p),
      identityCharter: p.identityCharter, // public "how this AI thinks" — never the genome
      trackRecord,
      lifecycleHistory: history.map((h) => ({
        eventType: h.eventType, fromStatus: h.fromStatus, toStatus: h.toStatus, createdAt: h.createdAt,
      })), // evidence/trigger internals stay server-side
    };
  },
});

/** CAP-176 — cast one revival vote. Gates (quoted): trust tier + min
 *  account age + not staff + CAP-393 guard + rate limit + unique pair +
 *  persona retired. N days + rate N are register-unnamed — flagged
 *  defaults (7 days, 5/day) documented as config rows. */
export const revivalVote = mutation({
  args: { personaId: v.id("personas") },
  returns: v.object({ voted: v.boolean(), alreadyVoted: v.optional(v.boolean()), reason: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("revival.vote: authentication required");
    await assertCustomerCapability(ctx, "revival_vote"); // CAP-393

    const persona = await ctx.db.get(args.personaId);
    if (!persona || persona.lifecycleStatus !== "retired") {
      throw new Error("revival.vote: persona is not retired");
    }
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("revival.vote: user not found");
    if (user.isStaff) return { voted: false, reason: "staff_excluded" };
    if (!user.trustTier) return { voted: false, reason: "trust_tier_required" };
    const MIN_ACCOUNT_AGE_DAYS = 7; // flagged default (register-unnamed)
    if (user.createdAt && Date.now() - user.createdAt < MIN_ACCOUNT_AGE_DAYS * 24 * 3_600_000) {
      return { voted: false, reason: "account_age" };
    }
    await checkRateLimit(ctx, "revival.vote", { kind: "user", value: userId });

    const existing = await ctx.db
      .query("personaRevivalVotes")
      .withIndex("by_persona_user", (q: any) => q.eq("retiredPersonaId", args.personaId).eq("userId", userId))
      .unique();
    if (existing) return { voted: true, alreadyVoted: true };

    await ctx.db.insert("personaRevivalVotes", {
      retiredPersonaId: args.personaId,
      userId,
      createdAt: Date.now(),
    });
    return { voted: true };
  },
});

/** CAP-177 — the tally (+ the member's own vote state). Threshold is
 *  config-keyed with a flagged default; revival NEVER fires from here. */
export const revivalTally = query({
  args: { personaId: v.id("personas") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const votes = await ctx.db
      .query("personaRevivalVotes")
      .withIndex("by_persona", (q: any) => q.eq("retiredPersonaId", args.personaId))
      .take(500);
    const REVIVAL_THRESHOLD = 25; // flagged default (register-unnamed; snapshot at CAP-165 approval)
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    const myVote = userId
      ? Boolean(await ctx.db
          .query("personaRevivalVotes")
          .withIndex("by_persona_user", (q: any) => q.eq("retiredPersonaId", args.personaId).eq("userId", userId))
          .unique())
      : false;
    return {
      count: votes.length,
      threshold: REVIVAL_THRESHOLD,
      thresholdMet: votes.length >= REVIVAL_THRESHOLD,
      myVote,
      note: "Revival is operator-confirmed — community demand never auto-revives (CAP-165).",
    };
  },
});
