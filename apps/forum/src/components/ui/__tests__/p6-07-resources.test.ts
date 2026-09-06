/* eslint-disable @typescript-eslint/no-explicit-any -- pure-function + source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P6-07 acceptance tests — CAP-224/212/213/215/216/229/570/214/
 * 376/377. Quotes live in convex/resources.ts + jobs/settleDownload.ts. */

import { quotaKeys, QUOTA_DAY, QUOTA_WEEK } from "../../../../../../convex/resources";

const convexRoot = join(__dirname, "../../../../../../convex");
const src = readFileSync(join(convexRoot, "resources.ts"), "utf8");
const settleSrc = readFileSync(join(convexRoot, "jobs/settleDownload.ts"), "utf8");
const cronsSrc = readFileSync(join(convexRoot, "crons.ts"), "utf8");
const seedSrc = readFileSync(join(convexRoot, "seed.ts"), "utf8");

describe("SLICE-P6-07 — CAP-376 quotaKeys (user-local calendar, DEC-S19)", () => {
  it("dayKey is YYYY-MM-DD in the member's IANA zone; UTC fallback on garbage zones", () => {
    const now = new Date("2026-09-06T20:00:00Z"); // 2026-09-07 01:30 in IST
    const ist = quotaKeys("Asia/Kolkata", now);
    expect(ist.dayKey).toBe("2026-09-07"); // local, not UTC
    const utc = quotaKeys("UTC", now);
    expect(utc.dayKey).toBe("2026-09-06");
    const fallback = quotaKeys("Not/AZone", now);
    expect(fallback.dayKey).toBe(utc.dayKey); // fallback UTC (quoted)
    expect(ist.dayKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("weekKey is the ISO Monday of the local date (Sunday belongs to the PRIOR Monday)", () => {
    // 2026-09-06 is a Sunday in UTC → ISO week Monday = 2026-08-31
    const sunday = new Date("2026-09-06T12:00:00Z");
    expect(quotaKeys("UTC", sunday).weekKey).toBe("2026-08-31");
    // 2026-09-09 is a Wednesday → Monday = 2026-09-07
    const wednesday = new Date("2026-09-09T12:00:00Z");
    expect(quotaKeys("UTC", wednesday).weekKey).toBe("2026-09-07");
    // Monday itself
    const monday = new Date("2026-09-07T12:00:00Z");
    expect(quotaKeys("UTC", monday).weekKey).toBe("2026-09-07");
  });
});

describe("SLICE-P6-07 — acquire (CAP-212/215/377/570)", () => {
  it("the quoted limits: 5/day · 20/week, server-side", () => {
    expect(QUOTA_DAY).toBe(5);
    expect(QUOTA_WEEK).toBe(20);
    expect(src).toContain("daily quota reached");
    expect(src).toContain("weekly quota reached");
  });

  it("concurrent double-get → one row (the unique lookup precedes every insert)", () => {
    const fn = src.split("export const acquire")[1].split("export const download")[0];
    const lookup = fn.indexOf("by_user_resource");
    const insert = fn.indexOf('insert("acquisitions"');
    expect(lookup).toBeGreaterThan(-1);
    expect(insert).toBeGreaterThan(lookup);
    expect(fn).toContain("alreadyAcquired");
  });

  it("lazy reset INSIDE the acquire txn (no midnight cron)", () => {
    const fn = src.split("export const acquire")[1] ?? "";
    expect(fn).toContain("rolledDay");
    expect(fn).toContain("rolledWeek");
    expect(src).not.toContain("runAfter");
  });

  it("CAP-570 resource_acquired appends in the SAME mutation (rolls back together)", () => {
    const fn = src.split("export const acquire")[1].split("export const download")[0];
    expect(fn).toContain('eventType: "resource_acquired"');
    expect(fn).not.toContain("runAfter");
  });
});

describe("SLICE-P6-07 — download (CAP-213/216)", () => {
  it("requires a prior acquisition; does NOT touch the ledger", () => {
    const fn = src.split("export const download")[1] ?? "";
    expect(fn).toContain("acquire first");
    expect(fn).not.toContain("resourceQuotaLedgers");
  });

  it("records downloads with a settlement-pending integrityClass", () => {
    expect(src).toContain("pending_settlement");
  });

  it("NO rawEvents write (the omission is intentional — quoted)", () => {
    expect(src).not.toContain("captureEvent");
  });

  it("CAP-216 settlement: first-download-only promotion; no Signal math", () => {
    expect(settleSrc).toContain("qualified_download");
    expect(settleSrc).toContain("redownload_no_signal");
    expect(settleSrc).not.toContain('insert("signalLedger"'); // the mint is M12's (P7)
    expect(cronsSrc).toContain("internal.jobs.settleDownload.settleQualifiedDownloads");
  });
});

describe("SLICE-P6-07 — the rest of the surface", () => {
  it("CAP-229: the attribution line renders from the row (present in browse + card)", () => {
    expect(src).toContain("attributionLine");
  });

  it("browse is flag-gated (resources.library.enabled)", () => {
    expect(src).toContain("resources.library.enabled");
    expect(seedSrc).toContain('"resources.library.enabled"');
  });

  it("CAP-214 tagInPost: own-post only + published resource + idempotent join", () => {
    const fn = src.split("export const tagInPost")[1] ?? "";
    expect(fn).toContain("only the post author");
    expect(fn).toContain("postResources");
  });

  it("view costs nothing — the browse path writes no acquisition/ledger/quota rows", () => {
    const fn = src.split("export const listLibrary")[1].split("export const getAcquisitionState")[0];
    expect(fn).not.toContain("insert");
    expect(fn).not.toContain("patch");
  });
});
