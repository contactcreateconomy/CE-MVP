---
id: CR-001
type: CR-REQUEST
author-model: Opus
status: OPEN
date: 2026-09-29
---

# CR-001 — Harden the `dev/demoSeed` guard (loopback allowlist or documented cloud-dest exception)

Territory: convex
Why: `convex/dev/demoSeed.ts` (dev-team commit `44d0bfb`, 150-post "dest-only demo fixtures") is gated only by `DEMO_SEED_ENABLED=true` plus a production-*name* denylist (`demoSeedBlockedReason`, L73–87: substring match on `energetic-kangaroo-55` / `discuss.createconomy.com` in CONVEX_CLOUD_URL / CONVEX_SITE_URL / SITE_URL). A renamed or new prod deployment, or a custom domain, passes the denylist. The redesign's `seed/demo` path is guarded by the server-side loopback allowlist `convex/seed/devGuard.ts` (6 tests in `tests/convex/dev-guard.test.ts`). Source: PRE-CLOUD-REPORT "Founder decisions applied".
Ask: 1. Keep the env flag. Replace/extend the denylist with an **allowlist**: call `seed/devGuard`'s loopback check (or an explicit `DEMO_SEED_ALLOWED_DEPLOYMENTS` list) before any write.
2. **If demoSeed is meant to run on a cloud "dest" deployment** (its own error text says "on the dest Convex deployment"), a pure loopback check would break that use — then allow exactly the named dest deployment(s) and document it in the file header. Dev decides which; say so in the response.
3. Add tests alongside `tests/convex/dev-guard.test.ts` covering: flag off, prod name, unknown cloud URL, allowed target.
No deletion of the seed or scripts (founder rule).

Reply in `CR-001-RESPONSE.md` (TEAM-WORKFLOW format). Status in this header is updated by Opus only.
