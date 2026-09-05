# CONTRACT-4-sources-FINAL

**Screen:** Source Console — `/admin/sources`
**Wave:** 4 (M2 Content Engine — backend; operator UI)
**Template archetype:** Admin table + form
**Primary CAP-IDs:** CAP-031, CAP-538
**Actor:** Publisher (CAP-031 Actor column; Notes read "Publisher/Admin")
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. CAP-019 rate limit adopted (GPT+GLM majority; Opus under-included). States: GPT's ~40 sub-states folded to the compact GLM+Opus set on register evidence. E2 closed (founder 2026-08-24 — minimal block/unblock now, CAP-059 at Wave 7). **E1 closed (founder 2026-08-24 — CAP-538 is the table-load read).** See RECONCILIATION-4 §1.

---

## 1. Route & Access
- **Path:** `/admin/sources`. **Dynamic params:** none. **Actor:** Publisher. CAP-031's trigger reads "Publisher/Admin registers or edits a source"; **Administrator inclusion comes from the trigger text only — the Actor column is Publisher.** Operator-only surface; no anonymous/member access.
- **Governing capability:** CAP-031 (§9 / §11 Source console / R-SSRF ingress). **CAP-031 `Gated by: none`** at row level — no eligibility gates beyond role + rate limit.
- **Auth sequencing:** minimal basic role-check gate at Wave 4; the full M15 `/admin` shell (CAP-390 `assertAdminPermission` + CAP-392 route authz) wraps at Wave 7 — the **known Wave-3 E5 pattern**, stated, not re-flagged as a new gap.
- **Systemic limit:** CAP-019 (`admin.write`: **60 / 1m per operator; staff NOT rate-exempt**) applies to every mutation on this screen.
- **Unauthorized operator:** source operations are rejected without Publisher/Admin authority; the register does not provide the response code or redirect destination (Open Questions).
- **Takedown sequencing (E2 RESOLVED, founder 2026-08-24):** `/admin/sources` ships a **minimal block/unblock toggle now** — CAP-031 writes `sources.trustLevel` including `blocked` as a simple admin action. The full escalation-to-legal-takedown workflow (CAP-059, with `takedownReason`/`takedownAt`) wires in at Wave 7 when `/legal/intake` exists — the **known Wave-3 E5 minimal-now/full-later pattern**, stated, not an open question. CAP-058/059/060 remain out of scope on this screen.
- **Redirect rules:** none specified; create/edit both occur within `/admin/sources` (no candidate-detail route).

## 2. Entities
- **CAP-538:** Reads `sources` · Writes **none**. This is the table-load query for the Source Console list. **E1 RESOLVED 2026-08-24.**
- **CAP-031:** Reads **none** (register Reads column = none) · Writes `sources`, `ingestionConfigs`, `auditLog`. CAP-031 remains the register/edit mutation; it does not own the list read.
- **Canonical fields (`_data-model.md`):**
  - `sources` = `url, domain, trustLevel {approved|blocked|conditional}, takedownReason?, takedownAt?, createdAt`. **`takedownReason?`/`takedownAt?` exist on the entity but are CAP-059's write path (Wave 7) — not this screen.**
  - `ingestionConfigs` = `sourceId, method {rss|youtube_api|newsletter|raw_scrape|operator_paste}, feedUrl?, youtubeChannelId?, newsletterInbox?, pollIntervalMinutes, nextPollAt?, lastPolledAt?, lastSuccessAt?, consecutiveFailures, robotsStatus, rightsBasis, termsReviewStatus, maxRequestsPerDay, createdAt`.
  - `auditLog` = one row per register/edit (CAP-031 requires the operation to be audited).
- **Source-to-config relationship:** a `sources` row may have **>1 `ingestionConfigs` record over time**; ingestion scheduling/method live on `ingestionConfigs`, not `sources`.
- **Read contract:** **CAP-538** is the specified list action. The table loads `sources` via CAP-538; health columns still derive from each source's latest `ingestionConfigs` row (join is display-side; CAP-538's Reads column is `sources` only). CAP-031's Reads=none is unchanged — it is the write path, not the table query.
- **Explicitly NOT read here:** `sourceItems`, `contentExtractions` — outputs of the ingestion crons (CAP-032 `pollRss`, CAP-033 `pollYouTube`, CAP-034 `rawFetch`, CAP-035 `ingest.inboundEmail`; all cron/webhook/System, Has-UI=NO). This screen **configures**; it does not monitor item flow.
- **Audit invariant:** CAP-031 writes `auditLog`; a privileged write must fail closed if its audit record cannot persist (CAP-426 pattern). CAP-538 writes nothing.

## 3. States
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

## 4. Actions → API
1. **List sources** — Publisher/Admin. **CAP-538** (query). Reads `sources`. Writes none. Gated by: none. This is the specified table-load action; without it the console has nothing to render. **E1 RESOLVED.**
2. **Register source** — Publisher (Admin per trigger). **Mutation unnamed in the register** (§9 / §11 "Source console"). CAP-031. Writes `sources`, `ingestionConfigs`, `auditLog`. Dupe/prefill may read via CAP-538. Gate: R-SSRF ingress at submit; CAP-019.
3. **Edit source** — same unnamed CAP-031 mutation path. Writes `sources` and/or `ingestionConfigs`, `auditLog`. Append-vs-update semantics for the ">1 config over time" case are unspecified (Open Questions).
4. **Select ingestion method / set cadence / rights basis / robots status** — local form values persisted as part of the CAP-031 write; no separate mutation names.

**Explicitly NOT actions on this screen (no register row → cut per inventory derivation rule 1):**
- **Manual poll / "test this source now"** — polls are cron-only (CAP-032/033/034); no trigger capability exists.
- **Source deletion** — no capability anywhere in the register.
- **Legal takedown intake/action/cascade** — CAP-058/059/060 are Wave 7 `/legal/intake`; out of scope here. Operational block/unblock (CAP-031 `trustLevel`) **is** in scope — E2 resolved.

## 5. Analytics Events
**None identified.** No `eventCatalog` row (CAP-436–463) covers source registration/editing, and CAP-031 writes `auditLog`, not `rawEvents`. The accountability record here is **`auditLog`** (written on every mutation), not an M16 event — CAP-436's same-mutation capture rule does not attach. Whether these operator writes should additionally emit cataloged `rawEvents` (stamped `isStaff=true` per CAP-438; excluded from product counters per CAP-434/446) is unspecified (Open Questions).

## 6. Components Used
- **§12.4 Admin Console Layout** (dense content) + **§7.4 admin motion** (fade-in only, duration/fast).
- **§11.2** Text Input (url, domain, method-specific values) · Select (method, trustLevel, rights basis, robots status where enumerated) · Textarea (optional note/rights explanation — no such field named by CAP-031).
- **§11.5** Pill mechanism (trustLevel display) · Status Dot (health display — note: §11.5 Status Dot defines online/away/offline, which don't map 1:1 to ingestion health without an added contract).
- **§11.7** Modal (form container — CAP-031 doesn't prescribe overlay vs inline) · Toast (mutation feedback — placement not prescribed).
- **§11.1** Button Primary (save) · Secondary (cancel) · Ghost (row actions). *Button-Destructive exists but CAP-031 authorizes no deletion/takedown here.*
- **§11.9** Skeleton (table load) · Spinner (submitting).
- **Archetype gaps — flag, not invent (all three panels):**
  - **A1 Data table** — Source Console is a named consumer (inventory §3); §11 defines **no table component.**
  - **No named Source Form / method-dependent field group / source-health row / historical-config component** in §11.

## 7. Open Questions
*(Blocking / register-silent items are escalated in RECONCILIATION-4. These are unspecified detail.)*
1. **Mutation name unspecified** — CAP-031 names no mutation (contrast `tools.create`, `candidate.approve`); the register supplies only the console reference.
2. **Config edit semantics** — changing method/cadence: append a new `ingestionConfigs` row (the ">1 config over time" note implies history) or update in place? (GLM + Opus.)
3. **Manual poll / test-source** — no capability exists; confirm the cut is intended. (GLM + Opus.)
4. **Source deletion** — no capability exists; confirm sources are never deleted, only blocked. (GLM.)
5. **`robotsStatus` value set** — undefined in `_data-model.md`.
6. **`rightsBasis` / `termsReviewStatus` values** — undefined for M2 ingestion. **Do not conflate** with M10's `resourceReferences.rightsBasis {own|authorized|compatible_licence|public_domain}` — different entity, different module. (GLM.)
7. **Failing-source alarm threshold** — `consecutiveFailures` shown raw; no M2 analog of M13's R-AGING escalation exists.
8. **Duplicate source URL/domain handling** — not specified.
9. **Polling-cadence + per-source request-budget bounds/defaults** — not specified.
10. **Unauthorized-access response** (redirect / 403 / shell error) — not specified.
11. **Inline form vs Modal/Bottom Sheet, inline vs Toast feedback** — not prescribed by CAP-031.
12. **Analytics cataloging** — should console writes be cataloged `rawEvents` (isStaff-stamped) or remain `auditLog`-only?
