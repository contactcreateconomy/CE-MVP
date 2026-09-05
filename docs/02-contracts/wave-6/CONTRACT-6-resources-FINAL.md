# CONTRACT-6-resources-FINAL

**Screen:** Resource Library — `/resources`
**Wave:** 6B (M10 Constellation / Free Resource Store)
**Template archetype:** Grid + acquire + quota counts
**Primary CAP-IDs:** CAP-224, CAP-212, CAP-213, CAP-215, CAP-229
**Actors:** anonymous, member
**Register basis:** 559-row register (Wave 6B closeout, through CAP-559). **E1–E8 CLOSED 2026-08-25.** E5 (CAP-213 rawEvents) remains an Open Question — not in this round.
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: status-enum set adopted (GLM+Opus; Opus in majority → GPT's transient states folded). Quota-basis locked to DEC-S19 user-local (E2). See RECONCILIATION-6B §1.

---

## 1. Route & Access
- **Path:** `/resources`, no params. **Actors:** anonymous, member → **two explicit branches** (Public-Read-Query rule).
- **Registered branch deltas:** browse is anonymous+member (CAP-224); **acquire/download are member-only** (CAP-212/213, gated "M7 verified"); quota counts render from the member's ledger (CAP-215 UI "inline remaining counts"); attribution view is member-actor (CAP-229). Anonymous-safe vs full-member card field lists beyond these are unspecified (Open Question).
- **Screen gate:** `resources.library.enabled` flag (CAP-224). No admin toggle CAP surfaces this flag's operator control (unlike `constellation.ugc.enabled` / CAP-221) — Open Question.
- **Acquisition gate (CAP-212):** verified member + published resource + current version + quota available (CAP-215).
- **Download gate (CAP-213):** existing acquisition + published/current version.
- **Quota model:** first acquisition consumes quota; **viewing does not**; **re-download does not**; an interrupted download does not reverse consumed quota. Limits **5/day · 20/week**.
- **Quota period basis:** **user-local calendar, per DEC-S19 (CONFIRMED)**. No UTC-default hedge. Windows = IANA timezone; ISO week Mon 00:00; UTC fallback; lazy reset on acquire (CAP-376/377).
- **Indexability:** published resources may be indexable; draft/removed/legal_hold excluded (CAP-224). Provenance pairing for indexable pages remains CAP-468 (Wave 7), same as other content surfaces.
- **Downstream (not on this screen):** CAP-216 `signal.settleDownload` (cron); M14 CAP-364 first-acquire → `users.activatedAt` (W7); CAP-462 stamps `catalogSizeAtTime`/`resourceAgeDays` on the acquire event.

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `resources` | read | title, slug, categoryIds[], license, **status {draft·review·scheduled·published·paused·under_legal_review·removed·archived}**, forgeDisclosure, attributionLine, releaseBatch?/releaseDate?, currentVersionId? |
| `resourceVersions` | read | versionNo, status {generating·validation_failed·editorial_review·approved·current·superseded·withdrawn·removed}, isCurrent, format=pdf, pageCount?, sizeBytes, previewAssetId? |
| `resourceTags` · `categories` | read | filter/facets (CAP-224) |
| `systemConfig` | read | `resources.library.enabled`; quota keys `quota.perDay`/`quota.perWeek` (5/20) |
| `users` | read | CAP-212 eligibility (M7 verified); CAP-229 attribution handle |
| `acquisitions` | read + write (CAP-212) | userId, resourceId, acquiredAt, quotaDayKey, quotaWeekKey — **Unique (userId, resourceId)**; quota unit only; **no type=view ever** |
| `resourceQuotaLedgers` | read + write (CAP-212) | dayKey, weekKey, acquisitionsUsedDay/Week — atomic increment in acquire txn |
| `downloads` | write (CAP-213) | acquisitionId, userId, resourceId, resourceVersionId, downloadedAt, integrityClass — **does not consume quota** |
| `mediaAssets` | read (CAP-213) | signed-URL source (clean bucket only) |
| `resourceContributions` | read (CAP-229) | attribution graph |
| `rawEvents` | write | CAP-224 (browse), CAP-212 (acquire). CAP-213's Writes omit rawEvents despite download being a product event → Open Question (E5; not closed this round) |

## 3. States
*(Status-enum set below. GPT's ~60 transient micro-states — each quota-period-change, each concurrent-collapse, each signed-URL sub-step — folded, since `resources.status` (8) + acquire/download/quota lifecycle are the authoritative sets. Per RECONCILIATION-6B §1.)*

**A. Library listing/visibility (CAP-224):** register states indexability — "Indexable after publish; noindex removed/legal_hold/draft." Which of the 8 `resources.status` values are *browsable* (vs merely indexable) is not stated (Open Question). Version gating: published ∧ exactly one `isCurrent` version.
**B. Quota states (CAP-212 + CAP-215):** within-quota (inline remaining counts) → exhausted → **blocked, no write** (CAP-215 gate; server-side, never trust client). 5/day · 20/week; user-local calendar keys; lazy reset on acquire.
**C. Acquisition idempotency:** concurrent double-get → **one row** (unique key); re-acquire of an owned resource blocked by uniqueness, not quota.
**D. Download states (CAP-213):** acquired → signed URL **TTL=60s** → download recorded with integrityClass; **abort mid-download does NOT reverse quota**; re-download ≠ quota (free, unbounded); each download schedules `signal.settleDownload` (CAP-216 cron consumes).
**E. Attribution states (CAP-229):** attribution line present — verbatim: **"Created by Createconomy · Built with references contributed by [handle]"**; post-erasure: `resourceContributions.contributorUserId` nulled (CAP-227) → line degrades; weight retained.
**F. Invariants:** **View ≠ acquisition; views never burn quota** (DEC-S15 / INV-6); acquisitions (ownership) ≠ downloads (fetch); license = terms pointer (DEC-S20 OPEN).
**G. Actor branches:** anonymous = browse + rawEvents browse only; member = browse + acquire + download + quota counts + attribution.

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Browse library | anonymous, member | CAP-224 (§10 Customer FE; no mutation named) | rawEvents (browse) | resources.library.enabled |
| Acquire ("Get free download") | member | CAP-212 `resource.acquire` (R-ACQUIRE; DEC-S15/S19) | acquisitions (idempotent unique), resourceQuotaLedgers (atomic day/week), rawEvents | M7 verified; CAP-215 quota; published/current |
| Download acquired resource | member | CAP-213 `resource.download` (R-DOWNLOAD; INV-6) | downloads (integrityClass); schedules signal.settleDownload (NO ledger write; no rawEvents — E5 Open Question) | CAP-212 (acquisition exists); published/current |
| Quota check (gate) | System | CAP-215 `quota.check` | none (block if exhausted) | server-side only |
| View attribution | member | CAP-229 (read; no mutation named) | none | none |

## 5. Analytics Events
rawEvents writes: **CAP-224 (browse)** and **CAP-212 (acquire)** — same-mutation capture (CAP-436); catalog gate CAP-437; CAP-462 stamps `catalogSizeAtTime`+`resourceAgeDays` on acquire. CAP-213 (download) omits rawEvents despite download being a product event and `resource_acquisition` being a rawEvents outcomeType — **E5 Open Question (not closed this round)**. `activityLedger` v1 eventType **`resource_acquired`** (Journal) has **no owning M10 write row** → Open Question. No eventType literals named — catalog-owned; none invented.

## 6. Components Used
- Grid archetype · **§11.3 card family** (resource cards; Stats Card for quota counts) · **§11.5 Pill/Tag** (category/tag facets) · **§11.1 Button** (Get free download; Secondary for re-download) · **§11.9 Skeleton** · Toast §11.7 (available-not-prescribed) · §11.8 Error (exhausted/blocked inline) · PDF deep-links to viewer.
- **Archetype gaps:** no dedicated Resource Card, quota-counter, acquisition-state control, attribution panel, or version-aware download component in §11.

## 7. Open Questions
*(Escalated items E1–E8 closed in RECONCILIATION-6B. These remain unspecified detail.)*
1. **CAP-229's host surface** — trigger says "resource page attribution line," but the inventory has **no `/resources/[slug]` detail route** (only library + `/view`). Library-card detail vs viewer page ambiguous. (GLM.)
2. **Browsability filter** — which `resources.status` values list (published only? paused?). Register note covers SEO indexability, not listing eligibility. (All three.)
3. **`resources.library.enabled` has no admin toggle CAP** (unlike CAP-221 for the UGC flag). (Opus.)
4. **`resources.library.enabled` vs `resources.view.enabled` interaction** — behavior when library on but view off (browsable but unviewable) unspecified. (Opus.)
5. **Journal write for `resource_acquired` unowned** (activityLedger). (GLM.)
6. **Exhausted-quota feedback** — M14's `quota_exhausted` notification (CAP-378) is W7; interim blocked-state UX unspecified. (GLM.)
7. **Anonymous-safe card projection list** — unspecified beyond capability-level deltas. (All three.)
8. **Pagination mechanism** for the library — unspecified. (GLM + GPT.)
9. **Acquired-but-later-removed resource downloadability** — CAP-213 requires published/current; behavior for an owned-then-removed resource incompletely defined. (GPT.)
10. **CAP-213 rawEvents omission (E5)** — download is a product event; Writes omit rawEvents. Not closed this round.
