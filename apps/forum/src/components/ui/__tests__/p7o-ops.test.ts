/* eslint-disable @typescript-eslint/no-explicit-any -- source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P7O-01…09 acceptance tests — the four OPS consoles + erasure +
 * client emit. F-22 and FATAL-M16-01 are the precision items. */

const convexRoot = join(__dirname, "../../../../../../convex");
const forumRoot = join(__dirname, "../../../..");
const read = (root: string, rel: string) => readFileSync(join(root, rel), "utf8");

const schemaSrc = read(convexRoot, "schema.ts");
const widgetsSrc = read(convexRoot, "admin/widgetsCatalog.ts");
const projectionsSrc = read(convexRoot, "analytics/projections.ts");
const analyticsSrc = read(convexRoot, "admin/analytics.ts");
const reliabilitySrc = read(convexRoot, "admin/reliability.ts");
const utmSrc = read(convexRoot, "admin/utm.ts");
const cronsSrc = read(convexRoot, "crons.ts");
const consentSrc = read(convexRoot, "consent.ts");

describe("SLICE-P7O-01 — widget rows", () => {
  it("four OPS routes registered; support_operator never in the actor sets", () => {
    for (const key of ["admin-analytics", "admin-reliability", "admin-utm", "admin-seo"]) {
      expect(widgetsSrc).toContain(`widgetKey: "${key}"`);
      const row = widgetsSrc.split(`widgetKey: "${key}"`)[1].split("},")[0];
      expect(row).not.toContain("support_operator");
    }
  });
});

describe("SLICE-P7O-03 — projections + effectiveCountable (CAP-439-448/457)", () => {
  it("CAP-440 quoted formula (pure)", async () => {
    const { effectiveCountable } = await import("../../../../../../convex/analytics/projections");
    expect(effectiveCountable({ isCountableAtWrite: true, tombstoneState: "active" }, [])).toBe(true);
    expect(effectiveCountable({ isCountableAtWrite: false, tombstoneState: "active" }, [])).toBe(false);
    expect(effectiveCountable({ isCountableAtWrite: true, tombstoneState: "redacted" }, [])).toBe(false);
    for (const t of ["invalidate", "reverse", "detach_identity", "exclude_staff", "exclude_test"]) {
      expect(effectiveCountable({ isCountableAtWrite: true, tombstoneState: "active" }, [{ adjustmentType: t }])).toBe(false);
    }
  });
  it("CAP-439: append adjustment + projections → recalculating; rawEvents NEVER rewritten", () => {
    const fn = projectionsSrc.split("appendAdjustment")[1].split("export const l08Core")[0];
    expect(fn).toContain("idempotencyKey");
    expect(fn).toContain('freshness: "recalculating"');
    expect(fn).not.toContain('patch(e._id');
  });
  it("CAP-445 windows verbatim in the L08 projection", () => {
    expect(projectionsSrc).toContain('impressionToSignup: "7d"');
    expect(projectionsSrc).toContain('signupToFirstAction: "7d"');
    expect(projectionsSrc).toContain('signupToAcquire: "14d"');
    expect(projectionsSrc).toContain('acquireToDay7: "30d"');
  });
  it("CAP-446 staff excluded; CAP-448 three funnels never merged (labeled)", () => {
    expect(projectionsSrc).toContain("(e as any).isStaff) continue");
    for (const funnel of ["commerce_store", "commerce_library", "commerce_affiliate"]) {
      expect(projectionsSrc).toContain(`projectionKey: "${funnel}"`);
    }
    expect(projectionsSrc).toContain("conversionType");
  });
  it("CAP-457: dual-browser orphan = instrumentation anomaly, never a block", () => {
    expect(projectionsSrc).toContain("dual_browser_login");
    expect(projectionsSrc).toContain("NOT a block");
  });
  it("M16 tables defined per bible l.272-279 + l.286", () => {
    for (const t of [
      "analyticsEligibilityAdjustments", "analyticsProjections", "analyticsWeeklyDecisions",
      "analyticsReconcileResults", "instrumentationIncidents", "utmDictionary",
    ]) {
      expect(schemaSrc).toContain(`${t}: defineTable`);
    }
  });
});

describe("SLICE-P7O-02 — founder dashboard (CAP-463/449/451/452/458/459)", () => {
  it("seven cards (the contract OQ#2 set)", () => {
    const set = analyticsSrc.split("SEVEN_CARDS")[1].split("] as const")[0];
    for (const card of ["l08_core", "s18_core", "activation_inline", "commerce_library", "commerce_affiliate", "commerce_store", "signal_card"]) {
      expect(set).toContain(card);
    }
  });
  it("CAP-459 cohort-incomplete label (never zero-catastrophe); CAP-451 Signal totals only", () => {
    expect(analyticsSrc).toContain("cohort_incomplete");
    expect(analyticsSrc).toContain("never event-weight-resolvable breakdown");
    expect(analyticsSrc).toContain('breakdown: "sealed"');
  });
  it("CAP-452: Founder-only record (first-administrator derivation — real gate); admin views", () => {
    const fn = analyticsSrc.split("export const recordWeeklyDecision")[1];
    expect(fn).toContain("Founder only (CAP-452)");
    expect(analyticsSrc).toContain("grantedAt - b.grantedAt"); // the CAP-007 derivation
  });
  it("stores metricSnapshots + projectionDefinitionVersion + catalogVersion + createdAt (quoted)", () => {
    const fn = analyticsSrc.split("export const recordWeeklyDecision")[1].split("\n});")[0];
    for (const f of ["metricSnapshots", "projectionDefinitionVersion", "catalogVersion", "createdAt"]) {
      expect(fn).toContain(f);
    }
  });
});

describe("SLICE-P7O-04/05 — reliability + redrive (CAP-499/500/501/503, F-22)", () => {
  it("CAP-501 liveness from lastSuccessAt; ×1.5 stale / ×3 dead+alert / never_ran; NOT the 15m UI TTL", () => {
    expect(reliabilitySrc).toContain("STALE_FACTOR = 1.5");
    expect(reliabilitySrc).toContain("DEAD_FACTOR = 3");
    expect(reliabilitySrc).toContain("lastSuccess");
    expect(reliabilitySrc).toContain("never_ran");
    expect(reliabilitySrc).toContain("NOT the 15m UI TTL");
  });
  it("manual_review VISIBLE with no redrive; DECISIONS-LOCKED #5 disposition actions", () => {
    expect(reliabilitySrc).toContain("disposeManualReview");
    expect(reliabilitySrc).toContain("approve_retry");
    expect(reliabilitySrc).toContain("cancel");
  });
  it("F-22 fence: manual_only + manual_review redrive REJECT fail-closed (quoted)", () => {
    const fn = reliabilitySrc.split("export const redriveDeadLetter")[1].split("export const disposeManualReview")[0];
    expect(fn).toContain("manual_only");
    expect(fn).toContain("F-22 open");
    expect(fn).toContain("manual_review");
  });
  it("CAP-500 revalidates at action time: authz + STOP (CAP-518 wins) + target exists; stamps the two bible fields", () => {
    const fn = reliabilitySrc.split("export const redriveDeadLetter")[1].split("export const disposeManualReview")[0];
    expect(fn).toContain("STOP wins");
    expect(fn).toContain("target no longer exists");
    expect(fn).toContain("redrivenAt: Date.now()");
    expect(fn).toContain("redrivenByUserId: userId");
  });
  it("probe cron at 5m; the projection crons wired", () => {
    expect(cronsSrc).toContain('crons.interval("health probe", { minutes: 5 }');
    for (const ref of [
      "internal.analytics.projections.l08Core",
      "internal.analytics.projections.commerceFunnels",
      "internal.analytics.projections.orphanSweep",
    ]) {
      expect(cronsSrc).toContain(ref);
    }
  });
});

describe("SLICE-P7O-06 — UTM (CAP-566/479)", () => {
  it("dictionary versioned; maxLen 80 non-editable; generate is pure (no write)", async () => {
    const { generateUtmLink } = await import("../../../../../../convex/admin/utm");
    const dict = { allowedSources: ["newsletter"], allowedMediums: ["email"], maxLen: 80 };
    expect(generateUtmLink({ baseUrl: "https://x.io", dictionary: dict, source: "newsletter", medium: "email", campaign: "launch" })).toHaveProperty("url");
    expect(generateUtmLink({ baseUrl: "https://x.io", dictionary: dict, source: "bogus", medium: "email", campaign: "x" })).toHaveProperty("error");
    const seed = utmSrc.split("export const dictionarySeedEdit")[1].split("export const getDictionary")[0];
    expect(seed).toContain("maxLen: 80");
    expect(seed).not.toContain("captureEvent"); // pure dictionary write — no event capture
  });
  it("empty dictionary = disabled + guidance (States B)", () => {
    expect(utmSrc).toContain("Seed the dictionary to enable the builder");
  });
});

describe("SLICE-P7O-07 — SEO view (CAP-567/483)", () => {
  it("render-only; unavailable = '—' not zero; never-pulled is honest absence; no override", () => {
    const fn = utmSrc.split("export const seoHealthView")[1].split("export const gscPull")[0];
    expect(fn).toContain("No GSC pull on record");
    expect(fn).toContain("connected: false"); // absent metrics render as absence ("—"), the client maps null → "—"
    expect(fn).toContain("overrideAvailable: false");
  });
  it("GSC pull: optional API — unconfigured writes NOTHING", () => {
    const fn = utmSrc.split("export const gscPull")[1];
    expect(fn).toContain("GSC_API_KEY");
    expect(fn).toContain("pulled: false"); // unconfigured → NO write (counts never invented)
  });
});

describe("SLICE-P7O-08 — analytics erasure (CAP-453/454)", () => {
  it("request: one active per subject; detach via the P7O-03 helper (no double-stamp)", () => {
    const fn = utmSrc.split("export const erasureRequest")[1].split("export const erasureConfirm")[0];
    expect(fn).toContain("appendAdjustment");
    expect(fn).toContain("detach_identity");
    expect(fn).toContain("no double-stamp");
  });
  it("confirm: never fake-confirmed without the vendor; failed→retrying lifecycle", () => {
    const fn = utmSrc.split("export const erasureConfirm")[1];
    expect(fn).toContain("vendorConfirmed");
    expect(fn).toContain("failed");
    expect(fn).toContain("lastError");
  });
  it("analyticsDeletionRequests = the bible l.277 shape (timestamps M16 l.97)", () => {
    const region = schemaSrc.split("analyticsDeletionRequests: defineTable")[1].split("}),")[0];
    for (const f of ["analyticsSubjectId", "requestedAt", "submittedAt", "confirmedAt", "lastError", "retrying"]) {
      expect(region).toContain(f);
    }
  });
  it("CMP withdraw writes the SAME lifecycle table (one pipeline — CAP-506 not auto-wired)", () => {
    expect(consentSrc).toContain("analyticsDeletionRequests");
    expect(consentSrc).toContain("status: \"requested\"");
    expect(consentSrc).not.toContain("erasureConfirm");
  });
});

describe("SLICE-P7O-09 — client observational emit (CAP-444/456)", () => {
  it("CAP-456: unknown + server_authoritative names REJECT + log (never persist)", () => {
    const fn = utmSrc.split("export const clientEmit")[1];
    expect(fn).toContain("unknown event name");
    expect(fn).toContain("server_authoritative");
    expect(fn).toContain("CAP-456");
  });
  it("CAP-444 quoted precedence: never creates acquire/download/Signal/mod/sale/quota", () => {
    const fn = utmSrc.split("export const clientEmit")[1];
    expect(fn).toContain("FORBIDDEN_CLASSES");
    expect(fn).toContain("server-authoritative only");
  });
  it("consent default-deny until CMP analytics grant", () => {
    const fn = utmSrc.split("export const clientEmit")[1];
    expect(fn).toContain("analytics consent not granted");
  });
});

describe("OPS console pages", () => {
  it("all four routes render the honest-empty / directional postures", () => {
    expect(read(forumRoot, "src/app/(app)/admin/analytics/page.tsx")).toContain("Cohort incomplete");
    expect(read(forumRoot, "src/app/(app)/admin/reliability/page.tsx")).toContain("Approve");
    expect(read(forumRoot, "src/app/(app)/admin/utm/page.tsx")).toContain("Generate");
    expect(read(forumRoot, "src/app/(app)/admin/seo/page.tsx")).toContain("never zero");
  });
});
