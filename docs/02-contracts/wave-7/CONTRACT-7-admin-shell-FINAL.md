# CONTRACT-7-admin-shell-FINAL

**Screen:** Admin Shell + Command Palette — `/admin`
**Wave:** 7B (M15 Admin & Ops Console — the shell that wraps every prior minimal-gated admin screen)
**Template archetype:** Admin shell (STYLE-KIT §12.4)
**Primary CAP-IDs:** CAP-390, CAP-392, CAP-430
**Actor:** any staff role (editor, publisher, moderator, store_operator, support_operator, administrator) — **E2 CLOSED 2026-08-26**
**Register basis:** 564-row register at Wave 7B drafting (rows verified from source); register is now **565** after Wave 7C's CAP-565 — no Wave 7B rows affected by that addition.
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: enum-backed set adopted (GLM+Opus; GPT's ~45 transient states folded). Two escalations touch this screen. See RECONCILIATION-7B §1.

---

## 1. Route & Access
- **Path:** `/admin` (+ nested widget routes), no params. **Actor:** any staff role — **E2 CLOSED 2026-08-26:** CAP-390/392 Actor broadened Administrator → **{editor · publisher · moderator · store_operator · support_operator · administrator}** (canonical `roleAssignments.role` minus `member`, `_data-model.md`; Founder = administrator + founder-only keys, not a separate enum). **`assertAdminPermission` = "is this user ANY staff role" — shell entry only.** Admin URLs noindex (CAP-486).
- **Two-layer model (E2, canonical):** **Shell entry = any staff role (broadest gate). Individual screen/action authority = each screen's own per-CAP actor column (narrow gate), unchanged by the broadening.** Verified: `/admin/config` STOP/kill-switches (CAP-396 Administrator; CAP-397/398 Founder/Admin), `/admin/roles` assignment (CAP-413 Founder-only), `/admin/audit` (CAP-421/422 Administrator), interventions (CAP-408–410 Administrator), CAP-221 kill-switch (Administrator), CAP-557 legal-review (Moderator) — every narrow Actor column stands exactly as before. Widget routes additionally gated by **CAP-392 (R-REGISTRY / R-AUTHZ)**; widgets filtered by `adminWidgets.requiredPermissionKeys[]`.
- **Chrome (CAP-390, verbatim):** env badge · role · search · **command palette** · alert count · operational-mode indicator · Wiki · profile.
- **This shell IS the "full M15 shell" every prior minimal-gate deferred to (verified 5/6 delivered):** it wraps `/admin/rulebook` (W3-E5), `/admin/affiliate-inventory` (W4-E5), `/admin/sources`, `/admin/editorial`, `/admin/personas*`, `/admin/curation`, `/admin/resources`, `/admin/store`. Both named mechanisms (assertAdminPermission + route authz) are exactly what CAP-390/392 deliver. Action-level CAP gates on child screens remain intact.
- **Widget catalog:** source-controlled executable catalog; `adminWidgets` holds **DB metadata only**; hidden/unregistered route → **FEATURE_DISABLED / NOT_FOUND** (never resolve on URL knowledge); `featureFlagKey` resolution fail-closed (M1 `getFlag`).
- **Dense-screen Actor rule (Wave 5A E-E / 6B E6) applies shell-wide:** broadest access ≠ per-action authority; each widget gates per its own CAP. ~~⚠️ **Per-action authority narrower than route authz** (e.g. Administrator-only CAP-221 inside a store_operator-accessible screen) has no expressing capability → ESCALATION E6.~~ **E6 CLOSED 2026-08-26:** the narrow layer IS each action's own per-CAP Actor column (CAP-221 Administrator, CAP-557 Moderator) — expressed by E2's two-layer model; no new capability needed.
- **Mid-session revoke (CAP-430):** Admin role revocation enforced on the **NEXT server request** — no lingering authority.
- **M18 boundary:** "M15 = only STOP chrome" — rollback mechanics are M18 process; only the STOP surface (on /admin/config) lives here.
- **`/admin/personas/genome`** remains intentional back-door — must not become a normal command-palette result.

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `roleAssignments` | read (CAP-390/430) | role ∈ member · editor · publisher · moderator · store_operator · support_operator · administrator |
| `adminWidgets` | read (CAP-390/392) | widgetKey, moduleId, widgetType, title, **routeKey**, **requiredPermissionKeys[]**, featureFlagKey?, status, homeEligible, defaultOrder, wikiSlug?, freshnessThresholdSeconds, **dataSourceKey** (enum → code) |
| `configKeyRegistry` | read (CAP-392) | featureFlagKey resolution |

- CAP-390/392 create no entity (read/gate); CAP-430 performs no request-time write (enforcement follows changed `roleAssignments`).
- ⚠️ **`adminWidgets` registration/seeding has no CAP** — the source-controlled catalog's deploy-sync path is uncovered (analogous to CAP-419 `wiki.deploySync`) → Open Question.

## 3. States
*(Enum-backed set. GPT's ~45 transient states — each role active/inactive, each route sub-state — folded, since the role enum + route-resolution outcomes + revoke enforcement are authoritative.)*

**A. Staff session** — any staff role (E2): full chrome + widget catalog **filtered by `requiredPermissionKeys[]`** — a support_operator sees only support widgets; an Editor sees only editorial ones. Chrome renders the actor's own role badge.
**B. ~~Non-administrator staff session — UNOWNED (E2):~~** **E2 CLOSED 2026-08-26:** CAP-390 admits any staff role; CAP-392 admits per-widget by permission keys; narrow per-action authority stays on each screen's own rows.
**C. Widget-route states (CAP-392):** registered+permitted → render · hidden/unregistered → **FEATURE_DISABLED/NOT_FOUND** · flag false → fail-closed · metadata-present-but-executable-absent (fallback, no invented route).
**D. Mid-session revoke (CAP-430):** enforced on NEXT server request.
**E. Operational-mode chrome:** normal / degraded / STOP-active — ⚠️ no binding row to the stop flag/incident state → Open Question.
**F. Command palette:** closed / open / authorized-results / no-match / unauthorized-excluded / back-door-genome-excluded.

## 4. Actions → API
- **Open shell** → CAP-390 (R-SHELL). **Open widget route** → CAP-392 (R-REGISTRY/R-AUTHZ). **Role-revoke takes effect** (System) → CAP-430 (next-request).
- No mutation on the shell rows — role *writes* are owned by CAP-413 (/admin/roles) and CAP-007/009 (Founder CLI, no UI). Command palette + search = navigation; no mutation named.

## 5. Analytics Events
**None identified.** Shell/widget-route rows write no rawEvents; admin surfaces are outside the M16 product-event stream. Accountability = auditLog on child-screen actions. Role-revocation truth lives in `roleAssignments` + `auditLog`, not client telemetry.

## 6. Components Used
- §12.4 admin layout · §11.4 nav / §12.1 Top Header · §11.5 pills/badges (env, role, alert count) · §11.9 skeleton / error boundary · **A11 Command palette — ARCHETYPE GAP** (inventory §3; CAP-390 explicitly lists one; §11 defines none).

## 7. Open Questions
*(Escalated items in RECONCILIATION-7B. These are unspecified detail.)*
1. ~~**Does `assertAdminPermission` admit every staff role with relevant permission keys, or only the literal Administrator role?**~~ **→ CLOSED (E2, 2026-08-26): any staff role; shell entry only; two-layer model stated on CAP-390.**
2. ~~**Per-action authority narrower than route authz**~~ **→ CLOSED (E6, 2026-08-26): the narrow layer is each action's own per-CAP Actor column (CAP-221/557 pattern) — expressed by E2's model, no new capability.**
3. **`adminWidgets` catalog seeding/deploy-sync** — no CAP populates it. (Opus.)
4. **Command-palette query surface** — `adminWidgets` is the only named read; scope, keyboard behavior, destructive-action exclusions, audit model unspecified. (GLM + GPT.)
5. **Operational-mode indicator ↔ stop flag/incident binding** — no row. (GLM.)
6. **Per-route permission-key mapping** for every prior-wave route not enumerated. (GPT.)
