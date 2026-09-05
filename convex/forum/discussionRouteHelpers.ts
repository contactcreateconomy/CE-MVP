import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { DISCUSSION_RELATED_CAP, DISCUSSION_TRENDING_CAP } from "./limits";
import { profileToUser } from "./helpers";

export type RichThreadPayload = Record<string, unknown>;

export async function hydrateRelatedThreads(
  ctx: QueryCtx,
  slugs: string[],
  cap: number,
): Promise<
  {
    slug: string;
    title: string;
    authorId: string;
    engagement: number;
  }[]
> {
  const out: {
    slug: string;
    title: string;
    authorId: string;
    engagement: number;
  }[] = [];
  const slice = slugs.slice(0, cap);
  for (const s of slice) {
    const rrow = await ctx.db
      .query("forumRichThreads")
      .withIndex("by_slug", (q) => q.eq("slug", s))
      .unique();
    if (rrow?.payload && typeof rrow.payload === "object") {
      const p = rrow.payload as unknown as {
        slug: string;
        title: string;
        authorId: string;
        upvotes: number;
        comments: unknown[];
      };
      out.push({
        slug: p.slug,
        title: p.title,
        authorId: p.authorId,
        engagement: p.upvotes + (Array.isArray(p.comments) ? p.comments.length * 2 : 0),
      });
    }
  }
  return out;
}

export async function loadProfilesForIds(
  ctx: QueryCtx,
  userIds: Set<string>,
): Promise<ReturnType<typeof profileToUser>[]> {
  const users = [];
  for (const id of userIds) {
    const doc = await ctx.db.get(id as Id<"forumProfiles">);
    if (doc) {
      users.push(profileToUser(doc));
    }
  }
  return users;
}

export function cappedRelatedSlugs(thread: RichThreadPayload): string[] {
  const relatedSlugs = (thread.relatedSlugs as string[] | undefined) ?? [];
  return relatedSlugs.slice(0, DISCUSSION_RELATED_CAP);
}

export function cappedTrendingSlugs(thread: RichThreadPayload): string[] {
  const trendingSlugs = (thread.trendingSlugs as string[] | undefined) ?? [];
  return trendingSlugs.slice(0, DISCUSSION_TRENDING_CAP);
}

const DEFAULT_KEY_AGREEMENTS = [
  "Practical, cited details beat hot takes.",
  "Community wants primary sources in replies.",
] as const;

const DEFAULT_TOP_CONTRIBUTOR = {
  userId: "u2",
  excerpt: "Strong write-up — primary source link makes this easy to verify.",
} as const;

/** Normalize stored rich-thread JSON so the forum UI never sees missing arrays or insightRail. */
export function coalesceRichThreadPayloadForClient(payload: RichThreadPayload): RichThreadPayload {
  const thread: RichThreadPayload = { ...payload };
  if (!Array.isArray(thread.comments)) {
    thread.comments = [];
  }
  if (!Array.isArray(thread.tags)) {
    thread.tags = [];
  }
  const irRaw = thread.insightRail;
  if (!irRaw || typeof irRaw !== "object" || Array.isArray(irRaw)) {
    thread.insightRail = {
      summary: String(thread.aiSummary ?? ""),
      keyAgreements: [...DEFAULT_KEY_AGREEMENTS],
      openQuestions: [],
      topContributor: { ...DEFAULT_TOP_CONTRIBUTOR },
    };
    return thread;
  }
  const ir = irRaw as Record<string, unknown>;
  const tc = ir.topContributor;
  let topContributor: { userId: string; excerpt: string } = { ...DEFAULT_TOP_CONTRIBUTOR };
  if (tc && typeof tc === "object" && !Array.isArray(tc)) {
    const t = tc as Record<string, unknown>;
    topContributor = {
      userId: String(t.userId ?? ""),
      excerpt: String(t.excerpt ?? ""),
    };
  }
  thread.insightRail = {
    summary: String(ir.summary ?? thread.aiSummary ?? ""),
    keyAgreements: Array.isArray(ir.keyAgreements) ? ir.keyAgreements : [...DEFAULT_KEY_AGREEMENTS],
    openQuestions: Array.isArray(ir.openQuestions) ? ir.openQuestions : [],
    topContributor,
  };
  return thread;
}
