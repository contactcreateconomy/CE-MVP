# Profile Settings & Privacy

**Status (2026-09-18 screen audit correction):** LIVE. **Fixed (this pass):** raw HTML `<select>` elements (role, age band, social platform) replaced with the STYLE-KIT `Select` component; raw-hex-with-fallback colors replaced with `text-(--feedback-error-text)` / `text-(--feedback-warning-text)`.

**Route:** `/settings/profile`
**Status:** LIVE, ROUTE DRIFT — live code split across `/profile` (PRD/app/apps/forum/src/app/(app)/(shell)/profile/page.tsx) and `/settings` (PRD/app/apps/forum/src/app/(app)/(shell)/settings/page.tsx)
**Route drift:** spec `/settings/profile` vs live `/profile` + `/settings` (split, no single `/settings/profile` route) — DECISION NEEDED: rename live route to match spec, OR update spec to match live route. Not silently picked.
**Contract:** PRD/02-contracts/wave-5/CONTRACT-5-settings-profile-FINAL.md
**Slice(s):** P5-06

## Layout

Contract §6 Components Used names only the **"Settings-form archetype (§12)"** — a generic §12 citation with no §12.x subsection pinned. Inventory Template archetype: "Settings form". Contract §1: this screen is the WRITE surface for the shared CAP-IDs (`/u/[handle]` is the READ/DISPLAY surface); CAP-157 re-acceptance prompt is a global overlay attaching to this host flow. Thin-layout note: the contract prescribes no column/section arrangement beyond the field groups below (from States A–G) — do not invent further structure.

```
+----------------------------------------------+
| SETTINGS FORM (§12, subsection unpinned)     |
|                                              |
| A. Optional attributes (each independently   |
|    unset → set → "prefer not to say" →       |
|    erased):                                  |
|    roleArchetype — Select {solo_creator|     |
|      small_team|agency|exploring|            |
|      prefer_not_to_say}                      |
|    ageBand — Select (banded, optional)       |
|    toolsUsed — tap-target pickers            |
|      (tool-affinity, from `tools`)           |
|    socials — see B                           |
|    bio — Text Input                          |
|    avatar — upload                           |
| B. Social handles: none · added (stored      |
|    handle only, no fetch) · visibility       |
|    {private|public|future_marketplace_only} ·|
|    verificationStatus (Phase-3 stub) ·       |
|    revoked/deleted via CAP-549 (soft-delete) |
| C. Consent: granted → withdrawn (append-only |
|    both ways; withdrawal triggers CAP-151    |
|    erasure cascade)                          |
| D. Erase field / attribution detach —        |
|    Button (Destructive) + confirm Modal      |
| G. Privacy toggles (CAP-552):                |
|    profileVisibility {public|private}        |
|    leaderboardOptOut (boolean)               |
| F. Re-acceptance prompt (CAP-157) — global   |
|    overlay on this host flow                 |
|                                              |
| [ Save ] [ Withdraw ] [ Erase (Destructive)] |
| [ Revoke social (Destructive) ]              |
+----------------------------------------------+
```

## Components required

- §11.2 Text Input (bio, handle) → apps/forum/src/components/ui/input.tsx
- §11.2 Select (banded enums: roleArchetype, ageBand) → apps/forum/src/components/ui/select.tsx
- Tap-target pickers (toolsUsed tool-affinity) → apps/forum/src/components/ui/combobox.tsx (nearest primitive; no dedicated picker in the library)
- Checkbox/Toggle (consent flags, visibility) → apps/forum/src/components/ui/checkbox.tsx + apps/forum/src/components/ui/toggle-switch.tsx
- §11.1 Button (save/withdraw/erase/revoke — Destructive for erase and revoke) → apps/forum/src/components/ui/button.tsx
- §11.7 Modal (erase confirm; re-acceptance overlay; revoke confirm) + Toast → apps/forum/src/components/ui/dialog.tsx + apps/forum/src/components/ui/toast.tsx
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx
- inline Error §11.8 (available-not-prescribed) → apps/forum/src/components/ui/input.tsx (error state is the defined surface; no standalone inline-error component exists)
- Avatar upload (avatar attribute) → apps/forum/src/components/ui/image-uploader.tsx (nearest library primitive; contract §6 does not name an uploader — flagged, not invented)
- MISSING: consent-history, erasure-impact, inferred-vs-declared, social-handle-stub, versioned-reacceptance component — contract §6 states none exist in §11

## States required

*(Copied VERBATIM from CONTRACT-5-settings-profile-FINAL §3.)*

*(Field-decision + consent/erasure set below. GPT's ~60 sub-states — each attribute's set/unset/prefer-not-to-say/erased, each verification sub-state — folded to the per-field decision model + consent/erasure lifecycle.)*

**A. Optional-attribute states (CAP-143's field set):** roleArchetype · ageBand · toolsUsed · socials · bio · avatar — each independently: unset → set → "prefer not to say" (**= a completed decision, equal credit**) → erased (CAP-151 detach). Tap-only, progressive, purpose-labelled.
**B. Social handle states (CAP-146/147/549):** none · added (stored handle only, no fetch) · visibility chosen `{private|public|future_marketplace_only}` · verificationStatus (**Phase-3 stub**, CAP-147) · **revoked/deleted via CAP-549** (soft-delete; row retained).
**C. Consent states (CAP-148/149):** granted → withdrawn (append-only both ways); withdrawal **overrides analytics/personalization/marketplace/completion use** and triggers the CAP-151 erasure cascade.
**D. Erasure states (CAP-151):** member-initiated field erase OR consent-withdrawn cascade → `userInferences` invalidated + `userProfileAttributes` detached + non-value-bearing `auditLog` record; **Recognition persists as "completed under version X" without revealing answers; aggregates survive only if unlinkable.**
**E. Completion-badge recompute (CAP-150):** field completes → recompute; **per-field badges, NOT a gamified 100% bar**; prefer-not-to-say earns equal credit; firewall: Recognition only, never Signal/rank/reach. Badge UI renders on `/u/[handle]`.
**F. Re-acceptance prompt (CAP-157):** System detects material rules/policy version bump (last-accepted vs current) → prompt surfaced; **no write until the member acts**; re-acceptance is **`consent.reaccept`** (append-only versioned consent log). *(Wave 7A E2: M7 profile mutation; M18 CMP names unaffected.)*
**G. Privacy toggles (CAP-552):** `profileVisibility {public|private}` (default public) · `leaderboardOptOut` (boolean, bootstrap default false) — independent toggles, same mutation. These are `users` self-preference fields, **not** CMP/`consentRecords` (FATAL-M18-02 lives on M18 consent, not here).

## Component library maturity note

- ⚠️ input has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ select has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ combobox has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ checkbox has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ dialog has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- button, toast are production-proven (no warning).
- toggle-switch.tsx and image-uploader.tsx are on neither the provided zero-production nor production-proven list — maturity unknown, not invented here.
