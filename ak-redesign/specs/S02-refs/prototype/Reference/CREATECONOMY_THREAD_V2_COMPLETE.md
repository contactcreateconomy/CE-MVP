# CREATECONOMY — THREAD DISCUSSION PAGE v2
## Complete Feature Specification · MVP 0 · All 9 Categories
## Prepared for Claude Code (Opus) Handoff

---

## DOCUMENT STRUCTURE

This document is organized into **3 priority phases**:

- **Phase 1 — MUST HAVE**: The core foundation. Ship this first. Without these, the product doesn't function.
- **Phase 2 — GOOD TO HAVE (Wow Factors)**: Features that make the 3% TAM say "this is different." These create the differentiation moat.
- **Phase 3 — NICE TO HAVE (Alien Level)**: Futuristic features that make creators feel like they're using a platform from 2030. Complex but buildable. Separate evaluation required before committing.

Each phase contains: Core Shell features (all categories) + Category-specific features (per category).

The **MIN/MAX toggle** is the master control:
- **MIN** = Read + Discuss. Clean, calm, content-first. No intelligence overlays. This is the default on every page load.
- **MAX** = Analyze + Decide. Same page, same thread, but reveals insight panels, quality signals, advanced filters, and AI intelligence layers. Toggling preserves scroll position, no reload, smooth transition.

---

## CONTEXT FOR CLAUDE CODE

You are building the **Thread Discussion Detail Page** for Createconomy — a creator economy discussion platform for the top 3% of tech builders, AI tool testers, and vibecoders. This is a **frontend-only build**. All data is mocked. The design system and visual tokens are already implemented in the home feed — inherit everything, introduce nothing new visually.

The page lives at `/discussion/[id]`. It opens when a user clicks any post card from the home feed.

The layout is **3-column** — the same grid as the home feed: Left Nav (reuse existing), Center Thread (main build), Right Sidebar (contextual). All 9 categories share one thread shell. What changes per category is the body block that renders between the header and the comment section.

**Architectural rule**: 70–80% shared UI, 20–30% category adaptation. Users must never feel they're on a different product when switching categories. Same interaction patterns, same keyboard shortcuts, same mental model. What changes is semantic emphasis and block ordering.

---

## PART 0 — MOCK DATA STRATEGY

Create one mock data file per category inside `/src/lib/mock-data/threads/`. Each file must contain realistic, creator-economy-relevant content — not lorem ipsum. The data must visually demonstrate the full feature set of that category when rendered, including all MIN and MAX fields. The CTO will replace these files with real API calls later, so keep all mock data centralized and cleanly typed.

**Mock thread IDs** (one per category, directly navigable during development):
- `/discussion/news-001`
- `/discussion/review-001`
- `/discussion/compare-001`
- `/discussion/launchpad-001`
- `/discussion/debate-001`
- `/discussion/help-001`
- `/discussion/list-001`
- `/discussion/showcase-001`
- `/discussion/gigs-001`

The `[id]` prefix determines which category body component renders. A simple helper function maps the ID prefix to the category.

---

# ═══════════════════════════════════════════════════════
# PHASE 1 — MUST HAVE (Core Foundation)
# Ship this first. The product doesn't work without these.
# ═══════════════════════════════════════════════════════

---

## 1A. CORE THREAD SHELL (All Categories)

These are the invariant structural elements. Every thread, regardless of category, has these zones stacked in this order: **Thread Header → Category Body → Comment Section → Composer**. The right sidebar provides contextual support.

---

### US-CORE-001 — Consistent Thread Shell

**As a reader,** I want the same structural layout in every category thread, **so that** I never have to relearn the interface when switching between News, Review, Gigs, or any other category.

**What the UI must show:**
- Every thread has four zones stacked in fixed order: Thread Header → Category Body → Comment Section → Composer
- The category tag is always visible near the title so the reader immediately knows what type of content they're looking at
- Spacing, typography, and interaction patterns are consistent everywhere
- The MIN/MAX toggle is present in the same position on every thread

---

### US-CORE-002 — Thread Header

**As a reader,** I want a rich but compact header at the top of every thread, **so that** I can understand the topic, trust the source, and take action — all within 3 seconds without scrolling.

**What the UI must show:**
- Category badge (colored chip with icon — each of the 9 categories has its own color and icon, use existing design system category tokens)
- Thread title — large, bold, prominent
- Author block: avatar, display name, @handle, and their reputation badge (e.g., "Pro Creator", "AI Builder")
- Posted timestamp and view count
- Tags — clickable chips representing the topic (e.g., "AI Tools", "Claude API", "Workflow")
- AI Summary block — a 1–2 sentence AI-generated summary of the thread. Visually distinct from the rest of the content (subtle border, slight background shift, small bot icon, labelled "AI Summary"). Collapsed by default on mobile, expanded by default on desktop.
- Action bar with: Upvote (with count), Comment count (clicking it scrolls to the comment section), Fav/Bookmark (toggleable, count shown), Share (copies link to clipboard, shows brief "Link copied" toast), and an overflow menu (···) for Report, Copy link
- The MIN/MAX mode toggle — a single control in the top-right corner of the header, clearly labelled. This is the most important global control on the page.

---

### US-CORE-003 — MIN/MAX Mode Toggle

**As a user,** I want to switch between MIN and MAX mode on any thread, **so that** I can choose between a clean reading experience and a deep analytical one without leaving the page.

**What the UI must show:**
- MIN is the default on every page load
- Toggling to MAX reveals additional panels, insight cards, and power-user features without navigating away, reloading, or losing scroll position
- The transition is smooth — elements slide or fade in, they do not flash or pop
- The toggle visually shows which mode is currently active (e.g., a pill slider with "MIN" and "MAX" labels)
- MAX-only elements are completely hidden in MIN — no collapsed placeholders, no empty space, no "upgrade to see more" teasers

**The core principle:** MIN = content + discussion. MAX = content + discussion + intelligence layer. The same thread, not two different pages.

---

### US-CORE-004 — Right Sidebar (Thread Context)

**As a reader,** I want a sidebar next to the thread that gives me context about the author and related content, **so that** I can explore further without leaving the page.

**What the UI must show in MIN mode:**
- **About the Author** card: author's avatar, name, handle, reputation badge, a one-line bio, follower count, and a Follow button (UI only, no persistence in MVP)
- **Related Threads** section: 3–4 compact post cards linking to threads in the same category. Compact variant — no image, just title, author, and engagement count
- **Trending in [Category]** section: 3 compact cards of trending posts in this category

**Behavior:**
- Sidebar is sticky on desktop scroll
- Below 768px, sidebar moves to below the comment section

---

### US-CORE-005 — Comment Section

**As a reader and participant,** I want a rich threaded comment section below every thread, **so that** I can follow the discussion and contribute.

**What the UI must show:**

**Sort bar:** Comment count label on the left, sort options on the right (Best, New, Top) — same pill style as the feed tabs

**Comment display:**
- Each comment shows: author avatar, name, handle, reputation badge, "OP" tag if the commenter is the original thread author, timestamp
- Upvote and downvote on each comment — optimistic UI, votes update immediately
- A Reply button that expands an inline composer directly below that comment
- An overflow menu (···) on each comment: Report, Copy link
- Comments are nested. Default visible nesting depth is 3 levels. At level 3, show a "Continue this thread →" link that expands the deeper replies inline on click.
- In MAX mode only: the full nesting depth expands to 5 levels

**Empty state:** "Be the first to reply. Share your thoughts." with a clear CTA

**Solution highlight (Help category only):** If a comment is marked as the solution, it gets a green left border and a "✅ Solution" badge. A banner at the top of the comment section links directly to it.

---

### US-CORE-006 — Comment Composer

**As a participant,** I want a clean, smart composer to write my reply, **so that** I can contribute quickly with quality.

**What the UI must show:**
- The composer appears at the top of the comment section (for new top-level comments) and inline below any comment when the Reply button is clicked
- Author's own avatar sits to the left of the input
- Text area that expands as the user types
- A minimal markdown toolbar: Bold, Italic, Inline code, Code block, Link
- Submit button that is disabled when the field is empty

**AI Quality Nudge** — this is a key differentiator:
- After the user has typed 20+ characters, a subtle tip card appears below the input (not intrusive, has an ✕ dismiss button)
- The nudge message is specific to the category:
  - News: "Adding a source link makes your reply 4x more likely to be upvoted."
  - Review: "Mention which version or plan you used — context builds trust."
  - Debate: "The strongest arguments cite a counter-argument directly before refuting it."
  - Help: "Include your error message and what you've already tried — it cuts reply time in half."
  - Compare: "Which use case are you optimising for? It makes your comparison actionable."
  - Launchpad: "Specific feedback ('the onboarding step 3 is unclear') is more useful than general praise."
  - List: "If you're suggesting an addition, explain why it meets the stated criteria."
  - Showcase: "Tell us which aspect you want feedback on — UX, visuals, or technical approach."
  - Gigs: "If you're a candidate, lead with your most relevant work, not your resume."
- The nudge is static text — no API call needed

---

### US-CORE-007 — Interaction States (All Categories)

**As a user,** I want all interactive elements to respond immediately and predictably.

**States to implement:**
- **Upvote thread** — toggle. Count increments/decrements immediately in UI. Icon fills when active.
- **Bookmark (Fav)** — toggle. Icon fills when active. Count updates immediately.
- **Share** — copies URL to clipboard. Brief "Link copied" toast notification appears and auto-dismisses after 2 seconds.
- **Upvote comment** — toggle, optimistic. Enabling upvote disables downvote simultaneously.
- **Downvote comment** — toggle, optimistic. Enabling downvote disables upvote simultaneously.
- **Reply** — clicking Reply on a comment expands an inline composer directly below that comment. Clicking again or pressing Escape collapses it.
- **MIN → MAX toggle** — scroll position is preserved. No reload. Transition uses smooth CSS transitions (200–300ms).
- **Auth-gated actions** — clicking any action that requires login (upvote, comment, bookmark, apply, debate vote, add argument) triggers the existing auth modal from the home feed. Do not build a new auth flow.

---

### US-CORE-008 — Mobile Behaviour

**As a mobile user,** I want the thread page to be fully functional on smaller screens.

**What the UI must show:**
- Below 768px: Left nav collapses. Hamburger toggle reveals it as an overlay.
- Below 768px: Right sidebar moves to below the comment section.
- Below 768px: Comparison table (Compare category) is horizontally scrollable with visible scroll hint.
- Below 768px: Showcase media gallery uses horizontal swipe with CSS scroll snap.
- Below 768px: MAX mode insight rail becomes a collapsible bottom sheet instead of a fixed right rail.
- Composer: full-width on mobile. Markdown toolbar collapses into a ··· overflow button.

---

## 1B. PHASE 1 CATEGORY-SPECIFIC FEATURES (MIN mode)

Each category has a **first principle** — the core purpose that defines what the UI must do for that category above all else. The category body renders between the Thread Header and the Comment Section. Phase 1 features are the MIN mode defaults.

---

## CATEGORY 1 — NEWS

**First Principle:** A news thread is about trust and time. The reader needs to know: What happened? When? Who reported it? Is it verified by others? The UI must answer these before the reader reads a single paragraph.

---

### US-MIN-NEWS-001 — Source Identity Block

**As a news reader,** I want to see the source of the news immediately when I open the thread, **so that** I can decide whether to trust the content before reading it.

**What the UI must show:**
- A source bar directly below the thread header, above the body text
- Shows: source favicon, source name (e.g., "OpenAI Blog"), publication date and time, and a "Read original →" link that opens in a new tab
- If there's no external source (original reporting), show "Original reporting by @author"

---

### US-MIN-NEWS-002 — Recency and Freshness Indicator

**As a reader,** I want the publish time and any update timestamps to be visually prominent, **so that** I know immediately if this is breaking news or an older story.

**What the UI must show:**
- Publish timestamp displayed prominently near the title — not buried in metadata
- If the post was updated after publishing, show "Updated [time]" separately from "Published [time]"
- Posts older than 7 days display a subtle "older content" visual treatment — slightly muted, not alarming

---

### US-MIN-NEWS-003 — Corroboration Strip

**As a critical reader,** I want to see how many other outlets are covering this same story, **so that** I can assess whether this is isolated or widely reported.

**What the UI must show:**
- A horizontal strip below the source bar showing 2–4 other sources covering the same story
- Each source shows: name, a stance chip (Confirms / Skeptical / Contradicts) with distinct colors (green / amber / red)
- If no corroboration sources are provided, show empty state: "No corroboration added yet. Know another source? Add it."

---

## CATEGORY 2 — REVIEW

**First Principle:** A review is only as trustworthy as its criteria and context. The reader needs to know: What was tested? On what basis? By whom? What was the verdict? The verdict must be visible before anything else.

---

### US-MIN-REVIEW-001 — Product Identity Block

**As a reader,** I want to see clearly what is being reviewed at the top of the thread, **so that** I know immediately what product, tool, or service this is about.

**What the UI must show:**
- A product card directly below the thread header
- Shows: product name, product logo/thumbnail, a "Visit product →" link, and a one-line reviewer context note (e.g., "30-day trial · 2 production projects · Claude API v3")
- This block anchors the entire thread — it never scrolls out of view on desktop (sticky behavior)

---

### US-MIN-REVIEW-002 — Verdict Block

**As a reader,** I want the reviewer's final verdict displayed prominently near the top, **so that** I can understand the stance in under 5 seconds.

**What the UI must show:**
- A verdict strip below the product card
- Contains: a star rating (e.g., 4.2/5), a verdict label (Recommended / With Caveats / Not Recommended) with distinct color treatment (green / amber / red)
- A one-sentence verdict rationale directly below the label
- This must be above the fold on desktop

---

### US-MIN-REVIEW-003 — Criteria Scorecard

**As a reader,** I want to see how the reviewer scored each evaluation criterion, **so that** I can understand what drove the overall rating.

**What the UI must show:**
- A scored criteria block showing each criterion as a row: criterion label, score bar (animated left-to-right on mount), and numerical score
- Each criterion also shows its weight percentage (e.g., "Accuracy — 4.1 — 35% weight")
- The overall weighted score is shown at the bottom of the block
- Criteria are defined by the post author and rendered from the thread data

---

## CATEGORY 3 — COMPARE

**First Principle:** Comparison is a decision tool. The reader is not here to read — they are here to choose. The UI must make differences immediately scannable and the winner obvious within each use case.

---

### US-MIN-COMPARE-001 — Comparison Table

**As a reader making a decision,** I want a clear side-by-side table of the options being compared, **so that** I can scan differences without reading paragraphs.

**What the UI must show:**
- A comparison table where each column is one option (2–4 options)
- Each row is a criterion (e.g., Speed, Accuracy, Price, UX)
- Each cell shows a score or label
- The highest score in each row is visually highlighted (bold, accent color)
- First column (criteria labels) is sticky on horizontal scroll for mobile
- Table is horizontally scrollable on screens below 768px

---

### US-MIN-COMPARE-002 — Verdict Cards

**As a decision-maker,** I want a "best for" verdict for each option, **so that** I can pick based on my context rather than just raw scores.

**What the UI must show:**
- Below the table, one verdict card per option
- Each card shows: option name/logo, overall score, and a "Best for:" one-liner (e.g., "Best for solo builders", "Best for enterprise teams")
- A "Community Pick" badge on the option the community voted as overall winner — shown with a distinct trophy icon

---

## CATEGORY 4 — LAUNCHPAD

**First Principle:** Launchpad is about momentum and iteration. The reader wants to understand what is being built, where it is in its journey, and what kind of help is needed right now. The UI must communicate stage and direction above all else.

---

### US-MIN-LAUNCHPAD-001 — Product Hero Block

**As a viewer,** I want to see the product being launched presented prominently at the top, **so that** I understand what it is before reading further.

**What the UI must show:**
- A hero image or video at the top of the body (wide, 16:9 ratio)
- Below the hero: product name, logo, tagline (one line), and a status badge indicating the launch stage (Idea / Prototype / Beta / Live) — each with a distinct color
- A primary CTA button appropriate to the stage: "Try it →" for Live, "Join waitlist →" for Beta, "Follow progress →" for Prototype/Idea
- A "Visit product →" secondary link

---

### US-MIN-LAUNCHPAD-002 — Launch Stats Strip

**As a community member,** I want to see the product's traction at a glance.

**What the UI must show:**
- A stats strip below the hero: upvote count, comment count, and if applicable, a waitlist signups number

---

### US-MIN-LAUNCHPAD-003 — Maker Note

**As a reader,** I want to hear directly from the person building this in their own voice.

**What the UI must show:**
- A distinct "From the maker" block — visually differentiated from the body (left accent border, slightly inset, author avatar inline)
- The maker writes a first-person note: why they built this, what problem they're solving, what they need
- This is the most human element on the page — it should feel personal, not corporate

---

### US-MIN-LAUNCHPAD-004 — Feedback Request Block

**As a viewer,** I want to know exactly what kind of feedback the creator is looking for, **so that** my comment is actually useful.

**What the UI must show:**
- A "What I need feedback on" section above the comment composer
- The creator specifies 2–3 focus areas as chips (e.g., "Onboarding clarity", "Pricing model", "Target audience fit")
- This anchors the discussion and reduces generic praise

---

## CATEGORY 5 — DEBATE

**First Principle:** A debate is a structured search for truth, not a shouting match. The UI must make the proposition crystal clear, allow users to take a side with commitment, and surface the strongest arguments on each side — not just the most popular comments.

---

### US-MIN-DEBATE-001 — Proposition Block

**As a reader,** I want the debate motion stated clearly and unavoidably at the top.

**What the UI must show:**
- A large, visually prominent proposition block below the header
- The motion is quoted: e.g., "AI will make 80% of SaaS tools irrelevant within 3 years"
- Debate status badge: Open / Closed / Resolved — with distinct color treatments

---

### US-MIN-DEBATE-002 — Voting Bar

**As a participant,** I want to cast my vote on the proposition and see where the community stands.

**What the UI must show:**
- A horizontal vote bar showing: % Agree, % Disagree, % Abstain — as a proportional bar with labels
- Three vote buttons below: Agree, Disagree, Abstain
- Once voted, buttons update to show user's choice (active state), and the bar animates to reflect their vote
- Total vote count shown below the bar
- If the debate is Closed, the buttons are disabled and a "Voting closed" label replaces them

---

### US-MIN-DEBATE-003 — Argument Summary Cards

**As a reader,** I want to see the strongest arguments on each side at a glance.

**What the UI must show:**
- Two columns: "For" and "Against" — each column showing 2 argument summary cards
- Each card shows the argument claim, a strength indicator (Strong / Medium — conveyed visually), and the upvote count
- An "Add argument" CTA at the bottom of each column, auth-gated

---

## CATEGORY 6 — HELP

**First Principle:** A help thread is a race against someone's frustration. The UI must make the problem crystal clear, show what's already been tried, and make the accepted solution impossible to miss.

---

### US-MIN-HELP-001 — Problem Statement Block

**As a helper,** I want to see the exact problem, the environment, and what's already been tried — all before I read any comments.

**What the UI must show:**
- A structured problem block at the top of the body with three labeled sections:
  - "What I'm trying to do" — the goal
  - "What I've tried" — list of attempted solutions
  - "Where I'm stuck" — the specific blocker
- Tech stack chips below the block (e.g., "Next.js 14", "Claude API", "Vercel") — clearly labeled "Environment"

---

### US-MIN-HELP-002 — Solved/Unsolved Status Banner

**As a reader with the same problem,** I want to know immediately whether this thread has been solved.

**What the UI must show:**
- A status banner directly below the problem block: a green "✅ Solved" banner if resolved, a red "🔴 Unsolved" banner if not
- If solved, a "Jump to solution ↓" link that scrolls to the accepted answer in the comment section

---

### US-MIN-HELP-003 — Code Block Support

**As a developer,** I want to see code in the thread body and comments rendered with syntax highlighting.

**What the UI must show:**
- Code blocks with syntax highlighting (use a library like Prism or Shiki)
- Language label on each code block
- Copy button on hover
- Code blocks appear in both the OP body and in comments

---

## CATEGORY 7 — LIST

**First Principle:** A list is only as good as its curation logic. The reader needs to trust the selection — which means the criteria that drove inclusion must be visible before the items themselves.

---

### US-MIN-LIST-001 — List Purpose and Criteria Block

**As a reader,** I want to understand the purpose and selection criteria before I look at a single item.

**What the UI must show:**
- A purpose block at the top: one-line purpose statement ("Best AI tools for YouTube creators in 2026"), target audience, and a "Why this list exists" explanation
- Below it, a criteria block showing the selection criteria as a checklist (e.g., "✓ Must save 2+ hours/week", "✓ Price under $50/month")
- Both blocks visually distinct from the list items below

---

### US-MIN-LIST-002 — Ranked List Items

**As a reader,** I want to scan the list items quickly with just enough information to evaluate each one.

**What the UI must show:**
- Items displayed in ranked order: rank number (large, prominent), item name, logo/thumbnail, category chip, star rating, and a one-sentence annotation (max 150 characters)
- The rank number is a key visual element — large, slightly muted, left-anchored
- Items are expandable — clicking an item reveals a slightly longer description inline

---

### US-MIN-LIST-003 — List Metadata Strip

**As a reader,** I want to know how current and collaborative this list is.

**What the UI must show:**
- A metadata strip below the criteria block: "Last updated [date]" and "X contributors"
- If the list is marked as "Ongoing", show an "Ongoing list" indicator

---

## CATEGORY 8 — SHOWCASE

**First Principle:** Showcase is about feedback, not applause. The creator is presenting work and asking for critique. The UI must make the work visually prominent, make the feedback request explicit, and give commenters the tools to give precise, directed feedback.

---

### US-MIN-SHOWCASE-001 — Media Gallery Hero

**As a viewer,** I want to see the creator's work in its best form at the top of the thread.

**What the UI must show:**
- A primary media display at the top — large image, video player, or audio player depending on the media type
- Below the primary media: a thumbnail strip for additional media. Clicking a thumbnail swaps the primary display (local state only)
- Caption below the primary display showing the media description
- A fullscreen toggle on the primary media

---

### US-MIN-SHOWCASE-002 — Creator Intent Block

**As a viewer about to give feedback,** I want to understand what the creator was trying to achieve.

**What the UI must show:**
- A "Creator's intent" block below the media: a first-person statement from the creator ("I was trying to achieve...")
- Visually distinct treatment that signals "this is the creator's voice and goal"

---

### US-MIN-SHOWCASE-003 — Feedback Request Tags

**As a commenter,** I want to see exactly what kind of feedback the creator wants.

**What the UI must show:**
- A "Feedback requested on:" row showing focus areas as chips (e.g., "UX Flow", "Error Handling", "Visual Hierarchy")
- These chips appear above the comment composer as a directive
- The AI quality nudge references these chips explicitly

---

### US-MIN-SHOWCASE-004 — Version Timeline

**As a returning viewer,** I want to see this project's version history.

**What the UI must show:**
- A compact version timeline below the body: version label (v1.0, v2.0), date, and a one-sentence note for each version
- The current version is highlighted
- Clicking a past version label does nothing in MVP (placeholder for future version diff view)

---

## CATEGORY 9 — GIGS

**First Principle:** A gig post is a transaction. Both sides need clarity before they invest time. The UI must surface role requirements, scope, and compensation with zero ambiguity, and give candidates a structured way to self-qualify before applying.

---

### US-MIN-GIGS-001 — Role Summary Card

**As a job seeker,** I want to see the essential role details at the very top, **so that** I can decide in 10 seconds whether to read further.

**What the UI must show:**
- A role summary card below the header with: Role title (large), Employment type chip (Full-time / Part-time / Contract / One-off), Location chip (Remote / On-site / Hybrid), Budget/compensation range, and Duration or start date
- Each detail uses an icon + label treatment
- If any critical field is missing (budget, duration), a subtle "Incomplete" indicator appears — this holds posters accountable

---

### US-MIN-GIGS-002 — Skills Block

**As a candidate,** I want to see required and preferred skills clearly separated.

**What the UI must show:**
- Two rows of skill chips: "Required" (solid chip) and "Preferred" (outlined chip)
- Visual distinction makes must-have vs nice-to-have immediately clear

---

### US-MIN-GIGS-003 — Poster Note

**As a candidate,** I want to hear from the person posting the gig in their own words.

**What the UI must show:**
- A "From the poster" block — same visual treatment as the Launchpad Maker Note (left accent border, slightly inset, poster's avatar inline)
- A first-person note about the team, working style, and what kind of person they're looking for

---

### US-MIN-GIGS-004 — Apply CTA

**As a candidate,** I want a clear, prominent way to apply.

**What the UI must show:**
- A primary "Apply Now →" button that is the most visually prominent interactive element on the page
- Below the button: applicant count ("24 applied") and position status ("Open" or "Closed")
- When position is Closed, the Apply button is replaced by a "Position Closed" badge
- Clicking Apply opens a simple modal with fields: Name, Email, Portfolio/LinkedIn URL, and a free-text "Why you?" field. Submitting shows an "Application submitted" toast. No API call in MVP.

---

### US-MIN-GIGS-005 — Process Stage Tracker

**As a candidate,** I want to see the hiring pipeline stages.

**What the UI must show:**
- A horizontal step indicator showing the hiring stages: Applied → Screening → Interview → Offer
- The current active stage is highlighted
- This is informational only — candidates see where the process is, not their personal status

---

## 1C. PHASE 1 ROUTING

The page lives at `/discussion/[id]`. The 9 mock thread IDs are listed in Part 0. The `[id]` prefix determines which category body component renders.

---

# ═══════════════════════════════════════════════════════
# PHASE 2 — GOOD TO HAVE (Wow Factors)
# These create the differentiation moat. The 3% TAM
# will say "this is not another Reddit." Ship after Phase 1.
# ═══════════════════════════════════════════════════════

---

## 2A. CORE ENHANCEMENTS (All Categories, MAX Mode)

These MAX-mode features apply across all 9 categories and transform the thread from a reading experience into an intelligence workspace.

---

### US-MAX-CORE-001 — Insight Rail (Right Sidebar in MAX)

**As a power user,** I want a live intelligence panel in the right sidebar when in MAX mode, **so that** I can understand the state of the thread without reading every comment.

**What the UI must show (MAX only, replaces or augments the standard sidebar):**
- A compact AI-generated summary of the thread's key points (static mock text)
- "Key Agreements" — 2–3 bullet points of what commenters seem to agree on
- "Open Questions" — 2–3 unresolved questions still being debated, each linking to the relevant comment cluster
- "Top Contributor" for this thread — one author card with their most upvoted comment
- The panel is sticky on desktop scroll, collapsible on mobile

**Why this is a wow factor:** No forum does this. Discourse has basic AI summaries, but they don't show agreements/disagreements/open questions as structured data. This is what makes Createconomy feel like an intelligence layer, not a chat log.

---

### US-MAX-CORE-002 — Advanced Comment Filtering

**As a power user,** I want to filter comments by contribution type in MAX mode, **so that** I can go straight to the highest-signal replies.

**What the UI must show (MAX only, appears above the comment list):**
- A filter bar with multi-select chips: Evidence, Counterpoint, Question, Resource, Solution (for Help)
- Active filter count shown on the filter button
- A "Clear all" option
- The comment list updates to show only matching comments

**Why this is a wow factor:** Reddit and Discourse have no comment filtering by contribution type. This single feature elevates discussion from "scroll everything" to "find exactly what I need."

---

### US-MAX-CORE-003 — Thread Genealogy Links

**As a reader,** I want to see how this thread connects to other discussions on the platform, **so that** I understand context and don't miss related knowledge.

**What the UI must show (MAX only, in insight rail or below header):**
- A "Builds on" section: 1–2 links to related predecessor threads
- A "Contradicts" section: 1–2 links to threads with opposing conclusions
- A "Related canonical" section: if a well-established thread on this topic exists, show a link with the note "Canonical discussion exists"

**Why this is a wow factor:** This is the beginning of a knowledge graph. No community platform connects threads as "builds on" or "contradicts." This turns isolated posts into an interconnected intelligence network.

---

### US-MAX-CORE-004 — Structured Reply Intent Tags

**As a commenter in MAX mode,** I want to tag my reply with its intent type, **so that** readers can quickly identify what kind of contribution I'm making.

**What the UI must show (MAX only):**
- When composing a reply in MAX mode, a row of intent tag chips appears above the text area: Evidence, Counterpoint, Clarifying Question, Implementation Note, Resource Link, Decision Proposal
- Selecting a tag adds a visible label to the published comment
- The tag is optional — the user can post without selecting one
- In MIN mode, comments with tags still show their tag label, but the tagging UI is not available in the composer

**Why this is a wow factor:** This converts generic "reply" actions into structured, filterable contributions. It's the single highest-leverage change for signal-to-noise ratio in discussions.

---

## 2B. PHASE 2 CATEGORY-SPECIFIC FEATURES (MAX Mode)

---

## NEWS — MAX FEATURES

### US-MAX-NEWS-001 — Source Credibility Badges

**As a power reader,** I want to see credibility context for each source in MAX mode.

**What the UI must show (MAX only):**
- Each source in the corroboration strip gains a credibility badge: Independent / Corporate / Government / Community
- A small "Why this matters" tooltip explains what each badge type means
- These badges are completely hidden in MIN

---

### US-MAX-NEWS-002 — Event Timeline Panel

**As a power reader,** I want a chronological timeline of how this story developed.

**What the UI must show (MAX only):**
- A timeline panel in the insight rail showing 3–5 dated entries (e.g., "March 18 — Initial report", "March 19 — Official response")
- Each timeline entry links to the relevant paragraph in the body or comment
- The timeline is MAX-only — completely absent in MIN

---

### US-MAX-NEWS-003 — Conflicting Reports Card

**As a critical reader,** I want to know when sources are actively contradicting each other.

**What the UI must show (MAX only):**
- A "Conflicting Reports" card in the insight rail, visible only when at least one source has a "Contradicts" stance
- Shows the conflicting claim and source name side by side in a two-column visual
- Hidden in MIN, hidden in MAX when no conflicts exist

---

## REVIEW — MAX FEATURES

### US-MAX-REVIEW-001 — Adjustable Criteria Weights

**As a reader evaluating this product for my own use case,** I want to adjust the weight of each criterion to match my priorities, **so that** I see a score relevant to me.

**What the UI must show (MAX only):**
- An "Adjust for my use case" toggle that reveals weight sliders for each criterion
- Moving a slider recalculates the weighted overall score in real time
- A "Reset to reviewer weights" button returns to defaults
- Pure frontend state — no API call

**Why this is a wow factor:** No review platform lets the reader re-weight criteria to personalize the score. This alone makes Createconomy reviews 10x more useful than static review sites.

---

### US-MAX-REVIEW-002 — Reviewer Context Panel

**As a skeptical reader,** I want to see full context about the reviewer's experience.

**What the UI must show (MAX only):**
- An expanded reviewer context card: usage duration, version/plan tested, environment details (OS, team size, use case), any declared conflicts of interest
- Presented as labeled metadata chips
- Completely hidden in MIN

---

### US-MAX-REVIEW-003 — Community Sentiment Card

**As a reader,** I want to see whether the community agrees or disagrees with the verdict.

**What the UI must show (MAX only):**
- A "Community Sentiment" card in the insight rail: % agree vs % disagree with the verdict
- The top upvoted agree and disagree comments surfaced as brief quotes
- Static mock data for MVP

---

## COMPARE — MAX FEATURES

### US-MAX-COMPARE-001 — Criteria Weight Sliders

**As a power user,** I want to weight comparison criteria based on my priorities.

**What the UI must show (MAX only):**
- A "My priorities" panel with sliders for each criterion
- Adjusting a slider recalculates weighted scores in real time
- Table highlighting updates to reflect new rankings
- A "Reset" option restores original weights

---

### US-MAX-COMPARE-002 — Scenario Matrix

**As a reader,** I want to see how the winner changes depending on the use case.

**What the UI must show (MAX only):**
- A scenario selector showing 3–4 preset scenarios (e.g., "Solo dev on a budget", "Agency with a team")
- Selecting a scenario shows which option is recommended and a one-sentence rationale
- Displayed as pill tabs, not a dropdown

---

### US-MAX-COMPARE-003 — Diff Highlight Mode

**As a power user,** I want to hide rows where all options score similarly, **so that** I focus only on meaningful differences.

**What the UI must show (MAX only):**
- A "Show differences only" toggle
- When active, rows where all scores are within a threshold are hidden
- A label "Hiding X similar rows — show all" appears

---

## LAUNCHPAD — MAX FEATURES

### US-MAX-LAUNCHPAD-001 — Milestone Timeline

**As a follower,** I want to see the product's roadmap and past milestones.

**What the UI must show (MAX only):**
- A vertical timeline showing past milestones (dated, with note) and upcoming milestones (marked "Upcoming")
- Current position highlighted
- Clicking a past milestone scrolls to relevant content if linked

---

### US-MAX-LAUNCHPAD-002 — Changelog Stack

**As a returning viewer,** I want to see what changed since I last visited.

**What the UI must show (MAX only):**
- A "Version / Update Log" section: stack of dated update entries
- Each entry: version label, date, one-sentence summary
- Most recent version shown first and highlighted as "Current"

---

### US-MAX-LAUNCHPAD-003 — Built With Stack

**As a technical reader,** I want to see the technology stack behind the product.

**What the UI must show (MAX only):**
- A "Built with" section showing technology chips (e.g., "Next.js", "Claude API", "Vercel")
- Display only — non-interactive
- Hidden in MIN to reduce clutter for non-technical readers

---

## DEBATE — MAX FEATURES

### US-MAX-DEBATE-001 — Argument Tree

**As a power reader,** I want to see how arguments branch and counter each other.

**What the UI must show (MAX only):**
- An expandable argument tree that branches from the main proposition
- Each node is a claim. Child nodes are "Supports this" or "Counters this"
- Nodes can be collapsed. Tree defaults to 2 levels visible
- Clicking a node scrolls to the relevant comment

**Why this is a wow factor:** No debate platform visualizes argument structure as a navigable tree. This is what separates intellectual infrastructure from a comment section.

---

### US-MAX-DEBATE-002 — Fallacy Flag Panel

**As a critical reader,** I want to see when community members have flagged logical fallacies.

**What the UI must show (MAX only):**
- Any comment can show a fallacy tag: "Ad Hominem", "Strawman", "False Dichotomy"
- Tags appear as small chips below the comment — semantic labels, not downvotes
- A fallacy count is visible on each flagged comment
- Completely hidden in MIN

---

### US-MAX-DEBATE-003 — Common Ground Box

**As a reader,** I want to see what both sides actually agree on.

**What the UI must show (MAX only):**
- A "Common Ground" card in the insight rail
- 2–3 bullet points of statements both sides have acknowledged as true
- Labelled "Where both sides agree"
- Static mock data in MVP

---

## HELP — MAX FEATURES

### US-MAX-HELP-001 — Reproducibility Counter

**As a helper,** I want to see how many other users have the same problem.

**What the UI must show (MAX only):**
- An "X others have this problem" counter below the problem block
- An "I have this too" button that increments the counter (optimistic UI)
- Hidden in MIN

---

### US-MAX-HELP-002 — Diagnostic Path

**As a power helper,** I want to see troubleshooting steps tried and suggested so far.

**What the UI must show (MAX only):**
- A "Troubleshooting path" card in the insight rail
- A numbered list of approaches: checkmark if tried, open circle if suggested but untested
- Static mock data in MVP

---

## LIST — MAX FEATURES

### US-MAX-LIST-001 — Multi-Lens Sorting

**As a power reader,** I want to re-sort the list by different lenses.

**What the UI must show (MAX only):**
- A lens selector: "Editor's choice", "Best value", "Most popular", "Beginner-friendly", "Custom"
- Selecting a lens re-orders items in real time (frontend state only)
- Active lens highlighted
- Each item shows if it moved up/down under the new lens (small delta arrow)

---

### US-MAX-LIST-002 — Coverage Gaps Panel

**As a contributor,** I want to see what's missing from this list.

**What the UI must show (MAX only):**
- A "Coverage gaps" card in the insight rail
- 2–3 criteria that are under-represented (e.g., "Only 1 item covers Audio editing")
- A "Propose addition" CTA below each gap — clicking opens the comment composer with context pre-filled
- Hidden in MIN

---

## SHOWCASE — MAX FEATURES

### US-MAX-SHOWCASE-001 — Annotated Comments

**As a feedback giver,** I want to pin my comment to a specific part of an image or timestamp in a video.

**What the UI must show (MAX only):**
- In MAX mode, the primary media has a "Comment on this" mode — clicking activates a crosshair cursor on images or a timestamp selector on video
- After selecting a location, the comment composer opens pre-loaded with a reference to that location
- In the comment list, annotated comments show a "📍 See in media" badge — clicking highlights the area
- This is the highest-complexity feature in this phase. Acceptable to ship as image-only first, video annotation as a follow-up.

**Why this is a wow factor:** Figma has this for design. No discussion platform has this for community feedback on creative work. This is the alien-level feature that makes showcase threads a legitimate critique tool.

---

### US-MAX-SHOWCASE-002 — Feedback Cluster View

**As a creator reviewing feedback,** I want comments grouped by theme.

**What the UI must show (MAX only):**
- A "Feedback by theme" grouping mode: re-groups comments into clusters (UX, Visual, Technical, Other)
- Cluster labels are tabs or accordions
- Standard chronological view still accessible via toggle
- View-only reorganization — no data changes

---

## GIGS — MAX FEATURES

### US-MAX-GIGS-001 — Fit Self-Check

**As a candidate,** I want to self-assess my fit before applying.

**What the UI must show (MAX only):**
- A "How well do you fit?" checklist: required skills as checkboxes
- Dynamic fit score: "You match 4 of 5 required skills"
- "You're a strong fit → Apply" if score is high, "Missing X — consider applying anyway" if partial
- Purely frontend state
- Hidden in MIN

---

### US-MAX-GIGS-002 — Q&A Partition

**As a candidate,** I want clarifying questions separated from application signals.

**What the UI must show (MAX only):**
- Comment section has a tab toggle: "Questions" and "Responses"
- "Questions" tab: public clarifying questions
- "Responses" tab: comments signaling application intent
- In MIN, all comments appear in one standard thread

---

### US-MAX-GIGS-003 — Proof of Work Rail

**As a poster reviewing applicants,** I want to see a candidate's best work from the platform.

**What the UI must show (MAX only):**
- Comments from candidates who have Showcase posts display a mini "Proof of Work" rail: 2–3 compact cards linking to their showcase posts
- Candidates with no Showcase posts do not show this rail
- Hidden in MIN

---

# ═══════════════════════════════════════════════════════
# PHASE 3 — NICE TO HAVE (Alien Level)
# Futuristic features. Complex but buildable.
# Each includes an "advantage assessment" explaining
# what it unlocks for the platform ecosystem.
# ═══════════════════════════════════════════════════════

---

## 3A. ALIEN-LEVEL CORE FEATURES

---

### US-ALIEN-001 — Living OP (Canonized Updates)

**As a thread author,** I want to promote the best comment into my original post as an official update, **so that** the thread becomes a living document, not a static post with a growing pile of comments.

**What the UI must show:**
- On any comment, the thread author (or a moderator) sees a "Canonize →" button
- Clicking it adds the comment's content to the OP as a timestamped update block (visually distinct — slightly indented, with "Update via @commenter" label and date)
- Multiple updates can be canonized. They appear in chronological order below the original body.
- A small "X updates since original post" counter in the thread header links to the first update

**Advantage assessment:** This solves the fundamental problem of forums — the answer is buried in comment #47. With canonized updates, the OP evolves into a knowledge artifact. This is the bridge to your future canonical/wiki system. Stack Overflow's Community Wiki is the closest parallel, but theirs is clunky and rarely used. Yours would be elegant and author-controlled.

---

### US-ALIEN-002 — Co-Author Mode

**As a thread author,** I want to invite another user to co-author my thread, **so that** complex topics benefit from multiple perspectives in a single structured post.

**What the UI must show:**
- In the thread header, a "Request co-author" button (author-only)
- Clicking opens a user search modal. Selecting a user sends a co-author invitation (UI only — toast confirmation)
- If accepted (mock: always accepted after 2 seconds), the thread header displays both authors: "Authored by @user1 & @user2"
- Both authors see the "Canonize" button on comments

**Advantage assessment:** This is the collaborative intelligence layer. Compare threads become dramatically better when both tool advocates write their respective sections. Debate threads become richer when the proposer and opponent co-author the framing. No discussion platform has native co-authorship.

---

### US-ALIEN-003 — Decision Capture Layer

**As a reader,** I want to see what decision or conclusion this thread reached, **so that** I don't have to read 100 comments to find the outcome.

**What the UI must show (MAX only, all categories):**
- A "Decision" block at the bottom of the OP body (before comments), visible in MAX mode
- Shows: decision status (Open / In Progress / Decided / Reopened), decision statement, owner, timestamp, follow-up actions
- Decision changes create visible log entries
- Reopening requires a reason tag (new evidence / changed context / invalid assumption)

**Advantage assessment:** This converts discussions from performative to operational. Threads become referenceable decision records. This is critical infrastructure for your future creator workflow layer — decisions in threads can eventually trigger actions (gig postings, product launches, list updates).

---

### US-ALIEN-004 — Quality Dimensions Radar

**As a reader,** I want to see a multi-dimensional quality signal on the thread, **so that** I can judge its value beyond a single upvote count.

**What the UI must show (MAX only, in thread header area):**
- A compact 4-axis quality indicator showing:
  - **Novelty** — does this add new information?
  - **Verifiability** — are claims backed by evidence?
  - **Actionability** — can I do something with this?
  - **Synthesis** — does it connect multiple ideas?
- Displayed as a mini radar chart or 4-bar signature
- Each dimension has a "why" tooltip explaining what inputs drove the score
- All scores are mock data in MVP

**Advantage assessment:** This replaces the "signal score" concept from the multi-model discussion. A single score is misleading (MiniMax's critique was correct). Four dimensions give readers honest, nuanced quality signals. No platform does this. Hacker News has a single karma system. Reddit has upvotes. Neither tells you *why* something is good.

---

### US-ALIEN-005 — AI Pre-Publish Stress Test (Composer Enhancement)

**As a writer about to publish,** I want the AI to challenge my post before it goes live, **so that** I can strengthen my arguments and fill gaps proactively.

**What the UI must show (in the composer, when user clicks "Review before posting"):**
- A modal showing an AI-generated analysis of their draft:
  - "Strongest point" — what lands well
  - "Weakest point" — what needs evidence or clarification
  - "Counter-argument you should address" — the best opposing view
  - "Missing context" — what a reader would need to know
- The user can edit their draft based on this feedback and re-run the analysis
- A "Post anyway" button lets them skip the feedback
- All analysis is static mock text in MVP (future: actual AI call)

**Advantage assessment:** Stack Overflow's Question Assistant (powered by Gemini) improved question success rates by 12%. A stress test for all content types — reviews, debates, comparisons — would be the first platform to do this. The static mock in MVP proves the UX pattern; real AI integration comes with CTO backend work.

---

### US-ALIEN-006 — Knowledge Freshness System

**As a returning reader,** I want to know if this thread's information is still current.

**What the UI must show (all modes):**
- If a thread has not been updated in 90+ days, a subtle "Last updated X days ago — information may be outdated" banner appears below the header
- A "Request update" button lets any user flag the thread as needing a refresh (optimistic UI counter)
- If the author responds with an update (canonized comment), the banner clears

**Advantage assessment:** Knowledge decay is the silent killer of forums. MiniMax's "expiration system" insight was strong. This simple banner + request mechanism keeps the knowledge base honest without heavy moderation. No community platform does this proactively.

---

### US-ALIEN-007 — Serendipity Engine (Unexpected Connections)

**As a reader,** I want to discover related threads from different categories that share semantic overlap, **so that** I find connections I didn't know existed.

**What the UI must show (MAX only, in insight rail):**
- A "You might also find interesting" section showing 2–3 threads from *different* categories that share semantic similarity
- Example: A "Review" thread about an AI tool links to a "Help" thread where someone is troubleshooting that same tool
- Mock data: hand-curated cross-category links

**Advantage assessment:** This is MiniMax's "Unknown Unknowns" concept implemented practically. Reddit's recommendation engine is engagement-optimized (more time on site). Yours would be knowledge-optimized (more insight per session). This is the kind of feature that creates "aha moments" that users share on Twitter.

---

## 3B. ALIEN-LEVEL CATEGORY ENHANCEMENTS

---

### US-ALIEN-NEWS-001 — Sentiment Pulse Visualization

**As a reader,** I want to see the community's emotional reaction to this news at a glance.

**What the UI must show (MAX only):**
- A compact sentiment distribution bar in the insight rail: % Positive, % Neutral, % Negative reactions from comments
- Visualized as a proportional color bar (green/grey/red)
- Mock data derived from comment count

**Advantage:** Turns passive reading into active sense-making. The reader doesn't just read the news — they see how the community received it.

---

### US-ALIEN-DEBATE-001 — Mind-Change Tracker

**As a participant,** I want to see how many people changed their vote after reading arguments, **so that** I know if this debate is actually changing minds.

**What the UI must show (MAX only):**
- A "Minds changed" counter below the vote bar: "X people changed their vote during this debate"
- This requires tracking vote history in local state (if user votes Agree, then later votes Disagree, the counter increments)
- Frontend state only — resets on page reload in MVP

**Advantage:** No debate platform tracks opinion changes. This rewards quality argumentation over tribal voting. It's the metric that proves discourse quality.

---

### US-ALIEN-COMPARE-001 — Community Override Row

**As a reader,** I want to see when the community disagrees with the author's comparison scores.

**What the UI must show (MAX only):**
- Below the author's comparison table, a "Community says" row appears if enough commenters have suggested different scores
- Shows the aggregate community score vs the author's score for each criterion
- Divergences are highlighted (e.g., author scored Price 8/10, community says 5/10)
- Mock data for MVP

**Advantage:** Transforms comparisons from single-author opinion to crowd-validated intelligence. This is unique in the market.

---

### US-ALIEN-HELP-001 — Similar Solved Threads

**As a seeker,** I want the platform to surface similar problems that have been solved, **so that** I might not even need to wait for a reply.

**What the UI must show (MAX only, in insight rail):**
- A "Similar solved threads" card showing 2–3 threads with matching tech stack chips and a "✅ Solved" status
- Each card shows: title, solution snippet (one line), solve time
- Mock data: hand-curated related threads

**Advantage:** Stack Overflow's "Questions that may already have your answer" is the closest parallel, but theirs appears during posting, not during reading. Showing this in the thread itself helps readers self-serve faster. Reduces duplicate threads organically.

---

### US-ALIEN-SHOWCASE-001 — Before/After Comparison Slider

**As a viewer,** I want to see how the creator's work evolved between versions.

**What the UI must show (MAX only, when thread has 2+ versions with media):**
- A horizontal before/after comparison slider overlaying two versions of the media
- Drag the slider to reveal version 1 vs version 2
- Only appears when both versions have comparable media

**Advantage:** Every design tool (Figma, Framer) lacks a native community comparison view. This makes Showcase threads dramatically more useful for iterative work. Creators would share Createconomy links instead of Figma links for feedback.

---

### US-ALIEN-LIST-001 — Community Nomination Queue

**As a contributor,** I want to suggest an addition to this list with a structured nomination.

**What the UI must show (MAX only):**
- A "Nominate an item" CTA below the list
- Clicking opens a mini form: Item name, Why it meets the criteria, Link
- Nominations appear in a "Pending nominations" section below the list (collapsed by default)
- Other users can upvote nominations
- Author can "Accept" a nomination to add it to the list (UI only in MVP)

**Advantage:** Lists on every platform are static. Author publishes, then comments pile up with "you forgot X." This gives a structured pathway from suggestion to inclusion. It's collaborative curation, not chaotic comments.

---

### US-ALIEN-GIGS-001 — Salary Benchmark Context

**As a candidate,** I want to see how this gig's compensation compares to similar roles.

**What the UI must show (MAX only):**
- A compact "Market context" card below the role summary
- Shows: "This gig offers $X–$Y. Similar roles on the platform range $A–$B."
- A visual bar showing where this gig falls in the range
- Mock data: hardcoded benchmark ranges per skill category

**Advantage:** Levels.fyi does this for full-time roles. No gig platform provides salary benchmarking context. For your socialist-leaning TAM, pay transparency is a first-class value.

---

## 3C. ALIEN-LEVEL INTERACTION PATTERNS

---

### US-ALIEN-INTERACTION-001 — Keyboard Command Palette

**As a power user,** I want a command palette (Cmd/Ctrl + K) to navigate anywhere instantly.

**What the UI must show:**
- A spotlight-style search overlay triggered by Cmd/Ctrl + K
- Actions available: Search threads, Navigate to category, Toggle MIN/MAX, Jump to comments, Share thread, Bookmark thread
- Fuzzy search on action names
- Keyboard-navigable (arrow keys + enter)

**Advantage:** Every power tool (VS Code, Linear, Notion, Raycast) has this. Your TAM expects it. Without it, the platform feels consumer-grade. With it, it feels like a professional tool.

---

### US-ALIEN-INTERACTION-002 — Hover TLDR on Related Thread Links

**As a reader,** I want a quick preview when hovering over any linked thread, **so that** I don't have to open every link to find what I need.

**What the UI must show:**
- On hover over any internal thread link (in related threads, genealogy links, or inline body links), show a tooltip card with: title, category, first 2 sentences, quality stage badge, and comment count
- Tooltip appears after 300ms hover delay
- Disappears on mouse-out

**Advantage:** Wikipedia has this. No discussion platform does. For a knowledge network, link previews are table stakes for fast navigation. They dramatically reduce unnecessary page loads and keep users in flow.

---

### US-ALIEN-INTERACTION-003 — Reading Progress Indicator

**As a reader,** I want to see how far I've scrolled through the thread, **so that** I can gauge my progress in long discussions.

**What the UI must show:**
- A thin, subtle progress bar at the very top of the viewport (below the nav)
- Fills from left to right as the user scrolls through the thread body + comments
- Disappears when the user reaches the bottom

**Advantage:** Medium has this. It's a small touch that signals editorial quality and respects the reader's time. For long technical threads, it reduces the "am I close to the end?" anxiety.

---

---

## PART 4 — INTERACTION STATES (All Phases)

These apply across all 9 category threads. Implement with Phase 1:

- **Upvote thread** — toggle. Count increments/decrements immediately. Icon fills when active.
- **Bookmark (Fav)** — toggle. Icon fills when active. Count updates immediately.
- **Share** — copies URL to clipboard. Brief "Link copied" toast, auto-dismisses.
- **Upvote comment** — toggle, optimistic. Upvote disables downvote simultaneously.
- **Downvote comment** — toggle, optimistic. Downvote disables upvote simultaneously.
- **Reply** — clicking Reply expands inline composer. Escape collapses it.
- **Debate vote** — radio-style (Agree / Disagree / Abstain). Vote bar animates.
- **Review weight sliders** — recalculate weighted total live.
- **Gallery thumbnail** — clicking swaps primary image. Active thumbnail has highlighted border.
- **Apply (Gigs)** — opens modal. Submitting shows toast, closes modal. No API call.
- **Auth-gated actions** — triggers existing auth modal. No new auth flow.
- **MIN → MAX toggle** — scroll preserved. No reload. Smooth transition.

---

## PART 5 — MOBILE BEHAVIOUR (All Phases)

- Below 768px: Left nav collapses. Hamburger overlay.
- Below 768px: Right sidebar moves to below comments.
- Below 768px: Compare table is horizontally scrollable with scroll hint.
- Below 768px: Showcase gallery uses horizontal swipe with CSS scroll snap.
- Below 768px: MAX insight rail becomes collapsible bottom sheet.
- Composer: full-width on mobile. Markdown toolbar collapses into ··· overflow.

---

## PART 6 — ROUTING (All Phases)

Page: `/discussion/[id]`

Mock IDs:
- `/discussion/news-001`
- `/discussion/review-001`
- `/discussion/compare-001`
- `/discussion/launchpad-001`
- `/discussion/debate-001`
- `/discussion/help-001`
- `/discussion/list-001`
- `/discussion/showcase-001`
- `/discussion/gigs-001`

---

## APPENDIX A — MOCK DATA REQUIREMENTS PER CATEGORY

Each mock data file should demonstrate the full feature set visually. Include:

**All categories:**
- Thread header data (title, author, tags, timestamps, view count, vote count)
- AI summary text (1–2 sentences)
- Body content (realistic creator-economy content, not lorem ipsum)
- 5–8 comments with varying nesting depths, including at least one OP reply
- Related threads (3–4 compact cards)
- Trending in category (3 compact cards)
- MAX mode insight rail data (summary, agreements, disagreements, open questions)

**Category-specific mock data:**
- News: source block, corroboration sources with stances, timeline entries, conflicting reports
- Review: product card, verdict, criteria scores with weights, reviewer context, community sentiment
- Compare: comparison table (3 options, 5 criteria), verdict cards, scenario data, weight defaults
- Launchpad: hero media, stage badge, stats, maker note, feedback chips, milestones, changelog, tech stack
- Debate: proposition text, vote distribution, argument summary cards (for/against), argument tree nodes, fallacy tags, common ground points
- Help: problem statement sections, environment chips, solved status, solution comment ID, reproducibility count, diagnostic path steps
- List: purpose, criteria checklist, ranked items (7–10), metadata, lens sort data, coverage gaps
- Showcase: primary + secondary media URLs, creator intent, feedback tags, version timeline, annotated comment locations
- Gigs: role summary fields, skill chips, poster note, apply CTA state, process stages, fit checklist items, salary benchmark range

---

## APPENDIX B — PHASE SUMMARY TABLE

| Phase | Feature Count | Scope | Build Order |
|-------|--------------|-------|-------------|
| Phase 1 — Must Have | ~30 user stories | Core shell + MIN mode for all 9 categories | Ship first |
| Phase 2 — Good to Have | ~25 user stories | MAX mode intelligence layer + category-specific MAX features | Ship second |
| Phase 3 — Nice to Have | ~15 user stories | Alien-level features with ecosystem advantages | Evaluate individually |

---

## APPENDIX C — WHAT MAKES THIS NOT ANOTHER REDDIT

A summary of differentiation for product positioning:

1. **Category-polymorphic threads** — same shell, different semantic UI per content type. Reddit treats everything as a text post.
2. **MIN/MAX progressive intelligence** — readers choose their depth. No platform does this.
3. **Structured comment intents** — replies are tagged by contribution type. Reddit has no comment structure beyond nesting.
4. **AI Quality Nudges** — category-specific coaching in the composer. No platform coaches users on reply quality.
5. **Insight Rail** — AI-generated thread state (agreements, disagreements, open questions). Discourse has basic summaries; you have structured intelligence.
6. **Thread Genealogy** — threads link to predecessors and contradictions. No platform builds an explicit knowledge graph from discussions.
7. **Decision Capture** — threads can reach outcomes, not just accumulate comments. Forums are talk; this is operational.
8. **Adjustable criteria weights** — readers personalize review/comparison scores. No review platform does this.
9. **Argument Trees** — debates show logical structure, not just popularity. No debate platform visualizes reasoning chains.
10. **Annotated media comments** — feedback pinned to specific regions of images/video. Figma-level precision in a community context.

---

*Document version: v2.0 · March 2026 · Prepared for Claude Code (Opus) handoff*
*Source: Multi-model analysis (GLM, Opus, OpenAI, Gemini, MiniMax) + independent research*
