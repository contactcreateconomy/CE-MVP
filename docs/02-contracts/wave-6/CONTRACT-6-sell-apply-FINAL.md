# CONTRACT-6-sell-apply-FINAL

**Screen:** Store Application — `/sell/apply`
**Wave:** 6C (M11 Affiliate Storefront)
**Template archetype:** Multi-step application + data-honesty flow
**Primary CAP-IDs:** CAP-230, CAP-231, CAP-262
**Actor:** member
**Register basis:** 559-row register; in-scope rows verified from source. **E6 CLOSED 2026-08-25.**
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: enum-backed set adopted (GLM+Opus; GPT's ~55 folded). See RECONCILIATION-6C §3.

---

## 1. Route & Access
- **Path:** `/sell/apply`, no params. **Actor:** member. No anonymous access.
- **Eligibility gate (CAP-230, as corrected — E6 CLOSED 2026-08-25):** **profile complete + ≥1 social handle + eligible trust tier + no integrity/moderation hold + NOT staff + NOT persona.** The staff/persona exclusion was missing from the register formula despite the bible M11 intro ("Personas/staff excluded") mandating it — now enforced server-side at the gate, mirroring CAP-112's R-STAFF pattern (Wave 2 tool-rating self-dealing exclusion; same conflict-of-interest logic). Bible: profile-complete = **directly-fillable fields, prefer-not-to-say counts**.
- **Data-honesty page:** **/how-we-use-your-store-data** (CAP-262; the trust page itself renders W7).
- **Money-path note:** no payment exists in this flow — commission flows merchant→creator; platform takes 0%.

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `users` · `profiles` · `userSocialAccounts` · `moderationCases` | read | eligibility inputs; **`users.isStaff` + persona role assignment = exclusion inputs (E6)** |
| `storeRequests` | read + write | userId, **status {submitted·under_review·info_requested·approved·rejected}**, categories[], networks[], expectedProductCount, experienceNote, **attestations {owns, programPermits, regionEligible, willDisclose}**, termsVersion, dataUseVersion, reviewerUserId?, reasonCode?, decidedAt |
| `systemConfig` | read (CAP-262) | data-honesty page content pointer |
| `auditLog` | write | on eligibility-eval + submit |

## 3. States
*(Enum-backed set. GPT's ~55 transient states — each attestation checked/unchecked, each eligibility sub-gate — folded, since `storeRequests.status` (5) + the four required attestations + the eligibility formula are authoritative.)*

**A. Eligibility (CAP-230 — each failed gate):** profile incomplete · no social handle · trust tier ineligible · integrity/moderation hold · **staff/persona exclusion (E6 — ineligible; server-side reject, R-STAFF class)** · **eligible**.
**B. Application form (CAP-231, tap-first):** intended categories · networks (`affiliate.network` enum: impact·shareasale·awin·cj·amazon·direct·other) · expectedProductCount · experienceNote · **attestations required (all four: owns, programPermits, regionEligible, willDisclose)** · terms + data-use acceptance (versions recorded).
**C. Data-honesty acceptance (CAP-262):** before approval; **aggregate-only disclosed** (Traffic/Intent/Confirmed explained; no buyer identity, no exact times, no arbitrary multi-dim filtering).
**D. Outcomes (`storeRequests.status`):** submitted → under_review → **info_requested** / **approved** (→ `storefront.status=setup`; **Rocketeer badge provisional** per CAP-232, on `/admin/store`) / **rejected** (reasonCode).

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Open apply flow (eligibility evaluated) | member | CAP-230 (R-REQUEST; no mutation named) | storeRequests, auditLog | eligibility formula **incl. staff/persona exclusion (E6)** |
| Submit application | member | CAP-231 (R-REQUEST; no mutation named) | storeRequests, auditLog | CAP-230 |
| Accept data-honesty page | member | CAP-262 (R-DATA-HONESTY; no mutation named) | storeRequests | CAP-231 |

- No mutation names on any of the three rows (Open Question). **Withdraw application** — no capability defined (Open Question).

## 5. Analytics Events
`auditLog` only; **no rawEvents named** on any row — commerce-funnel capture (eventCatalog `commerceFunnel`; CAP-448 reads rawEvents downstream) ownership unstated (Open Question). Policy acceptance is authoritative versioned evidence in `storeRequests`, not analytics. No literals named.

## 6. Components Used
- Multi-step form (§11.2 Inputs, stepped) · attestation checkboxes · Select (categories, networks) · number input (expectedProductCount) · Textarea (experienceNote) · §11.1 Button · §11.5 Pill (status) · data-honesty content block (Reading column §4.3) · §11.7 Modal (terms/data-use acceptance) · §11.9 Skeleton · §11.8 Error (ineligible reasons **incl. staff/persona ineligibility — E6**).
- **Archetype gaps:** no multi-step seller application, eligibility checklist, versioned commercial-attestation, or aggregate-data-honesty component in §11.

## 7. Open Questions
1. ~~Staff/persona exclusion absent from CAP-230's eligibility formula~~ **→ CLOSED (E6): added to the formula + this contract; register corrected.**
2. **Re-application after rejection** — cooldown? new request row? status transition on re-submit? Unspecified. (All three.)
3. **No mutation names** on CAP-230/231/262. (All three.)
4. **Application funnel analytics ownership** unstated. (GLM.)
5. **"Eligible trust tier" threshold** — CAP-230 gates on it but no CAP/config key names the value; M12 TrustTier (CAP-290) exists but its store-eligibility cutoff isn't bound. (Opus.)
6. **Member withdrawal/cancellation** of a submitted application — no capability. (GPT + Opus.)
7. **Category/network selection limits + expectedProductCount validation bounds** — unspecified. (GPT.)
8. **Material data-honesty-version change + reacceptance** — unspecified. (GPT.)
