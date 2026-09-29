---
id: CR-009
type: CR-REQUEST
author-model: Opus
status: OPEN
date: 2026-09-29
---

# CR-009 — Local seed: mark launch readiness `ready` and sign-up `open`

Territory: convex (seed) + scripts
Why: D-009 (founder, 2026-09-29): sign-up is **open, no gates at launch**; the "closed" state is never the front door. Today `convex/admission.ts` `effectiveSignupMode` is fail-closed — without a `launchReadinessResults` row with `overall === "ready"` the mode is `"closed"`, so every dev machine and every baseline shows "New sign-ups are currently closed" on `/signin` and on every auth-gated page. S00/S01 baselines must show the open flow.
Ask:
1. `seed/demo` (local-only, behind `seed/devGuard`) inserts a `launchReadinessResults` row with `overall: "ready"` and sets `systemConfig` `signup.mode = "open"`. Idempotent. Same commit updates `scripts/seed-fingerprint.txt` (TEAM-WORKFLOW seed rule).
2. **Never on prod:** this must only run through the loopback-guarded seed path. Production readiness stays a real launch checklist (legal, Cat-8) run by the founder.
3. Do **not** change the fail-closed logic in `admission.ts` itself.
4. Reply with the new fingerprint so GLM can re-capture baselines (`scripts/capture-baselines.mjs`).

Reply in `CR-009-RESPONSE.md` (TEAM-WORKFLOW format). Status in this header is updated by Opus only.
