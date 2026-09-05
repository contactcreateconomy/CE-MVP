# CONTRACT-6-resource-viewer-FINAL

**Screen:** Resource Viewer — `/resources/[slug]/view`
**Wave:** 6B (M10 Constellation / Free Resource Store)
**Template archetype:** Sandboxed PDF viewer
**Primary CAP-IDs:** CAP-211
**Actors:** anonymous, member
**Register basis:** 561-row register (Wave 6 cleanup, through CAP-561). **E1–E8 CLOSED 2026-08-25.** E-viewer branch structure DEFINED same date (States B); teaser content remains DEC-M10-VIEW-AUTH.
**Reconciliation:** All-agree on the view≠quota defining invariant + delivery security. States: status-enum set adopted (GLM+Opus; GPT's ~35 transient states folded). See RECONCILIATION-6B §2.

---

## 1. Route & Access
- **Path:** `/resources/[slug]/view`, dynamic `[slug]`. **Actors:** anonymous, member → **two explicit branches** (Public-Read-Query rule).
- **Governed by CAP-211**, gated by **`resources.view.enabled` flag + "SEO policy (anonymous vs teaser)"** + **DEC-M10-VIEW-AUTH CONSTRAINED**. The flag is not in CAP-211's Reads column though it lives in systemConfig (Open Question); branch structure defined in States B (E-viewer, Group B 2026-08-25); teaser's exact content = DEC-M10-VIEW-AUTH's call.
- **Delivery:** serve **only the platform-forged clean PDF artifact, never original user reference bytes** (bible: "signed URLs from clean delivery origin only").
- **Viewing does not:** create an acquisition · consume daily/weekly quota · create download ownership (INV-6 / DEC-S15 — the screen's defining invariant).
- Removed/legal-review/withdrawn artifacts must not remain publicly viewable.
- Flag-off render for this route (unreachable vs disabled) is unspecified — Open Question. Do not import `/contribute`'s Wave 6B E3 disabled-render rule here without a founder ruling; E3 applies to `/contribute` only.

## 2. Entities
- **CAP-211** Reads: `resources, resourceVersions, mediaAssets, rawEvents`. Writes: **`rawEvents` (view event ONLY — NOT acquisitions)** (verbatim).
- **Canonical:** `resources` publication/lifecycle status + currentVersionId; `resourceVersions` format=pdf, current status, safety validation, clean media asset, pageCount, sizeBytes, previewAssetId? (purpose unstated — Open Question); `mediaAssets` clean delivery asset.
- **Delivery uses:** short-TTL signed access; sandboxed iframe; CSP; patched pdf.js; delivery origin without app cookies.

## 3. States
*(Status-enum + delivery set below. GPT's ~35 transient states — each version status as a viewer state, each signed-URL sub-step, each network interruption — folded, since the authoritative sets are `resources.status` / `resourceVersions.status` + the delivery-security invariants.)*

**A. View state (core invariant):** viewing records a rawEvents view event and **never creates an acquisition, never burns quota** (INV-6 / DEC-S15). Enumerated separately from any acquire path because they are physically separate (acquire lives on `/resources`).
**B. Actor branches (Group B E-viewer, 2026-08-25 — branch STRUCTURE defined; teaser CONTENT remains DEC-M10-VIEW-AUTH CONSTRAINED to FE+SEO, not invented here):** **member → full view** (complete forged PDF, no interstitial) · **anonymous → teaser branch** (gated by `resources.view.enabled` + SEO policy; renders the platform-controlled preview defined by DEC-M10-VIEW-AUTH — page-count/first-page/watermark specifics are that decision's to make, flagged, not guessed) · download stays member-gated on both branches (INV-6 unchanged: view never acquires, never burns quota, on either branch).
**C. Delivery states:** signed **short-TTL** access to the forged PDF only; sandboxed iframe + CSP; patched pdf.js; **no app cookies on delivery origin**. TTL length unnamed (download's is 60s; view's is not — Open Question).
**D. Format state:** `format=pdf` only (launch consumer; docx intake-only upstream).
**E. Flag-off state:** `resources.view.enabled=false` → gated; route-unreachable vs disabled-render unspecified (Open Question — not covered by E3).
**F. Mid-session removal:** resource → removed/under_legal_review while viewing — human-facing state unstated (M17's 404/410 contract is crawler-side, CAP-467) (Open Question).

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| View PDF in-platform | anonymous, member | CAP-211 `resource.view` (R-VIEW; INV-6) | rawEvents (view event only) | resources.view.enabled; SEO policy (anonymous vs teaser) — branch structure per States B (member=full, anonymous=teaser; content = DEC-M10-VIEW-AUTH) |

- Single-CAP screen — no other registered action. Acquire/download not owned here; any entry point delegates to CAP-212/213 on the library flow.

## 5. Analytics Events
One rawEvents view write per view (CAP-211), same-mutation capture (CAP-436). Downstream (not on-screen): M14 CAP-363 first-value qualification (view ≥20s OR ≥25% progress; short resource ≥10s → `users.firstValueAt`) reads these events (W7). eventType literal unnamed — catalog-owned. **No Signal from views** (view = 0.3-weight outcome event; bare views never mint Signal — CAP-274). The view event must remain distinct from acquisition/download/quota/qualified-download Signal.

## 6. Components Used
- **A5 sandboxed PDF viewer — archetype gap** (inventory §3: delivery is sandboxed iframe + CSP; no viewer-chrome pattern — do not invent) · **§11.9 Skeleton** (signed-URL fetch) · **§11.8 Error** (unsupported/corrupt) · §11.1 Button (close/back; optional "Get free download" CTA → routes to CAP-212). Attribution line if hosted here — mirror of `/resources` OQ-1.
- Viewer toolbar, page controls, signed-session-expiry, and rendering-error patterns are undefined.

## 7. Open Questions
*(Escalated items E1–E8 closed in RECONCILIATION-6B. These remain unspecified detail.)*
1. ~~**Anonymous-vs-teaser branch content contract**~~ **→ PARTIALLY DEFINED (Group B E-viewer, 2026-08-25): branch structure canonical (States B) — member=full view, anonymous=teaser branch, download member-gated both ways. The teaser's exact content (page count? first page? watermark?) remains DEC-M10-VIEW-AUTH *(CONSTRAINED)* — a named FE+SEO decision owned outside this contract; flagged for that process, not invented here. (All three.)**
2. **`resources.view.enabled` gate flag absent from CAP-211's Reads** (lives in systemConfig). (GLM + Opus.)
3. **View signed-URL TTL length ("short-TTL")** unspecified (vs download's explicit 60s). (GLM + GPT.)
4. **`previewAssetId?` purpose** — whether the viewer serves `previewAssetId` or `fileAssetId` is unstated. (GLM + GPT.)
5. **Flag-off render semantics** (route unreachable vs disabled state). (GLM + GPT.)
6. **Mid-view takedown state for humans** — resource removed while open. (All three.)
7. **`[slug]` resolution for resources has no governing CAP** — unlike posts/tools (CAP-474 slug-change + previousSlugs); a renamed/removed-resource slug has no governed viewer behavior. (Opus.)
8. **Viewer-route indexability** unstated (CAP-224's indexability note attaches to library browse). (GLM.)
