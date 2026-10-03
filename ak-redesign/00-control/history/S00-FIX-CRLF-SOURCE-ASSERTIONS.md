---
id: S00-FIX-CRLF
type: FIX
author-model: GLM
round: 1
date: 2026-10-03
task: S00 gate (test-suite determinism)
branch: s00-fix-tz-tests
status: DONE
---

# FIX — the "973/975" pair (p5-02 CAP-140, p7e season-derivation) is CRLF, not TZ

The standing hypothesis (IST vs UTC date math) is **disproved**: the two
tests fail **identically under TZ=UTC and TZ=Asia/Kolkata**. No `Date`,
clock, or timezone call is involved in either test — both are
`readFileSync` source assertions that embed a **literal `\n`**, which can
never match a CRLF working tree.

## Root cause (machine state, not product code)

- This Windows machine's system gitconfig (`C:/Program Files/Git/etc/gitconfig`)
  sets `core.autocrlf=true`; the working tree predates the repo's
  `.gitattributes` (`* text=auto eol=lf`, landed cbf2b2b "[S00-PREP][BUILD]
  .gitattributes: force LF checkouts"), so unchanged files were never
  re-smudged and stay **CRLF on disk** (`convex/posts.ts`: 715 CR lines,
  `convex/signal/promoteDemote.ts`: 320). Cloud/office trees are LF → 975/975.
  A fresh clone is already safe (attributes beat autocrlf); only stale
  checkouts like this one trip the two assertions below.
- `p5-02-comments-eligibility.test.ts:153` —
  `toMatch(/moderationStatus = "passed";\n        lifecycleStatus = "published"/)`
  (the CAP-140 preserve-draft return-contract row).
- `p7e-moderation.test.ts:241` —
  `toContain('.withIndex("by_seasonNumber")\n    .order("desc")')`
  (the season-derivation "never hardcoded season 1" row).

## Fix — tests only, product code untouched

Normalize `\r\n → \n` at the read boundary (no-op on LF checkouts):

- `p5-02-comments-eligibility.test.ts`: new `readSource()` helper; both
  `posts.ts` / `comments.ts` reads go through it.
- `p7e-moderation.test.ts`: the shared `read()` helper gains the same
  normalization (covers all 15 module reads in the file).

## RED — before the fix (both TZs, targeted files)

Command: `TZ=<tz> pnpm test:run p5-02-comments-eligibility p7e-moderation`

```text
===== TZ=UTC =====
 × the CURRENT season is derived — never hardcoded season 1 (award + promoteDemote)
 × CAP-140: preserve-draft outcome + missing decisions in the return contract
 FAIL src/components/ui/__tests__/p5-02-comments-eligibility.test.ts > CAP-140: preserve-draft…
 FAIL src/components/ui/__tests__/p7e-moderation.test.ts > the CURRENT season is derived…
 Test Files  2 failed (2)
      Tests  2 failed | 56 passed (58)

===== TZ=Asia/Kolkata =====
 × the CURRENT season is derived — never hardcoded season 1 (award + promoteDemote)
 × CAP-140: preserve-draft outcome + missing decisions in the return contract
 Test Files  2 failed (2)
      Tests  2 failed | 56 passed (58)
```

Identical failures under both TZs → timezone-independent.

## GREEN — after the fix

```text
===== targeted, TZ=UTC =====        ===== targeted, TZ=Asia/Kolkata =====
 Test Files  2 passed (2)            Test Files  2 passed (2)
      Tests  58 passed (58)                Tests  58 passed (58)

===== FULL GATE, TZ=UTC =====        ===== FULL GATE, TZ=Asia/Kolkata =====
 Test Files  67 passed (67)          Test Files  67 passed (67)
      Tests  975 passed (975)             Tests  975 passed (975)
```

Gates: test:run 975/975 on **both** TZs · typecheck ✅ · lint ✅.
Branch `s00-fix-tz-tests` pushed, unmerged (Grok reviews).

## Optional machine hygiene (not required by the fix)

To bring this working tree in line with the repo's eol=lf policy (fresh
clones already get LF): delete + re-checkout tracked sources, e.g.
`git checkout HEAD -- <path>` after touching, or re-clone. The hardened
tests pass under either line-ending state, so this is cosmetic.
