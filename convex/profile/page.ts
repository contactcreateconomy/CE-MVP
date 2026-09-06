/**
 * page — SLICE-P5-07: CAP-526/527/528/550 — the /users/[handle] read
 * surface + the System handle reserve.
 *
 * CAP-550 (quoted): "System resolves and reserves a member's public handle
 *   at profile creation, enforcing uniqueness" via users.username +
 *   usernameNormalized — CAP-474's collision discipline. Handle CHANGE is
 *   FUTURE-M7-01: not built, usernames immutable at MVP-1.
 * CAP-526: Overview (identity + per-field badges + Awards shelf + M12
 *   triad RESERVED for W7 — render empty/placeholder, honest zero-state);
 *   single query surface. noindex per CAP-486 (route metadata).
 * CAP-527/528: Journal Summary + Ledger — **self-only at launch** (quoted
 *   register assumption); other members + anonymous get Overview only.
 * Consent discipline: non-self viewers see consent-bound attributes only
 *   when the field's purpose is granted; private visibility fields stay
 *   server-side (never projected). Never reads privateUserData.
 */

import { query, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

/** CAP-474-discipline normalization for handles. */
const LATIN_SUPPLEMENT: Record<string, string> = { ø: "o", æ: "ae", ß: "ss", đ: "d", ł: "l", þ: "th" };
export function normalizeHandle(source: string): string {
  const slug = source
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining marks (Ü→u, not U-+dash)
    .replace(/[øæßđłþ]/g, (c) => LATIN_SUPPLEMENT[c]) // letters NFKD won't decompose
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return slug.length >= 3 ? slug : `member-${slug || "x"}`;
}

/** The reserve transaction body — shared by the internalMutation entry
 *  point and setup.upsertBasic's same-transaction call (CAP-550 fires at
 *  profile creation; there is no client surface). */
export async function reserveHandleTx(ctx: any, userId: Id<"users">, source: string): Promise<{ username: string; usernameNormalized: string }> {
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("handle.reserve: user not found");
  if (user.username && user.usernameNormalized) {
    return { username: user.username, usernameNormalized: user.usernameNormalized }; // idempotent — FUTURE-M7-01: never re-reserve
  }
  const base = normalizeHandle(source);
  let candidate = base;
  for (let suffix = 2; suffix <= 99; suffix++) {
    const taken = await ctx.db
      .query("users")
      .withIndex("by_usernameNormalized", (q: any) => q.eq("usernameNormalized", candidate))
      .first();
    if (!taken) break;
    candidate = `${base}-${suffix}`;
  }
  await ctx.db.patch(userId, { username: candidate, usernameNormalized: candidate });
  return { username: candidate, usernameNormalized: candidate };
}

/** CAP-550 `handle.reserve` — System; fires inside profile creation
 *  (setup.upsertBasic's transaction), never from a client surface. */
export const handleReserve = internalMutation({
  args: { userId: v.id("users"), source: v.string() },
  returns: v.object({ username: v.string(), usernameNormalized: v.string() }),
  handler: async (ctx, args) => reserveHandleTx(ctx, args.userId, args.source),
});

/** CAP-526/527/528 — the single query surface for /users/[handle]. */
export const getProfilePage = query({
  args: { handle: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const normalized = normalizeHandle(args.handle);
    const user = await ctx.db
      .query("users")
      .withIndex("by_usernameNormalized", (q: any) => q.eq("usernameNormalized", normalized))
      .unique();
    if (!user) return null; // not-found per contract §1

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .unique();

    const viewerId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    const isSelf = viewerId === user._id;

    // Consent discipline (contract §2): demographic attributes surface to
    // non-self viewers only under a granted demographics flag; private-
    // visibility fields are never projected at all.
    const demographicsVisible = isSelf || profile?.consentFlags?.demographicsPersonalization === true;

    // Direct interests with tile labels (public surface)
    const interests = await ctx.db
      .query("userInterests")
      .withIndex("by_user_source", (q: any) => q.eq("userId", user._id).eq("source", "direct"))
      .filter((q: any) => q.eq(q.field("status"), "active"))
      .take(10);
    const interestTiles = [];
    for (const interest of interests) {
      const tile = await ctx.db
        .query("interestTaxonomy")
        .withIndex("by_tagId", (q: any) => q.eq("tagId", interest.tagId))
        .unique();
      if (tile?.isActive) interestTiles.push(tile.label);
    }

    // Journal — self-only at launch (CAP-527/528 quoted assumption)
    let journal: { summary: Record<string, number>; milestones: { eventType: string; createdAt: number }[]; ledger: { entries: any[]; cursor: string | null } } | null = null;
    if (isSelf) {
      const rows = await ctx.db
        .query("activityLedger")
        .withIndex("by_user_created", (q: any) => q.eq("userId", user._id))
        .order("desc")
        .take(40);
      const summary: Record<string, number> = {};
      for (const row of rows) summary[row.eventType] = (summary[row.eventType] ?? 0) + 1;
      const seen = new Set<string>();
      const milestones: { eventType: string; createdAt: number }[] = [];
      for (const row of [...rows].reverse()) {
        if (!seen.has(row.eventType)) {
          seen.add(row.eventType);
          milestones.push({ eventType: row.eventType, createdAt: row.createdAt });
        }
      }
      // Ledger entries project ONLY safe_for_public meta fields (bible l.231)
      const entries = rows.slice(0, 20).map((row) => {
        const meta: Record<string, unknown> = {};
        for (const [field, entry] of Object.entries(row.meta ?? {})) {
          if ((entry as any)?.privacy === "safe_for_public") meta[field] = (entry as any).value;
        }
        return { id: row._id, eventType: row.eventType, targetType: row.targetType, summary: row.summary, createdAt: row.createdAt, meta };
      });
      journal = {
        summary,
        milestones: milestones.slice(-6),
        ledger: { entries, cursor: rows.length > 20 ? String(rows[19].createdAt) : null },
      };
    }

    return {
      identity: {
        displayName: user.displayName ?? user.email?.split("@")[0] ?? "Member",
        username: user.username ?? normalized,
        bio: user.bio ?? null,
        roleArchetype: demographicsVisible ? (profile?.roleArchetype ?? null) : null,
        avatarUrl: null, // default avatar (§11.6 renders the initial)
      },
      badges: user.completionBadges ?? [], // per-field pills (CAP-150) — display only
      interests: interestTiles,
      awardsShelf: [], // CAP-297 W7 — honest empty placeholder (contract §3 A)
      metrics: null, // M12 triad — W7 reserved
      profileVisibility: user.profileVisibility ?? "public",
      isSelf,
      journal,
    };
  },
});
