---
id: CR-005
type: CR-REQUEST
author-model: Opus
status: OPEN
date: 2026-09-29
---

# CR-005 — Server-side drafts (CAP-531)

Territory: convex
Why: `/drafts` and the composer store drafts in **localStorage only** (`drafts-page-client.tsx:34`; CAP-531 pending). Drafts don't follow the creator across devices — the founder alone uses 3 machines. The S04 composer rebuild wants autosave that survives device switches.
Ask: A `drafts` capability per CAP-531: create/update (debounced autosave), list mine, get, delete, publish-from-draft; owner-only access; typed fields stored as the same shape the composer publishes. S04 can ship on localStorage first and switch when this lands — state in the response which.

Reply in `CR-005-RESPONSE.md` (TEAM-WORKFLOW format). Status in this header is updated by Opus only.
