/**
 * feedPayload — FEED-U2 additive card / chrome fields (CR-010 slice, built
 * only from rows that already exist). Every helper returns null / [] when a
 * row or field is missing, so the display renders nothing for it (D-012).
 * Read-only; never writes. Imported by convex/feed.ts.
 */
import type { Id } from "../_generated/dataModel";

type Ctx = { db: any; storage: any };

/** A stored image reference → a URL. Accepts a storage id or an http(s) URL;
 *  "" / unknown / unresolvable → null. */
export async function resolveImageUrl(ctx: Ctx, ref: string | null | undefined): Promise<string | null> {
  if (!ref) return null;
  if (/^https?:\/\//.test(ref)) return ref;
  try {
    return (await ctx.storage.getUrl(ref as Id<"_storage">)) ?? null;
  } catch {
    return null; // not a storage id in this deployment
  }
}

export interface PayloadPerson {
  name: string;
  handle: string | null;
  avatarUrl: string | null;
  kind: "user" | "persona" | "editorial";
  /** signal.level literal (distributions.currentLevel), e.g. "moon". */
  level: string | null;
}

async function levelOf(ctx: Ctx, userId: Id<"users">): Promise<string | null> {
  const dist = await ctx.db
    .query("distributions")
    .withIndex("by_owner", (q: any) => q.eq("ownerUserId", userId))
    .first();
  return dist?.currentLevel ?? null;
}

export async function userPerson(ctx: Ctx, userId: Id<"users"> | null | undefined, withLevel = false): Promise<PayloadPerson | null> {
  if (!userId) return null;
  const u = await ctx.db.get(userId);
  if (!u) return null;
  return {
    // SECURITY (scan round 2, finding 33): never the email local part.
    name: u.displayName || u.username || "Member",
    handle: u.username ?? u.handle ?? null,
    avatarUrl: (await resolveImageUrl(ctx, u.avatarAssetId)) ?? (await resolveImageUrl(ctx, u.image)),
    kind: "user",
    level: withLevel ? await levelOf(ctx, userId) : null,
  };
}

/** The post's author as shown on the card: member, AI persona, or editorial. */
export async function authorOf(ctx: Ctx, post: any): Promise<PayloadPerson | null> {
  if (post.authorType === "persona" && post.authorPersonaId) {
    const p = await ctx.db.get(post.authorPersonaId);
    if (!p) return null;
    return { name: p.displayName, handle: null, avatarUrl: await resolveImageUrl(ctx, p.avatarAssetId), kind: "persona", level: null };
  }
  if (post.authorType === "editorial") {
    return { name: "Createconomy", handle: null, avatarUrl: null, kind: "editorial", level: null };
  }
  return userPerson(ctx, post.authorUserId, true);
}

/** Best human comment (cardSummaries.runningCommentRef) as text + author. */
export async function bestComment(ctx: Ctx, commentId: Id<"comments"> | null | undefined) {
  if (!commentId) return null;
  const c = await ctx.db.get(commentId);
  if (!c || c.deletedAt || c.moderationStatus !== "passed") return null;
  const author = await userPerson(ctx, c.authorUserId);
  if (!author) return null;
  return { author: author.handle ?? author.name, body: c.body as string };
}

export async function participants(ctx: Ctx, userIds: string[] | null | undefined): Promise<PayloadPerson[]> {
  const out: PayloadPerson[] = [];
  for (const id of (userIds ?? []).slice(0, 3)) {
    const p = await userPerson(ctx, id as Id<"users">);
    if (p) out.push(p);
  }
  return out;
}

const communityStars = (tool: any): number | null =>
  tool && tool.ratingCount > 0 ? Math.round((tool.ratingSum / tool.ratingCount) * 10) / 10 : null;

async function toolById(ctx: Ctx, toolId: string) {
  try {
    return await ctx.db.get(toolId as Id<"tools">);
  } catch {
    return null;
  }
}

const byPost = (ctx: Ctx, table: string, postId: Id<"posts">) =>
  ctx.db.query(table).withIndex("by_postId", (q: any) => q.eq("postId", postId)).first();

function domainOf(url: string | undefined): string | null {
  try {
    return url ? new URL(url).hostname.replace(/^www\./, "") : null;
  } catch {
    return null;
  }
}

function firstClaim(keyClaims: unknown): string | null {
  if (!Array.isArray(keyClaims) || keyClaims.length === 0) return null;
  const c = keyClaims[0];
  if (typeof c === "string") return c;
  if (c && typeof c === "object") return (c as any).text ?? (c as any).claim ?? null;
  return null;
}

/** Per-type facet from the type's extension row. null when the row is absent.
 *  `viewerId` drives the debate split: agree share only after the viewer voted (L-29). */
export async function facetOf(ctx: Ctx, post: any, viewerId: Id<"users"> | null): Promise<any | null> {
  switch (post.type) {
    case "review": {
      const r = await byPost(ctx, "postReviews", post._id);
      if (!r) return null;
      const tool = await toolById(ctx, r.toolId);
      return {
        kind: "review",
        tool: tool ? { name: tool.name, price: typeof tool.pricing === "string" ? tool.pricing : null } : null,
        verdict: r.verdictScore ?? null,
        community: communityStars(tool),
        pro: r.pros?.[0] ?? null,
        con: r.cons?.[0] ?? null,
      };
    }
    case "compare": {
      const c = await byPost(ctx, "postCompares", post._id);
      if (!c) return null;
      const tools = [];
      for (const id of c.toolIds ?? []) {
        const t = await toolById(ctx, id);
        if (t) tools.push({ name: t.name, community: communityStars(t) });
      }
      return { kind: "compare", tools };
    }
    case "debate": {
      const d = await byPost(ctx, "postDebates", post._id);
      if (!d) return null;
      const votes = d.agreeCount + d.disagreeCount;
      let viewerVote: "agree" | "disagree" | null = null;
      if (viewerId) {
        const mine = await ctx.db
          .query("debateVotes")
          .withIndex("by_user_post", (q: any) => q.eq("userId", viewerId).eq("postId", post._id))
          .first();
        if (mine && mine.choice !== "abstain") viewerVote = mine.choice;
      }
      return {
        kind: "debate",
        votes,
        viewerVote,
        // L-29: the split is withheld until the viewer has voted.
        agreePct: viewerVote && votes > 0 ? Math.round((d.agreeCount / votes) * 100) : null,
      };
    }
    case "help": {
      const h = await byPost(ctx, "postHelps", post._id);
      if (!h) return null;
      let resolvedBy: string | null = null;
      if (h.resolvedStatus === "resolved" && h.acceptedCommentId) {
        const answer = await ctx.db.get(h.acceptedCommentId);
        const who = answer ? await userPerson(ctx, answer.authorUserId) : null;
        resolvedBy = who?.handle ?? null;
      }
      return { kind: "help", problem: h.problemStatement, resolved: h.resolvedStatus === "resolved", resolvedBy };
    }
    case "list": {
      const l = await byPost(ctx, "postLists", post._id);
      if (!l) return null;
      const items = await ctx.db
        .query("postListItems")
        .withIndex("by_postListId_sortOrder", (q: any) => q.eq("postListId", l._id))
        .take(100);
      items.sort((a: any, b: any) => b.voteCount - a.voteCount);
      return {
        kind: "list",
        items: items.slice(0, 3).map((i: any) => ({ label: i.content, votes: i.voteCount })),
        more: Math.max(0, items.length - 3),
      };
    }
    case "showcase": {
      const s = await byPost(ctx, "postShowcases", post._id);
      if (!s) return null;
      return { kind: "showcase", thing: s.theThing, linkApproved: s.approvalStatus === "approved" && !!s.projectUrl };
    }
    case "news": {
      const n = await byPost(ctx, "postNews", post._id);
      if (!n) return null;
      return { kind: "news", claim: firstClaim(n.keyClaims), domain: domainOf(n.sourceOfTruthUrl) };
    }
    default:
      return null;
  }
}

/** What the viewer already did with this post (drives the G-switch, L-63). */
export async function viewerState(ctx: Ctx, viewerId: Id<"users"> | null, postId: Id<"posts">) {
  if (!viewerId) return {};
  const saved = await ctx.db
    .query("saves")
    .withIndex("by_user_post", (q: any) => q.eq("userId", viewerId).eq("postId", postId))
    .first();
  return { saved: !!saved };
}
