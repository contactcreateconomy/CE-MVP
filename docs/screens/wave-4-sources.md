# Source Console

**Status (2026-09-18 screen audit correction):** LIVE. **Fixed (this pass):** the source-configuration form was missing input fields for `robotsStatus`, `rightsBasis`, and `termsReviewStatus`, all of which the backend already tracked — added.

**Route:** `/admin/sources`
**Status:** NOT STARTED
**Contract:** PRD/02-contracts/wave-4/CONTRACT-4-sources-FINAL.md
**Slice(s):** P4-08

## Layout

From contract §6 Components Used: **§12.4 Admin Console Layout** (dense content) + **§7.4 admin motion** (fade-in only, duration/fast). Inventory Template archetype: "Admin table + form". Contract §3 defines two operations / three modes: sources table (default), register source (blank form), edit source (prefilled form); form container may be a Modal (CAP-031 doesn't prescribe overlay vs inline — OQ11).

```
+------------------+---------------------------------------------------+
| (admin sidebar,  |  DENSE CONTENT (§12.4)                            |
|  §12.4)          |                                                   |
|                  |  MODE 1 — SOURCES TABLE (default)                 |
|                  |  A1 data table, one row per source:               |
|                  |    url | domain | trustLevel pill                 |
|                  |    (approved|conditional|blocked) |              |
|                  |    health display (Never polled / Succeeding /   |
|                  |    Failing — derived from latest                 |
|                  |    ingestionConfigs row) | row actions (Ghost)   |
|                  |  [Register source]                               |
|                  |                                                   |
|                  |  MODE 2 — REGISTER SOURCE (blank form)           |
|                  |  MODE 3 — EDIT SOURCE (prefilled form)           |
|                  |    §11.2 Text Input (url, domain,                |
|                  |      method-specific values: feedUrl /           |
|                  |      youtubeChannelId / newsletterInbox)         |
|                  |    Select (method {rss|youtube_api|newsletter|   |
|                  |      raw_scrape|operator_paste}, trustLevel,     |
|                  |      rights basis, robots status)               |
|                  |    Textarea (optional note/rights explanation    |
|                  |      — no such field named by CAP-031)           |
|                  |    [Save (Primary)] [Cancel (Secondary)]         |
|                  |                                                   |
|                  |  Health display: Status Dot — §11.5 defines      |
|                  |  online/away/offline only (mapping gap flagged)  |
+------------------+---------------------------------------------------+
```

## Components required

- A1 data table → apps/forum/src/components/ui/data-table/index.tsx
- §11.2 Text Input (url, domain, method-specific values) → apps/forum/src/components/ui/input.tsx
- §11.2 Select (method, trustLevel, rights basis, robots status where enumerated) → apps/forum/src/components/ui/select.tsx
- MISSING: Textarea (optional note/rights explanation) — no textarea component exists in the library
- §11.5 pills (trustLevel display) → apps/forum/src/components/ui/badge.tsx
- MISSING: Status Dot (health display) — no such component in the library; the contract itself notes §11.5's Status Dot (online/away/offline) doesn't map 1:1 to ingestion health without an added contract
- §11.7 Modal (form container — overlay vs inline not prescribed, OQ11) → apps/forum/src/components/ui/dialog.tsx
- §11.7 Toast (mutation feedback) → apps/forum/src/components/ui/toast.tsx
- §11.1 Button Primary (save) / Secondary (cancel) / Ghost (row actions) → apps/forum/src/components/ui/button.tsx
- §11.9 Skeleton (table load) → apps/forum/src/components/ui/skeleton.tsx
- MISSING: Spinner (submitting) — no spinner component exists in the library
- MISSING: Source Form / method-dependent field group / source-health row / historical-config component — contract §6 flags none exist in §11

## States required

*(Copied VERBATIM from CONTRACT-4-sources-FINAL §3.)*

*(Substantive states below. GPT's per-branch SSRF enumeration — HTTPS/non-HTTPS/creds/private-IP/nonstandard-port as separate states — is folded into one "SSRF-ingress rejection" state, since R-SSRF is a single ingress gate. See RECONCILIATION-4 §1.)*

**Screen modes (CAP-031 "registers or edits" = two operations, three modes):**
1. **Sources table (default)** — one row per source; health columns sourced from that source's latest `ingestionConfigs` row.
2. **Register source (blank form).**
3. **Edit source (prefilled form).**

**Per-source `trustLevel` display (3, from the enum):** `approved` · `conditional` · `blocked`.

**Per-config method branches (5, from `ingestionConfig.method`; each gates which optional fields the form exposes):**
1. `rss` → `feedUrl`
2. `youtube_api` → `youtubeChannelId`
3. `newsletter` → `newsletterInbox`
4. `raw_scrape` → (no listed optional config field; target is `sources.url`)
5. `operator_paste` → (no fetch config; no feed fields)

**Health display (derived; no invented thresholds):**
- **Never polled** — `lastPolledAt` null, `nextPollAt` set.
- **Succeeding** — `lastSuccessAt` set, `consecutiveFailures = 0`.
- **Failing** — `consecutiveFailures ≥ 1`, counter shown raw (no alarm/escalation threshold defined anywhere — Open Questions).

**Form-submit validation:**
- **SSRF-ingress rejection** — CAP-031 R-SSRF (ingress) + CAP-061's "Validated at registration AND each fetch": HTTPS-only; reject private/reserved/link-local/loopback/cloud-metadata IPs; revalidate IP each redirect hop; cap redirects + size; block creds + nonstandard ports. Exact registration-time error codes not supplied (Open Questions).
- **Rate-limited** — CAP-019 ceiling exceeded → mutation rejected.

**Auth/shell:** authorized-Publisher · unauthorized-operator · Wave-4-minimal-shell vs Wave-7-M15-shell (later enrichment, no behavior change).

*(No canonical empty-state, duplicate-source, or write-failure error schema is specified — Open Questions.)*

## Component library maturity note

- ⚠️ input has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ select has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ badge has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ dialog has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ data-table has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- button, toast are production-proven (no warning).
