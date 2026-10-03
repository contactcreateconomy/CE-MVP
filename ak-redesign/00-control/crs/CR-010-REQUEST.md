---
id: CR-010
type: CR-REQUEST
author-model: Opus
status: OPEN
date: 2026-10-03
---

# CR-010 — Feed card + chrome payloads for the S02 display components

Territory: convex
Why: S02 ports the founder-approved feed prototype as display components (D-016). Several props have no source in `feed.list` / `feed.getChrome` today; the UI must not invent them (D-012), so until this lands they render nothing (designed fallback). Full prop-by-prop map: `ak-redesign/specs/S02-SPEC.md` §5. Avatars are CR-003; podium windows/floor are CR-006 — not repeated here.

Ask — `feed.list` card (`assembleCard`, `convex/feed.ts`):
1. **Author identity:** `authorHandle` (`users.username`) and `authorType` (`user` / `persona` / `editorial`; the Fav sort path does not filter personas, so the card must be able to show the AI label). For persona authors, the persona's display name + handle.
2. **Running comment resolved:** `runningComment: { body (plain text, ≤200 chars), authorName, authorHandle, isPersona } | null` from `cardSummaries.runningCommentRef` (keep the 15-min freeze). Optional: up to 4 recent top-level comments in the same shape (the prototype cycles them on hover).
3. **Participants resolved:** `participants: [{ name, handle, isPersona }]` (≤3) from `cardSummaries.avatarUserIds` (avatar URL per CR-003).
4. **Raw counts:** `valuableCount` as the integer count of valuable reactions. `engagement.valuable` is `valuableWeighted` (a weighted score), which isn't a number a member can verify.
5. **Viewer state:** `viewer: { valued: boolean, saved: boolean }` for the signed-in caller (both `false` for guests).
6. **Cover image (optional, say if not cheap):** `coverImageUrl` if the post has an image (first body image or a dedicated field). There is no cover field in `posts` / `cardSummaries` today; the prototype's "AI thumbnail pipeline" is not in the capability register. Reply with what exists; never generate one without a CAP.

Ask — `feed.getChrome`:
7. **Hero:** add `type`, `summary` (`heroSlots.textOverride` ?? `cardSummaries.oneLiner`), `imageUrl` (storage URL of `heroSlots.mediaAssetId`), `reads` + `replies` (from `postDistributionScores`), and respect `desktopEnabled` (S02 shows the hero at lg+ only). No shares counter exists → none is shown.
8. **Vibing:** for `objectType: "post"` add `title` (neutral fallback when `hook` is null), `slug`, `type`. Say how tool/category/theme objects should link.
9. **Podium entries:** add `username` (for the `/users/[handle]` link).

No new scoring and no new tables. Raw facts only.

Reply in `CR-010-RESPONSE.md` (TEAM-WORKFLOW format). Status in this header is updated by Opus only.
