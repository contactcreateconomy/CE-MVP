/* eslint-disable @typescript-eslint/no-explicit-any -- Convex feed payloads are `v.any()` at the client edge */
/**
 * feed-adapter — FEED-U2: `feed.list` / `feed.getChrome` payloads → the
 * display props (D-016: the container owns data, display components take
 * props). Pure functions, no Convex. Anything without a source row maps to
 * null / [] / "" so the display renders nothing for it (D-012) — never a
 * placeholder number.
 */
import type {
  FeedCardData,
  FeedFacet,
  FeedHeroSlide,
  FeedNavItem,
  FeedPerson,
  FeedPodiumEntry,
  FeedVibingItem,
  FeedWhyCare,
} from "./feed-display-types";

/** Post type → display label (postTypeConfig.label via getChrome.typeNav). */
export type TypeLabel = (type: string) => string | null | undefined;

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** Readable fallback when the label map has no entry ("launch_pad" → "Launch pad"). */
const readable = (literal: string) => capitalise(literal.replace(/_/g, " "));

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Compact relative time for the identity row: "now", "38m", "5h", "3d", then "Jul 4". */
export function relativeTime(ts: number, now = Date.now()): string {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86_400) return `${Math.floor(s / 86_400)}d`;
  const d = new Date(ts);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function person(p: any): FeedPerson {
  return {
    name: p.name,
    handle: p.handle ?? null,
    avatarUrl: p.avatarUrl ?? null,
    isPersona: p.kind === "persona",
    isEditorial: p.kind === "editorial",
    levelLabel: p.level ? capitalise(p.level) : null,
  };
}

function facet(f: any): FeedFacet | null {
  if (!f) return null;
  switch (f.kind) {
    case "review":
      return { kind: "review", tool: f.tool ?? null, verdict: f.verdict ?? null, community: f.community ?? null, pro: f.pro ?? null, con: f.con ?? null };
    case "compare":
      return f.tools?.length ? { kind: "compare", tools: f.tools, row: null } : null;
    case "debate":
      return { kind: "debate", votes: f.votes ?? 0, viewerVote: f.viewerVote ?? null, agreePct: f.agreePct ?? null };
    case "help":
      return { kind: "help", problem: f.problem ?? null, resolved: !!f.resolved, resolvedBy: f.resolvedBy ?? null };
    case "list":
      return f.items?.length ? { kind: "list", items: f.items, more: f.more ?? 0 } : null;
    case "showcase":
      return { kind: "showcase", thing: f.thing ?? null, linkApproved: !!f.linkApproved };
    case "news":
      return f.claim || f.domain ? { kind: "news", claim: f.claim ?? null, domain: f.domain ?? null } : null;
    default:
      return null;
  }
}

/** Relationship / life-stage lines need the B3 engines; today only the best
 *  human comment and the Rising flag have sources. */
function whyCare(raw: any): FeedWhyCare | null {
  if (raw.bestComment?.body) return { kind: "comment", author: raw.bestComment.author, body: raw.bestComment.body };
  if (raw.rising) return { kind: "line", rising: true, text: "" };
  return null;
}

export function toCardData(raw: any, typeLabel: TypeLabel, now = Date.now()): FeedCardData {
  return {
    id: raw.postId,
    href: raw.slug ? `/discussions/${raw.slug}` : null,
    type: raw.type,
    typeLabel: typeLabel(raw.type) ?? readable(raw.type),
    topicLabel: null, // L-23 taxonomy not unified yet — no source
    title: raw.title,
    author: raw.author ? person(raw.author) : { name: raw.authorName ?? "Member", handle: null, avatarUrl: null },
    timeLabel: relativeTime(raw.publishedAt ?? now, now),
    coverImageUrl: raw.coverImage ?? null,
    facet: facet(raw.facet),
    whyCare: whyCare(raw),
    // L-83: the public G count renders nothing until the Gravity engine
    // (L-60/L-64) lands with B2a — the valuable-score stand-in is gone.
    gravity: null,
    strings: raw.engagement?.replies ?? 0,
    discussing: raw.discussingCount ?? 0,
    participants: (raw.participants ?? []).map(person),
    viewer: raw.viewer ?? {},
  };
}

export function toHeroSlides(hero: any[] | undefined): FeedHeroSlide[] {
  return (hero ?? [])
    .filter((h) => h.slug)
    .map((h) => ({
      id: h.postId,
      href: `/discussions/${h.slug}`,
      type: h.type ?? null,
      // disclosureClass values are unnamed (curation OQ3): community_top is
      // earned; every other curated slot is an editorial pick (§9.2 labels).
      eyebrow: h.isCommunityTop ? "Community top" : "Picked by Createconomy",
      title: h.title,
      summary: h.summary ?? null,
      imageUrl: h.mediaUrl ?? h.coverImage ?? null,
      ctaLabel: h.ctaLabel ?? "Open discussion",
      metrics: [],
    }));
}

export function toVibingItems(vibing: any[] | undefined, featured: any[] | undefined, typeLabel: TypeLabel): FeedVibingItem[] {
  const promoted = new Set((featured ?? []).map((f) => String(f.postId)));
  return (vibing ?? [])
    .filter((v) => v.objectType === "post" && v.title && v.slug)
    .map((v) => ({
      id: String(v.objectId),
      href: `/discussions/${v.slug}`,
      contextLabel: `Trending in ${typeLabel(v.postType) ?? readable(v.postType)}`,
      title: v.hook ?? v.title,
      shortTitle: v.title,
      engagedCount: v.humans ?? 0,
      featured: promoted.has(String(v.objectId)),
    }));
}

export function toPodium(podium: any): { entries: FeedPodiumEntry[] | null } {
  if (!podium || podium.forming || !podium.entries?.length) return { entries: null };
  return {
    entries: podium.entries.map((e: any) => ({
      rank: e.rank,
      person: { name: e.displayName ?? "Member", handle: e.handle ?? null, avatarUrl: e.avatarUrl ?? null, levelLabel: e.level ? capitalise(e.level) : null },
      href: e.handle ? `/users/${encodeURIComponent(e.handle)}` : null,
      // R-10: never opaque points; "what they did" needs a recognition source (gap).
      did: "",
    })),
  };
}

export function toNavItems(typeNav: Array<{ type: string; label: string }> | undefined): FeedNavItem[] {
  return [
    { key: "home", label: "All", href: "/feed" },
    ...(typeNav ?? []).map((t) => ({ key: t.type, label: t.label, href: `/feed?category=${encodeURIComponent(t.type)}` })),
  ];
}
