---
id: CR-003
type: CR-REQUEST
author-model: Opus
status: OPEN
date: 2026-09-29
---

# CR-003 — Avatars: project the user's image and allow uploading one

Territory: convex
Why: VISION "feel special" + TRUST: a community without faces reads as low trust. Today every person is an initial. `convex/profile/page.ts` hardcodes `avatarUrl: null` (L98 private projection, L166 public). `users.image` already exists in the schema (auth field). No avatar upload exists in `/setup` or `/settings/profile`. Needed by S01 (setup), S02 (feed card), S03 (thread), S05 (profile, notifications), S08 (settings).
Ask: 1. Profile projections return `avatarUrl` from `users.image` (or a storage URL), still `null` for private profiles viewed by others.
2. A mutation to set/clear the caller's avatar from a Convex storage upload (size/type limits; moderation hook if one exists for images).
3. Author payloads used by the feed (`feed.list`), thread (`posts.detail.getDetail`, comments) and notifications (CR-004) include `avatarUrl` so the UI never makes N extra queries.
4. Seed: give some demo members an avatar (update fingerprint in the same commit).

Reply in `CR-003-RESPONSE.md` (TEAM-WORKFLOW format). Status in this header is updated by Opus only.
