# CONTRACT-7-repeat-infringer-FINAL

**Screen:** Repeat-Infringer Policy — `/repeat-infringer`
**Wave:** 7A (M13 Trust, Safety & Moderation — public policy page)
**Template archetype:** Static policy page
**Primary CAP-IDs:** CAP-339
**Actor:** anonymous
**Reconciliation:** All-agree on public read-only render. ~~One escalation (strikes/users public projection).~~ **E3 CLOSED 2026-08-25 — Reads restricted to policy text + precomputed aggregates; per-user data unreachable.** See RECONCILIATION-7A §4.

---

## 1. Route & Access
- **Path:** `/repeat-infringer`, no params. **Actor:** anonymous (public page). CAP-339 sole owner; render-only (Writes: none). Authenticated users see the same public content; no personalized branch.
- **The page must not expose individual users, strikes, or enforcement cases** — this is a public policy route, not an operator queue.

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| (none — data reads) | — | **E3 CLOSED 2026-08-25:** `strikes`/`users` Reads REMOVED from this public route. The page reads **policy text + aggregate statistics only** — no per-user data may be queried. Aggregate counts (e.g. terminations this period) are precomputed/admin-published, not raw-table projections. |

- Policy engine off-screen: CAP-338 `ri.evaluate` cron — **counter-notice/withdrawal/reversal voids a strike retroactively → reinstate if <3**. (Policy reference for the text; CAP-339 itself no longer reads strike rows.)

## 3. States
**A. Static policy render** — the repeat-infringer policy text (CAP-338 policy: 3 valid copyright strikes / 12 months → TERMINATED; retroactive voiding).
**B. Aggregate-statistics state (E3 CLOSED 2026-08-25):** renders precomputed aggregate counts only — "N repeat infringers actioned this period" (a count, no identities). No per-user strike detail, no user identities, no case specifics. Firewall discipline consistent with CAP-394 (sealed economy keys) and Wave 5A's E-H (genome public-safe allowlist) — per-user moderation data never surfaces on an unauthenticated public route.
**C. Terminated-count state:** folded into B — the RI-termination count IS the aggregate B renders.
**D. Provenance/version:** policy version + provenance metadata (available/missing).

## 4. Actions → API
- **Render** → CAP-339 (R-RI; no query name; Writes: none). No member or operator action on this page. Reads: **none** (policy text + published aggregates only — E3).

## 5. Analytics Events
**None named** (public static render; consistent with other trust pages). Any observational event must not include strike/user records.

## 6. Components Used
- Static content page — **720px reading column (§4.3) + Wordmark-only header (§10.2)** per the Wave-1 legal-pages family (CAP-027 grounding, pattern-extended; flagged) · provenance/version block · footer links · §11.9 Skeleton · §11.8 Error. No app-shell chrome.

## 7. Open Questions
1. ~~**What the `strikes`/`users` Reads project publicly — no allowlist.**~~ **→ CLOSED (E3, 2026-08-25): Reads removed entirely; policy text + precomputed aggregates only. No per-user data reachable from this route.**
2. **Indexability unspecified** — not in CAP-486's noindex list; not in M17's P0 trust list either — ambiguous class. (GLM + GPT.)
3. **Page content source unowned** — same class as Wave-1 E6 legal-content. (GLM.)
