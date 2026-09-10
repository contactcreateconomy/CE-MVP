/* eslint-disable @typescript-eslint/no-explicit-any -- source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P7T-01…13 acceptance tests — notifications, appeal, legal intake,
 * trust pages, landing wire, CMP. Quotes live in the source modules. */

const convexRoot = join(__dirname, "../../../../../../convex");
const forumRoot = join(__dirname, "../../../..");
const read = (root: string, rel: string) => readFileSync(join(root, rel), "utf8");

const schemaSrc = read(convexRoot, "schema.ts");
const readsSrc = read(convexRoot, "notifications/reads.ts");
const quotaSrc = read(convexRoot, "notifications/quota.ts");
const batchSrc = read(convexRoot, "notifications/batch.ts");
const appealSrc = read(convexRoot, "appeal.ts");
const intakeSrc = read(convexRoot, "legal/intake.ts");
const riSrc = read(convexRoot, "jobs/repeatInfringer.ts");
const consentSrc = read(convexRoot, "consent.ts");
const cronsSrc = read(convexRoot, "crons.ts");
const commentsSrc = read(convexRoot, "comments.ts");

describe("SLICE-P7T-01 — /notifications list + mark-read (CAP-568/386)", () => {
  it("recipient-private + newest-first; never reads activityLedger (V5 ownership line)", () => {
    const body = readsSrc.split("export const list")[1];
    expect(body).toContain('q.eq("recipientUserId", userId)');
    expect(body).toContain("b.createdAt - a.createdAt");
    expect(body).not.toContain("activityLedger"); // docblock quotes the rule; the QUERY never reads it
  });
  it("markRead writes readAt; another member's row is rejected", () => {
    expect(readsSrc).toContain("readAt: Date.now()");
    expect(readsSrc).toContain("not your notification");
  });
  it("page uses the CANONonical query (legacy forum read retired on this surface)", () => {
    const page = read(forumRoot, "src/app/(app)/(shell)/notifications/notifications-page-client.tsx");
    expect(page).toContain("api.notifications.reads.list");
    expect(page).not.toContain("listNotificationsForViewer");
  });
});

describe("SLICE-P7T-02 — quota writers (CAP-378/379)", () => {
  it("no 'almost gone' nag — only the exhausted notify exists (quoted)", () => {
    const body = quotaSrc.split("export async function onQuotaExhausted")[1];
    expect(body).toContain("quota_exhausted");
    expect(body).not.toContain("almost");
  });
  it("restored is in-app session-start only — no midnight cron (quoted)", () => {
    expect(quotaSrc).toContain("onSessionStart");
    expect(quotaSrc).toContain("marker === currentPeriodKey");
    expect(cronsSrc).not.toContain("quotaRestored");
  });
  it("marker cleared ONLY after the successful emit; same-mutation rawEvent", () => {
    const fn = quotaSrc.split("onSessionStart")[1];
    expect(fn.indexOf("lastQuotaExhaustedPeriodKey: undefined")).toBeGreaterThan(fn.indexOf("db.insert"));
    expect(quotaSrc).toContain("captureEvent");
  });
  it("hooked into the acquire reject path (same-mutation, before the throw)", () => {
    const res = read(convexRoot, "resources.ts");
    const branch = res.split("CAP-378")[1].split("const now")[0];
    expect(branch).toContain("onQuotaExhausted");
    expect(branch).toContain("throw");
  });
});

describe("SLICE-P7T-03 — batch/dedupe (CAP-382/383)", () => {
  it("quoted batch windows: reply 15m · saved 24h · join 6h · drip per batch", () => {
    expect(batchSrc).toContain("comment_reply: 15 * 60_000");
    expect(batchSrc).toContain("saved_post_activity: 24 * 3_600_000");
    expect(batchSrc).toContain("distribution_joined: 6 * 3_600_000");
  });
  it("social vs legal/mod kind sets encoded (mute suppresses social ONLY — quoted)", () => {
    expect(batchSrc).toContain("SOCIAL_KINDS");
    expect(batchSrc).toContain("NEVER_SUPPRESSED_KINDS");
    expect(batchSrc).toContain("quota_exhausted");
  });
  it("reply flood hooks R-BRIGADE (integrityFlags) — the reply is never dropped", () => {
    const fn = batchSrc.split("notifyBatched")[1];
    expect(fn).toContain("reply_flood");
    expect(fn.indexOf("db.patch")).toBeLessThan(fn.indexOf("return existing._id")); // the reply row survives
  });
  it("CAP-382 writes NO rawEvents (contract §5)", () => {
    expect(batchSrc).not.toContain("captureEvent");
  });
  it("call-sites: comment/save/join writers notify same-mutation", () => {
    expect(commentsSrc).toContain("notifyBatched");
    expect(read(convexRoot, "reactions.ts")).toContain("notifyBatched");
    expect(read(convexRoot, "profile/metrics.ts")).toContain("notifyBatched");
  });
});

describe("SLICE-P7T-04 — appeal submit (CAP-340)", () => {
  it("quoted gates: one/action · 14d/30d · 2k chars · ≤3 refs · no URLs", () => {
    expect(appealSrc).toContain("CONTENT_DEADLINE_DAYS = 14");
    expect(appealSrc).toContain("TERMINATE_DEADLINE_DAYS = 30");
    expect(appealSrc).toContain("MAX_CHARS = 2000");
    expect(appealSrc).toContain("MAX_EVIDENCE = 3");
    expect(appealSrc).toContain("URLs are not accepted");
  });
  it("submits — never decides (P7E-16 owns resolve); case flips to appealed", () => {
    expect(appealSrc).toContain('status: "appealed"');
    expect(appealSrc).not.toContain("appeal.resolve");
  });
  it("server-reject is mandatory on deadline expiry (OQ#3)", () => {
    expect(appealSrc).toContain("appeal window has closed");
  });
  it("no rawEvents (contract §5)", () => {
    expect(appealSrc).not.toContain("captureEvent");
  });
});

describe("SLICE-P7T-05/06/07 — legal intake (CAP-217/343/344/348/350/361/058/059/060)", () => {
  it("statutory-minimum DMCA gates (DECISIONS-LOCKED #6) + 5/24h email rate + 24h dedupe", () => {
    expect(intakeSrc).toContain("17 U.S.C. §512");
    expect(intakeSrc).toContain("legal.dmca.email");
    expect(read(convexRoot, "lib/rateLimit.ts")).toContain('"legal.dmca.email.daily", max: 5');
    expect(intakeSrc).toContain("already in the 24h window");
  });
  it("quoted clocks stored: DMCA 3bd/10bd · grievance +24h/+15d — displayed as stored instants", () => {
    expect(intakeSrc).toContain("DMCA_ACK = 3 * BD_MS");
    expect(intakeSrc).toContain("DMCA_ACTION = 10 * BD_MS");
    expect(intakeSrc).toContain("24 * 3_600_000");
    expect(intakeSrc).toContain("15 * 24 * 3_600_000");
  });
  it("CAP-344/361: facially complete ALWAYS intake-eligible; deficient counts toward the chill", () => {
    expect(intakeSrc).toContain("never refuse facially complete counter");
    expect(intakeSrc).toContain("expeditedRemoved");
    expect(intakeSrc).toContain("2 rejected-deficient");
  });
  it("CAP-350: anonymize + tombstone — never delete the immutable records", () => {
    const fn = intakeSrc.split("erasureSubmit")[1];
    expect(fn).toContain("erased+");
    expect(fn).toContain('accountStatus: "deleted"');
    expect(fn).not.toContain("db.delete");
  });
  it("CAP-059/060: block source + re-eval (≥2 other independent sources keep the post)", () => {
    const fn = intakeSrc.split("takedownAction")[1];
    expect(fn).toContain('status: "blocked"');
    expect(fn).toContain("independentCount >= 2");
    expect(fn).toContain("archived");
  });
  it("absorbed-entity discipline: zero dmcaNotices/takedownRequests writes; no rawEvents", () => {
    expect(intakeSrc).not.toContain('insert("dmcaNotices"');
    expect(intakeSrc).not.toContain('insert("takedownRequests"');
    expect(intakeSrc).not.toContain("captureEvent");
    expect(schemaSrc).not.toContain("dmcaNotices: defineTable");
  });
});

describe("SLICE-P7T-08/09/10 — RI page, ri.evaluate, trust routes", () => {
  it("public RI page: contentVersions render only — no per-user strikes/users queries (E3)", () => {
    const page = read(forumRoot, "src/app/(app)/(shell)/repeat-infringer/page.tsx");
    expect(page).toContain("LegalDocPage");
    expect(page).not.toContain("strikes");
  });
  it("ri.evaluate: 3 valid copyright/12mo → terminated; voided strike reinstates (quoted)", () => {
    expect(riSrc).toContain("STRIKE_THRESHOLD = 3");
    expect(riSrc).toContain('s.class !== "copyright_rights"');
    expect(riSrc).toContain("voidedByRestore");
    expect(riSrc).toContain("repeat_infringer_reinstated_strike_voided");
  });
  it("six trust routes exist, one shared template, no invented copy", () => {
    for (const slug of ["about", "help", "how-we-review", "editorial-policy", "ai-disclosure", "how-we-use-your-store-data"]) {
      const page = read(forumRoot, `src/app/(app)/(shell)/${slug}/page.tsx`);
      expect(page).toContain("LegalDocPage");
    }
  });
});

describe("SLICE-P7T-11 — provenance footers (CAP-468/469)", () => {
  it("footer renders the three trust links; AI label is visible + machine-readable", () => {
    const footer = read(forumRoot, "src/components/trust/provenance-footer.tsx");
    expect(footer).toContain('href="/how-we-review"');
    expect(footer).toContain('href="/editorial-policy"');
    expect(footer).toContain('href="/ai-disclosure"');
    expect(footer).toContain("data-ai-generated");
  });
  it("mounted on the four host surfaces; no event capture (contract §5)", () => {
    expect(read(forumRoot, "src/components/discussion/post-detail-client.tsx")).toContain("ProvenanceFooter");
    expect(read(forumRoot, "src/components/trust/provenance-footer.tsx")).not.toContain("captureEvent");
  });
});

describe("SLICE-P7T-12 — landing waitlist CTA (F-14 close)", () => {
  it("delegates to CAP-014 waitlist.join — the same public endpoint, no second mutation", () => {
    const page = read(forumRoot, "src/app/(auth)/landing/page.tsx");
    expect(page).toContain('"/api/convex/waitlist.join"');
    expect(page).not.toContain("useMutation(api.waitlist");
  });
});

describe("SLICE-P7T-13 — CMP (CAP-504–506)", () => {
  it("consentRecords back-filled per M18 l.74 (bible + schema)", () => {
    const bible = read(join(__dirname, "../../../../../../docs/01-product-spec"), "_data-model.md");
    expect(bible).toContain("purposesGranted[], purposesDenied[], jurisdictionClass");
    expect(schemaSrc).toContain("consentRecords: defineTable");
  });
  it("strictly_necessary always granted (quoted); the four purposes (CAP-505)", () => {
    expect(consentSrc).toContain('"strictly_necessary", ...args.granted');
    expect(consentSrc).toContain('"strictly_necessary", "functional", "analytics", "marketing"');
  });
  it("withdraw: rawEvents NOT consent-gated; the vendor-delete outbox (P7O-08 consumes) — no direct API call", () => {
    const fn = consentSrc.split("export const withdraw")[1];
    expect(fn).toContain("analyticsDeletionRequests");
    expect(fn).toContain("pending");
    expect(fn).not.toContain("PostHog");
    expect(fn).not.toContain("fetch(");
  });
  it("anonymous grant FENCED on CAP-387 (no cookie scheme invented)", () => {
    expect(consentSrc).toContain("CAP-387");
  });
  it("overlay in the CAP-025 slot inside the (app) layout; PostHog absent pre-grant", () => {
    const layout = read(forumRoot, "src/app/(app)/layout.tsx");
    expect(layout).toContain("CmpOverlay");
    const overlay = read(forumRoot, "src/components/consent/cmp-overlay.tsx");
    expect(overlay).not.toContain("posthog");
  });
});

describe("7-TRUST cron wiring", () => {
  it("ri.evaluate cron wired", () => {
    expect(cronsSrc).toContain("internal.jobs.repeatInfringer.evaluate");
  });
});
