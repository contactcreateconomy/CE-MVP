# CONTRACT-1-legal-pages-FINAL

**Screen:** Legal Pages — `/privacy` · `/dmca` · `/terms`
**Wave:** 1 (M1 Foundation)
**Template archetype:** Static legal (no ConsentProvider)
**Primary CAP-IDs:** CAP-027 (+ CAP-028 degraded-mode dependency)
**Actor:** anonymous
**Reconciliation:** Route/Access, States, Analytics, Components locked (all three aligned, incl. the `/terms` coverage flag). Actions framing was a 2-1 with Opus on the "None" side → resolved on register evidence (CAP-027 static, no mutation/query). See RECONCILIATION-1 §5.

---

## 1. Route & Access
- **Paths:** `/privacy`, `/dmca`, `/terms`, grouped as one Legal Pages template (inventory row). **Dynamic params:** none. **Actor:** anonymous. **Gated by:** none. **Redirects:** none.
- **Structural rule:** renders in a **legal layout WITHOUT ConsentProvider** (CAP-027, FATAL-M1C-03) — legal sits outside the consent scope and must remain reachable when the CMP has crashed ("legal still up," CAP-028).
- **Publication states:** published static content when available; otherwise render `unavailable_pending_legal` and apply **noindex** until M18 publication (CAP-027).
- **Route-coverage discrepancy (all three panels flag):** CAP-027's trigger names only "`/privacy` or `/dmca`." `/terms` appears in the reconciled inventory but is **not** explicitly named in CAP-027's trigger. → ESCALATION E5.

## 2. Entities
- **CAP-027:** Reads **none** · Writes **none**.
- **CAP-028** (relevant degraded-mode dependency): Reads **none** · Writes **none**.

## 3. States
1. **Published static content** — post-M18-publish render (per route: `/privacy`, `/dmca`; `/terms` via the shared template, its CAP-027 trigger coverage not explicit).
2. **`unavailable_pending_legal` + noindex** — pre-publish placeholder, served with noindex until M18 publish (CAP-027).
3. **Static fallback (P1)** — CAP-027 mandates a static fallback so the page can't hard-fail; the trigger, content source, and precedence vs. `unavailable_pending_legal` are **undefined** (Open Questions).
4. **CMP-crashed / degrade** — the legal page remains available while application analytics is denied (CAP-028).

*Not per-route missing-content behavior beyond `unavailable_pending_legal`; no async loading state (content is static).*

## 4. Actions → API
**None — static legal pages; no user actions, mutations, or queries** (CAP-027, Reads none / Writes none). *[Evidence-resolved: GPT listed navigation/render behaviors as "actions," but none carry a mutation/query name; GLM+Opus said "None." Register confirms static render → majority verdict "None," GPT's render behaviors kept as non-normative context only.]*
- *Clarification (register-grounded):* the `/dmca` legal **page** here is distinct from the DMCA **notice-submission form**, which is `/legal/intake` (CAP-217 / CAP-343, Wave 7). Do not conflate the two.

## 5. Analytics Events
**None identified.** These routes render outside the ConsentProvider and carry no instrumented action; CAP-028 denies analytics when the CMP crashes. No legal-page-view event is specified in Wave-1. A generic client observational event (CAP-444) would require an active catalog entry, an allowed client capture mode, and the applicable consent gate — none is named here.

## 6. Components Used
- **Static legal template** — **Reading column 720px max** (STYLE-KIT §4.3), §3.2 type scale under §3.3 rules (sequential heading hierarchy; body line-length ≤720px). *[Grounded specifics contributed by GLM; §4.3 + §3 confirm.]*
- **Wordmark only** — §10.2 (usage list: "Legal footers, very small spaces").
- **Archetype gaps (flagged, not invented — all panels agree):** §11 has **no** static legal-document / long-form prose component (it provides buttons, inputs, cards, nav, badges, avatar, overlays, skeletons only), and **no** empty-state/placeholder component for the `unavailable_pending_legal` state (§11.9 covers loading skeletons only). Legal-page navigation pattern and legal footer are likewise undefined.
- Button Ghost (§11.1) is available for any backed navigation action; CAP-027 specifies none.

## 7. Open Questions
1. **`/terms` has no register trigger** — CAP-027 names `/privacy` and `/dmca` only. Confirm `/terms` inherits CAP-027's contract or amend the register. → ESCALATION E5.
2. **Legal content source & publish trigger** — CAP-027 does not identify the source (DB vs. static files), storage location, publication flag, version metadata, retrieval mechanism, or what "M18 publish" concretely gates on (no `systemConfig` key in any of the four files). → ESCALATION E6.
3. **Static fallback vs. `unavailable_pending_legal`** — the relationship/precedence between the P1 static fallback and the pending-legal state is undefined.
4. **Indexability of published legal pages** — CAP-027 specifies only that *pending-legal* pages are noindex; whether *published* legal pages are indexable is unspecified.
5. **HTTP status** for `unavailable_pending_legal` is not specified.
6. **Component contracts** for static legal content, a pending-legal notice, legal-page navigation, and the legal footer are undefined.
7. **Shell inheritance** — which shell (full app chrome vs. standalone) legal pages inherit, beyond being outside ConsentProvider, is unspecified (cross-listed with CONTRACT-1-app-shell Q6).
8. **Acceptance-record link** — no CAP links these display pages to the acceptance record / version tracking (which live in M7: `users.rulesAcceptedVersion` / CAP-142); whether `/terms` must surface the currently-accepted `policyVersion` is unspecified.
9. **Consent treatment** for an optional legal-page-view event is undefined.
