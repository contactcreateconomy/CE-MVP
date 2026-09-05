# CONTRACT-7-admin-wiki-FINAL

**Screen:** Admin Wiki — `/admin/wiki`
**Wave:** 7B (M15 Admin & Ops Console)
**Template archetype:** Sanitized-Markdown reader (deploy-synced)
**Primary CAP-IDs:** CAP-418, CAP-419, CAP-420
**Actor:** all staff — **E1 CLOSED 2026-08-26** (CAP-418 register row corrected: Actor "anonymous, member" → staff-role set; Gated-by none → CAP-390 shell entry)
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: enum-backed set adopted (GLM+Opus; GPT's ~20 folded). One escalation (actor/gate drift). See RECONCILIATION-7B §6.

---

## 1. Route & Access
- **Path:** `/admin/wiki`, no params. **Inventory Actor:** all staff (via M15 shell). CAP-418 (read) · CAP-419 (deploy sync, System) · CAP-420 (missing-article route).
- **E1 CLOSED 2026-08-26:** CAP-418 register row corrected — Actor "anonymous, member" → **staff-role set {editor · publisher · moderator · store_operator · support_operator · administrator}**; Gated-by "none" → **CAP-390 (any staff-role shell entry)**. Resolves E1 — internal runbooks (`constraintsSummary`, widget runbooks) were publicly readable with zero gate. Sanitization still blocks script injection; disclosure now gated by staff identity, consistent with E2's model.

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `adminWikiArticles` | read (418/420) + write (System, 419) | slug, title, domain, **bodyMarkdown (sanitized)**, relatedWidgetKeys[], constraintsSummary, version, updatedAt, updatedBy |
| `adminWidgets` | read | links widgets to `wikiSlug` |

## 3. States
*(Enum-backed set. GPT's ~20 transient states folded — the render/missing/sync branches are authoritative.)*

**A. Article render (CAP-418 `wiki.get`):** source-controlled **sanitized Markdown; never executable HTML/JS**.
**B. Missing article (CAP-420, gated CAP-418):** explicit **"no article yet"**, not a broken panel (AC-19).
**C. Deploy sync (CAP-419 `wiki.deploySync`, System):** repo → table; **Founder cannot inject scripts**; soft-beta ships **P0 widget articles** (linked via `adminWidgets.wikiSlug`).
**D. Versioning:** version + updatedAt per article — **deploy-synced only; no in-app editor CAP exists.**

## 4. Actions → API
- **Read article** → CAP-418 `wiki.get`. **Deploy sync** → CAP-419 `wiki.deploySync` (System, deploy-time). **Open missing article** → CAP-420 (read-only explicit empty state).
- No on-screen mutation; no browser editor / article-write path exists in the register.

## 5. Analytics Events
**None named.** Deploy sync is deployment state, not analytics. Wiki reads have no exact registered event.

## 6. Components Used
- **Sanitized-Markdown reader — no §11 archetype** (nearest = static reading column §4.3; flag) · article navigation · missing-article empty state · version/source metadata · §11.9 Skeleton / error · shell search.

## 7. Open Questions
1. ~~**CAP-418 actor="anonymous, member" / Gated-by "none" drift**~~ **→ CLOSED (E1, 2026-08-26): staff-role Actor + CAP-390 shell-entry gate; no public-wiki ruling needed.**
2. **Markdown-reader archetype undefined** in §11. (GLM + Opus.)
3. **Article authoring workflow is repo-only** — confirm no admin write path is intended (none exists in register). (GLM + GPT.)
4. **Repository deletion / article archival / stale-projection cleanup** — unspecified. (GPT.)
5. **Sanitization policy + supported Markdown extensions** — unspecified. (GPT.)
