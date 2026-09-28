/**
 * Demo seed (R3) — deterministic, idempotent local-dev fixtures.
 *
 * Scope: feed / post detail / profile / leaderboard / notifications realism
 * for design baselines. Admin-console fixtures stay in dev/demoSeed.ts.
 *
 * Gates:
 *   - The pnpm wrapper (scripts/seed-demo.mjs) HARD-REFUSES unless the
 *     selected deployment is local:<name> or anonymous:<name> (read from .env.local).
 *   - This module additionally refuses on anything that smells like the
 *     production deployment (same defense as dev/demoSeed).
 *
 * Determinism: no Math.random; every timestamp is `now - fixedOffset` so
 * ages always look fresh. Identical logical state on every machine; the
 * seed:check fingerprint (counts + stable keys, never timestamps) matches.
 *
 * Idempotency: every insert is keyed on a natural key (email, slug, exact
 * title, dedupeKey, composite index) and skipped when present.
 *
 * Boundaries honored: NO schema changes; direct inserts follow the pattern
 * sanctioned by dev/demoSeed.ts. Not seedable without backend changes are
 * listed in ak-redesign/00-control/SETUP-REPORT-R3.md (follows, streaks,
 * post-level upvote rows, avatars).
 */
import { internalAction, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { canonicalSignupFields } from "../lib/founder";
import { normalizeHandle } from "../lib/handle";
import { ensurePostSeoMetaTx } from "../lib/distributionScores";
import { ensureDistributionTx } from "../distributions";
import { assertLocalDeployment as assertLocalDeploymentTx } from "./devGuard";

const EMAIL_DOMAIN = "demo.createconomy.invalid";
const RUN_KEY = "demo-seed-r3";

// ── fixed member roster ────────────────────────────────────────────────
// 15 members across signal levels 1-8 (orbit..galaxy per bible l.404).
const LEVELS = [
  "orbit",
  "comet",
  "moon",
  "planet",
  "star",
  "supernova",
  "nebula",
  "galaxy",
] as const;

type Member = {
  handle: string;
  name: string;
  level: (typeof LEVELS)[number];
  might: number;
  reach: number;
  bio: string;
};

const MEMBERS: Member[] = [
  { handle: "samir", name: "Samir Haddad", level: "galaxy", might: 912, reach: 4100, bio: "Writes The Margin Call, a weekly letter on where AI actually changes creator economics. Ex-platform data." },
  { handle: "yuki", name: "Yuki Tanaka", level: "nebula", might: 744, reach: 2600, bio: "Animates dense research into 90-second explainers. Obsessed with compression without loss." },
  { handle: "elena", name: "Elena Popov", level: "supernova", might: 623, reach: 1980, bio: "Showcases side projects before they're ready on purpose. Ships weekly, apologizes never." },
  { handle: "noah", name: "Noah Berg", level: "supernova", might: 588, reach: 1750, bio: "Asks the help questions everyone else is too proud to type. Runs two small paid communities." },
  { handle: "luca", name: "Luca Rossi", level: "star", might: 471, reach: 1200, bio: "Ships digital products on nights and documents every launch's real numbers, refunds included." },
  { handle: "sofia", name: "Sofia Alvarez", level: "star", might: 452, reach: 1110, bio: "Hosts the distribution debates. Believes most growth advice is survivorship in a trench coat." },
  { handle: "kenji", name: "Kenji Sato", level: "star", might: 429, reach: 980, bio: "Curates ranked stacks for specific jobs instead of generic top-10s. Spreadsheet brain." },
  { handle: "jordan", name: "Jordan Hale", level: "planet", might: 318, reach: 620, bio: "Runs a four-person creator studio. Writes about ops, contractors, and the boring middle." },
  { handle: "amina", name: "Amina Okonkwo", level: "planet", might: 301, reach: 570, bio: "Documents future-of-work experiments on herself before recommending them to anyone." },
  { handle: "maya", name: "Maya Chen", level: "moon", might: 214, reach: 340, bio: "Reviews AI workflow tools after 30-day trials, not 30-minute demos. Trial receipts in every post." },
  { handle: "priya", name: "Priya Nair", level: "moon", might: 198, reach: 310, bio: "Compares writing stacks for client work. Cares about export paths more than feature lists." },
  { handle: "iris", name: "Iris Kwan", level: "comet", might: 121, reach: 160, bio: "Newsletter operator testing every new editor for a month each. Slow takes, fast screenshots." },
  { handle: "mateo", name: "Mateo Reyes", level: "comet", might: 109, reach: 140, bio: "Turning a hobby channel into a real business and posting the P&L monthly." },
  { handle: "nadia", name: "Nadia Petrova", level: "orbit", might: 42, reach: 25, bio: "Ceramics newsletter, 400 readers, just started using AI for editing. Learning in public." },
  { handle: "theo", name: "Theo Mensah", level: "orbit", might: 31, reach: 18, bio: "Student. Building a comparison habit: nothing gets bought without a two-tool bake-off." },
];

// ── tools referenced by review/compare posts ──────────────────────────
const TOOLS: { slug: string; name: string; category: string }[] = [
  { slug: "demo-claude-code", name: "Claude Code", category: "ai-technology" },
  { slug: "demo-cursor", name: "Cursor", category: "ai-technology" },
  { slug: "demo-notion", name: "Notion", category: "digital-products" },
  { slug: "demo-substack", name: "Substack", category: "creator-business" },
  { slug: "demo-beehiiv", name: "Beehiiv", category: "creator-business" },
  { slug: "demo-descript", name: "Descript", category: "internet-culture" },
  { slug: "demo-obsidian", name: "Obsidian", category: "future-of-work" },
  { slug: "demo-framer", name: "Framer", category: "digital-products" },
];

const CATEGORIES = [
  "ai-technology",
  "creator-business",
  "internet-culture",
  "digital-products",
  "future-of-work",
] as const;

type PostType = "review" | "compare" | "help" | "spark" | "debate" | "list" | "showcase";

/** Fixed offsets from `now`, in minutes — ages always look fresh. */
type PostSpec = {
  by: string;
  type: PostType;
  category: (typeof CATEGORIES)[number];
  title: string;
  body: string;
  ageMin: number;
  tools?: number[]; // indexes into TOOLS (first = review target)
  thread?: boolean; // gets the 21-comment thread
  noComments?: boolean; // guaranteed zero comments
  engaging?: number; // valuableWeighted bump
};

// ~60 posts. Realistic AI-creator voice; no lorem ipsum. Edge cases:
// LONG_TITLE (two-line overflow), LONG_BODY, EMPTY_BODY, the 21-reply
// thread post, and several guaranteed zero-comment posts.
const POSTS: PostSpec[] = [
  // ── ai-technology ──────────────────────────────────────────────────
  { by: "maya", type: "review", category: "ai-technology", title: "Claude Code after 30 days of daily pair-programming — the honest verdict", body: "I ran Claude Code as my default pairing tool for a month across three client projects. The headline: it is the first assistant that changed how I structure work rather than just speeding up typing. It handles repo-wide refactors without losing the plot, and the weak spot is exactly what you'd guess — it confidently invents internal APIs it has never seen. Budget review time for the diff, not the prompt. Trial receipts: 22 working sessions, 4 abandoned threads, 3 genuine saves that would have been days.", ageMin: 10, tools: [0], engaging: 16, thread: true },
  { by: "kenji", type: "compare", category: "ai-technology", title: "Claude Code vs Cursor for a two-week bake-off on the same real codebase", body: "Same repo, same tasks, two weeks, one spreadsheet. Cursor wins on instant onboarding and inline velocity; Claude Code wins on long multi-file changes and staying coherent inside a big refactor. My cut: solo greenfield work favors Cursor, anything with legacy structure favors Claude Code. Full qualitative grid below — no fake precision, no scores out of ten.", ageMin: 25, tools: [0, 1], engaging: 12 },
  { by: "nadia", type: "help", category: "ai-technology", title: "How do you keep AI-edited prose from collapsing into the same flat voice?", body: "Three newsletters in, and every draft I run through an editor comes back grammatically clean and tonally dead. The rhythm is gone, the asides are gone, it reads like a manual. Do those of you with distinctive voices have a prompt pattern or a workflow stage that keeps the voice? Or do you just accept the flattening for the first pass and rewrite by hand after?", ageMin: 60, engaging: 8 },
  { by: "samir", type: "spark", category: "ai-technology", title: "Spark: the winning skill for creators this decade is taste filtration, not prompt craft", body: "Prompting got commoditized in eighteen months. The people still compounding are the ones who can look at fifty generated options and know which one is actually good. That's a taste problem, and taste is trained by consumption, not by tools.", ageMin: 120, engaging: 14 },
  { by: "sofia", type: "debate", category: "ai-technology", title: "Debate: AI-assisted writing should be labeled on every published post", body: "Taking the prop seriously: readers deserve to know when a draft was machine-fluent. Against: the label means nothing because the spectrum from autocomplete to generation is continuous, and the dishonest will just lie. I genuinely flip sides on this weekly. Vote and argue — I want to be wrong in public.", ageMin: 180, tools: [], engaging: 11 },
  { by: "yuki", type: "list", category: "ai-technology", title: "Six AI workflow additions that survived contact with my actual production calendar", body: "Everything here earned its slot by surviving a real deadline, not a demo. Ranked by how much recurring time they actually gave back.", ageMin: 1440, engaging: 9 },
  { by: "elena", type: "showcase", category: "ai-technology", title: "Showcase: I built a research-to-video pipeline that cuts my production week to two days", body: "The stack ingests papers, extracts claims I mark as load-bearing, drafts a 90-second script around exactly those claims, and leaves the animation to me because that's where the taste lives. It's held together with two scripts and stubbornness. Source layout and the failure modes are in the repo — the interesting part is what it gets wrong on purpose.", ageMin: 2880, tools: [5], engaging: 13 },
  { by: "iris", type: "review", category: "ai-technology", title: "Cursor's new background agents after two weeks of real client work", body: "The promise is delegating a ticket while you sleep. Reality: one in three comes back genuinely merge-ready, one comes back merge-ready-but-wrong, and one eats the token budget exploring. The economics still work if you treat it like a junior with no shame about being told to redo work. Net positive, will keep paying.", ageMin: 4320, tools: [1], engaging: 7 },
  { by: "theo", type: "compare", category: "ai-technology", title: "Two budget AI note-takers, one month of the same lectures — surprisingly different notes", body: "Same eight lectures, same transcription source. One tool's notes read like the lecture; the other's read like the textbook the lecturer was clearly avoiding. Neither is 'better' — they're different products pretending to be one category. Details in the grid.", ageMin: 5760, tools: [6] },
  { by: "mateo", type: "spark", category: "ai-technology", title: "Spark: most 'AI workflows' are just checklists people were too lazy to write down", body: "Half the automations I see celebrated online are a six-step manual process with one LLM call stapled on. The checklist was the value. Write the checklist first, then decide if a model earns a slot.", ageMin: 8640, noComments: true },
  { by: "noah", type: "help", category: "ai-technology", title: "Is anyone successfully running local models for real editing work — not toys?", body: "Every guide stops at 'it runs'. I need it to edit a 2000-word draft without a GPU melting or quality falling off a cliff. What's the actual state of local editing models for prose this quarter, from someone using them weekly rather than benchmarking them once?", ageMin: 12960, engaging: 4 },

  // ── creator-business ───────────────────────────────────────────────
  { by: "luca", type: "review", category: "creator-business", title: "Beehiiv at 8,400 subscribers: the referral program finally clicked", body: "Six months ago I called the referral system a gimmick. Then I moved the ask from 'share this' to 'share this specific issue, it's the good one' and referrals tripled in a fortnight. Platform review with the numbers, the migration cost from Substack, and the two features I still think are hostile to writers.", ageMin: 45, tools: [4], engaging: 15 },
  { by: "priya", type: "compare", category: "creator-business", title: "Substack vs Beehiiv for a client moving 12k subscribers with paid tiers", body: "Migration shape, fees at her price point, ad network reality, and the export story — the thing nobody demos until you need it. Verdict was closer than the internet claims. The grid is qualitative on purpose: your mileage depends on which of these four dimensions is load-bearing for you.", ageMin: 90, tools: [3, 4], engaging: 10 },
  { by: "samir", type: "list", category: "creator-business", title: "The only five numbers I check every week running a paid letter", body: "Not vanity metrics — the five that have actually predicted revenue two quarters out. Ranked by how early they move before money does.", ageMin: 240, engaging: 17 },
  { by: "amina", type: "debate", category: "creator-business", title: "Debate: launch a paid tier at 1,000 subscribers or wait for true demand signals?", body: "The 1,000 rule gives you a forcing function and a public promise. Waiting gives you evidence. But evidence arrives late and attention decays fast. I've seen both work and both quietly fail. Which failure mode scares you more? Argue your corner.", ageMin: 600, engaging: 12 },
  { by: "jordan", type: "spark", category: "creator-business", title: "Spark: your product's refund rate is the most honest review you will ever receive", body: "Everyone A/B tests the landing page. Almost nobody reads the refund reasons. Two quarters of refund notes taught us more about positioning than every analytics dashboard combined.", ageMin: 1080, engaging: 8 },
  { by: "mateo", type: "showcase", category: "creator-business", title: "Showcase: month 7 of turning the channel into a business — the P&L, including the embarrassing parts", body: "Revenue up, margin down, and a sponsorship deal that cost me money once I priced my own hours honestly. Everything tabulated. The lesson forming: sponsorship revenue is the most expensive money I've earned.", ageMin: 2160, engaging: 6 },
  { by: "kenji", type: "help", category: "creator-business", title: "Contractors: what does your VA/onboarding stack actually look like in 2026?", body: "Every 'creator ops' tool I trial assumes a team of one or a team of forty. I have three contractors and a shared inbox held together by vibes. What are four-person studios actually running for onboarding, SOPs, and shared passwords?", ageMin: 4320, engaging: 3 },
  { by: "sofia", type: "review", category: "creator-business", title: "The sponsorship marketplace experiment: three months, six deals, mixed feelings", body: "Fill rate went up, rates went down, and one brand tried to edit a published post through the platform's back channel. Marketplaces solve discovery and break leverage. Full breakdown plus the clause I now insist on.", ageMin: 7200, noComments: true },
  { by: "yuki", type: "compare", category: "creator-business", title: "Direct sponsor outreach vs marketplace listings for a 100k-view channel", body: "Forty outreach threads versus eleven marketplace deals, same quarter, same channel. Outreach closes slower at 2.3x the rate. The uncomfortable reason: marketplaces optimize for advertiser convenience, and convenience is priced into your fee.", ageMin: 10080, engaging: 5 },

  // ── internet-culture ───────────────────────────────────────────────
  { by: "elena", type: "spark", category: "internet-culture", title: "Spark: the reply guy economy collapsed and nobody announced it", body: "Two years ago, replies were a growth channel with whole courses attached. Now the engagement is in private shares and group chats where you can't farm it. The public reply section is becoming a comment box on a ghost town. Adapt your distribution accordingly.", ageMin: 30, engaging: 13 },
  { by: "noah", type: "debate", category: "internet-culture", title: "Debate: engagement bait is dead — or it just moved to formats we don't call bait anymore", body: "The poll-with-a-wrong-answer used to be the move. Now it's the 'I shouldn't share this but' screenshot and the artificially cut-short video. Is the new stuff meaningfully different or just bait with better cover? I keep a folder of examples and I'm genuinely unsure.", ageMin: 150, engaging: 9 },
  { by: "iris", type: "review", category: "internet-culture", title: "Descript's new multi-speaker workflow after a month of real podcast editing", body: "The speaker detection finally handles my co-host's habit of trailing off mid-sentence and finishing forty seconds later. The fillers removal is now good enough that I had to re-add some on purpose — completely clean speech sounds dead. Weird problem to have; good product.", ageMin: 360, tools: [5], engaging: 7 },
  { by: "theo", type: "list", category: "internet-culture", title: "Five comment sections that are still worth reading in 2026 (and why they survived)", body: "Not nostalgia bait — a structural look at what the surviving good sections share: small scale, visible moderation, and a reason to be there beyond the content itself.", ageMin: 2880, engaging: 4 },
  { by: "nadia", type: "showcase", category: "internet-culture", title: "Showcase: my ceramics newsletter went viral in the wrong community and it was the best thing that happened", body: "A glaze-chemistry explainer got picked up by a math visualization group, of all places. Bounce rate was terrible, but forty of them stayed and now ask the sharpest questions I get. Notes on what a 'wrong audience' is actually worth.", ageMin: 8640, engaging: 6 },
  { by: "mateo", type: "help", category: "internet-culture", title: "When your niche gets its first big AI slop account — fight, ignore, or differentiate?", body: "A content farm cloned our format this month, down to the section headers, at five times the volume. Their comments are bots talking to bots. But they're ranking. What's the actual playbook that worked for you, not the theory?", ageMin: 12960, noComments: true },
  { by: "yuki", type: "spark", category: "internet-culture", title: "Spark: 'posting through it' is now a measurable career stage", body: "The audience can tell within two posts when a creator has stopped being interested in their own subject. The feed doesn't punish it — people do, quietly, by leaving. Taking a break is a growth strategy and almost nobody's analytics will show them that.", ageMin: 20160, engaging: 3 },

  // ── digital-products ───────────────────────────────────────────────
  { by: "luca", type: "review", category: "digital-products", title: "Notion's new product-database features after shipping two paid toolkits on them", body: "The relation rollups finally handle multi-sku inventories without the formula house of cards. Delivery automation is still DIY-adjacent. Full review with the exact setup that survived two launches and 900 customers.", ageMin: 20, tools: [2], engaging: 11 },
  { by: "priya", type: "compare", category: "digital-products", title: "Framer vs Notion for selling a documentation-style product", body: "One is a website builder pretending to be a knowledge tool; the other is a knowledge tool pretending to be a storefront. For a docs-first product the answer is genuinely close. The comparison grid breaks down where each one's fakery stops costing you money.", ageMin: 200, tools: [2, 7], engaging: 8 },
  { by: "jordan", type: "list", category: "digital-products", title: "Eight launch assets I build before writing any product page copy", body: "Copy written last is copy written from evidence. The list starts with the support inbox and ends with the refund policy draft — the two documents that know what the product actually is.", ageMin: 720, engaging: 10 },
  { by: "kenji", type: "debate", category: "digital-products", title: "Debate: version-one digital products should be embarrassingly small", body: "Ship a checklist, not a course — or ship the course and let the checklist version be free? The 'tiny product' school says speed compounds; the depth school says a thin v1 brands you as thin. I've done both and my revenue graph disagrees with my philosophy. Fight it out.", ageMin: 1440, engaging: 12 },
  { by: "amina", type: "spark", category: "digital-products", title: "Spark: the most underrated product skill is writing an honest changelog", body: "A good changelog is a retention document. It tells past buyers the thing they own is still alive and tells prospects you'll still be honest after their money clears. Nobody reads them, everybody feels them.", ageMin: 3600, engaging: 5 },
  { by: "elena", type: "showcase", category: "digital-products", title: "Showcase: I open-sourced my course's exercise generator and signups went up 18%", body: "Counterintuitive but explicable: the generator is the demo. People run it, hit the limits of generic exercises, and the paid version is the obvious next click. Full numbers, the license choice, and what I deliberately left closed.", ageMin: 5760, engaging: 9 },
  { by: "iris", type: "help", category: "digital-products", title: "EU VAT on digital downloads — what's your actual 2026 setup, not the 2023 blog posts?", body: "Every guide I find is three years stale or selling a $40 solution to what might be a $4 problem at my volume. Solo creators selling templates: what are you actually using, and what did it cost you to get compliant?", ageMin: 11520, engaging: 2 },
  { by: "theo", type: "review", category: "digital-products", title: "Bought the cheapest and most expensive notion templates in the same niche — here's the gap", body: "$9 versus $149, same category, both bestsellers. The expensive one isn't fifteen times better; it's better in three specific places and worse in one. The interesting part is what those places say about who's buying.", ageMin: 17280, noComments: true },
  { by: "samir", type: "spark", category: "digital-products", title: "Spark: 'information should be free' and 'my rent should be paid' are both true and that's the whole job", body: "Every pricing thread re-litigates this like it's solvable. The working creators I know stopped resolving it and started pricing the packaging, the updates, and the support — the parts that were never information.", ageMin: 43200, engaging: 7 },

  // ── future-of-work ─────────────────────────────────────────────────
  { by: "amina", type: "review", category: "future-of-work", title: "The 4-day week after a full year on it — what broke, what held, what I'm keeping", body: "Twelve months, real deadlines, one product launch inside the experiment. Output held, the fourth day turned out to be where all my thinking got done, and the failure mode was sneaking 'light admin' back in until the day wasn't real. The fix was structural, not discipline. Full review.", ageMin: 15, engaging: 14 },
  { by: "jordan", type: "compare", category: "future-of-work", title: "Async-first vs meeting-heavy weeks: I ran both with the same team, same quarter", body: "Same four people, alternating fortnights for a quarter. Async weeks produced more artifacts; meeting weeks produced more alignment. The trick nobody mentions: the meeting weeks' alignment decayed in nine days. Grid with the qualitative trade-offs.", ageMin: 75, tools: [6], engaging: 9 },
  { by: "noah", type: "help", category: "future-of-work", title: "How are other solo operators handling the 'always slightly behind' feeling?", body: "Systems help, but every system I install creates its own maintenance tax and eventually I'm behind on maintaining the systems for not being behind. Is the actual answer acceptance, or is there a class of tool that doesn't generate its own inbox? Looking for honest answers, not productivity content.", ageMin: 300, engaging: 11 },
  { by: "samir", type: "debate", category: "future-of-work", title: "Debate: personal brands are a workplace liability now", body: "Five years ago a public profile was leverage in any negotiation. Today hiring managers quietly screen for 'flight risk by audience size'. The leverage inverted and nobody updated their advice. Do you build in public under your name, a pseudonym, or not at all? Pick one and defend it.", ageMin: 420, engaging: 13 },
  { by: "yuki", type: "list", category: "future-of-work", title: "Six rituals from studio teams that ship consistently without crunching", body: "Collected from a year of interviewing small teams. None of the six are apps. All six are calendar decisions someone defended aggressively.", ageMin: 1320, engaging: 6 },
  { by: "priya", type: "spark", category: "future-of-work", title: "Spark: the calendar is the only honest strategy document", body: "Read someone's calendar and you know their actual priorities; read their roadmap and you know their aspirations. I've stopped asking teams about strategy and started asking for a screenshot of a normal week.", ageMin: 2160, engaging: 4 },
  { by: "maya", type: "showcase", category: "future-of-work", title: "Showcase: my entire two-tool work setup after deleting everything else", body: "Went from twenty-seven tools to two and a text file. The month of withdrawal was rough and the quarter after was the most productive of my life. What survived and why, including the embarrassing category of tools I kept paying for out of pure guilt.", ageMin: 6480, engaging: 8 },
  { by: "mateo", type: "review", category: "future-of-work", title: "Obsidian after 18 months as my company's entire knowledge base", body: "Three people, one vault, 4,000 notes. It survived a co-founder leaving, which is the real knowledge-base test. Git-backed plain text means our notes will outlive every SaaS we've canceled. Honest costs included: the onboarding tax is real and the plugin churn is a background hum of maintenance.", ageMin: 12960, tools: [6], engaging: 7 },
  { by: "nadia", type: "help", category: "future-of-work", title: "Career pivot into creator-adjacent work — what actually transferred for you?", body: "Ten years in lab science. The transferable parts turned out to be writing under deadline and explaining failure honestly — nobody warned me those were the moneymakers. What transferred for you that you didn't expect?", ageMin: 20160, engaging: 3 },
  { by: "kenji", type: "spark", category: "future-of-work", title: "Spark: 'AI won't take your job' and 'AI will take your tasks' are the same sentence at different zoom levels", body: "Your job is a bundle of tasks. Unbundle enough of them and the job re-prices. The defensive move isn't learning the tools — it's owning the parts of the bundle the tools make more valuable.", ageMin: 86400, engaging: 6 },

  // ── volume pass — fills out the feed across categories/types ───────
  { by: "iris", type: "list", category: "creator-business", title: "Seven newsletter subject lines that survived 40+ sends last quarter", body: "Pulled from the archive with open rates attached. Patterns, not templates — the reason each worked is noted, because copying the words without the reason is how everyone's inbox started sounding the same.", ageMin: 35, engaging: 5 },
  { by: "noah", type: "compare", category: "future-of-work", title: "Two focus timers, ninety days, one honest spreadsheet", body: "One gamifies, one just counts. The gamified one made me feel more productive; the counter made me actually work longer before checking the time. The spreadsheet is less flattering to the fun one.", ageMin: 95, tools: [6] },
  { by: "mateo", type: "review", category: "ai-technology", title: "The AI transcription tool I ditched and the one that replaced it", body: "Switched after the old one started charging by the minute for the same errors. The replacement isn't smarter — it's just honest about confidence, which turns out to matter more than accuracy on paper.", ageMin: 130, tools: [5], engaging: 4 },
  { by: "nadia", type: "debate", category: "digital-products", title: "Debate: free tiers devalue digital products for everyone", body: "Every free tier trains the market to wait for free. Against: free tiers are the only discovery channel left that doesn't cost a fortune in ads. I've bought both arguments on different days. Tiebreak me.", ageMin: 260, engaging: 7 },
  { by: "theo", type: "list", category: "internet-culture", title: "Four Discord servers that quietly outperform every public community I'm in", body: "What they share: hard entry, small rooms, and no growth metric anywhere. Public communities optimize for membership counts; these optimize for showing up tomorrow. The list explains each.", ageMin: 420, engaging: 3 },
  { by: "jordan", type: "showcase", category: "creator-business", title: "Showcase: our studio's client-facing status page, two months in", body: "A single Notion page that shows every client exactly where their project is, updated every Friday whether there's news or not. Support tickets dropped by half. The interesting part: clients say they read it even when nothing changed.", ageMin: 600, tools: [2], engaging: 6 },
  { by: "priya", type: "spark", category: "internet-culture", title: "Spark: every platform is converging on the same three feeds and nobody's happy", body: "Following, algorithmic, and paid — every app now has all three, half-labeled, and users build folk theories about which one they're looking at. The shared UI is a shared confusion, and confusion is where trust goes to die.", ageMin: 900, engaging: 8 },
  { by: "luca", type: "help", category: "digital-products", title: "Anyone migrated a product from one-time pricing to credits without rioting?", body: "The one-time price made sense at launch scale and doesn't now. Credits fix the economics but read as a cash grab to early buyers. If you've done this migration: what did you grandfather, and what did you learn the hard way?", ageMin: 1560, engaging: 5 },
  { by: "amina", type: "compare", category: "ai-technology", title: "Same lecture, two AI notetakers, one month — the notes diverged wildly", body: "One produced meeting minutes; the other produced an argument. Same audio, same speakers. The difference traces to how each handles disagreement in the room — one flattens it, one preserves it. For research audio, preserving it is everything.", ageMin: 2300, tools: [6] },
  { by: "sofia", type: "list", category: "digital-products", title: "Five pricing pages I keep screenshotting (and the one thing each does right)", body: "Not a best-of — a working collection. Each entry names the single decision the page made that most pricing pages dodge: anchoring, hiding, tiering honestly, pricing the outcome, or admitting the cheap tier exists for a reason.", ageMin: 3300, engaging: 4 },
  { by: "elena", type: "review", category: "future-of-work", title: "The standing desk of software: a focus app I regret buying, reviewed honestly", body: "It promised flow states and delivered a notification about my streak during a meeting. The two stars are for the calendar blocker, which works exactly as advertised and is genuinely the whole product.", ageMin: 5040, noComments: true },

  // ── edge cases ─────────────────────────────────────────────────────
  { by: "sofia", type: "spark", category: "ai-technology", title: "This title intentionally runs long enough to overflow the standard two-line clamp on feed cards so we can verify the truncation behavior renders correctly instead of blowing out the card layout on narrow viewports", body: "Layout fixture: the title above is the test. If it renders as three or more lines on a 390px viewport, the two-line clamp regressed.", ageMin: 50, noComments: true },
  { by: "luca", type: "review", category: "creator-business", title: "The complete first-year audit of my productized service — every number, every mistake, every near-miss, written down so you can skip the expensive parts", body: "This is the long one.\n\nWhen I started this service fourteen months ago I had a spreadsheet, a landing page, and a suspicion that agencies were overcharging for something a structured solo operator could deliver. The suspicion was right. The part I got wrong was everything adjacent to the delivery.\n\nMonth one: two clients at $400, both from public work, both underscoped. I delivered sixty hours of work for $800 because I priced the deliverable instead of the problem. Classic. The fix was not, as every guide says, 'raising prices' — it was writing down what the deliverable actually cost me in hours, which forced the price to raise itself.\n\nMonths two through four: the referral flywheel started, and this is where the first real decision showed up. Referrals arrived at the old price. Honoring the old price for referred clients felt loyal and was in fact a subsidy from my calendar to their goodwill. I kept it for two more months, measured the effective hourly, and stopped.\n\nThe middle of the year is a blur of exactly the operational toil this site exists to talk about: the client who paid annually and went quiet (a flags-and-communication failure on my side, not theirs), the contractor I hired too early and under-briefed, the month where a 'small scope addition' quietly became a second product I wasn't charging for.\n\nThe numbers, honestly stated: peak month $8,900, median month $5,400, one month at $0 because I took a contract to fix my own runway math. Refunds: two, both in month one, both my fault, both among the most useful hours I've worked. The referral discount I ran cost more than the ads I never bought.\n\nWhat I'd keep: pricing by problem, the weekly audit of where hours actually went, and refusing to sell the roadmap before the first deliverable. What I'd drop: the annual option for new clients, and any tool whose main feature was making me feel organized.\n\nIf you take one thing from this wall of text: the audit habit is the product. The service is just what the audit lets me promise.", ageMin: 120, tools: [3], engaging: 10 },
  { by: "iris", type: "spark", category: "digital-products", title: "Empty body on purpose — the card must lean on title and type alone", body: "", ageMin: 480, noComments: true },
];

// deterministic leaderboard points (per member, fixed)
function leaderboardPoints(m: Member): number {
  return m.might * 10 + (m.level === "galaxy" ? 40 : m.level === "nebula" ? 25 : 0);
}

function mustLevelIndex(m: Member): number {
  const i = LEVELS.indexOf(m.level);
  return i < 0 ? 0 : i;
}

// ── gates ──────────────────────────────────────────────────────────────
/** Every seed mutation calls this first — the server-side allowlist in
 *  seed/devGuard (loopback CONVEX_CLOUD_URL only, any cloud = refuse). */
function assertNotProd(): void {
  assertLocalDeploymentTx();
}

function demoEmail(handle: string): string {
  return `${handle}@${EMAIL_DOMAIN}`;
}

async function findUserByEmail(ctx: any, email: string): Promise<any | null> {
  return ctx.db.query("users").withIndex("email", (q: any) => q.eq("email", email)).unique();
}

// ── 1. identities: users, tools, distributions, levels, badges, ledger ─
export const seedIdentities = internalMutation({
  args: {},
  returns: v.object({
    users: v.number(),
    tools: v.number(),
    distributions: v.number(),
    levelAssignments: v.number(),
    membershipRows: v.number(),
    badges: v.number(),
    ledger: v.number(),
  }),
  handler: async (ctx) => {
    assertNotProd();
    const now = Date.now();
    const userIds = new Map<string, Id<"users">>();
    let tools = 0;

    for (const m of MEMBERS) {
      const email = demoEmail(m.handle);
      let user = await findUserByEmail(ctx, email);
      if (!user) {
        const username = normalizeHandle(m.handle);
        await ctx.db.insert("users", {
          ...canonicalSignupFields(email, m.name),
          handle: username,
          username,
          usernameNormalized: username,
          displayName: m.name,
          bio: m.bio,
          bootstrapState: "complete",
          postingEligibilityState: "eligible",
          basicProfileComplete: true,
          onboardingState: "engaged",
          activationQuality: "standard",
          leaderboardOptOut: false,
          lastActiveAt: now - (mustLevelIndex(m) % 5) * 3_600_000,
          postCount: 0,
          approvedCommentCount: 0,
          completionBadges: ["email_verified", "basic_profile_complete"],
          activationProgress: {
            emailVerified: true,
            mobileVerified: false,
            profileComplete: true,
            firstPostPublished: true,
            firstCommentPosted: true,
            firstReactionGiven: true,
            firstFollowMade: true,
          },
        });
        user = await findUserByEmail(ctx, email);
      }
      if (user) userIds.set(m.handle, user._id);
    }
    const users = userIds.size;

    for (const t of TOOLS) {
      const existing = await ctx.db.query("tools").withIndex("by_slug", (q: any) => q.eq("slug", t.slug)).unique();
      if (existing) continue;
      await ctx.db.insert("tools", {
        name: t.name,
        slug: t.slug,
        categoryIds: [t.category],
        officialUrl: `https://example.com/${t.slug}`,
        status: "active",
        ratingSum: 0,
        ratingCount: 0,
        dimensionSums: { ease_of_use: 0, output_quality: 0, reliability: 0, value_for_money: 0 },
        dimensionCounts: { ease_of_use: 0, output_quality: 0, reliability: 0, value_for_money: 0 },
      });
      tools += 1;
    }

    // per-member distributions + signal level assignments + badges + ledger
    const season = await ctx.db.query("signalSeasons").withIndex("by_seasonNumber", (q: any) => q.eq("seasonNumber", 1)).unique();
    let distributions = 0;
    let levelAssignments = 0;
    let badges = 0;
    let ledger = 0;

    for (const m of MEMBERS) {
      const userId = userIds.get(m.handle);
      if (!userId) continue;
      const { distributionId } = await ensureDistributionTx(ctx, userId);
      await ctx.db.patch(distributionId, {
        name: `${m.name.split(" ")[0]}'s distribution`,
        memberCount: m.reach,
        reachFactor: Math.round(m.reach / 100) / 10,
        activeSignalFactor: Math.round((m.reach / 20) * 10) / 10,
        might: m.might,
        mightPercentile: 90 + mustLevelIndex(m),
        currentLevel: m.level,
        highestLevelAchieved: m.level,
        awardsCount: mustLevelIndex(m) >= 5 ? 2 : mustLevelIndex(m) >= 3 ? 1 : 0,
        dormant: false,
      });
      distributions += 1;

      if (season) {
        const existing = await ctx.db
          .query("distributionLevelAssignments")
          .withIndex("by_distribution_season", (q: any) =>
            q.eq("distributionId", distributionId).eq("seasonId", season._id),
          )
          .take(4);
        if (existing.length === 0) {
          await ctx.db.insert("distributionLevelAssignments", {
            distributionId,
            seasonId: season._id,
            level: m.level,
            status: "active",
            mightAtCommit: m.might,
            committedAt: now - 30 * 86_400_000,
          });
          levelAssignments += 1;
        }
      }

      // level milestone badge for level 3+; profile completion badge for all
      const existingBadges = await ctx.db
        .query("badges")
        .withIndex("by_subject_state", (q: any) =>
          q.eq("subjectType", "user").eq("subjectId", userId).eq("state", "finalized"),
        )
        .filter((q: any) => q.eq(q.field("label"), `Level milestone: ${m.level}`))
        .first();
      if (!existingBadges && mustLevelIndex(m) >= 2) {
        await ctx.db.insert("badges", {
          subjectType: "user",
          subjectId: userId,
          type: "level_milestone",
          label: `Level milestone: ${m.level}`,
          level: m.level,
          mightAtAward: m.might,
          isFirstToAchieve: false,
          state: "finalized",
          awardedAt: now - (14 + mustLevelIndex(m)) * 86_400_000,
        });
        badges += 1;
      }
      const completionBadge = await ctx.db
        .query("badges")
        .withIndex("by_subject_state", (q: any) =>
          q.eq("subjectType", "user").eq("subjectId", userId).eq("state", "finalized"),
        )
        .filter((q: any) => q.eq(q.field("label"), "Profile complete"))
        .first();
      if (!completionBadge) {
        await ctx.db.insert("badges", {
          subjectType: "user",
          subjectId: userId,
          type: "profile_completion",
          label: "Profile complete",
          isFirstToAchieve: false,
          state: "finalized",
          awardedAt: now - 60 * 86_400_000,
        });
        badges += 1;
      }

      // journal samples — deterministic one tier_unlocked + one save_added
      const existingLedger = await ctx.db
        .query("activityLedger")
        .withIndex("by_user_type_created", (q: any) =>
          q.eq("userId", userId).eq("eventType", "tier_unlocked"),
        )
        .filter((q: any) => q.eq(q.field("summary"), `[${RUN_KEY}] Reached ${m.level}`))
        .first();
      if (!existingLedger) {
        await ctx.db.insert("activityLedger", {
          userId,
          eventType: "tier_unlocked",
          targetType: "user",
          targetId: userId,
          summary: `[${RUN_KEY}] Reached ${m.level}`,
          meta: { runId: { value: RUN_KEY, privacy: "public" } },
          visibility: "public",
          createdAt: now - 30 * 86_400_000,
        });
        ledger += 1;
      }
    }

    // membership rows: everyone joins the two flagship distributions, deterministically
    const flagshipOwners = ["samir", "yuki"];
    let membershipRows = 0;
    for (const ownerHandle of flagshipOwners) {
      const ownerId = userIds.get(ownerHandle);
      if (!ownerId) continue;
      const dist = await ctx.db.query("distributions").withIndex("by_owner", (q: any) => q.eq("ownerUserId", ownerId)).unique();
      if (!dist) continue;
      for (const m of MEMBERS) {
        if (m.handle === ownerHandle) continue;
        const memberId = userIds.get(m.handle);
        if (!memberId) continue;
        const existing = await ctx.db
          .query("distributionMemberships")
          .withIndex("by_distribution_member", (q: any) =>
            q.eq("distributionId", dist._id).eq("memberUserId", memberId),
          )
          .unique();
        if (existing) {
          membershipRows += 1;
          continue;
        }
        await ctx.db.insert("distributionMemberships", {
          distributionId: dist._id,
          memberUserId: memberId,
          memberLegitimacySnapshot: m.might,
          eligibilityStatus: "active",
          joinedAt: now - (20 + mustLevelIndex(m)) * 86_400_000,
        });
        membershipRows += 1;
      }
    }

    return { users, tools, distributions, levelAssignments, membershipRows, badges, ledger };
  },
});

// ── 2. posts (+ extensions, revisions, scores, seo, cards) ────────────
async function insertExtension(ctx: any, args: { postId: Id<"posts">; type: PostType; userId: Id<"users">; toolIds: string[]; title: string; body: string; createdAt: number }): Promise<void> {
  const { postId, type, userId, toolIds, title, body, createdAt } = args;
  switch (type) {
    case "review":
      await ctx.db.insert("postReviews", {
        postId,
        toolId: toolIds[0] ?? "",
        verdictScore: 4,
        verdictSummary: "Recommended with documented caveats.",
        pros: ["Does the core job reliably", "Honest about limits"],
        cons: ["Onboarding assumes prior context"],
      });
      break;
    case "compare":
      await ctx.db.insert("postCompares", {
        postId,
        toolIds: toolIds.slice(0, 3),
        qualitativeGrid: { axes: ["onboarding", "day-to-day velocity", "lock-in risk", "export story"] },
      });
      break;
    case "spark":
      await ctx.db.insert("postSparks", { postId, statement: title });
      break;
    case "debate":
      await ctx.db.insert("postDebates", {
        postId,
        proposition: title,
        agreeCount: 7,
        disagreeCount: 4,
        abstainCount: 2,
      });
      break;
    case "list": {
      const listId = await ctx.db.insert("postLists", {
        postId,
        mode: "community_ranked",
        intro: "Ranked from surviving a real production week — vote to reorder.",
      });
      const items = [
        "The weekly audit of where hours actually went",
        "Pricing by problem, not by deliverable",
        "The refund-reasons inbox read every Friday",
        "One deliberately closed tab per week",
        "The two-tool ceiling rule",
        "Writing the changelog before the feature",
      ];
        for (let i = 0; i < items.length; i++) {
        await ctx.db.insert("postListItems", {
          postListId: listId,
          content: items[i]!,
          createdByUserId: userId,
          voteCount: Math.max(0, 6 - i),
          sortOrder: i,
          createdAt,
        });
      }
      break;
    }
    case "showcase":
      await ctx.db.insert("postShowcases", {
        postId,
        theThing: body.slice(0, 2000),
        approvalStatus: "none",
      });
      break;
    case "help":
      await ctx.db.insert("postHelps", {
        postId,
        problemStatement: title,
        resolvedStatus: "open",
      });
      break;
  }
}

function scoreFor(spec: PostSpec, index: number, now: number): { publishedAt: number; valuableWeighted: number; replyCount: number } {
  const ageHours = spec.ageMin / 60;
  const publishedAt = now - spec.ageMin * 60_000;
  const valuableWeighted = spec.engaging ?? 2 + (index % 5);
  const replyCount = spec.noComments || spec.thread ? 0 : index % 3;
  return { publishedAt, valuableWeighted, replyCount };
}

async function insertPostDistributionScore(
  ctx: any,
  args: { postId: Id<"posts">; now: number; publishedAt: number; valuableWeighted: number; replyCount: number; index: number },
): Promise<void> {
  const { postId, now, publishedAt, valuableWeighted, replyCount, index } = args;
  const ageHours = Math.max(0.01, (now - publishedAt) / 3_600_000);
  const saveCount = index % 4;
  const distinctCommenters = replyCount > 0 ? Math.min(6, 2 + (index % 3)) : 0;
  const qualifiedReads = 10 + index * 2;
  const topPriorWeight = 5;
  const topPriorMean = 0.3;
  const denominator = valuableWeighted + topPriorWeight;
  const topScore =
    ((valuableWeighted + topPriorMean * topPriorWeight) / denominator) *
    (1 + Math.min(0.5, distinctCommenters * 0.05));
  const engagement = valuableWeighted + replyCount + saveCount + qualifiedReads;
  const hotScore = engagement * Math.pow(2, -ageHours / 12);
  await ctx.db.insert("postDistributionScores", {
    postId,
    distributionQualityVersion: 1,
    topScore: Math.round(topScore * 1000) / 1000,
    hotScore: Math.round(hotScore * 1000) / 1000,
    trendScore: index < 6 ? 2.5 - index * 0.3 : 0,
    integrityMultiplier: 1,
    valuableWeighted,
    distinctCommenters,
    replyCount,
    saveCount,
    qualifiedReads,
    returns7d: index % 5,
    qualifiedExposureCount: qualifiedReads,
    explorationDeficit: Math.max(0, 20 - qualifiedReads),
    lastEligibleInteractionAt: publishedAt + replyCount * 90_000,
    scoreVersion: 1,
    computedAt: now,
  });
}

async function toolIdsFor(ctx: any, spec: PostSpec): Promise<string[]> {
  const out: string[] = [];
  for (const i of spec.tools ?? []) {
    const row = await ctx.db.query("tools").withIndex("by_slug", (q: any) => q.eq("slug", TOOLS[i]!.slug)).unique();
    if (row) out.push(row._id);
  }
  return out;
}

export const seedPosts = internalMutation({
  args: {},
  returns: v.object({ posts: v.number(), created: v.number(), skipped: v.number() }),
  handler: async (ctx) => {
    assertNotProd();
    const now = Date.now();
    const users = new Map<string, Id<"users">>();
    for (const m of MEMBERS) {
      const u = await findUserByEmail(ctx, demoEmail(m.handle));
      if (u) users.set(m.handle, u._id);
    }
    let created = 0;
    let skipped = 0;
    const perUserCounts = new Map<string, number>();

    for (const [index, spec] of POSTS.entries()) {
      const authorId = users.get(spec.by);
      if (!authorId) throw new Error(`seed/demo: missing author ${spec.by}`);
      const existing = await ctx.db
        .query("posts")
        .withIndex("by_author_type_authorUserId", (q: any) =>
          q.eq("authorType", "user").eq("authorUserId", authorId),
        )
        .filter((q: any) => q.eq(q.field("title"), spec.title))
        .first();
      if (existing) {
        skipped += 1;
        perUserCounts.set(spec.by, (perUserCounts.get(spec.by) ?? 0) + 1);
        continue;
      }

      const toolIds = await toolIdsFor(ctx, spec);
      const scored = scoreFor(spec, index, now);
      const postId = (await ctx.db.insert("posts", {
        authorType: "user",
        authorUserId: authorId,
        type: spec.type,
        title: spec.title,
        body: spec.body,
        categoryId: spec.category,
        toolIds: spec.type === "review" ? toolIds.slice(0, 1) : spec.type === "compare" ? toolIds.slice(0, 3) : [],
        lifecycleStatus: "published",
        moderationStatus: "passed",
        visibility: "public",
        publishedAt: scored.publishedAt,
        createdAt: scored.publishedAt,
      })) as Id<"posts">;

      await insertExtension(ctx, { postId, type: spec.type, userId: authorId, toolIds, title: spec.title, body: spec.body, createdAt: scored.publishedAt });
      await ctx.db.insert("postRevisions", {
        postId,
        revisionNumber: 1,
        title: spec.title,
        body: spec.body,
        changeType: "create",
        changedByUserId: authorId,
        createdAt: scored.publishedAt,
      });
      await insertPostDistributionScore(ctx, {
        postId,
        now,
        publishedAt: scored.publishedAt,
        valuableWeighted: scored.valuableWeighted,
        replyCount: scored.replyCount,
        index,
      });
      await ensurePostSeoMetaTx(ctx, { postId, title: spec.title, body: spec.body, type: spec.type, now: scored.publishedAt });
      const oneLiner = (spec.body || spec.title).replace(/\s+/g, " ").slice(0, 140);
      await ctx.db.insert("cardSummaries", {
        postId,
        oneLiner,
        generationRunId: RUN_KEY,
        supportingClaimIds: [],
        groundingStatus: "insufficient",
        stale: false,
        avatarUserIds: [],
        discussingCount: 0,
        createdAt: scored.publishedAt,
      });
      created += 1;
      perUserCounts.set(spec.by, (perUserCounts.get(spec.by) ?? 0) + 1);
    }

    for (const [handle, count] of perUserCounts.entries()) {
      const userId = users.get(handle);
      if (!userId) continue;
      await ctx.db.patch(userId, { postCount: count, lastActiveAt: now });
    }

    return { posts: perUserCounts.size > 0 ? POSTS.length : 0, created, skipped };
  },
});

// ── 3. engagement: comments, the 21-reply thread, reactions, saves, votes,
//        leaderboard, vibing, hero, featured ─────────────────────────────
const THREAD_REPLIES: { by: string; text: string; ageMin: number }[] = [
  { by: "kenji", text: "The API-invention failure mode is the one that ended my trial early. Did prompt scaffolding (repo map, conventions file) actually reduce it for you, or just relocate it?", ageMin: 9 },
  { by: "maya", text: "Relocated it, mostly. The inventions got more plausible-looking, which is worse in review and better in runtime. I check diffs harder now, not less.", ageMin: 8 },
  { by: "samir", text: "This matches what I'm seeing across teams: the tool changes where your review attention should go, and most people don't move it.", ageMin: 8 },
  { by: "iris", text: "22 sessions is a real sample. Did the 4 abandoned threads share a pattern, or was it genuinely random?", ageMin: 7 },
  { by: "maya", text: "Two shared a pattern: anything touching config generation. The other two were me writing ambiguous specs and getting confidently-wrong architecture back.", ageMin: 7 },
  { by: "luca", text: "The 3 genuine saves — were they days saved on the calendar or days saved of nagging yourself to start? Asking because mine are always the second kind and I keep counting them as the first.", ageMin: 6 },
  { by: "maya", text: "One calendar-day save (a migration I'd have postponed for a week), two of the nagging kind. Honest accounting matters here or the whole trial is vibes.", ageMin: 6 },
  { by: "noah", text: "Do you keep the trial receipts published anywhere, or just for yourself? I'd read a public ledger of 'what I claimed vs what held up'.", ageMin: 5 },
  { by: "maya", text: "Just for myself so far — publishing the misses feels like a different commitment level. Might do a quarter-end retro post.", ageMin: 5 },
  { by: "theo", text: "As a student watching professionals use this: the 'budget review time for the diff, not the prompt' line is the realest advice in this thread.", ageMin: 5 },
  { by: "priya", text: "Curious whether your 30-day verdict changed your recommendation to clients, or just your own workflow?", ageMin: 4 },
  { by: "maya", text: "Changed my default recommendation from 'try it on greenfield only' to 'try it anywhere with tests'. The presence of a test suite flips the failure mode from expensive to annoying.", ageMin: 4 },
  { by: "kenji", text: "That's a useful decision rule. Adding it to my stack-selection criteria as a hard column: does the repo have a safety net.", ageMin: 4 },
  { by: "sofia", text: "Counterpoint from the cheap seats: a month is still a honeymoon. The tools that decay do it in months four through six, when the novelty stops subsidizing the setup effort.", ageMin: 3 },
  { by: "maya", text: "Fair hit. I'll keep running it and post the 90-day follow-up — if the numbers sag I'll say so with the same volume I used here.", ageMin: 3 },
  { by: "elena", text: "The 'confidently invents internal APIs' bit is exactly why I don't let it near my build scripts. People keep showing off one-shot deploys and I keep thinking about the morning after.", ageMin: 3 },
  { by: "yuki", text: "Same failure in research summarization, different costume: it invents citations that sound like papers you'd cite. Plausibility is the enemy.", ageMin: 2 },
  { by: "mateo", text: "Thread's worth more than most courses I've paid for. The meta-lesson I'm taking: run trials with exit criteria written before you start.", ageMin: 2 },
  { by: "nadia", text: "Late to this but as a beginner: what does 'repo-wide refactor without losing the plot' actually mean in practice? Genuinely asking.", ageMin: 1 },
  { by: "samir", text: "It means you ask for a rename across 40 files and it correctly updates the imports, the tests that reference them, and doesn't hallucinate a 41st file. Pre-agents, that was a find-and-replace plus a week of regret.", ageMin: 1 },
];

export const seedEngagement = internalMutation({
  args: {},
  returns: v.object({
    threadComments: v.number(),
    scatteredComments: v.number(),
    commentReactions: v.number(),
    commentSaves: v.number(),
    postSaves: v.number(),
    debateVotes: v.number(),
    listItemVotes: v.number(),
    leaderboard: v.number(),
    vibing: v.number(),
    hero: v.number(),
    featured: v.number(),
  }),
  handler: async (ctx) => {
    assertNotProd();
    const now = Date.now();
    const users = new Map<string, Id<"users">>();
    for (const m of MEMBERS) {
      const u = await findUserByEmail(ctx, demoEmail(m.handle));
      if (u) users.set(m.handle, u._id);
    }

    const postsByEmail = async (handle: string) => {
      const authorId = users.get(handle);
      if (!authorId) return [] as any[];
      const rows = await ctx.db
        .query("posts")
        .withIndex("by_author_type_authorUserId", (q: any) =>
          q.eq("authorType", "user").eq("authorUserId", authorId),
        )
        .collect();
      return rows;
    };

    // ── the 21-comment thread on maya's review ──────────────────────
    let threadComments = 0;
    const mayaPosts = await postsByEmail("maya");
    const threadPost = mayaPosts.find((p: any) => p.title.startsWith("Claude Code after 30 days"));
    if (threadPost) {
      const existingRoots = await ctx.db
        .query("comments")
        .withIndex("by_post_depth_created", (q: any) => q.eq("postId", threadPost._id).eq("depth", 0))
        .take(5);
      if (existingRoots.length === 0) {
        const rootId = (await ctx.db.insert("comments", {
          postId: threadPost._id,
          depth: 0,
          authorType: "user",
          authorUserId: users.get("kenji")!,
          body: "Trial receipts are the differentiator here — most reviews are vibes after a weekend. Two questions: did your review load stay higher than pre-agent baseline all month, and did the three saves survive contact with the client's own deadlines?",
          isQuestion: true,
          moderationStatus: "passed",
          createdAt: now - 10 * 60_000,
          lastActivityAt: now - 1 * 60_000,
        })) as Id<"comments">;
        await ctx.db.patch(rootId, { threadRootCommentId: rootId });
        await ctx.db.insert("commentScores", {
          commentId: rootId,
          valuableCount: 6,
          replyCount: THREAD_REPLIES.length,
          distinctReplierCount: 11,
          saveCount: 2,
          contextSignalCount: 0,
          bestScore: 1.4,
          liveScore: 1.0,
          mostDiscussedScore: 0.9,
          rankVersion: 1,
          lastInteractionAt: now,
          lastRankedAt: now,
          dirty: false,
        });
        threadComments += 1;

        let parent: Id<"comments"> = rootId;
        let lastCommentId: Id<"comments"> = rootId;
        for (const [i, reply] of THREAD_REPLIES.entries()) {
          // a few replies chain onto earlier replies; most attach to the root
          if (i > 0 && i % 4 === 3) {
            // keep parent as the previous reply (depth stays 1)
          } else {
            parent = rootId;
          }
          const createdAt = now - reply.ageMin * 60_000;
          const commentId = (await ctx.db.insert("comments", {
            postId: threadPost._id,
            parentCommentId: parent,
            replyToCommentId: parent,
            threadRootCommentId: rootId,
            depth: 1,
            authorType: "user",
            authorUserId: users.get(reply.by)!,
            body: reply.text,
            isQuestion: false,
            moderationStatus: "passed",
            createdAt,
            lastActivityAt: createdAt,
          })) as Id<"comments">;
          await ctx.db.insert("commentScores", {
            commentId,
            valuableCount: (i * 7) % 5,
            replyCount: 0,
            distinctReplierCount: 0,
            saveCount: 0,
            contextSignalCount: 0,
            bestScore: ((i * 13) % 7) / 10,
            liveScore: ((i * 11) % 5) / 10,
            mostDiscussedScore: 0,
            rankVersion: 1,
            lastInteractionAt: createdAt,
            lastRankedAt: createdAt,
            dirty: false,
          });
          threadComments += 1;
          lastCommentId = commentId;
          if (i > 0 && i % 4 === 3) parent = commentId;
        }

        await ctx.db.insert("threadStats", {
          postId: threadPost._id,
          humanCommentCount: 1 + THREAD_REPLIES.length,
          personaCommentCount: 0,
          topLevelCount: 1,
          replyCount: THREAD_REPLIES.length,
          humanParticipantCount: 11,
          unresolvedQuestionCount: 1,
          latestHumanCommentId: lastCommentId,
          latestActivityAt: now - 60_000,
          threadRevision: 1 + THREAD_REPLIES.length,
          updatedAt: now - 60_000,
        });
      }
    }

    // ── scattered comments on posts that opt in (not noComments/thread) ─
    let scatteredComments = 0;
    const SCATTERED: { by: string; onAuthor: string; titlePrefix: string; text: string; ageMin: number }[] = [
      { by: "noah", onAuthor: "samir", titlePrefix: "The only five numbers", text: "Which of the five moves first when a launch flops? Asking because mine always tell me after I already know.", ageMin: 200 },
      { by: "luca", onAuthor: "amina", titlePrefix: "The 4-day week", text: "The 'sneaking light admin back in' failure is so real. What was the structural fix — a blocked calendar or a rule?", ageMin: 12 },
      { by: "amina", onAuthor: "luca", titlePrefix: "The complete first-year audit", text: "Pricing the problem instead of the deliverable — did that reframing change your intake call too, or just the number?", ageMin: 118 },
      { by: "iris", onAuthor: "priya", titlePrefix: "Substack vs Beehiiv", text: "The export story is the part nobody demos until moving week. Which one made you wince?", ageMin: 88 },
      { by: "priya", onAuthor: "iris", titlePrefix: "Cursor's new background agents", text: "One in three merge-ready is better than my numbers. Curious what your briefs look like — mine are probably too thin.", ageMin: 4310 },
      { by: "maya", onAuthor: "noah", titlePrefix: "How are other solo operators", text: "Acceptance, then a weekly deletion pass. The systems that survive are the ones that generate no inbox of their own.", ageMin: 295 },
      { by: "kenji", onAuthor: "elena", titlePrefix: "I open-sourced my course's", text: "The generator-as-demo move is quietly brilliant. Did open-sourcing cost you any paid conversions you can see?", ageMin: 5740 },
      { by: "sofia", onAuthor: "samir", titlePrefix: "Spark: the winning skill", text: "Taste filtration is trained by consumption — hardest sentence to sell to someone who consumes only their own niche.", ageMin: 118 },
    ];
    const commentIdsByAuthor = new Map<string, Id<"comments">>();
    for (const target of SCATTERED) {
      const authorPosts = await postsByEmail(target.onAuthor);
      const post = authorPosts.find((p: any) => p.title.startsWith(target.titlePrefix));
      if (!post) continue;
      const existing = await ctx.db
        .query("comments")
        .withIndex("by_post_depth_created", (q: any) => q.eq("postId", post._id).eq("depth", 0))
        .take(10);
      if (existing.length > 0) continue;
      const userId = users.get(target.by)!;
      const createdAt = now - target.ageMin * 60_000;
      const commentId = (await ctx.db.insert("comments", {
        postId: post._id,
        depth: 0,
        authorType: "user",
        authorUserId: userId,
        body: target.text,
        isQuestion: false,
        moderationStatus: "passed",
        createdAt,
        lastActivityAt: createdAt,
      })) as Id<"comments">;
      await ctx.db.patch(commentId, { threadRootCommentId: commentId });
      await ctx.db.insert("commentScores", {
        commentId,
        valuableCount: 2,
        replyCount: 0,
        distinctReplierCount: 0,
        saveCount: 0,
        contextSignalCount: 0,
        bestScore: 0.5,
        liveScore: 0.3,
        mostDiscussedScore: 0,
        rankVersion: 1,
        lastInteractionAt: createdAt,
        lastRankedAt: createdAt,
        dirty: false,
      });
      commentIdsByAuthor.set(target.by, commentId);
      scatteredComments += 1;
      const stats = await ctx.db.query("threadStats").withIndex("by_postId", (q: any) => q.eq("postId", post._id)).unique();
      if (!stats) {
        await ctx.db.insert("threadStats", {
          postId: post._id,
          humanCommentCount: 1,
          personaCommentCount: 0,
          topLevelCount: 1,
          replyCount: 0,
          humanParticipantCount: 1,
          unresolvedQuestionCount: 0,
          latestHumanCommentId: commentId,
          latestActivityAt: createdAt,
          threadRevision: 1,
          updatedAt: createdAt,
        });
      }
    }

    // ── comment upvotes + saves ──────────────────────────────────────
    let commentReactions = 0;
    let commentSaves = 0;
    const reactionPlan: { user: string; onCommentBy: string }[] = [
      { user: "samir", onCommentBy: "kenji" },
      { user: "maya", onCommentBy: "kenji" },
      { user: "luca", onCommentBy: "kenji" },
      { user: "noah", onCommentBy: "kenji" },
      { user: "iris", onCommentBy: "kenji" },
      { user: "nadia", onCommentBy: "kenji" },
      { user: "theo", onCommentBy: "kenji" },
    ];
    for (const plan of reactionPlan) {
      const commentId = commentIdsByAuthor.get(plan.onCommentBy);
      const userId = users.get(plan.user);
      if (!commentId || !userId) continue;
      const existing = await ctx.db
        .query("commentReactions")
        .withIndex("by_comment_type", (q: any) => q.eq("commentId", commentId).eq("reactionType", "valuable"))
        .filter((q: any) => q.eq(q.field("userId"), userId))
        .first();
      if (existing) continue;
      await ctx.db.insert("commentReactions", {
        userId,
        commentId,
        reactionType: "valuable",
        weightAtCast: 1,
        createdAt: now - 90 * 60_000,
      });
      commentReactions += 1;
    }
    {
      const commentId = commentIdsByAuthor.get("noah");
      const userId = users.get("iris");
      if (commentId && userId) {
        const existing = await ctx.db.query("commentSaves").withIndex("by_comment", (q: any) => q.eq("commentId", commentId)).filter((q: any) => q.eq(q.field("userId"), userId)).first();
        if (!existing) {
          await ctx.db.insert("commentSaves", { userId, commentId, createdAt: now - 100 * 60_000 });
          commentSaves += 1;
        }
      }
    }

    // ── post bookmarks ───────────────────────────────────────────────
    let postSaves = 0;
    const savePlan: { user: string; onAuthor: string; titlePrefix: string }[] = [
      { user: "iris", onAuthor: "samir", titlePrefix: "The only five numbers" },
      { user: "mateo", onAuthor: "samir", titlePrefix: "The only five numbers" },
      { user: "nadia", onAuthor: "amina", titlePrefix: "The 4-day week" },
      { user: "theo", onAuthor: "luca", titlePrefix: "The complete first-year audit" },
      { user: "priya", onAuthor: "maya", titlePrefix: "Claude Code after 30 days" },
      { user: "kenji", onAuthor: "maya", titlePrefix: "Claude Code after 30 days" },
      { user: "noah", onAuthor: "maya", titlePrefix: "Claude Code after 30 days" },
      { user: "jordan", onAuthor: "luca", titlePrefix: "The complete first-year audit" },
      { user: "iris", onAuthor: "kenji", titlePrefix: "Six AI workflow additions" },
      { user: "sofia", onAuthor: "elena", titlePrefix: "I open-sourced my course's" },
    ];
    for (const plan of savePlan) {
      const userId = users.get(plan.user);
      const authorPosts = await postsByEmail(plan.onAuthor);
      const post = authorPosts.find((p: any) => p.title.startsWith(plan.titlePrefix));
      if (!userId || !post) continue;
      const existing = await ctx.db.query("saves").withIndex("by_user_post", (q: any) => q.eq("userId", userId).eq("postId", post._id)).unique();
      if (existing) {
        postSaves += 1;
        continue;
      }
      await ctx.db.insert("saves", { userId, postId: post._id, createdAt: now - 70 * 60_000 });
      postSaves += 1;
    }

    // ── debate + list votes ──────────────────────────────────────────
    let debateVotes = 0;
    let listItemVotes = 0;
    const debatePlan: { user: string; onAuthor: string; titlePrefix: string; choice: "agree" | "disagree" | "abstain" }[] = [
      { user: "kenji", onAuthor: "sofia", titlePrefix: "Debate: AI-assisted writing", choice: "agree" },
      { user: "iris", onAuthor: "sofia", titlePrefix: "Debate: AI-assisted writing", choice: "agree" },
      { user: "luca", onAuthor: "sofia", titlePrefix: "Debate: AI-assisted writing", choice: "disagree" },
      { user: "nadia", onAuthor: "sofia", titlePrefix: "Debate: AI-assisted writing", choice: "agree" },
      { user: "samir", onAuthor: "samir", titlePrefix: "Debate: personal brands", choice: "agree" },
      { user: "jordan", onAuthor: "samir", titlePrefix: "Debate: personal brands", choice: "disagree" },
      { user: "maya", onAuthor: "samir", titlePrefix: "Debate: personal brands", choice: "disagree" },
    ];
    for (const plan of debatePlan) {
      const userId = users.get(plan.user);
      const authorPosts = await postsByEmail(plan.onAuthor);
      const post = authorPosts.find((p: any) => p.title.startsWith(plan.titlePrefix));
      if (!userId || !post) continue;
      const existing = await ctx.db.query("debateVotes").withIndex("by_postId", (q: any) => q.eq("postId", post._id)).filter((q: any) => q.eq(q.field("userId"), userId)).first();
      if (existing) continue;
      await ctx.db.insert("debateVotes", { postId: post._id, userId, choice: plan.choice, createdAt: now - 160 * 60_000 });
      debateVotes += 1;
    }
    {
      // vote up the top item of maya's list post
      const userId = users.get("theo");
      const listPosts = await postsByEmail("yuki");
      const listPost = listPosts.find((p: any) => p.title.startsWith("Six AI workflow additions"));
      if (userId && listPost) {
        const list = await ctx.db.query("postLists").withIndex("by_postId", (q: any) => q.eq("postId", listPost._id)).first();
        if (list) {
          const items = await ctx.db.query("postListItems").withIndex("by_postListId_sortOrder", (q: any) => q.eq("postListId", list._id)).take(10);
          const top = items[0];
          if (top) {
            const existing = await ctx.db.query("listItemVotes").withIndex("by_item", (q: any) => q.eq("postListItemId", top._id)).filter((q: any) => q.eq(q.field("userId"), userId)).first();
            if (!existing) {
              await ctx.db.insert("listItemVotes", { postListItemId: top._id, userId, createdAt: now - 1400 * 60_000 });
              listItemVotes += 1;
            }
          }
        }
      }
    }

    // ── leaderboard (podium source: overall/d7 via getChrome) ────────
    let leaderboard = 0;
    {
      const ranked = [...MEMBERS]
        .sort((a, b) => leaderboardPoints(b) - leaderboardPoints(a))
        .slice(0, 10)
        .map((m, i) => ({ userId: users.get(m.handle)!, rank: i + 1, points: leaderboardPoints(m), trend: i < 3 ? "up" : i > 7 ? "down" : "flat" }));
      for (const window of ["d7", "h24"] as const) {
        const existing = await ctx.db
          .query("leaderboardProjections")
          .withIndex("by_category_window", (q: any) => q.eq("category", "overall").eq("window", window))
          .unique();
        const row = {
          category: "overall" as const,
          window,
          projectionVersion: 1,
          entries: ranked,
          minThresholdMet: true,
          computedAt: now,
        };
        if (existing) await ctx.db.patch(existing._id, row);
        else await ctx.db.insert("leaderboardProjections", row);
        leaderboard += 1;
      }
    }

    // ── vibing + hero + featured chrome ──────────────────────────────
    let vibing = 0;
    let hero = 0;
    let featured = 0;
    {
      const trendingPrefixes = [
        "Claude Code after 30 days",
        "The 4-day week after a full year",
        "Beehiiv at 8,400 subscribers",
        "The only five numbers",
        "Spark: the reply guy economy",
        "Debate: personal brands",
      ];
      const allPosts: any[] = [];
      for (const m of MEMBERS) allPosts.push(...(await postsByEmail(m.handle)));
      for (const [i, prefix] of trendingPrefixes.entries()) {
        const post = allPosts.find((p: any) => p.title.startsWith(prefix));
        if (!post) continue;
        const existing = await ctx.db
          .query("vibingTrends")
          .withIndex("by_object", (q: any) => q.eq("objectType", "post").eq("objectId", post._id))
          .unique();
        if (!existing) {
          await ctx.db.insert("vibingTrends", {
            objectType: "post",
            objectId: post._id,
            trendScore: 4 - i * 0.4,
            velocity: 1.1 + i * 0.1,
            acceleration: 0.3,
            distinctHumanCount: 6 - i,
            interactionTypeCount: 3,
            integrityMultiplier: 1,
            enteredAt: now - i * 40 * 60_000,
            status: "trending",
          });
          await ctx.db.insert("vibingHooks", {
            objectType: "post",
            objectId: post._id,
            hookText: post.title,
            valence: "informational",
            groundingStatus: "insufficient",
            entailment: "insufficient",
            supportingSpans: [],
            opposingSpans: [],
            generationRunId: RUN_KEY,
            stale: false,
            createdAt: now - i * 40 * 60_000,
          });
          vibing += 1;
        }
      }
      const heroPrefixes = ["Claude Code after 30 days", "The 4-day week after a full year", "Beehiiv at 8,400 subscribers"];
      for (const [i, prefix] of heroPrefixes.entries()) {
        const post = allPosts.find((p: any) => p.title.startsWith(prefix));
        if (!post) continue;
        const existing = await ctx.db.query("heroSlots").withIndex("by_slotOrder", (q: any) => q.eq("slotOrder", i)).first();
        if (existing) {
          hero += 1;
          continue;
        }
        await ctx.db.insert("heroSlots", {
          slotOrder: i,
          postId: post._id,
          headlineOverride: post.title,
          ctaLabel: "Read the trial notes",
          startAt: now - 30 * 60_000,
          endAt: now + 7 * 86_400_000,
          desktopEnabled: true,
          mobileEnabled: true,
          status: "active",
          disclosureClass: i === 0 ? "community_top" : "editorial",
          createdAt: now - 30 * 60_000,
        });
        hero += 1;
      }
      const featuredPrefix = "The only five numbers";
      {
        const post = allPosts.find((p: any) => p.title.startsWith(featuredPrefix));
        const staff = users.get("samir");
        if (post && staff) {
          const existing = await ctx.db.query("vibingFeatured").withIndex("by_postId", (q: any) => q.eq("postId", post._id)).first();
          if (!existing) {
            await ctx.db.insert("vibingFeatured", {
              postId: post._id,
              label: "Editor's pick",
              startAt: now - 45 * 60_000,
              endAt: now + 3 * 86_400_000,
              status: "active",
              approvedByUserId: staff,
              createdAt: now - 45 * 60_000,
            });
            featured += 1;
          }
        }
      }
    }

    return {
      threadComments,
      scatteredComments,
      commentReactions,
      commentSaves,
      postSaves,
      debateVotes,
      listItemVotes,
      leaderboard,
      vibing,
      hero,
      featured,
    };
  },
});

// ── 4. notifications for the dev test account ─────────────────────────
const DEVTEST_EMAIL = "devtest@example.com";
type NotifSpec = {
  type: "post_comment" | "comment_reply" | "signal_level_changed" | "help_resolution" | "saved_post_activity" | "moderation_resolved";
  objectType: string;
  actor: string;
  ageMin: number;
  read: boolean;
  /** findPost: [authorHandle, titlePrefix] for post/comment targets */
  findPost?: [string, string];
};
const NOTIFICATIONS: NotifSpec[] = [
  { type: "post_comment", objectType: "post", actor: "kenji", ageMin: 8, read: false, findPost: ["maya", "Claude Code after 30 days"] },
  { type: "comment_reply", objectType: "comment", actor: "samir", ageMin: 35, read: false, findPost: ["maya", "Claude Code after 30 days"] },
  { type: "saved_post_activity", objectType: "post", actor: "luca", ageMin: 180, read: false, findPost: ["luca", "The complete first-year audit"] },
  { type: "signal_level_changed", objectType: "user", actor: "samir", ageMin: 1440, read: true },
  { type: "help_resolution", objectType: "post", actor: "noah", ageMin: 2880, read: true, findPost: ["noah", "How are other solo operators"] },
  { type: "moderation_resolved", objectType: "comment", actor: "sofia", ageMin: 4320, read: true, findPost: ["amina", "The 4-day week"] },
];

export const seedNotifications = internalMutation({
  args: {},
  returns: v.object({ notifications: v.number(), skipped: v.boolean() }),
  handler: async (ctx) => {
    assertNotProd();
    const now = Date.now();
    const devtest = await findUserByEmail(ctx, DEVTEST_EMAIL);
    if (!devtest) {
      return { notifications: 0, skipped: true };
    }
    let inserted = 0;
    for (const [i, spec] of NOTIFICATIONS.entries()) {
      const dedupeKey = `${RUN_KEY}:devtest:${i}`;
      const existing = await ctx.db.query("notifications").withIndex("by_dedupe", (q: any) => q.eq("dedupeKey", dedupeKey)).unique();
      if (existing) continue;
      const actor = await findUserByEmail(ctx, demoEmail(spec.actor));

      let objectId = String(devtest._id);
      if (spec.findPost) {
        const [authorHandle, titlePrefix] = spec.findPost;
        const author = await findUserByEmail(ctx, demoEmail(authorHandle));
        const post = author
          ? await ctx.db
              .query("posts")
              .withIndex("by_author_type_authorUserId", (q: any) => q.eq("authorType", "user").eq("authorUserId", author._id))
              .collect()
              .then((rows: any[]) => rows.find((p: any) => typeof p.title === "string" && p.title.startsWith(titlePrefix)) ?? null)
          : null;
        if (!post) continue; // target post not seeded — skip rather than fabricate
        if (spec.objectType === "post") {
          objectId = String(post._id);
        } else {
          const comment = await ctx.db
            .query("comments")
            .withIndex("by_post_depth_created", (q: any) => q.eq("postId", post._id).eq("depth", 0))
            .order("desc")
            .first();
          if (!comment) continue;
          objectId = String(comment._id);
        }
      }

      await ctx.db.insert("notifications", {
        recipientUserId: devtest._id,
        notificationType: spec.type,
        objectType: spec.objectType,
        objectId,
        actorUserIds: actor ? [actor._id] : [],
        eventCount: 1,
        dedupeKey,
        status: spec.read ? "read" : "unread",
        priority: spec.type === "moderation_resolved" ? "legal" : "social",
        batchWindowStartedAt: now - spec.ageMin * 60_000,
        createdAt: now - spec.ageMin * 60_000,
        updatedAt: now - spec.ageMin * 60_000,
        ...(spec.read ? { readAt: now - spec.ageMin * 60_000 + 3_600_000 } : {}),
      });
      inserted += 1;
    }
    return { notifications: inserted, skipped: false };
  },
});

// ── orchestration ──────────────────────────────────────────────────────
export const seed = internalAction({
  args: {},
  returns: v.object({
    identities: v.any(),
    posts: v.any(),
    engagement: v.any(),
    notifications: v.any(),
  }),
  handler: async (ctx): Promise<{
    identities: unknown;
    posts: unknown;
    engagement: unknown;
    notifications: unknown;
  }> => {
    await ctx.runMutation(internal.seed.demo.seedIdentities, {});
    const posts = await ctx.runMutation(internal.seed.demo.seedPosts, {});
    const engagement = await ctx.runMutation(internal.seed.demo.seedEngagement, {});
    const notifications = await ctx.runMutation(internal.seed.demo.seedNotifications, {});
    return { identities: { ok: true }, posts, engagement, notifications };
  },
});
