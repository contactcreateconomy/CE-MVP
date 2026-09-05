# AGENT-START-HERE — operating instructions for the build agent

You are the coding agent building Createconomy. This file is the only entry point you need. Read it fully before touching any code.

---

## 1. WHAT THIS FOLDER IS

`PRD/` is the complete, verified build specification for Createconomy: 572 capabilities, 54 screens, 56 screen contracts, 132 slices, 19 module build sheets, and the design system. Everything needed to build is here. **Do not read or reference anything outside `PRD/`.** Specifically: **never read `Brainstorm/`** — it contains superseded drafts, historical debate logs, and two audit files that still read "BLOCKED" despite their findings having been resolved; reading them will cause false blocking. If a question seems unanswered inside `PRD/`, that is a stop-and-report condition (see §4), not a reason to go looking elsewhere.

## 1b. REFERENCE IMPLEMENTATIONS — extend these, don't rebuild them

Three pieces of this app are already built, real, and verified working — not mockups, not stubs. Treat them as the reference standard for quality and pattern, and **EXTEND them rather than creating parallel/duplicate versions**:

1. **Feed page** — live at `/feed`, real Convex-backed, verified rendering (sort tabs Hot/New/Top/Fav, real data). Spec route matches live route — no drift here.

2. **Auth popup** — `packages/auth-ui` (AuthModal, AppAuthProvider, useAuth). Frontend code is complete and preserved; NOT connected to a real configured OAuth backend (no live provider secrets). Treat the UI/component layer as done; backend auth configuration is future work, not yet started.

3. **Discussion page** — live at `/discussions/[slug]`, real Convex wiring, but PARTIALLY built — does not yet fully match its contract (`PRD/02-contracts/wave-5/CONTRACT-5-discussion-thread-FINAL.md`). Extend this implementation to close the gap; do not start a fresh discussion-page build.

**KNOWN NAMING NOTE:** some of these live routes use different path names than their contracts (e.g. contract may reference `/p/[slug]`, live code is `/discussions/[slug]`). This is a known, accepted, non-blocking naming difference — do not rename these routes, and do not treat the name mismatch as a sign the screen needs to be rebuilt. When a contract route doesn't exist verbatim, check `PRD/screens/` first — the per-screen sheet states whether a live equivalent exists under a different name.

**BUILD-READINESS:** per-screen scores and deduction evidence live in `PRD/06-open-items/SCREEN-SCORES.md` — read it before starting any screen. **wave-4-editorial carries a NEEDS HUMAN REVIEW flag**: its primary interactive surface (the A10 evidence/diff panel) does not exist in the component library and requires founder input before an agent attempts it. All other 53 screens are cleared for autonomous build per that file's scores.

**FENCE STATUS (2026-09-04 — DECISIONS-LOCKED.md):** all eleven former stop-and-report product fences are **RESOLVED** (`PRD/06-open-items/DECISIONS-LOCKED.md` — OTP=Twilio Verify, timezone auto-detect/no-Skip, 7 activation bits, policyFamily taxonomy, manual_review Approve&Retry/Cancel, legal-intake identity+rate rules, consent→vendor-deletion outbox, 8-category readiness predicates, versioned legal content, A10 two-pane interaction, calibration_pending ranking constants). The affected slices carry UNBLOCKED notes in their catalogs; the affected contracts carry dated addenda. Remaining items that do NOT block any slice: E1, F-34, F-36, the FUTURE-* rows (see `06-open-items/OPEN-DECISIONS.md`).

**PRE-LAUNCH GATES (do not block build):** lawyer review of the four founder-drafted legal documents, and Readiness Category 8 (ranking calibration reviewed) — both gate `signup.mode=open` only.

**GOVERNING DECISION RECORDS (read before any architecture-adjacent work):** `PRD/00-project-status/00-TRANSITION.md` (live→canonical: RESET + strangler ports, no data migration, no dual-write; never write a legacy `forum*` table), `PRD/00-project-status/00-TOPOLOGY.md` (forum app owns ALL MVP routes; admin/seller/marketplace apps parked; `app/admin/...` slice paths mean `apps/forum/src/app/(app)/admin/...`), `PRD/00-project-status/00-ROUTES.md` (live route names are canonical: `/discussions/[slug]`, `/new-post`, `/users/[handle]`, `/profile`+`/settings`). App setup: `PRD/app/SETUP.md`.

EVERYTHING ELSE in the 54-screen inventory is being built fresh against the PRD spec — no existing code to extend, build per the contract and slice catalog from scratch.

## 2. READ ORDER — before starting ANY slice/screen

Read in this sequence, every time you start a new slice or screen:

1. **`01-product-spec/_data-model.md`** — canonical entities and enums. Read first, always. Every table, field, and enum literal you write must match this file verbatim (e.g. the ten `signal.level` literals).
2. **`01-product-spec/CAPABILITY-REGISTER-MERGED.md`** — the 572 capability rows. CAP-XXX IDs are referenced everywhere else; this file defines what each one means (Actor, Reads, Writes, Gates).
3. **`01-product-spec/MASTER-SCREEN-INVENTORY-MERGED.md`** — the 54 screens, each row's wave, contract, template archetype, and CAP-IDs. §3 of this file also lists the archetype gaps (A1–A13).
4. **`04-design-system/STYLE-KIT.md`** — every token (§2–§8), icon/logo rule (§9–§10), component spec (§11.1–§11.26), and layout (§12). **NEVER use a raw hex or px value where a named token exists here.** Components already built in code must match their §11 spec.
5. **`04-design-system/DESIGN-SYSTEM-OPEN-ITEMS.md`** — check before building anything touching **A8 (tiered ladder)** or **A9**. These are known-open items; do not treat them as silently resolved.

## 3. PER-TASK LOOKUP TABLE — "I'm building slice X, what do I read?"

| Step | Read | Why |
|---|---|---|
| 1 | Find the slice in `03-slices/SLICE-CATALOG-PHASE*.md` | Gives scope, dependencies, files-touched, acceptance criteria, size fence |
| 2 | Find the screen(s) that slice touches → `02-contracts/wave-N/CONTRACT-*-FINAL.md` | The literal States / Actions / Components-Used spec. **Build to this exactly**, not to a generic version of the screen |
| 3 | If the slice touches backend/business logic beyond UI → the matching module in `05-build-sheets/M#-*.md` | Module-level logic (examples: signals/gamification → `M12-signals.md`; moderation → `M13-trust-safety.md`; admin console → `M15-admin.md`) |
| 4 | Cross-check `06-open-items/OPEN-DECISIONS.md` | If any OPEN row is tagged to that module/capability, the decision is NOT final — do not assume |

## 4. HARD RULES (non-negotiable — cite the rule back if you are about to violate one)

1. **Never invent a token, color, spacing value, or component pattern not already in `STYLE-KIT.md`.** If no token exists for a value you need, stop and report; do not mint one silently.
2. **Never build against a capability or screen that is not in the register / inventory.** No "usual product" surfaces.
3. **Contract vs. slice-catalog conflicts:** the **CONTRACT is authoritative for UI/states/actions**; the **SLICE CATALOG is authoritative for scope/sizing/dependencies**. If they conflict, flag the conflict explicitly — do not silently pick one.
4. **If something is genuinely ambiguous or missing, STOP and report it rather than guessing.** Do not fill gaps with assumptions. This includes unspecified copy that is marked founder/legal-owned (e.g. `/go` interstitial strings, legal pages).

## 5. WHAT'S OUT OF SCOPE FOR THIS PRD

- **Charts (A2) do not exist — by logged decision.** No chart primitive is specified anywhere in STYLE-KIT; the analytics screen (`CONTRACT-7-admin-analytics`) needs one. Do not build screens requiring charts without flagging this first.
- **A8 tiered ladder: visual sign-off is OPEN.** A code component exists (token-conformant, vertical rail per the A8-A one-liner), but the founder's Figma direction was never attached. Check `04-design-system/DESIGN-SYSTEM-OPEN-ITEMS.md` before building on it.

## 6. FILE MAP

| Path | Contents |
|---|---|
| `01-product-spec/` | What to build: capabilities (572), screens (54), data model |
| `02-contracts/wave-N/` | Exact UI spec per screen (56 contracts, waves 1–7) |
| `03-slices/` | Ticket-sized work units, build order, dependencies (132 slices, Phases 1–7) |
| `04-design-system/` | Tokens, component specs, what's built vs. missing |
| `05-build-sheets/` | Module-level business logic (M0–M18) |
| `06-open-items/` | Things still genuinely undecided (check before assuming any decision is final) |
| `00-project-status/` | Project-status records: the three governing decision docs (00-ROUTES/00-TOPOLOGY/00-TRANSITION), BIBLE-FIXES.md, KNOWN-UI-GAPS.md, FINAL-HOLISTIC-AUDIT.md, and PROJECT-STATUS.md (read PROJECT-STATUS.md first when arriving cold) |
