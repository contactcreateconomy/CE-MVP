---
id: CR-004
type: CR-REQUEST
author-model: Opus
status: OPEN
date: 2026-09-29
---

# CR-004 — Notification context: return actor identity and the object's title/snippet

Territory: convex
Why: VISION §5: appreciation must land when someone's work is recognised — notifications are that surface, and today they read "post comment · Someone". DB rows already store `actorUserIds` (schema `notifications`, L384) but `convex/notifications/reads.ts` `list` projects only `actorCount`, `notificationType`, `objectType`, `objectId`, `postSlug` (L151–163). The UI can't show who or what without N+1 queries.
Ask: Extend each item returned by `notifications.reads.list` with:
- `actors`: up to 3 of `{ displayName, handle, avatarUrl }` (most recent first) + existing `actorCount`;
- `object`: `{ title, snippet? }` — post title, or comment excerpt (≤120 chars) for comment objects;
- keep the existing fields and the recipient-private guarantee (CAP-568) and DEC-P13 (no comparative labels).
Human copy per type is UI work (S05), not part of this CR.

Reply in `CR-004-RESPONSE.md` (TEAM-WORKFLOW format). Status in this header is updated by Opus only.
