# DEV-HANDOFF — Terminal/CLI/Deployment-Dependent Items

> **Rule (standing):** any build item that requires terminal access, Node,
> pnpm, the Convex CLI, a deployment push, a package install, or any
> command-line execution goes HERE — not worked around. The agent stops,
> flags it, and moves to the next Bucket-2 item.
>
> **Audience:** the developer with terminal + Convex CLI access on the
> deployment (`watchful-chameleon-570`).

---

## Immediate (needed to verify current work)

### 1. Convex login + codegen + legal seed
```bash
cd PRD/app
npx convex login          # one-time browser flow
npx convex dev --once     # push functions + regenerate _generated (incl. api.d.ts diff check)
pnpm convex:seed-legal    # seed the 4 legal docs as v1 published
npx convex run legalContent:getPublished '{"docKey":"terms"}'  # verify
```
**Why:** the legal routes render the contract-sanctioned `unavailable_pending_legal` state until seeded. Also: step (b) regenerates `api.d.ts` — diff against the hand-extended version (the Item 2 verification you noted).

### 2. Founder-bootstrap + admin access verification (P2-AUTH-CUTOVER gate)
See `FOUNDER-BOOTSTRAP.md` for the full step-by-step. Short version:
```bash
# Create the roleAssignments administrator row (via dashboard or CLI)
# Then verify admin access works via roleAssignments ONLY
```
**Why:** blocks the ADMIN_EMAILS removal (P2-AUTH-CUTOVER gate). Also blocks the auth provider swap from password/OAuth to magic-link-only.

### 3. Install the rate-limiter component
```bash
cd PRD/app
pnpm add @convex-dev/rate-limiter
```
**Why:** P1-09 built the literal sets + typed helpers in `convex/lib/rateLimit.ts`, but the actual `reserve()` calls need the component installed and its client wired into the mutation ctx. Without it, rate limits are defined but not enforced.

### 4. Push the current schema to the deployment
```bash
cd PRD/app
npx convex dev --once
```
**Why:** 14 new tables landed in Phase 1-2 (users canonical fields, privateUserData, roleAssignments, auditLog, systemConfig, configKeyRegistry, moderationCases, legalIntake, waitlistEntries, notifications, jobCatalog, jobRuns, jobDeadLetters, rawEvents, eventCatalog, categories, launchReadinessResults, deployLog, identityJoins, capabilityRestrictions, contentVersions). They need a deployment push to be queryable.

---

## Phase 3 (when Phase 3 build starts)

### 5. Admin widget deploy seeder (SLICE-P3-03)
```bash
npx convex run admin/widgetsCatalog:deploySeed
```
**Why:** CAP-569 seeds the adminWidgets DB catalog from the source-controlled executable catalog. Without it, `/admin` renders an empty widget catalog.

### 6. Convex cron registration
Multiple slices register crons (P4-08 ingestion pollers, P5-04 rank recompute, P5-10 persona lifecycle, P6-02 feed crons, P7A-04 counters, P7E-06 signalSummary, P7E-08 level commit, P7G-05 drip.release, P7T-09 repeat-infringer). Each lands in `convex/crons.ts` (code I write), but activation requires a deployment push:
```bash
npx convex dev --once
```

---

## Phase 4+ (when each phase's build starts)

### 7. Moderation-classifier provider for H-SAFE — **PIPELINE-BLOCKING (P4-07)**
Pick a content-classification provider (the register says "dedicated moderation
classifier (not GLM self-check)" but names no provider), create the account,
and set `MODERATION_CLASSIFIER_API_KEY` (+ provider-specific env) in
`.env.local`. The evaluator ships behind a fail-closed seam
(`convex/lib/classifier.ts`): while unset, **every H-SAFE check holds its
candidate** — correct behavior, but it means the qualify pipeline blocks ALL
content from publishing until this is wired. Higher priority than Twilio/
PostHog below: those block features; this blocks the whole content pipeline
once P4-09's forge is live.

### 8. GLM API key + ingestion env seams — **PIPELINE-BLOCKING (P4-07/08)**
Set `GLM_API_KEY` (+ optional `GLM_API_BASE`, `GLM_MODEL`) in `.env.local`.
Without it: claims.extract skips (CAP-036 fail-closed) → no clusters → no
forge candidates, AND the qualify pipeline's S-DISC/S-VAL soft scores fail
every run closed — the content pipeline is as dead as it is without item 7.
Also from P4-09: the forge writes the candidate's 1024-dim embedding via `GLM_EMBEDDING_MODEL` (default embedding-2) — dims MUST match the by_embedding vector index; a model swap bumps embeddingVersion and re-indexes.
Also from P4-08, non-blocking but same session: `YOUTUBE_API_KEY` (YouTube
poller skips without it) and `INBOUND_EMAIL_SECRET` + an email-ingress
provider (newsletter webhook 503s without it — the provider does
SPF/DKIM/DMARC verification before posting).

### 9. Twilio Verify integration (DECISIONS-LOCKED #1, CAP-551)
```bash
cd PRD/app
pnpm add twilio
```
Plus: set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` in `.env.local`. This unblocks CAP-141 (comment eligibility). The helper code in `convex/lib/` is Bucket-2; the account setup + package install + env vars are Bucket-1.

### 10. PostHog integration (Phase 7 CMP/reliability)
```bash
cd PRD/app/apps/forum
pnpm add posthog-js
```
Plus: set `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST` in `.env.local`. The CMP consent gate code is Bucket-2; the account + package + env vars are Bucket-1. The vendor-deletion outbox (DECISIONS-LOCKED #7) also needs a PostHog API key set server-side.

### 11. Email provider for magic-link (production)
The `Email` provider in `convex/auth.ts` currently logs the token in dev and throws in production. A real email provider (Resend, SendGrid, etc.) is needed:
```bash
pnpm add resend  # or your preferred provider
```
Plus: set `EMAIL_FROM` + provider API keys in `.env.local`. Dev mode works without this (code is logged).

### 12. Seed data pushes (per-phase, as their slices land)
```bash
npx convex run seed:bootstrap         # P1-08 (idempotent)
npx convex run legalContent:seedDefaults  # legal docs (idempotent)
npx convex run rulebook/deploySeed    # P4-06 (CAP-536 rulebook thresholds, idempotent)
# + per-phase seeders as they land (CAP-566, CAP-569, CAP-571, CAP-572)
```

---

## One-time only

### 13. Diff hand-extended api.d.ts against real codegen (your Item 2)
After step 1's `npx convex dev --once`:
```bash
# BEFORE: cp convex/_generated/api.d.ts ../api.d.ts.handmade
# AFTER step 1:
diff convex/_generated/api.d.ts ../api.d.ts.handmade
# Expect: only header/ordering differences, zero semantic delta
```

### 14. Root workspace cleanup (audit HOL-P2-007)
```bash
# Remove the stray 114-byte pnpm-lock.yaml at the CEY workspace root
rm C:/Users/akr604/Music/CEY/pnpm-lock.yaml
rm -rf C:/Users/akr604/Music/CEY/node_modules
```
**Why:** causes Next.js to infer the wrong workspace root (Turbopack warning seen in dev).

---

## Summary table

| # | Item | Phase | Blocking | Effort |
|---|---|---|---|---|
| 1 | Convex login + codegen + legal seed | now | legal pages + api.d.ts diff | 10 min |
| 2 | Founder-bootstrap + admin verify | now | P2-AUTH-CUTOVER gate, Phase 3 admin | 15 min |
| 3 | Install @convex-dev/rate-limiter | now | rate-limit enforcement | 2 min |
| 4 | Push current schema (14 new tables) | now | all Convex queries on new tables | 5 min |
| 5 | Admin widget deploy seeder | P3 | admin shell renders empty without it | 5 min |
| 6 | Cron activation (deployment push) | P3-P7 | all scheduled jobs | per push |
| 7 | **Moderation-classifier provider (H-SAFE)** | **P4** | **PIPELINE-BLOCKING — all content once forge is live (fail-closed hold until wired)** | 30 min |
| 8 | **GLM API key + ingestion env seams** | **P4** | **PIPELINE-BLOCKING — claims.extract + soft scores fail closed without it** | 10 min |
| 9 | Twilio Verify (package + account + env) | P5 | CAP-141 comment eligibility | 30 min |
| 10 | PostHog (package + account + env) | P7 | CMP consent + vendor deletion | 30 min |
| 11 | Email provider (package + account + env) | production | magic-link in production | 30 min |
| 12 | Per-phase seed pushes | ongoing | seed-dependent tables | per push |
| 13 | api.d.ts diff check | with #1 | confidence only | 2 min |
| 14 | Root workspace cleanup | now | Turbopack warning | 1 min |
