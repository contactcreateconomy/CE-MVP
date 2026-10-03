/**
 * /lab/feed fixtures — LAB ONLY (D-012: never imported outside /lab).
 * Shapes are the S02 display props; content mirrors the product's post
 * types (not the prototype's 9 categories). Numbers here are fixture
 * values for layout only; production numbers come from real rows.
 */
import type {
  FeedCardData,
  FeedHeroSlide,
  FeedNavItem,
  FeedPerson,
  FeedPodiumEntry,
  FeedPodiumWindow,
  FeedVibingItem,
} from "@/components/feed/feed-display-types";

/** Stand-in cover art (a soft two-stop gradient SVG) so the image layout
 *  renders offline. Hues match the --cat-* tokens of each type. */
function cover(hue: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 416 280"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 80% 55%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360} 70% 22%)"/></linearGradient></defs><rect width="416" height="280" fill="url(#g)"/><circle cx="300" cy="90" r="70" fill="hsl(${hue} 90% 80% / 0.35)"/><circle cx="110" cy="210" r="110" fill="hsl(${hue} 90% 15% / 0.35)"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const people: Record<string, FeedPerson> = {
  maya: { name: "Maya Chen", handle: "mayamakes", avatarUrl: null },
  jordan: { name: "Jordan Ellis", handle: "jordanbuilds", avatarUrl: null },
  priya: { name: "Priya Raman", handle: "priyawrites", avatarUrl: null },
  leo: { name: "Leo Hart", handle: "leohart", avatarUrl: null },
  sam: { name: "Sam Okafor", handle: "samedits", avatarUrl: null },
  nova: { name: "Nova", handle: "nova", avatarUrl: null, isPersona: true },
  atlas: { name: "Atlas", handle: "atlas", avatarUrl: null, isPersona: true },
};

export const navItems: FeedNavItem[] = [
  { key: "home", label: "Home", href: "/lab/feed" },
  { key: "news", label: "News", href: "/lab/feed?type=news" },
  { key: "review", label: "Review", href: "/lab/feed?type=review" },
  { key: "compare", label: "Compare", href: "/lab/feed?type=compare" },
  { key: "help", label: "Help", href: "/lab/feed?type=help" },
  { key: "spark", label: "Spark", href: "/lab/feed?type=spark" },
  { key: "debate", label: "Debate", href: "/lab/feed?type=debate" },
  { key: "list", label: "List", href: "/lab/feed?type=list" },
  { key: "showcase", label: "Showcase", href: "/lab/feed?type=showcase" },
];

export const heroSlides: FeedHeroSlide[] = [
  {
    id: "h1",
    href: "/lab/feed",
    type: "debate",
    eyebrow: "Community top",
    title: "Should creators charge for their first course or give it away?",
    summary:
      "Forty creators weighed in on paid-first versus free-first launches. The split is closer than you think — and the AI personas brought receipts.",
    imageUrl: cover(0),
    ctaLabel: "Join the debate",
    metrics: [
      { kind: "reads", value: 1240 },
      { kind: "replies", value: 86 },
    ],
  },
  {
    id: "h2",
    href: "/lab/feed",
    type: "review",
    eyebrow: "Editor's pick",
    title: "Six months editing on Descript: the honest review",
    summary: "What held up, what broke, and where the transcript-first workflow saves real hours.",
    imageUrl: cover(258),
    ctaLabel: "Read the review",
    metrics: [
      { kind: "reads", value: 932 },
      { kind: "replies", value: 41 },
    ],
  },
  {
    id: "h3",
    href: "/lab/feed",
    type: "list",
    eyebrow: "Community top",
    title: "The 12 tools our members actually pay for in 2026",
    summary: null,
    imageUrl: null,
    ctaLabel: "See the list",
    metrics: [{ kind: "reads", value: 2105 }],
  },
];

export const cards: FeedCardData[] = [
  {
    id: "c1",
    href: "/lab/feed",
    type: "debate",
    typeLabel: "Debate",
    title: "Should creators charge for their first course or give it away?",
    summary:
      "I've seen both work. Paid-first filters for serious students; free-first builds the list. Which one did you pick, and would you pick it again?",
    author: people.maya,
    timeLabel: "2h ago",
    coverImageUrl: cover(0),
    commentPreviews: [
      { id: "p1", author: people.nova, body: "Across 40 launches in this forum, paid-first had fewer refunds but a smaller list." },
      { id: "p2", author: people.jordan, body: "Free-first, then a paid cohort. Never looked back." },
      { id: "p3", author: people.priya, body: "Depends entirely on whether you already have an audience." },
    ],
    participants: [people.jordan, people.priya, people.nova],
    valuableCount: 128,
    replyCount: 86,
    isValued: true,
    isSaved: false,
    isRising: true,
  },
  {
    id: "c2",
    href: "/lab/feed",
    type: "help",
    typeLabel: "Help",
    title: "How do you price a YouTube sponsorship at 20k subscribers?",
    summary: "First brand reached out and asked for my rate card. I don't have one. What's a fair starting point?",
    author: people.leo,
    timeLabel: "4h ago",
    coverImageUrl: null,
    commentPreviews: [
      { id: "p4", author: people.sam, body: "Start from your average views, not subscribers. CPM 20–40 is common." },
    ],
    participants: [people.sam, people.maya],
    valuableCount: 54,
    replyCount: 23,
    isValued: false,
    isSaved: true,
  },
  {
    id: "c3",
    href: "/lab/feed",
    type: "review",
    typeLabel: "Review",
    title: "Six months editing on Descript: the honest review",
    summary: "Transcript-first editing saves me about four hours per video. Export is still the weak spot.",
    author: people.priya,
    timeLabel: "9h ago",
    coverImageUrl: cover(258),
    commentPreviews: [
      { id: "p5", author: people.atlas, body: "Members who switched report the same export issue on long timelines." },
      { id: "p6", author: people.leo, body: "Overdub alone was worth it for me." },
    ],
    participants: [people.leo, people.atlas, people.jordan],
    valuableCount: 97,
    replyCount: 41,
    isValued: false,
    isSaved: false,
  },
  {
    id: "c4",
    href: "/lab/feed",
    type: "spark",
    typeLabel: "Spark",
    title: "Your newsletter's welcome email is your most-read post. Treat it that way.",
    summary: "Mine has a 71% open rate. I rewrote it last week and replies tripled.",
    author: people.jordan,
    timeLabel: "1d ago",
    coverImageUrl: null,
    commentPreviews: [],
    participants: [],
    valuableCount: 12,
    replyCount: 3,
    isValued: false,
    isSaved: false,
  },
  {
    id: "c5",
    href: null,
    type: "compare",
    typeLabel: "Compare",
    title: "Kit vs. Beehiiv for a 5k-subscriber paid newsletter",
    summary: "Side-by-side on fees, deliverability, and the referral program after moving both ways.",
    author: people.sam,
    timeLabel: "2d ago",
    coverImageUrl: null,
    commentPreviews: [{ id: "p7", author: people.maya, body: "Beehiiv's referral program paid for itself in a month." }],
    participants: [people.maya],
    valuableCount: 1520,
    replyCount: 214,
    isValued: false,
    isSaved: false,
  },
];

const podiumBase: FeedPodiumEntry[] = [
  { rank: 1, person: people.maya, href: "/lab/feed", points: 4820 },
  { rank: 2, person: people.priya, href: "/lab/feed", points: 3975 },
  { rank: 3, person: people.jordan, href: "/lab/feed", points: 3410 },
  { rank: 4, person: people.sam, href: "/lab/feed", points: 2280 },
  { rank: 5, person: people.leo, href: "/lab/feed", points: 1965 },
];

export const podiumByWindow: Record<FeedPodiumWindow, FeedPodiumEntry[] | null> = {
  h24: null, // shows the "forming" state
  d7: podiumBase,
  m1: [...podiumBase].reverse().map((e, i) => ({ ...e, rank: i + 1, points: 9000 - i * 1100 })),
};

export const vibing: FeedVibingItem[] = [
  { id: "v1", href: "/lab/feed", contextLabel: "Trending in Debate", title: "Should creators charge for their first course or give it away?", engagedCount: 42 },
  { id: "v2", href: "/lab/feed", contextLabel: "Trending in Review", title: "Six months editing on Descript: the honest review", engagedCount: 27 },
  { id: "v3", href: "/lab/feed", contextLabel: "Trending in Help", title: "How do you price a YouTube sponsorship at 20k subscribers?", engagedCount: 18 },
];
