---
id: CR-010-U2-RESPONSE
responds_to: CR-010 (feed card + chrome payloads) — partial, U2 slice
branch: feed-u2-payload (from feed-base) → merged into feed-u2-wire
author: Opus (FEED-U2)
date: 2026-10-12
review: dev final review per L-58 (security, code, prod deploy). No deploy done.
---

# CR-010 (U2 slice) — additive feed payload from rows that already exist

## What changed (additive only — no schema change, no new table, no write)
| Function | Added fields | Source rows |
|---|---|---|
| `feed.list` → each card (`assembleCard`) | `author {name, handle, avatarUrl, kind: user/persona/editorial, level}` | `users` (displayName, username/handle, avatarAssetId → storage URL, `image` fallback), `personas` (displayName, avatarAssetId), `distributions.currentLevel` (by_owner) |
| | `facet` (per type; `null` without its row) | review: `postReviews` + `tools` (name, `pricing` when it is a string, community ★ = ratingSum/ratingCount) · compare: `postCompares.toolIds` → `tools` · debate: `postDebates` counts + viewer's `debateVotes` (by_user_post) · help: `postHelps` + accepted comment's author · list: `postListItems` top 3 by voteCount + "more" · showcase: `postShowcases` (link approved) · news: `postNews` first key claim + source domain |
| | `bestComment {author, body}` | `cardSummaries.runningCommentRef` → `comments` (passed, not deleted) → author |
| | `participants[]` (≤3) | `cardSummaries.avatarUserIds` → `users` |
| | `viewer {saved}` | `saves` by_user_post (members only; guests `{}`) |
| `feed.getChrome` → `hero[]` | `summary`, `type`, `mediaUrl` | `heroSlots.textOverride` ?? `cardSummaries.oneLiner`; `posts.type`; `heroSlots.mediaAssetId` |
| `feed.getChrome` → `vibing[]` | `title`, `slug`, `postType` (post trends only) | `posts`, `postSeoMeta` |
| `feed.getChrome` → `podium.entries[]` | `handle`, `avatarUrl`, `level` | `users`, `distributions` |

Helpers live in `convex/lib/feedPayload.ts` (read-only). `assembleCard` takes the viewer id as a new optional last parameter; both call sites pass it.

## Safety notes for the review
- **L-29 (no herding):** the debate agree share is returned **only** when the requesting viewer has a non-abstain vote; guests and non-voters get `agreePct: null`.
- **Privacy:** no email or email-derived text is returned (same rule as finding 33). Persona/editorial authors carry no handle.
- **Reads per card** rise by roughly 8–14 (author, level, facet rows, best comment, participants, save). Page = 20 cards → ~300 extra reads, inside query limits; a later projection (cardSummaries) can absorb them (B5a).
- `storage.getUrl` is wrapped: a non-storage `avatarAssetId` (e.g. "") returns null instead of throwing.

## Proof
- `tests/integration/feed-u2-payload.test.ts` (convex-test, real schema + real `feed.list` / `getChrome`): 4 tests — RED with the change stashed (4 failing, `FEED-U2-evidence/red-01-payload.txt`) → GREEN (`green-01-payload.txt`).
- `pnpm test:convex` 18 files / 150 ✅ · forum tests ✅ (one source-pattern test updated: the call now passes `userId`).

## Gaps — no source row, renders nothing (D-012)
Main topic (L-23 taxonomy not unified) · `updated` flag (no post edit timestamp) · `pinned` flag · tool pricing when `tools.pricing` is not a plain string (shape unspecified) · compare "most-different row" (`qualitativeGrid` shape unspecified) · public Gravity (CR-014 counters; `engagement.valuable` is the flat weighted Valuable) · viewer `appreciated` / `commented` / `shared` (no post-level reaction table; comment lookup per post not indexed) · why-care life-stage line + its numbers (B3) · Podium "what they did" text (recognition entries carry points only) · Vibing hook text (no `vibingHooks` writer) · hero labels beyond `community_top` (disclosureClass values unnamed, curation OQ3).
