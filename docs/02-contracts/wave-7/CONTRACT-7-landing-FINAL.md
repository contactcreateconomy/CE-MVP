# CONTRACT-7-landing-FINAL

**Screen:** Landing Page — `/` (anonymous)
**Wave:** 7A (M17 Growth, SEO & Distribution)
**Template archetype:** Landing layout (STYLE-KIT §12.3 — NOT the app-shell §12.1)
**Primary CAP-IDs:** CAP-464, CAP-465, CAP-478
**Actor:** anonymous
**Reconciliation:** All-agree on §12.3 layout + signup-mode branches + UTM. States: enum-backed set adopted (GLM+Opus; GPT's ~40 folded). See RECONCILIATION-7A §6.

---

## 1. Route & Access
- **Path:** `/` (anonymous). **Actor:** anonymous. **Landing layout §12.3** — genuinely different visual register; **NO §12.1 app-shell chrome** (Top Header/sidebars/tab bar) is bound by any CAP (nav-chrome adoption was App-Shell-scoped, Wave 1). Confirmed: CAP-464/465/478 are all anonymous, read `systemConfig (signup.mode)` + `utmDictionary`, write only `rawEvents`; none reference app-shell providers.
- **Providers still mount:** landing lives under the CAP-025 tree (ErrorBoundary → CMP slot → BetaBanner → children); CMP's actors include anonymous, so the banner is available. CAP-027's no-ConsentProvider carve-out is **legal-pages-specific**; landing is not a legal page (Open Question).
- **Signup gating chain:** `signup.mode` ∈ {open · waitlist · closed} (default **open**, soft beta) → **`effectiveSignupMode = readiness ? signup.mode : closed`** (FATAL-M1A-02) → CAP-510 blocks open if any GATE false. **Never dual CTAs.**
- Authenticated `/` remains Feed/Home (not this contract).

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `systemConfig` | read | `signup.mode` |
| `utmDictionary` | read (CAP-465) | version, allowedSources[], allowedMediums[], campaign/content formats, maxLen 80 |
| `rawEvents` | write | UTM first-touch capture (464/465); mode annotation (478) |

- Waitlist/email capture reuses the existing waitlist/auth flow; ⚠️ **CAP-478's Writes list only `rawEvents`, not `waitlistEntries`** — delegation to CAP-014 (`waitlist.join`) unspecified (Open Question).

## 3. States
*(Enum-backed set. GPT's ~40 transient states — each UTM sub-branch, each chrome-absent assertion — folded, since the `signup.mode` (3) + UTM-validity states are authoritative.)*

**A. signup-mode CTA set (CAP-464/478 — three modes):** **open** → primary "Join public beta" (email-verified account) · **waitlist** → email capture only (**no L08 signup_completed**) · **closed** → **no capture**. Always: Beta label · secondary Explore free resources (→ /resources) · tertiary Discussions (→ feed, Hot = anonymous default). Readiness-closed may override config-open server-side (distinct state).
**B. UTM state (CAP-465):** valid params (validated vs dictionary; **first-touch stored once**; canonical URL strips UTMs; emits M16 observational event) · unknown params → `utmValidated=false` · no UTMs. **referrer is the ONE non-backfillable field.**

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Landing render | System/anonymous | CAP-464 (R-SIGNUP-MODE) | rawEvents (UTM capture) | none |
| (System) UTM capture on request | System | CAP-465 `utm.capture` (R-UTM) | rawEvents (firstTouch utm_*) + M16 observational event | dictionary validation |
| Open signup CTA | anonymous *(register Actor=member; trigger="Visitor" — actor drift, M11 class)* | CAP-478 (unnamed) | rawEvents (mode annotation) | effectiveSignupMode |

- **Explore resources** → /resources. **Open discussions** → feed (Hot default). No app-shell mutation owned here.

## 5. Analytics Events
rawEvents: UTM capture (first-touch-once), signup-CTA mode annotation, CAP-465's M16 observational event. This is the funnel-entry capture (CAP-445 L08 impression→signup reads it downstream). Waitlist mode must not emit signup_completed; closed mode must not emit capture/completion; unknown UTMs recorded as unvalidated must not pollute validated attribution. No literals named — catalog-owned.

## 6. Components Used
- **§12.3 Landing layout** (its own archetype) · §11.1 Buttons (primary/secondary/tertiary CTA hierarchy — **single CTA set, never dual**) · §11.5 Pill (Beta label) · Wordmark §10.2 · §11.8 Error · §11.9 Skeleton · CMP banner available. **BetaBanner ungoverned** (Wave-1 OPEN-DECISIONS E1 — still open).
- **Archetype gap:** no formal signup-mode CTA switch or UTM-degraded landing state in §11.

## 7. Open Questions
1. **CAP-478 Actor=member vs "Visitor" trigger** (grouped actor drift, M11 class). (GLM.)
2. **Waitlist branch entity** — CAP-478 writes only rawEvents; whether the landing waitlist CTA delegates to CAP-014 (`waitlistEntries`) or writes its own capture is unspecified (and `waitlistEntries` field schema was itself a Wave-1 OPEN-DECISION). (Opus.)
3. **Landing + ConsentProvider** — mounts CMP (anonymous actor) or follows the legal-pages no-CMP carve-out? Carve-out is legal-specific; unspecified for landing. (GLM.)
4. **"Discussions" target URL** — not stated in CAP-464. (GPT.)
5. **First-touch storage scope** (browser/session/anonymous cookie/server identity) — not fully specified. (GPT.)
6. **CTA behavior during a live `signup.mode` transition** — unspecified. (GPT.)
7. **Landing indexability** — not in CAP-486 noindex list; M17 launch context implies indexable (assumed, flag). (GLM.)
8. **Beta-label copy unowned** (E1 residual). (GLM.)
