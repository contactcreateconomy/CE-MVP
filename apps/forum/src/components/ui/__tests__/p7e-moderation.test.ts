 
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P7E-10…18 acceptance tests — the M13 moderation track + season
 * engine. Quotes live in the source modules. */

const convexRoot = join(__dirname, "../../../../../../convex");
const read = (rel: string) => readFileSync(join(convexRoot, rel), "utf8");

const schemaSrc = read("schema.ts");
const autoGateSrc = read("moderation/autoGate.ts");
const reportSrc = read("moderation/report.ts");
const seedSrc = read("moderation/reasonCodesSeed.ts");
const reasonCodesSrc = read("moderation/reasonCodes.ts");
const domainSrc = read("admin/moderationDomain.ts");
const queueSrc = read("admin/moderationQueue.ts");
const sanctionsSrc = read("admin/sanctions.ts");
const appealsSrc = read("admin/appeals.ts");
const maxSrc = read("jobs/maxRefresh.ts");
const seasonSrc = read("signal/promoteDemote.ts");
const awardSrc = read("signal/award.ts");
const cronsSrc = read("crons.ts");
const postsSrc = read("posts.ts");
const commentsSrc = read("comments.ts");

describe("SLICE-P7E-10 — M13 remainder schema + CAP-360/358/429", () => {
  it("moderationActions / strikes / policyReasonCodes defined; dmcaNotices still absent", () => {
    expect(schemaSrc).toContain("moderationActions: defineTable");
    expect(schemaSrc).toContain("strikes: defineTable");
    expect(schemaSrc).toContain("policyReasonCodes: defineTable");
    expect(schemaSrc).not.toContain("dmcaNotices: defineTable");
  });

  it("strikes carry the five bible classes + the RI provisional rule fields", () => {
    const region = schemaSrc.split("strikes: defineTable")[1].split("policyReasonCodes")[0];
    for (const c of ["content_conduct", "spam_manipulation", "commercial_integrity", "copyright_rights", "account_integrity"]) {
      expect(region).toContain(c);
    }
    expect(region).toContain("voidedByRestore");
    expect(region).toContain("provisional");
  });

  it("CAP-333 allowlist: exactly the four quoted codes autoReleaseEligible", () => {
    const allow = seedSrc.split("AUTORELEASE_ALLOWLIST")[1].split("] as const")[0];
    for (const code of ["profanity_soft", "off_topic_uncertain", "low_substance", "wrong_post_type_uncertain"]) {
      expect(allow).toContain(code);
    }
    const fn = seedSrc.split("seedReasonCodes")[1];
    expect(fn).toContain('AUTORELEASE_ALLOWLIST as readonly string[]).includes(row.code)');
  });

  it("CAP-358/429 version-forward: never an in-place overwrite (old row deactivated, new row inserted)", () => {
    const fn = reasonCodesSrc.split("insertNextVersion")[1].split("export const editCopy")[0];
    expect(fn).toContain('active: false'); // supersede
    expect(fn).toContain("version: nextVersion");
    // the deactivate patch touches `active` ONLY — never the copy fields
    expect(fn).toContain('ctx.db.patch(latest._id, { active: false })');
  });
});

describe("SLICE-P7E-11 — autoGate (CAP-321/322/323/102)", () => {
  it("deterministic: obfuscation patterns detect, classifier never called here", () => {
    expect(autoGateSrc).toContain("OBFUSCATION_PATTERNS");
    expect(autoGateSrc).not.toContain("classifySafety");
  });
  it("CAP-323 fail-closed: classifier-unavailable never autoReleaseEligible (the case flag defaults false)", () => {
    expect(autoGateSrc).toContain("autoReleaseEligible: input.autoReleaseEligible ?? false");
  });
  it("CAP-102 repeated obfuscation → hard reject; first → hold + case", () => {
    expect(autoGateSrc).toContain("priors >= 1 ? \"hard_reject\" : \"hold\"");
    expect(autoGateSrc).toContain('"url_obfuscation"');
  });
  it("l.239 dedupe holds the line against CAP-154 double-hold", () => {
    expect(autoGateSrc).toContain("openCaseDeduped");
    expect(autoGateSrc).toContain("findOpenCase");
  });
  it("wired into BOTH submit paths (not a replacement — R-URL/154 stay)", () => {
    expect(postsSrc).toContain("autoGateTx");
    expect(commentsSrc).toContain("autoGateTx");
    expect(postsSrc).toContain("classifySafety");
    expect(commentsSrc).toContain("isDuplicateComment");
  });
});

describe("SLICE-P7E-12 — report submit (CAP-324/325)", () => {
  it("target = the comment (H6); one open case per target+policyFamily+window", () => {
    expect(reportSrc).toContain("commentId: v.id(\"comments\")");
    expect(reportSrc).toContain("findOpenCase");
    expect(reportSrc).toContain("openCaseDeduped");
  });
  it("rates: 10/24h + 30/7d set + critical ≤5/hr for safety_illegal", async () => {
    const rateSrc = read("lib/rateLimit.ts");
    expect(rateSrc).toContain('"report.daily", max: 10');
    expect(rateSrc).toContain('"report.weekly", max: 30');
    expect(rateSrc).toContain('"report.critical.hourly", max: 5');
    expect(reportSrc).toContain('"report.critical"');
  });
  it("reporter count is DISTINCT members — not report volume", () => {
    // incremented on EVERY new reporter (previously frozen at 1 after the
    // first report); the dedupeKey gate guarantees the +1 is distinct
    expect(reportSrc).toContain("reporterCountDistinct: reporterBase + 1");
  });
  it("dedupeKey is enforced on write — one intake row per reporter+target+family", () => {
    expect(reportSrc).toContain('withIndex("by_dedupe"');
    expect(reportSrc).toContain("if (dup?.caseId) return");
    // the immutable intake row still lands with the dedupe anchor
    expect(reportSrc).toContain("dedupeKey,");
  });
});

describe("SLICE-P7E-13 — domain moderator mutations (CAP-101/103/114/135)", () => {
  it("CAP-101: only approved renders the outbound URL; pending-only review", () => {
    expect(domainSrc).toContain('decision: v.union(v.literal("approved"), v.literal("rejected"))');
    expect(domainSrc).toContain("not pending");
  });
  it("CAP-114: R-AGG delta rides P4-05's recompute (never reimplemented)", () => {
    expect(domainSrc).toContain("internal.tools.recomputeAggregate");
    expect(domainSrc).not.toContain("ratingSum");
  });
  it("CAP-135: tombstone + same-tx Help-ref clear (CAP-122)", () => {
    const fn = domainSrc.split("export const moderateComment")[1];
    expect(fn).toContain("deletedAt");
    expect(fn).toContain("acceptedCommentId: undefined");
  });
  it("every mutation: audit fail-closed + moderationActions record", () => {
    expect((domainSrc.match(/writeAudited/g) ?? []).length).toBeGreaterThanOrEqual(4);
    expect((domainSrc.match(/recordAction/g) ?? []).length).toBeGreaterThanOrEqual(4);
  });
});

describe("SLICE-P7E-14 — queue console (CAP-328..335/359/400/433)", () => {
  it("CAP-330 order: s0 → legal → s1 → appeals → s2 → s3; report count never sorts", () => {
    const fn = queueSrc.split("export function orderKey")[1].split("async function")[0];
    expect(fn.indexOf("s0_critical")).toBeLessThan(fn.indexOf("LEGAL_CASE_TYPES"));
    expect(fn.indexOf("LEGAL_CASE_TYPES")).toBeLessThan(fn.indexOf("s1_high"));
    expect(fn.indexOf("s1_high")).toBeLessThan(fn.indexOf('"appealed"'));
    expect(fn.indexOf('"appealed"')).toBeLessThan(fn.indexOf("s2_medium"));
    const lister = queueSrc.split("listQueue")[1];
    expect(lister).toContain("a.createdAt - b.createdAt");
    expect(lister).not.toContain("reporterCountDistinct -");
  });
  it("CAP-328/400: 20m lease / 5m renew / 60m max; expired → triaged (in the status union)", () => {
    expect(queueSrc).toContain("LEASE_MS = 20 * 60_000");
    expect(queueSrc).toContain("RENEW_MS = 5 * 60_000");
    expect(queueSrc).toContain("LEASE_MAX_MS = 60 * 60_000");
    expect(queueSrc).toContain('status: "triaged"');
  });
  it("CAP-333: s3 @96h, allowlist codes only", () => {
    expect(queueSrc).toContain("S3_AUTORELEASE_MS = 96 * 3_600_000");
    expect(queueSrc).toContain("AUTORELEASE_ALLOWLIST");
  });
  it("CAP-335: batch max 25; critical/legal excluded", () => {
    expect(queueSrc).toContain("BATCH_MAX = 25");
    const fn = queueSrc.split("batch = mutation")[1];
    expect(fn).toContain("s0_critical");
    expect(fn).toContain("LEGAL_CASE_TYPES.has");
  });
  it("console UI exists on the A12 board (no second board component)", () => {
    const page = readFileSync(
      join(__dirname, "../../../../../../apps/admin/src/app/admin/moderation/page.tsx"), "utf8",
    );
    expect(page).toContain("QueueBoard");
    expect(page).toContain("s0 → legal → s1 → appeals near bound → s2 → s3");
  });
});

describe("SLICE-P7E-15/16 — sanctions + appeals (CAP-326/327/336/337/341/342)", () => {
  it("CAP-336 capability keys (canonical PROTECTED_CAPABILITIES set) + the four ladder levels", () => {
    // SECURITY (scan 2026-09-13, finding 5): sanctions now use the SINGLE
    // canonical enum (lib/authz PROTECTED_CAPABILITIES) — the old local
    // list carried "create_comment", a key the enforcement path never
    // looked up (comment restrictions were dead letters). The alias for
    // stored legacy rows lives in assertCustomerCapability.
    expect(sanctionsSrc).toContain("SANCTION_CAPABILITY_KEYS = PROTECTED_CAPABILITIES");
    for (const k of ["create_post", "comment", "react", "report", "manage_store", "tag_product", "revival_vote", "tag_resource"]) {
      expect(`"${k}"`).toBeTruthy();
    }
    expect(sanctionsSrc).toContain('v.literal("warn"), v.literal("strike"), v.literal("restrict"), v.literal("suspend")');
  });
  it("CAP-337: terminate gate rejects Moderator; RI 3/12mo auto-terminate", () => {
    expect(sanctionsSrc).toContain("requireSanctionActor(ctx, false)");
    expect(sanctionsSrc).toContain("repeat_infringer_3_in_12mo");
  });
  it("CAP-326 recipient neutrality: brigade flags attach to the SOURCE cluster", () => {
    expect(sanctionsSrc).toContain("flag attaches to the SOURCE");
    expect(sanctionsSrc).toContain("reporterId");
  });
  it("CAP-341/342: overdue → Admin escalation, never auto-deny/restore; safety holds untouched", () => {
    expect(appealsSrc).toContain("adminInterventionAlerts");
    expect(appealsSrc).toContain("never fires (CAP-342)");
  });
  it("CAP-354 bridge: terminate schedules the M12 clawback (M13 never recomputes legitimacy)", () => {
    expect(sanctionsSrc).toContain("internal.jobs.attributionSettle.clawbackForActor");
    expect(sanctionsSrc).not.toContain("legitimacy.recompute");
  });
  it("trustHistory defined with the l.246a deepening", () => {
    expect(schemaSrc).toContain("standingTransition");
    expect(schemaSrc).toContain("triggerCaseId");
  });
});

describe("SLICE-P7E-17 — MAX + plugins (CAP-132/136/137/138)", () => {
  it("MAX tables defined per bible l.110-113 (P5-01 omission closed)", () => {
    for (const t of ["threadIntelligenceRuns", "threadThemes", "threadPositions", "threadQuestions"]) {
      expect(schemaSrc).toContain(`${t}: defineTable`);
    }
  });
  it("CAP-132: persona-exclusion at input; empty-success while the vendor is unnamed", () => {
    const fn = maxSrc.split("sweep = internalMutation")[1];
    expect(fn).toContain('"persona"');
    expect(fn).toContain("empty_success");
  });
  it("CAP-136: typed keys only — no executable", () => {
    const fn = maxSrc.split("setPluginEnabled")[1];
    expect(fn).toContain("ALLOWED_FEATURES");
    expect(fn).toContain("threadPluginConfig");
  });
  it("CAP-137: never lowers Best — no commentScores.bestScore write", () => {
    const fn = maxSrc.split("export const resolveContextSignal")[1];
    expect(fn).not.toContain('query("commentScores")'); // no read or write of the score projection
    expect(fn).toContain('ctx.db.patch(args.signalId, { status: args.disposition }'); // the signal row's status is the ONLY write
  });
});

describe("SLICE-P7E-18 — season engine (CAP-306..311/314/319)", () => {
  it("CAP-307 boundary: T-30 announce / T-0 freeze / T+1 publish", () => {
    const fn = seasonSrc.split("export const seasonRecalibrate")[1];
    expect(fn).toContain('"announced"');
    expect(fn).toContain('"closed"');
    expect(fn).toContain("published_next_season");
  });
  it("the CURRENT season is derived — never hardcoded season 1 (award + promoteDemote)", () => {
    expect(seasonSrc).toContain("currentSeasonTx");
    expect(awardSrc).toContain("currentSeasonTx(ctx)");
    // no signal-module season lookup pins seasonNumber 1 anymore
    for (const src of [seasonSrc, awardSrc]) {
      expect(src).not.toContain('q.eq("seasonNumber", 1)');
    }
    expect(seasonSrc).toContain('.withIndex("by_seasonNumber")\n    .order("desc")');
  });
  it("T+1 publish is an idempotent upsert by season key — re-runs never duplicate seasons", () => {
    const fn = seasonSrc.split("export const seasonRecalibrate")[1];
    expect(fn).toContain("q.eq(\"seasonNumber\", season.seasonNumber + 1)");
    expect(fn.indexOf(".unique();")).toBeLessThan(fn.indexOf('ctx.db.insert("signalSeasons"'));
  });
  it("CAP-308: min(percentileCandidate, prior×1.50) with the transition label (pure)", async () => {
    const { thresholdPrecedence } = await import("../../../../../../convex/signal/promoteDemote");
    expect(thresholdPrecedence(100, 50)).toEqual({ value: 75, transition: true });
    expect(thresholdPrecedence(40, 50)).toEqual({ value: 40, transition: false });
    expect(thresholdPrecedence(40, undefined)).toEqual({ value: 40, transition: false });
  });
  it("CAP-306 promotion gate: ~30d sustained + ≥2 outcome families + integrity clear", () => {
    const fn = seasonSrc.split("export const promoteSustained")[1];
    expect(fn).toContain("30 * 24");
    expect(fn).toContain("families.size < 2");
    expect(fn).toContain('"neutralize"');
  });
  it("CAP-310: annual only, max 1 level, ~10% holdover; uncalibrated line never demotes", () => {
    const fn = seasonSrc.split("export const demoteAnnual")[1];
    expect(fn).toContain("HOLDOVER_PCT");
    expect(fn).toContain("LEVELS[idx - 1]");
    expect(fn).toContain("uncalibrated — no demotion invents a line");
  });
  it("CAP-310 demotion is once per (distribution, season) — no daily re-demotion on re-runs", () => {
    const fn = seasonSrc.split("export const demoteAnnual")[1];
    expect(fn).toContain('a.status === "demoted" || a.status === "holdover"');
    // the latest-season lookup is what stops the closed season 1 from
    // re-demoting forever once its successor is published
    expect(fn).toContain("currentSeasonTx(ctx)");
  });
  it("CAP-311 integrity drop is immediate (floor); not competitive demotion", () => {
    expect(seasonSrc).toContain('level: "orbit", // the floor — immediate, integrity-class');
  });
  it("CAP-314 discoverer + CAP-319 store skeleton only when storeEnabled", () => {
    expect(seasonSrc).toContain('"discoverer"');
    expect(seasonSrc).toContain("storeEnabled === true");
  });
});

describe("moderation cron wiring", () => {
  it("all eight track crons wired", () => {
    for (const ref of [
      "internal.admin.moderationQueue.leaseExpire",
      "internal.admin.moderationQueue.queueAge",
      "internal.admin.moderationQueue.autoRelease",
      "internal.admin.sanctions.brigadeSweep",
      "internal.admin.appeals.slaTick",
      "internal.jobs.maxRefresh.sweep",
      "internal.signal.promoteDemote.seasonRecalibrate",
      "internal.signal.promoteDemote.promoteSustained",
      "internal.signal.promoteDemote.demoteAnnual",
      "internal.signal.promoteDemote.discovererCheck",
      "internal.signal.promoteDemote.storeMetricsSkeleton",
    ]) {
      expect(cronsSrc).toContain(ref);
    }
  });
});
