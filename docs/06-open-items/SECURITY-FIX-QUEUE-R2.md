# Security fix queue — round 2 (Erdos economy/privacy sweep, 2026-09-13)

Status: **NOT STARTED — fix tomorrow.** Source-verified by the scanning agent
(Erdos economy worker re-run); citations spot-checked from the Hermes session
(the two corrections at the bottom are incorporated). Priority order as given:
31 → 32, then 33, 34. Work on `006-testing-security-validation` (or its
successor branch); full gate before closing each item.

Context: items 1–30 of the first scan are FIXED and live on Convex dev
`watchful-chameleon-570` (commit `11de97e`, 2026-09-13 — see CHANGELOG
"Security hardening: 30 findings"). Items below are the deltas found after
that fix landed. Note: `convex/profile/page.tsx` cited in the original note
is actually `convex/profile/page.ts`.

---

## 31. HIGH — Signal economy: reaction replay (reactions + award)

`convex/reactions.ts:98-264` + `convex/signal/award.ts:57-63, 216-249`

Removing a reaction, or even a negative reaction, still emits a
`comment.reacted` event that the Signal sweep awards as positive weight.
Every toggle = a new awardable event (the cap is only 3 per actor/comment
pair per 7 days — bypassable with more accounts/comments).

Fix direction: award only NEW positive transitions (reject `removed === true`,
non-valuable reaction types, held/deleted comments); idempotency key per
actor/comment/positive-transition; rate-limit reaction transitions; reverse
awards when reactions are removed or comments get held/deleted.

## 32. HIGH — Signal revocation cascade broken (attributionSettle + award + comments)

`convex/jobs/attributionSettle.ts:5-214`, `convex/signal/award.ts:254-324`,
`convex/comments.ts:441-507`

Settled Signal survives deleted content. Verified from this session's grep:
`attributionSettle.ts` READS `reversedAt` (5 refs) but neither `award.ts` nor
`comments.ts` ever WRITES `rawEvents.reversedAt` — the only reversal trigger
is dead. Also: softDelete never reverses the ledger; CTA/conversion anchors
(`cta:<id>` / `conv:<id>`) can't be loaded by settlement's `db.get()` (they're
prefixed ids, not table ids); the split-lookup key `split:<ledgerId>` doesn't
match the insert key `split:<ledgerId>:<commenter>`; clawback skips commenter
rows — derived payouts can't be retracted.

Fix direction: typed revocation on the source row; resolve anchors by outcome
family; reverse provisional awards on deletion/moderation; derive dependent
split ids from `reversesLedgerId`; add an idempotent cascade test.

## 33. MEDIUM — Email local parts leak as public display names

`convex/auth.ts:82-107`, `convex/profile/page.ts:133-140`,
`convex/comments/reads.ts:102-107`, `convex/feed.ts:91-97`

Password signup defaults `displayName` to the email local part, and the
public profile/comment/feed helpers fall back to `email.split("@")[0]` →
platform-scale harvesting of identifying local parts.

Fix direction: never derive PUBLIC names from email; opaque `member-<random>`
labels for accounts that never set a display name; migration for existing
rows (flag the backfill choice — dev-deployment data is disposable demo data
per 00-TRANSITION, so a migration may be unnecessary; confirm before writing
one).

## 34. LOW — Draft tag reads unguarded

`convex/tags.ts:66-88` — `getPostTags` returns tag joins for ANY post id (the
write path is owner-guarded, the read isn't) → private draft topics/products
discoverable if a draft id leaks.

Fix direction: require authenticated owner (or moderator) + published /
visibility check, mirroring `posts/detail.ts getDetail`'s null-for-drafts
posture.

---

## CORRECTIONS to round 1 (already incorporated in `11de97e` — recorded here so tomorrow's session doesn't undo them)

- **Item 18 (private-profile leak) is likely NOT a vuln.** Erdos found
  `docs/02-contracts/wave-5/CONTRACT-5-u-handle-FINAL.md:25,62` explicitly
  leaves private-profile rendering for non-self viewers unspecified, and
  search exclusion is a recorded open question. → Downgraded to a FOUNDER
  PRODUCT DECISION (spec gap), not a code fix. The redaction shipped in
  `11de97e` is stricter than the contract requires; KEEP or REVERT is the
  founder's call — do not invent further behavior (AGENTS.md: stop and flag
  spec gaps). Flagged on the wiki Founder-Review-Queue.
- **Item 20 (admin reads) was narrower than first reported.** Only the four
  reads `sources.listSources`, `rulebook.listRules`,
  `rulebook.listCalibrationExamples`, `policyReasonCodes.listLatest` were
  unguarded — and exactly those four were staff-gated in `11de97e`. No
  further action.
- **Verified safe by Erdos (no action):** drafts (myDrafts owner-scoped,
  getDetail null-for-drafts), notifications, consent/appeals/reports reads,
  feed personalization, resources/downloads, ensureDistribution idempotency,
  settlement amounts (sealed constants, not client-controlled),
  editorial/qualify pipeline (internal/role-gated), and no XSS sinks
  anywhere (render layer clean).
