# CONTRACT-7-appeal-FINAL

**Screen:** Appeal Submission — `/appeal/[actionId]`
**Wave:** 7A (M13 Trust, Safety & Moderation)
**Template archetype:** Appeal form
**Primary CAP-IDs:** CAP-340
**Actor:** member (the sanctioned member)
**Reconciliation:** All-agree on the single-CAP submit + eligibility gates. States: enum-backed set adopted (GLM+Opus; GPT's ~40 folded). See RECONCILIATION-7A §2.

---

## 1. Route & Access
- **Path:** `/appeal/[actionId]`, dynamic `[actionId]` (a `moderationActions` id carrying `appealDeadlineAt`). **Actor:** member. **Gated by CAP-336** (a sanction exists to appeal). No anonymous access.
- A member can appeal only an action applied to that member or the member's eligible content. **This route submits the appeal; it does not decide it.**

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `moderationActions` | read | the appealed action; `appealDeadlineAt?` (the deadline carrier); action type/target/actor/status |
| `moderationCases` | read + write | case attach; `userResponseDueAt?` |
| `auditLog` | write | on submit |

- **Teardown:** appeal records are compliance/audit evidence with no member-delete path; they create no public/live content.

## 3. States
*(Enum-backed set. GPT's ~40 transient states — each validation sub-step, each reviewer-availability branch — folded, since the eligibility gates + submit outcome are authoritative.)*

**A. Eligibility gates (each a distinct reject state, CAP-340):** one-appeal-per-action (already appealed) · deadline expired — **14d content / 30d terminate (two windows by sanction type)** · length > 2,000 chars · > 3 evidence refs · **URLs in submission (hard-reject — echoes the no-user-URL principle)** · action-not-appealable · action-not-owned.
**B. Submitted:** moderationCases updated; queue places appeals near bound (CAP-330 ordering: s0 → legal → s1 → **appeals near bound** → s2 → s3).
**C. Review (off-screen, CAP-341):** pending human re-review — **one human re-review (second human or Admin if solo)**; resolved ≤ 7 business days.
**D. Overdue (off-screen, CAP-342 cron):** `appeal.slaTick` → **Admin escalation — not auto-deny/restore; safety holds not auto-restored**.
**E. Deadline-passed pre-submission:** server behavior (reject vs form-disabled) unspecified (Open Question).

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Submit appeal | member | CAP-340 `appeal.submit` (R-APPEAL) | moderationCases, auditLog | one/action; 14d\|30d window; ≤2k chars; ≤3 evidence refs; no URLs |

- **Load appealable action** — no exact query name; must validate ownership, appealability, deadline, prior-appeal state. **Withdraw/amend appeal** — no capability. **Decide appeal** — not owned here (CAP-341).

## 5. Analytics Events
**None named.** CAP-340 writes moderationCases + auditLog, not rawEvents; no M16 catalog row covers appeals (may be deliberate legal/mod privacy — Open Question). Appeal text/evidence must not be copied into broad observational analytics.

## 6. Components Used
- §12 Form · §11.2 Textarea (2k cap + counter; evidence-ref fields ≤3) · moderation-action summary card (§11.3) · §11.5 Pill (deadline/status) · §11.1 Button · §11.8 inline Error (each gate) · §11.7 Modal (confirm) · §11.9 Skeleton.
- **Archetype gap:** no appeal-specific evidence selector, deadline-expiry form, or reviewer-independence state in §11.

## 7. Open Questions
1. **Sanction-class data source for the 14d/30d window** — CAP-340 branches by content-vs-terminate but the field distinguishing sanction class for the deadline computation isn't pinned in the read set. (Opus.)
2. **No appeal-status/outcome read CAP** — the member has no capability to view disposition after CAP-341 resolves it. (GLM + Opus.)
3. **Deadline-expiry enforcement surface** (server-reject vs UI-disable) — unspecified. (GLM + GPT.)
4. **"Evidence refs" referent entity** (post/comment id? URL-free format?) — unspecified. (GLM + GPT.)
5. **Delivery path to this route** (mod-transactional notification link?) — not explicitly wired. (GLM.)
6. **No rawEvents/analytics ownership** — see §5. (GLM.)
7. **Timezone handling for 14/30-day deadlines** — unspecified. (GPT.)
