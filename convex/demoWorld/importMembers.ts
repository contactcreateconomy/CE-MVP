/** demoWorld/importMembers — 500 demo members as full canonical users
 * (CR-011 §1; `seed/demo.ts` pattern: canonicalSignupFields + engaged
 * overrides). Backdated `createdAt`/`lastActiveAt` (join spread 180d before
 * world start). Emails are @demo.createconomy.invalid; no auth accounts.
 * devtest is NOT created here — it already exists (dev/ensureTestUser). */
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { canonicalSignupFields } from "../lib/founder";
import { normalizeHandle } from "../lib/handle";
import { guard, register, batchId, findUserByEmail } from "./lib";

export const importMembers = internalMutation({
  args: {
    seq: v.number(),
    worldEnd: v.number(),
      rows: v.array(v.object({
        handle: v.string(),
        name: v.string(),
        email: v.string(),
        bio: v.string(),
        joinOffsetMs: v.number(), // negative, from world end
        lastActiveOffsetMs: v.optional(v.number()),
        verified: v.boolean(),
        displayName: v.optional(v.string()),
      })),
  },
  returns: v.object({ inserted: v.number(), skipped: v.number() }),
  handler: async (ctx, args) => {
    guard();
    const batch = batchId("members", args.seq);
    let inserted = 0;
    let skipped = 0;
    for (const m of args.rows) {
      if (await findUserByEmail(ctx, m.email)) { skipped += 1; continue; }
      const username = normalizeHandle(m.handle);
      const createdAt = args.worldEnd + m.joinOffsetMs;
      const id = await ctx.db.insert("users", {
        ...canonicalSignupFields(m.email, m.name),
        handle: username,
        username,
        usernameNormalized: username,
        displayName: m.displayName ?? m.name,
        bio: m.bio,
        bootstrapState: "complete",
        postingEligibilityState: "eligible",
        basicProfileComplete: true,
        onboardingState: "engaged",
        activationQuality: "standard",
        emailVerified: m.verified,
        createdAt,
        lastActiveAt: args.worldEnd + (m.lastActiveOffsetMs ?? Math.max(m.joinOffsetMs, -30 * 86_400_000)),
        postCount: 0,
        approvedCommentCount: 0,
        completionBadges: ["email_verified", "basic_profile_complete"],
        activationProgress: {
          emailVerified: true, mobileVerified: false, profileComplete: true,
          firstPostPublished: true, firstCommentPosted: true,
          firstReactionGiven: true, firstFollowMade: true,
        },
      });
      await register(ctx, "users", id, batch);
      inserted += 1;
    }
    return { inserted, skipped };
  },
});

/** Patch per-user counters from the imported content (post/comment tallies
 * never hand-set — they equal the imported rows; run after posts+comments). */
export const finalizeMemberCounts = internalMutation({
  args: { seq: v.number() },
  returns: v.object({ patched: v.number() }),
  handler: async (ctx, _args) => {
    guard();
    let patched = 0;
    const registry = await ctx.db.query("demoRegistry").withIndex("by_table", (q: any) => q.eq("table", "users")).collect();
    for (const r of registry) {
      const userId = r.docId as any;
      const posts = await ctx.db.query("posts").withIndex("by_author_type_authorUserId", (q: any) => q.eq("authorType", "user").eq("authorUserId", userId)).collect();
      const comments = await ctx.db.query("comments").withIndex("by_author_type_authorUserId", (q: any) => q.eq("authorType", "user").eq("authorUserId", userId)).collect();
      await ctx.db.patch(userId, {
        postCount: posts.length,
        approvedCommentCount: comments.filter((c: any) => c.moderationStatus === "passed").length,
      });
      patched += 1;
    }
    return { patched };
  },
});

/** Final-run Rising cohort: re-date selected existing members to recent
 * joins (createdAt) with fresh lastActiveAt — they are the members "who
 * joined recently and are climbing" for the Podium Rising category.
 * Patches only; no new rows, no registry writes. */
export const adjustJoinDates = internalMutation({
  args: {
    seq: v.optional(v.number()),
    worldEnd: v.number(),
    rows: v.array(v.object({ userEmail: v.string(), joinOffsetMs: v.number() })),
  },
  returns: v.object({ patched: v.number() }),
  handler: async (ctx, args) => {
    guard();
    let patched = 0;
    for (const r of args.rows) {
      const uid = await findUserByEmail(ctx, r.userEmail);
      if (!uid) continue;
      const at = args.worldEnd + r.joinOffsetMs;
      // deterministic replay: active half-way between join and world end
      await ctx.db.patch(uid, { createdAt: at, lastActiveAt: at - Math.floor(r.joinOffsetMs / 2) });
      patched += 1;
    }
    return { patched };
  },
});

/** Final-run edge-case pass: rename selected members to authentic non-Latin
 * script names (artifact-patched first; this syncs the imported users). */
export const patchNames = internalMutation({
  args: { rows: v.array(v.object({ userEmail: v.string(), name: v.string() })) },
  returns: v.object({ patched: v.number() }),
  handler: async (ctx, args) => {
    guard();
    let patched = 0;
    for (const r of args.rows) {
      const uid = await findUserByEmail(ctx, r.userEmail);
      if (!uid) continue;
      await ctx.db.patch(uid, { name: r.name, displayName: r.name.split(" ")[0] });
      patched += 1;
    }
    return { patched };
  },
});
