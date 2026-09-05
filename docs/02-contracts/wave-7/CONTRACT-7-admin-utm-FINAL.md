# CONTRACT-7-admin-utm-FINAL

**Screen:** UTM Builder — `/admin/utm` *(canonical — register CAP-479 synced to the inventory route, E-route CLOSED)*
**Wave:** 7D (M17 Growth, SEO & Distribution)
**Template archetype:** Link generator (read-only)
**Primary CAP-IDs:** CAP-479, **CAP-566**
**Actor:** Founder/Admin (CAP-479); inventory says administrator
**Register basis:** 567-row register (post Wave 7D fixes); rows verified from source.
**Reconciliation:** All-agree on read-only generator. Two escalations (route drift, missing writer) — **both CLOSED 2026-08-26**. States: enum-backed set adopted (GLM+Opus; GPT's ~40 folded). See RECONCILIATION-7D §3.

---

## 1. Route & Access
- ~~⚠️ **ROUTE-NAME DRIFT (verified verbatim):** inventory route = **`/admin/utm`**; CAP-479's trigger reads "Admin opens **`/admin/utm-builder`**". One must yield → **ESCALATION E2** (contract written route-neutral).~~ **E-route CLOSED 2026-08-26 (founder decision):** CAP-479's trigger renamed to **`/admin/utm`**, matching `MASTER-SCREEN-INVENTORY-MERGED.md` (the reconciled canonical screen list — inventory wins). DEC-M17-UTM rows + M17 sheet route references synced.
- **Actor:** CAP-479 = **Founder/Admin** (verified); inventory Actor "administrator" understates (Founder also admitted). Per the 7B two-layer model, the per-CAP Actor (Founder/Admin) is the narrow gate.
- **Gated by CAP-390** (shell). Read-only generator — no deeper gates. Admin/UTM URLs noindex (CAP-486).
- The builder reads `utmDictionary` and generates links from controlled dropdown values. It does **not** mutate the dictionary, create campaigns, shorten links, publish content, or write first-touch attribution (that's CAP-465 on the landing page). Must not allow arbitrary parameter names to bypass the dictionary.
- **CAP-566 (administrator)** — the dictionary seed/edit surface, co-located on this screen (see Actions). It is the only writer to `utmDictionary` register-wide; CAP-479 remains the read-only generator.

## 2. Entities

| Entity | Direction | Detail (CAP) |
|---|---|---|
| `utmDictionary` | read (CAP-479) + **write (CAP-566 — seeds/edits allowedSources/allowedMediums/campaign+content formats)** | version · allowedSources[] · allowedMediums[] · campaign/content formats · **maxLen 80** |

- ~~⚠️ **WRITER GAP (verified — CAP-536-class):** a whole-register scan finds **no CAP writes or seeds `utmDictionary`** — CAP-464 (landing), CAP-465 (capture), and CAP-479 (this builder) are **all read-only** against it (Writes = rawEvents/none). Without a seeder, this builder's dropdowns render **empty at first launch** — the identical hole Wave-3 E3 closed for `qualificationRules` via CAP-536. Runtime validation (CAP-465, off-screen) is also dictionary-dependent → **ESCALATION E1.**~~ **E1 CLOSED 2026-08-26 (founder decision): CAP-566 (M17, administrator, Has-UI: YES) added** — Admin seeds/edits the UTM campaign source dictionary values; versioned per DEC-M17-UTM. The builder's dropdowns and CAP-465's landing-page runtime validation now have a governed fill path. Mutation: `utm.dictionary.seedEdit`.

## 3. States
*(Enum-backed set. GPT's ~40 transient states — each field selected/unselected, each URL sub-step — folded, since the dictionary-loaded / generate / invalid states are authoritative.)*

**A. Dictionary-loaded:** dropdowns constrained to `allowedSources`/`allowedMediums`; campaign/content per declared formats; generated link respects **maxLen 80**.
**B. ~~Empty/unseeded dictionary — behavior undefined (E1).~~ Seeded dictionary (CAP-566) — the pre-fix empty state is no longer reachable at first launch; an explicitly empty dictionary remains an admin-configuration choice, rendered as disabled dropdowns + guidance copy, not an error.**
**C. Generated link:** output render; **copy affordance + feedback surface unspecified** (available-not-prescribed per the Wave-1 Toast resolution — Open Question).
**D. Over-length/invalid combination + arbitrary-param attempt** — rejected by the controlled selector; exact rejection UI unspecified.
**E. Base-URL states:** empty / valid / already-contains-UTMs (replace vs reject unspecified).

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Generate link (dropdowns) | Founder/Admin | CAP-479 `utm.builder.generate` | **none** | CAP-390 |
| Seed/edit dictionary values | administrator | **CAP-566 `utm.dictionary.seedEdit` (NEW — E1)** | utmDictionary | CAP-390 |

- No persistence beyond the dictionary, no server mutation on generate — pure generator. **Record first-touch UTM** — CAP-465, landing only. **Copy generated URL** — client action, no server API.

## 5. Analytics Events
**None** — CAP-479 reads `utmDictionary` and writes nothing; staff excluded from product counters. Link generation ≠ a visit/signup/conversion. First-touch UTM capture (CAP-465, rawEvents firstTouch utm_*) happens on the landing page, not here.

## 6. Components Used
- §11.2 Select (utm source/medium/campaign dropdowns) · Text Input (base URL; generated URL read-only) · §11.1 Button (generate/copy) · **copy-to-clipboard — no §11 pattern** (flag) · feedback surface (toast/inline) unspecified · §11.9 Skeleton · §12.4 generator layout via shell.

## 7. Open Questions
*(Escalated items in RECONCILIATION-7D. These are unspecified detail.)*
1. ~~**`/admin/utm` vs `/admin/utm-builder` route drift** — pick one. (All three, verified.) → **ESCALATION E2.**~~ **→ CLOSED (E-route, 2026-08-26): `/admin/utm`; CAP-479 trigger + DEC-M17-UTM + M17 sheet synced.**
2. ~~**`utmDictionary` has no writer/seeder CAP**~~ **→ CLOSED (E1, 2026-08-26): CAP-566 `utm.dictionary.seedEdit` added.**
3. **Inventory Actor "administrator" vs CAP-479 "Founder/Admin"** — minor scope drift. (GLM + Opus.)
4. **Copy-to-clipboard + feedback pattern** undefined. (GLM.)
5. **Required vs optional UTM fields + base-domain allowlist + existing-param merge behavior** — unspecified. (GPT.)
6. **No link-history persistence** — confirm no saved-links surface is wanted. (GLM + GPT.)
