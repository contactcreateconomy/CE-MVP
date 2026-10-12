/**
 * /lab/feed fixtures — LAB ONLY (D-012: never imported outside /lab).
 * Content follows the founder-approved Figma Make round
 * (ak-redesign/specs/S02-refs/make/code/src/components/feedData.ts, Vibing,
 * Podium, taxonomy), adapted to the display props and the decisions made
 * after it (G-switch + "18G", strings, "what they did"). Numbers are fixture
 * values for layout only; production numbers come from real rows.
 * Covers are offline gradient stand-ins — real photos come from data (L-41).
 */
import type {
  FeedCardData,
  FeedHeroSlide,
  FeedNavItem,
  FeedPerson,
  FeedPodiumDimension,
  FeedPodiumEntry,
  FeedSort,
  FeedVibingItem,
} from "@/components/feed/feed-display-types";

/** Stand-in cover art (soft two-stop gradient SVG) so layouts render offline. */
function cover(hue: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 416 280"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 70% 50%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360} 60% 18%)"/></linearGradient></defs><rect width="416" height="280" fill="url(#g)"/><circle cx="300" cy="90" r="70" fill="hsl(${hue} 90% 80% / 0.3)"/><circle cx="110" cy="210" r="110" fill="hsl(${hue} 90% 12% / 0.35)"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const people = {
  rachel: { name: "Rachel Moore", handle: "rachel", avatarUrl: null, levelLabel: "Nova" },
  theo: { name: "Theo Brandt", handle: "theo", avatarUrl: null, levelLabel: "Orbit" },
  lina: { name: "Lina Park", handle: "lina", avatarUrl: null, levelLabel: "Star" },
  dev: { name: "Dev Patel", handle: "dev", avatarUrl: null, levelLabel: "Comet" },
  maya: { name: "Maya Okafor", handle: "maya", avatarUrl: null, levelLabel: "Galaxy" },
  atlas: { name: "Atlas", handle: "atlas", avatarUrl: null, isPersona: true },
  editorial: { name: "Createconomy", handle: null, avatarUrl: null, isEditorial: true },
} satisfies Record<string, FeedPerson>;
const faces = (...ps: FeedPerson[]) => ps;

const href = (key: string) => (key === "home" ? "/lab/feed" : `/lab/feed?type=${key}`);
export const navItems: FeedNavItem[] = [
  { key: "home", label: "All", href: href("home") },
  { key: "spark", label: "Spark", href: href("spark"), count: 4 },
  { key: "news", label: "News", href: href("news"), count: 2 },
  { key: "review", label: "Review", href: href("review"), count: 12 },
  { key: "compare", label: "Compare", href: href("compare") },
  { key: "debate", label: "Debate", href: href("debate"), count: 3 },
  { key: "help", label: "Help", href: href("help"), count: 7 },
  { key: "list", label: "List", href: href("list") },
  { key: "showcase", label: "Showcase", href: href("showcase"), count: 1 },
];
export const topicItems: FeedNavItem[] = [
  { key: "t-agents", label: "Agents", href: "/lab/feed?topic=agents", count: 9 },
  { key: "t-pricing", label: "Pricing", href: "/lab/feed?topic=pricing" },
  { key: "t-automation", label: "Automation", href: "/lab/feed?topic=automation", count: 2 },
  { key: "t-video", label: "Video", href: "/lab/feed?topic=video" },
  { key: "t-nocode", label: "No-code", href: "/lab/feed?topic=no-code", count: 5 },
];

/** FEED-DESIGN §9.4 hover / first-use notes (labels read from config, L-07). */
export const sortNotes: Record<FeedSort, string> = {
  top: "Top · best of the last month",
  hot: "Hot · accelerating this week",
  new: "New · last 24 hours",
  fav: "Fav · new activity on what you saved or joined",
};
export const podiumWindowFor: Record<FeedSort, string> = { top: "this month", hot: "this week", new: "today", fav: "this week" };

export const heroSlides: FeedHeroSlide[] = [
  { id: "h1", href: "/lab/feed", type: "showcase", eyebrow: "Community top", title: "Six weeks running my studio on three agents", summary: "Review · What held up, what quietly broke, and the one handoff I still do by hand.", imageUrl: cover(28), ctaLabel: "Open discussion", metrics: [] },
  { id: "h2", href: "/lab/feed", type: "debate", eyebrow: "Live debate", title: "AI-written posts should carry a label.", summary: "214 creators weighed in", imageUrl: cover(258), ctaLabel: "Open debate", metrics: [] },
  { id: "h3", href: "/lab/feed", type: "review", eyebrow: "Featured", featured: true, title: "Loomwright climbed to 4.4 stars from 212 ratings", summary: "Tool · $12/mo · first week", imageUrl: cover(200), ctaLabel: "See the tool", metrics: [] },
  { id: "h4", href: "/lab/feed", type: "help", eyebrow: "Community answer", title: "How do I price a prompt bundle for agencies?", summary: "27 answers in 6 hours", imageUrl: cover(142), ctaLabel: "Read the answers", metrics: [] },
  { id: "h5", href: "/lab/feed", type: "news", eyebrow: "Picked by Createconomy", title: "Creator Week: the full schedule is live", summary: "Five days of live teardowns", imageUrl: cover(330), ctaLabel: "Open discussion", metrics: [] },
];

export const cards: FeedCardData[] = [
  {
    id: "p-pinned", href: "/lab/feed", type: "news", typeLabel: "News", topicLabel: "Video", pinned: true,
    title: "Creator Week: the full schedule is live", author: people.editorial, timeLabel: "1d", coverImageUrl: cover(330),
    facet: { kind: "news", claim: "Five days of live teardowns, starting Monday at 10:00 ET.", domain: "createconomy.com" },
    whyCare: { kind: "comment", author: "lina", body: "the Thursday pricing teardown is the one not to miss" },
    gravity: 96, strings: 31, discussing: 12, participants: faces(people.lina, people.dev, people.maya), viewer: {},
  },
  {
    id: "p-review", href: "/lab/feed", type: "review", typeLabel: "Review", topicLabel: "Agents", updated: true,
    title: "Cursor after six months: still worth $20?", author: people.rachel, timeLabel: "2h", coverImageUrl: cover(210),
    facet: { kind: "review", tool: { name: "Cursor", price: "$20/mo" }, verdict: 4, community: 4.4, pro: "Multi-file edits finally feel trustworthy", con: "Usage caps bite on long refactors" },
    whyCare: { kind: "line", rising: true, text: "+14G in the last 3h", detail: "faster than most Review posts" },
    gravity: 1240, strings: 23, discussing: 24, participants: faces(people.theo, people.lina, people.maya), viewer: { appreciated: true, saved: true },
  },
  {
    id: "p-spark", href: "/lab/feed", type: "spark", typeLabel: "Spark", topicLabel: "Pricing",
    title: "Charging by the hour is a tax on getting better at your job.", author: people.theo, timeLabel: "38m", coverImageUrl: null,
    facet: null, whyCare: { kind: "line", text: "First look · be one of the first to weigh in", detail: "posted minutes ago" },
    gravity: 0, strings: 0, discussing: 0, participants: [], viewer: {},
  },
  {
    id: "p-debate", href: "/lab/feed", type: "debate", typeLabel: "Debate", topicLabel: "Agents",
    title: "AI-written posts should carry a label.", author: people.lina, timeLabel: "5h", coverImageUrl: null,
    facet: { kind: "debate", votes: 214, viewerVote: null, agreePct: null },
    whyCare: { kind: "comment", author: "dev", body: "labels are fine, but only if the bar is “mostly written by”, not “touched by”." },
    gravity: 41, strings: 88, discussing: 57, participants: faces(people.dev, people.maya, people.rachel), viewer: {},
  },
  {
    id: "p-help", href: "/lab/feed", type: "help", typeLabel: "Help", topicLabel: "Pricing",
    title: "How do I price a prompt bundle for agencies?", author: people.dev, timeLabel: "1h", coverImageUrl: null,
    facet: { kind: "help", problem: "Agencies want unlimited seats; I sell per-creator licences." },
    whyCare: { kind: "line", text: "Unanswered · in your topic", detail: "you've helped 12 people here" },
    gravity: 3, strings: 1, discussing: 5, participants: faces(people.theo, people.maya), viewer: { commented: true },
  },
  {
    id: "p-compare", href: "/lab/feed", type: "compare", typeLabel: "Compare", topicLabel: "Video",
    title: "Descript vs Riverside vs Loomwright for weekly shows", author: people.maya, timeLabel: "9h", coverImageUrl: cover(173),
    facet: { kind: "compare", tools: [{ name: "Descript", community: 4.3 }, { name: "Riverside", community: 4.1 }, { name: "Loomwright", community: 4.4 }], row: { label: "Offline mode", values: ["Yes", "No", "Partial"] } },
    whyCare: { kind: "line", text: "Back in discussion · 9 new replies", detail: "last reply 8m ago" },
    gravity: 37, strings: 46, discussing: 18, participants: faces(people.rachel, people.theo, people.dev), viewer: {},
  },
  {
    id: "p-list", href: "/lab/feed", type: "list", typeLabel: "List", topicLabel: "No-code",
    title: "The leanest no-code stack for a one-person studio", author: people.atlas, timeLabel: "3h", coverImageUrl: null,
    facet: { kind: "list", items: [{ label: "Framer for the site", votes: 128 }, { label: "Tally for intake", votes: 94 }, { label: "Make for glue", votes: 71 }], more: 12 },
    whyCare: { kind: "line", text: "Still drawing Gravity 3 months later", detail: "+6G this week" },
    gravity: 12400, strings: 64, discussing: 9, participants: faces(people.lina, people.rachel, people.maya), viewer: { saved: true },
  },
  {
    id: "p-showcase", href: "/lab/feed", type: "showcase", typeLabel: "Showcase", topicLabel: "Automation",
    title: "I automated my whole client onboarding — here it is", author: people.maya, timeLabel: "6h", coverImageUrl: cover(28),
    facet: { kind: "showcase", thing: "A form → contract → kickoff call pipeline that runs itself.", linkApproved: true },
    whyCare: { kind: "line", text: "412 saw · 18G ↗", detail: "only you see this" },
    gravity: 58, strings: 19, discussing: 11, participants: faces(people.theo, people.dev, people.lina), viewer: {},
  },
  {
    id: "p-help2", href: "/lab/feed", type: "help", typeLabel: "Help", topicLabel: "Automation",
    title: "Zapier keeps double-firing on new Stripe payments", author: people.lina, timeLabel: "2d", coverImageUrl: null,
    facet: { kind: "help", problem: "Every successful charge triggers my welcome email twice.", resolvedBy: "maya" },
    whyCare: { kind: "line", text: "3 replies since you left", detail: "one mentions you" },
    gravity: 29, strings: 12, discussing: 4, participants: faces(people.maya, people.rachel, people.theo), viewer: { commented: true, shared: true },
  },
];

/** Debate split shown only after the viewer votes (L-29) — fixture value. */
export const debateAgreePct = 62;

export const vibing: FeedVibingItem[] = [
  { id: "v1", href: "/lab/feed", contextLabel: "Trending in Help", title: "27 answers in 6 hours → “How do I price a prompt bundle for agencies?”", shortTitle: "27 answers on prompt pricing", engagedCount: 512 },
  { id: "v2", href: "/lab/feed", contextLabel: "Trending in Review", title: "Cursor reviews doubled since Monday → “Is Cursor still worth $20?”", shortTitle: "Cursor reviews doubled", engagedCount: 1189 },
  { id: "v3", href: "/lab/feed", contextLabel: "Trending in Debate", title: "214 votes in a day on “AI-written posts should carry a label”", shortTitle: "“Label AI posts” at 62% agree", engagedCount: 864 },
  { id: "v4", href: "/lab/feed", contextLabel: "Trending in Agents", title: "Agent posts up 340% this week → “Six weeks running my studio on three agents”", shortTitle: "Agent posts up 340%", engagedCount: 2031 },
  { id: "v5", href: "/lab/feed", contextLabel: "Trending in Showcase", title: "Loomwright climbed to 4.4 stars from 212 ratings in its first week", shortTitle: "Loomwright hit 4.4 stars", engagedCount: 743, featured: true },
];

export const podiumDimensions: FeedPodiumDimension[] = [
  { key: "overall", label: "Overall" },
  { key: "commenters", label: "Top commenters" },
  { key: "helpers", label: "Top helpers" },
  { key: "reviewers", label: "Top reviewers" },
  { key: "rising", label: "Rising" },
];

const ranked = [people.maya, people.rachel, people.lina, people.dev, people.theo];
const nums = [38, 31, 24, 19, 15];
const did: Record<string, (n: number) => string> = {
  overall: (n) => `+${n * 3}G from contributions`,
  commenters: (n) => `${n} comments drew Gravity`,
  helpers: (n) => `${n} answers drew Gravity`,
  reviewers: (n) => `${Math.round(n / 3)} reviews found helpful`,
  rising: (n) => `+${n * 4}G, up from +3G`,
};
export const podiumFor = (dim: string): FeedPodiumEntry[] | null =>
  dim === "rising"
    ? null // "Forming" state in the lab
    : ranked.map((person, i) => ({ rank: i + 1, person, href: `/users/${person.handle}`, did: did[dim](nums[i]) }));
export const podiumFormingDetail = "needs 25 contributors (12 so far)";
