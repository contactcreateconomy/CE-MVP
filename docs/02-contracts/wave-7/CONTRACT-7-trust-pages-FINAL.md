# CONTRACT-7-trust-pages-FINAL

**Screen:** Trust & Policy Pages — `/how-we-review` · `/editorial-policy` · `/ai-disclosure` · `/about` · `/help` · `/how-we-use-your-store-data`
**Wave:** 7A (M17 Growth/SEO trust pages + M11 CAP-262 data-honesty)
**Template archetype:** Static content + provenance (one shared template, six routes)
**Primary CAP-IDs:** CAP-262, CAP-468, CAP-469, **CAP-562, CAP-563**
**Actor:** anonymous
**Reconciliation:** All-agree these six share one template, not six contracts. ~~One escalation (/about + /help have no CAP).~~ **E4 CLOSED 2026-08-25 — CAP-562/563 added, mirroring CAP-027's pattern.** See RECONCILIATION-7A §5.

---

## 1. Route & Access
- Six anonymous public routes sharing one **Static Content + Provenance** template — **not six independent contracts** (all three panels agree). Public; no App-Shell member-only behavior.
- **`/how-we-review · /editorial-policy · /ai-disclosure`** are the provenance-block footer targets required by **CAP-468 (FATAL-M17-01)**; **`/ai-disclosure`** is **CAP-469's (FATAL-M17-02)** editorial-responsibility page. **`/how-we-use-your-store-data`** is **CAP-262's** data-honesty page.
- **`/about` + `/help`** ~~are in the inventory template with **zero backing capability** → **ESCALATION E4**~~ → **E4 CLOSED 2026-08-25:** backed by **CAP-562** (`/about`) and **CAP-563** (`/help`) — exact CAP-027 pattern (static render, no API, Reads/Writes none, legal-layout family, no-ConsentProvider). Content-source/publish-trigger remain Open Questions (OQ#1 partially narrowed), same residual as Wave-1's /terms E5 class.

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `systemConfig` | read (CAP-262) | data-honesty content pointer |
| `storeRequests` | write (CAP-262) | acceptance recorded on the **/sell/apply flow step** — `dataUseVersion`; the page itself is read-only content |
| `posts` · `tools` · `resources` | read (CAP-468) | provenance render context — provenance fields live on indexable content pages, not here |
| `personas` · `posts` | read (CAP-469) | AI-disclosure render context |

- No live-content entity is created by these pages.

## 3. States
**A. `/how-we-review`:** methodology content backing CAP-468's provenance block (byline · Reviewed by · dates · sources · methodology links).
**B. `/editorial-policy`:** editorial standards (footer destination of CAP-468).
**C. `/ai-disclosure` (CAP-469, FATAL-M17-02):** states the **editorial responsibility holder**; documents visible + machine-readable persona AI labels; **Legal Art. 50 confirm recorded pre-beta** (jurisdiction · surfaces · rationale · reviewer · policy version) — process gate, listed not designed.
**D. `/about` · `/help`:** P0 list members — **E4 CLOSED: owned by CAP-562/563** (CAP-027-pattern static render; content source + publish trigger remain OQ, Wave-1 E5/E6 class).
**E. `/how-we-use-your-store-data` (CAP-262):** public content state + **accepted-as-part-of-application** state (the write lives on /sell/apply; **aggregate-only disclosed** — Traffic/Intent/Confirmed explained; no buyer identity, no exact times, no arbitrary multi-dim filtering; gated by CAP-231).
**F. Provenance/version:** current version available / missing.

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Render provenance page | System | CAP-468 (R-PROVENANCE; render) | none | on indexable host pages |
| Render AI-disclosure | System | CAP-469 (R-AI-DISCLOSURE; render) | none | on persona/AI-assisted host pages |
| Accept data-honesty page | member (seller) | CAP-262 (unnamed) | storeRequests | CAP-231 — **executed on /sell/apply; this surface hosts the content** |
| Render /about | anonymous | **CAP-562 (static render, no API — CAP-027 pattern)** | none | none |
| Render /help | anonymous | **CAP-563 (static render, no API — CAP-027 pattern)** | none | none |

- No content-edit action exists on these public routes.

## 5. Analytics Events
**None named** on CAP-262/468/469 (static content). Policy/version viewed during seller application is recorded through the application/consent evidence (`storeRequests`), not page analytics. Provenance rendering must not generate Signal or Recognition.

## 6. Components Used
- Static content + provenance-footer links (§11.5 Pill/label for AI-disclosure machine-readable marker) · **720px reading column** · Wordmark-only header (pattern-class, flagged) · §11.9 Skeleton · §11.8 Error.
- **Archetype gap:** no formally defined provenance block, machine-readable disclosure companion, or seller-data-honesty component in §11.

## 7. Open Questions
1. ~~**`/about` + `/help` content ownership** — no CAP at all~~ **→ CLOSED (E4, 2026-08-25): CAP-562/563 added (CAP-027 pattern — static render, no API). Residual: content-source/publish-trigger still undefined — same Wave-1 E5/E6 class as OQ#2; owner = founder/PM content process, not a register gap.**
2. **Provenance-page content source undefined** — CAP-468 requires the footer links resolve to real pages, but no CAP (nor a `wiki.deploySync` CAP-419 analog for customer legal pages) defines where `/how-we-review` / `/editorial-policy` content comes from (mirrors Wave-1 legal-content-source E6). (Opus.)
3. **CAP-262 acceptance mutation unnamed.** (GLM.)
4. **CAP-468/469 define host-page requirements but not the complete body contract** for each trust route. (GPT.)
5. **Reading-column/Wordmark pattern extension** from legal pages to trust pages is pattern-inference, not a register citation. (GLM.)
6. **Policy archive / previous-version access** — unspecified. (GPT.)
