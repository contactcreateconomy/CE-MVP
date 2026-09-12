# BIBLE-FIXES — every [BIBLE-FIX]-class edit, one line each

**Purpose:** the single place to see every spot where `_data-model.md` (the
data-model Bible) was wrong or incomplete and was corrected during a slice
build — date, file, reason. Inline `[BIBLE-FIX …]` comments stay at the edit
site; this file is the index. Started 2026-09-05 (P4-05 session); earlier
entries backfilled from the Bible's own Revisions log at `_data-model.md`
l.483-485.

**Discipline (from the slice catalogs):** a `[BIBLE-FIX — apply now]` edit is
one the slice's own description requires — apply it in the same session, in
both the Bible text AND `convex/schema.ts`, and log it here. Never park it as
"described in the catalog."

| Date | Slice | File(s) | What was wrong → fix |
|---|---|---|---|
| 2026-08-29 | 7-AdminCore | `_data-model.md` (platformHealth bullet + Core-enums) | `platformHealth` bullet was an `…` pointer — replaced with the field list + `state` literals from `M18-reliability.md` l.73/§7 |
| 2026-08-29 | 7-OPS | `_data-model.md` (rawEvents, utmDictionary, analyticsWeeklyDecisions) | `rawEvents` l.271 `…` → full M16 §6 envelope + `tombstoneState` literals; `utmDictionary` vague shape note → `campaignFormat`/`contentFormat`/`updatedAt` from M17 l.75; `analyticsWeeklyDecisions` missing `createdAt` (M16 l.96) |
| 2026-08-29 | 7-OPS P7O-08 | `_data-model.md` (analyticsDeletionRequests) | Missing `requestedAt`/`submittedAt?`/`confirmedAt?`/`lastError?` timestamps (M16 l.97) |
| 2026-09-05 | P4-05 | `_data-model.md` l.144 + `convex/schema.ts` (toolRatings) | Bible bullet omitted timestamps, but CAP-533's rating-velocity window (added 2026-08-23, after the M5 lock) requires `createdAt`; `updatedAt?` tracks CAP-113 edits. Schema + Bible edited same-session. |
| 2026-09-05 | P4-08 | `_data-model.md` l.151 + `convex/schema.ts` (generationRuns) | Bible typed `contentCandidateId` required, but CAP-036's claims.extract writes extraction-scoped runs before any candidate exists — made optional. Schema + Bible edited same-session. |
| 2026-09-12 | AUDIT (docs-vs-code) | `_data-model.md` l.44 + `convex/schema.ts` (roleAssignments) | l.44's role enum used camelCase (`storeOperator`/`supportOperator`) — the outlier vs l.266 + Core-enums l.386 (lower_snake mandated l.35). Bible + schema + all gates moved to `store_operator`/`support_operator` same-session; the camelCase split had broken the admin-support widget gate (roles could never match the catalog's snake_case permission keys). |
| 2026-09-12 | AUDIT (docs-vs-code) | `_data-model.md` l.421 (signal.level) | Core-enums read `pulsar`, contradicting the band prose l.346 + the M12 revision note (both `Nebula`); schema matches Nebula → line fixed to `nebula`. |
| 2026-09-12 | AUDIT (docs-vs-code) | `_data-model.md` (dispositions on 9 entities) | Explicit "2026-09-12 disposition" notes added where the logical model names a table no register CAP owns or the implementation substituted another table: postReactions, postSources (→ contentCandidateSources), resourceTags, mediaAssets, campaigns/banners/commercialClicks, opsCoverageAcknowledgements (→ opsAssignments.state), authorizedCommands (substrate landed P1-04; consume path deferred). |

## Related-but-distinct (NOT bible fixes — logged so they aren't confused for one)

- **2026-09-05, P4-05 — `adminInterventionAlerts` transcribed** (`convex/schema.ts` from bible l.263): the Bible was RIGHT; the schema simply hadn't transcribed the table yet (first writer = CAP-116 drift monitor). Back-fill, not a fix.
- **2026-09-05, P4-05 — `rate_tool` capability key** (`convex/lib/authz.ts`): not a Bible/Bible-fix matter — a register-vs-contract tension (CAP-393 enumeration vs CONTRACT-2-tool-profile §1), resolved contract-favor; cross-reference note added to the CAP-393 row in `CAPABILITY-REGISTER-MERGED.md`.
- **2026-09-12, AUDIT — `contentVersions` backfilled** into `_data-model.md`: the Bible was missing an IMPLEMENTED table (shipped with 7-TRUST per DECISIONS-LOCKED #9; backs `/dmca`, `/repeat-infringer`, trust routes). Bible caught up to code — back-fill, not a fix.
- **2026-09-12, AUDIT — `postReviews` verdict-block fields** (`verdictSummary`/`pros`/`cons`, bible l.88): added as `v.optional` in schema + composer passthrough; the review FORM spec is flagged (not invented) until checked against CONTRACT-2.
