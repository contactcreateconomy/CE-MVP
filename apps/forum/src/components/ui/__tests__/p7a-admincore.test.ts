/* eslint-disable @typescript-eslint/no-explicit-any -- source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P7A-01…11 acceptance tests — AdminCore: home, support, wiki,
 * readiness. Quotes live in the source modules. */

const convexRoot = join(__dirname, "../../../../../../convex");
const forumRoot = join(__dirname, "../../../..");
const read = (root: string, rel: string) => readFileSync(join(root, rel), "utf8");

const schemaSrc = read(convexRoot, "schema.ts");
const widgetsSrc = read(convexRoot, "admin/widgetsCatalog.ts");
const interventionsSrc = read(convexRoot, "admin/interventions.ts");
const homeSrc = read(convexRoot, "admin/home.ts");
const countersSrc = read(convexRoot, "admin/counters.ts");
const alertsSrc = read(convexRoot, "admin/homeAlertWriters.ts");
const supportSrc = read(convexRoot, "admin/support.ts");
const wikiSrc = read(convexRoot, "admin/wiki.ts");
const readinessSrc = read(convexRoot, "admin/readiness.ts");
const cronsSrc = read(convexRoot, "crons.ts");
const configSrc = read(convexRoot, "config.ts");
const stopSrc = read(convexRoot, "admin/stop.ts");

describe("SLICE-P7A-01 — widget catalog grow (CAP-569)", () => {
  it("exactly four new routes with the right actors", () => {
    for (const key of ["admin-home", "admin-support", "admin-wiki", "admin-readiness"]) {
      expect(widgetsSrc).toContain(`widgetKey: "${key}"`);
    }
    const homeRow = widgetsSrc.split('widgetKey: "admin-home"')[1].split("},")[0];
    expect(homeRow).toContain('["administrator"]');
    const supportRow = widgetsSrc.split('widgetKey: "admin-support"')[1].split("},")[0];
    expect(supportRow).toContain('["support_operator"]');
    const wikiRow = widgetsSrc.split('widgetKey: "admin-wiki"')[1].split("},")[0];
    expect(wikiRow).toContain("support_operator");
  });
});

describe("SLICE-P7A-03 — intervention lifecycle (CAP-407-410/401)", () => {
  it("CAP-407 copy contract: whatHappening + whatToDo + source-controlled routeKey", () => {
    expect(interventionsSrc).toContain("whatHappening");
    expect(interventionsSrc).toContain("whatToDo");
    expect(interventionsSrc).toContain("assertDeepLinkKey");
  });
  it("CAP-410: snooze ≤24h and CRITICAL FORBIDDEN (quoted)", () => {
    const fn = interventionsSrc.split("snooze = mutation")[1];
    expect(fn).toContain("critical alerts cannot be snoozed");
    expect(fn).toContain("24 * 3_600_000");
  });
  it("lifecycle open → acknowledged|snoozed → resolved; audit on 408/409/410", () => {
    for (const m of ["ack", "resolve", "snooze"]) {
      const fn = interventionsSrc.split(`${m} = mutation`)[1].split("export const")[0];
      expect(fn).toContain("writeAudited");
    }
  });
});

describe("SLICE-P7A-02/04 — home compose + counters (CAP-391/411/412/427/428)", () => {
  it("R-HOME strip order (quoted): s0 → legal → unsafe → outage → STOP → M18 → interventions", () => {
    const fn = homeSrc.split("buildStrip")[1].split("return strip")[0];
    expect(fn.indexOf("s0_critical")).toBeLessThan(fn.indexOf("actionDueAt"));
    expect(fn.indexOf("actionDueAt")).toBeLessThan(fn.indexOf("under_review"));
    expect(fn.indexOf("under_review")).toBeLessThan(fn.indexOf("platformHealth"));
    expect(fn.indexOf("platformHealth")).toBeLessThan(fn.indexOf('type", "stop'));
    expect(fn.indexOf('type", "stop')).toBeLessThan(fn.indexOf('=== "critical"'));
  });
  it("≤8 next actions; same case id collapses once; compose is Administrator-only", () => {
    expect(homeSrc).toContain("MAX_NEXT_ACTIONS = 8");
    expect(homeSrc).toContain("seenCaseIds");
    expect(homeSrc).toContain('!roles.includes("administrator")) return { state: "forbidden" }');
  });
  it("CAP-428: stale → null ('—'), never 0; heartbeat >15m flagged (quoted)", () => {
    expect(homeSrc).toContain("STALE_AFTER_MS");
    expect(homeSrc).toContain("HEARTBEAT_STALE_MS = 15 * 60_000");
    expect(homeSrc).toContain("value: stale ? null : c.value");
  });
  it("no unbounded reads (INV-M15-7): every query is take-bounded", () => {
    const fns = homeSrc + countersSrc;
    expect(fns).not.toContain(".collect()");
    for (const m of fns.match(/\.take\((\d+)\)/g) ?? []) {
      expect(Number(m.match(/\d+/)?.[0])).toBeLessThanOrEqual(600);
    }
  });
  it("CAP-412: counter failure → intervention; unavailable ≠ zero", () => {
    expect(countersSrc).toContain("interventionCreateTx");
    expect(countersSrc).toContain("unavailable, not zero");
  });
  it("counter keys = ONLY what compose displays (no platform-wide enum)", () => {
    expect(countersSrc).toContain("COUNTER_KEYS");
    expect(countersSrc.split("COUNTER_KEYS")[1].split("] as const")[0]).not.toContain("platform");
  });
});

describe("SLICE-P7A-05/06 — S0 cover + remote writers (CAP-399/332/334/381/484/318)", () => {
  it("CAP-399 quoted title + >4h trip + the shared ingest.throttle flag", () => {
    expect(alertsSrc).toContain("INGEST THROTTLED — S0 BACKLOG");
    expect(alertsSrc).toContain("S0_THROTTLE_MS = 4 * 3_600_000");
    expect(alertsSrc).toContain('key: "ingest.throttle"');
  });
  it("+15m backup / +15m Founder ladders (R-S0-COVER quoted)", () => {
    expect(alertsSrc).toContain("15 * 60_000");
    expect(alertsSrc).toContain("30 * 60_000"); // +15m after the backup step
  });
  it("CAP-332 soft thresholds 250/400; CAP-334 >500 → throttle + DISTINCT banner", () => {
    expect(alertsSrc).toContain("SOFT_ALERT_250 = 250");
    expect(alertsSrc).toContain("SOFT_ALERT_400 = 400");
    expect(alertsSrc).toContain("HARD_THROTTLE_500 = 500");
    expect(alertsSrc).toContain("INGEST THROTTLED — FLOOD DETECTED");
  });
  it("AC-5: throttle never stops appeals/legal/erasure/safety/Admin (quoted in the copy)", () => {
    expect(alertsSrc).toContain("appeals, legal intake, privacy/erasure, safety reports");
  });
  it("CAP-381: 14-day floor + launch floor 40 unchanged; drip fixture degraded (no invented cron)", () => {
    expect(alertsSrc).toContain("DRIP_SUPPLY_FLOOR_DAYS = 14");
    expect(alertsSrc).toContain("DRIP_LAUNCH_FLOOR = 40");
    expect(alertsSrc).not.toContain("export const dripRelease"); // the cron stays P7G-05's
    expect(cronsSrc).not.toContain("drip.release"); // the SUPPLY sweep is ours; the RELEASE cron is not
  });
  it("CAP-484 monitors: thin indexed = 0 · held indexed = 0; CAP-318 reads integrityFlags only", () => {
    expect(alertsSrc).toContain("thinIndexedCount");
    expect(alertsSrc).toContain("heldIndexedCount");
    expect(alertsSrc).toContain('query("integrityFlags")');
    expect(alertsSrc).not.toContain('insert("adminInterventionAlerts"'); // the shared create only — no forked rows
  });
  it("CAP-414 NOT duplicated here (P3-10 owns the vacant-slot writer)", () => {
    expect(alertsSrc).not.toContain('alertKey: "vacant');
  });
});

describe("SLICE-P7A-07/08 — support console (CAP-402-406/020/024/029/432)", () => {
  it("CAP-402 bounds: ≤5 · ≤7d · max 1 active/user · unique incident; no opsExempt", () => {
    expect(supportSrc).toContain("≤5 extra acquires");
    expect(supportSrc).toContain("7 * 24 * 3_600_000");
    expect(supportSrc).toContain("max 1 active grant per user");
    expect(supportSrc).toContain("incident already granted");
    const grantFn = supportSrc.split("quotaGrant = mutation")[1].split("export const")[0];
    expect(grantFn).not.toContain("opsExempt");
  });
  it("CAP-020: 30/1h per operator; staff NOT rate-exempt", () => {
    expect(supportSrc).toContain('"support.action"');
    expect(read(convexRoot, "lib/rateLimit.ts")).toContain('"support.action", max: 30');
  });
  it("CAP-432: >3/90d → Admin intervention (Home, not this screen)", () => {
    const fn = supportSrc.split("quotaGrant = mutation")[1];
    expect(fn).toContain("interventionCreateTx");
    expect(fn).toContain("90 * 24 * 3_600_000");
  });
  it("CAP-404 is the ONLY mutation name (no timezone.correct alias); IANA write + audit", () => {
    expect(supportSrc).toContain("export const timezoneFix");
    expect(supportSrc).not.toContain("export const timezoneCorrect"); // no alias (V1, quoted)
    expect(supportSrc).toContain("Asia/Kolkata");
  });
  it("CAP-405: note writes auditLog ONLY (no users note field)", () => {
    const fn = supportSrc.split("noteCreate")[1].split("export const")[0];
    expect(fn).not.toContain("db.insert");
    expect(fn).not.toContain("db.patch");
  });
  it("CAP-406/029: masked allowlist — email/mobile/token/evidence NEVER in the projection", () => {
    const fn = supportSrc.split("userSummary")[1].split("export const")[0];
    expect(fn).not.toContain("email");
    expect(fn).not.toContain("mobile");
    expect(fn).not.toContain("tokenIdentifier");
  });
});

describe("SLICE-P7A-09 — wiki (CAP-418/419/420)", () => {
  it("staff-role gate; anonymous fails (CAP-418 quoted)", () => {
    expect(wikiSrc).toContain("requireAnyStaffRole");
    expect(wikiSrc).toContain("wiki: authentication required");
  });
  it("CAP-420: missing slug = explicit 'no article yet', not a broken panel", () => {
    expect(wikiSrc).toContain("No article yet");
  });
  it("CAP-419: deploySync sanitizes — Founder cannot inject scripts; no in-app editor", () => {
    expect(wikiSrc).toContain("sanitizeMarkdown");
    expect(wikiSrc).toContain("<script");
    expect(wikiSrc).not.toContain("export const edit");
  });
});

describe("SLICE-P7A-10/11 — readiness (CAP-509/510/023/435)", () => {
  it("persisted row = EXACTLY the five bible fields (V5 quoted)", () => {
    const fn = readinessSrc.split("evaluate = mutation")[1].split("export const")[0];
    const insert = fn.split("db.insert")[1].split("})")[0];
    for (const f of ["evaluatedAt", "overall", "blockers", "warnings", "evidence"]) {
      expect(insert).toContain(f);
    }
    expect(insert).not.toContain("checklistVersion");
    expect(insert).not.toContain("evaluatorUserId");
  });
  it("8 categories (DECISIONS-LOCKED #8 correction) incl. ranking calibration", () => {
    const cats = readinessSrc.split("READINESS_CATEGORIES")[1].split("] as const")[0];
    expect(cats.match(/"/g)?.length).toBe(16); // 8 names
    expect(cats).toContain("ranking_calibration_reviewed");
  });
  it("unavailable = FAIL; CAP-023 preview nuance; CAP-500 quoted blocker string", () => {
    expect(readinessSrc).toContain("unavailable = FAIL");
    expect(readinessSrc).toContain("founder_bootstrap_completed");
    expect(readinessSrc).toContain("Redrive runbook required before open beta");
  });
  it("CAP-510 invoked SYNCHRONOUSLY in BOTH setters; absent/blocked/warning/revoked all reject", () => {
    expect(configSrc).toContain("assertSignupOpenAllowedTx");
    expect(stopSrc).toContain("assertSignupOpenAllowedTx");
    const fn = readinessSrc.split("assertSignupOpenAllowedTx")[1].split("export const assertSignupOpenAllowed")[0];
    expect(fn).toContain("order(\"desc\")"); // LATEST row, not .first()
    expect(fn).toContain('latest.overall !== "ready"');
  });
  it("no force-open control on the checklist screen (contract §1 quoted)", () => {
    const page = read(forumRoot, "src/app/(app)/admin/readiness/page.tsx");
    expect(page).toContain("CAP-510");
    expect(page).not.toContain("signupModeSet");
  });
  it("warning/revoked literals reserved — no write trigger invented", () => {
    expect(readinessSrc).not.toContain('"warning"');
    expect(readinessSrc).not.toContain('"revoked"');
  });
});

describe("AdminCore cron + registry wiring", () => {
  it("all seven job crons wired to internal functions", () => {
    for (const ref of [
      "internal.admin.counters.refresh",
      "internal.admin.homeAlertWriters.s0CoverSweep",
      "internal.admin.homeAlertWriters.queueLoadSweep",
      "internal.admin.homeAlertWriters.dripSupplySweep",
      "internal.admin.homeAlertWriters.seoHealthSweep",
      "internal.admin.homeAlertWriters.rankIntegritySweep",
      "internal.admin.interventions.sweepOrphans",
    ]) {
      expect(cronsSrc).toContain(ref);
    }
  });
  it("ingest.throttle + ranking.calibration.reviewed registry rows seeded", () => {
    const seed = read(convexRoot, "seed.ts");
    expect(seed).toContain('"ingest.throttle"');
    expect(seed).toContain('"ranking.calibration.reviewed"');
  });
  it("platformHealth carries the seven Core-enums state literals (bible l.392)", () => {
    const region = schemaSrc.split("platformHealth: defineTable")[1].split("adminWikiArticles")[0];
    for (const lit of ["healthy", "degraded", "unavailable", "recovering", "stale", "dead", "never_ran"]) {
      expect(region).toContain(`v.literal("${lit}")`);
    }
  });
});
