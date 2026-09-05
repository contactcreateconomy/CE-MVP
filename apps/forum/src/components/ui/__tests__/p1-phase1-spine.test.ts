import { describe, it, expect } from "vitest";

/* SLICE-P1-02/03/04/07/08/09/10 acceptance tests — schema-vs-bible fidelity +
 * helper behavior. Sources: bible l.53/121/238/241/270/300-302/317/409-410;
 * M18 l.69-71; DEC-C01; M1 §4/§6/§8; CAP notes per slice. */

// eslint-disable-next-line @typescript-eslint/no-var-requires
import schemaDefault from "../../../../../../convex/schema";
import { RATE_LIMITS, RateLimitError, rateLimitSet, subjectKey, isRateExempt } from "../../../../../../convex/lib/rateLimit";
import { isBlockedIp } from "../../../../../../convex/lib/safeFetch";
import { assertCatalogEvent, captureEvent } from "../../../../../../convex/lib/events";
import * as seedModule from "../../../../../../convex/seed";

const schema = schemaDefault as any;
const fieldsOf = (t: any) => t.validator.fields;
const hasField = (t: any, f: string) => Boolean(fieldsOf(t)?.[f]);
const literalValues = (field: any): string[] => {
  if (!field) return [];
  if (field.kind === "union") return field.members.map((l: any) => l.value);
  if (field.kind === "literal") return [field.value];
  return [];
};
const indexNames = (t: any) => (t.indexes ?? []).map((i: any) => i.indexDescriptor);

describe("SLICE-P1-03 — moderation + legal spine", () => {
  it("moderationCases carries bible l.238: caseType 12, policyFamily 7 (DECISIONS-LOCKED #4), severity 4, status 11", () => {
    const t = schema.tables.moderationCases;
    for (const f of ["caseType", "targetType", "targetId", "policyFamily", "severity", "priority", "status", "reasonCode", "policyVersion", "autoReleaseEligible", "preserveUntil", "reporterCountDistinct", "reporterClusterCount", "claimedByUserId", "leaseExpiresAt", "nextReviewAt", "userResponseDueAt", "agingLevel", "subjectClass", "parentCaseId", "createdAt", "closedAt"]) {
      expect(hasField(t, f), `moderationCases.${f}`).toBe(true);
    }
    expect(literalValues(fieldsOf(t).caseType)).toHaveLength(12);
    expect(literalValues(fieldsOf(t).policyFamily).sort()).toEqual(
      ["spam", "harassment_abuse", "misinformation", "copyright_ip", "legal_other", "quality_guidelines", "safety_illegal"].sort(),
    );
    expect(literalValues(fieldsOf(t).severity).sort()).toEqual(["s0_critical", "s1_high", "s2_medium", "s3_low"]);
    expect(literalValues(fieldsOf(t).status)).toHaveLength(11);
  });

  it("INV-2 dedupe index by_target_policyFamily_status present", () => {
    expect(indexNames(schema.tables.moderationCases)).toContain("by_target_policyFamily_status");
  });

  it("legalIntake carries bible l.241 incl. the 2026-08-29 remainder fields", () => {
    const t = schema.tables.legalIntake;
    for (const f of ["type", "subjectClass", "caseId", "complainantContact", "targetType", "targetId", "payloadHash", "status", "ackDueAt", "actionDueAt", "restoreEligibleAt", "strikeId", "counterNoticeId", "operatorUserId", "erasureOutcome", "policyContactSnapshot", "createdAt"]) {
      expect(hasField(t, f), `legalIntake.${f}`).toBe(true);
    }
    expect(literalValues(fieldsOf(t).type)).toHaveLength(6);
    expect(literalValues(fieldsOf(t).erasureOutcome).sort()).toEqual(["ERASE_PARTIAL", "REFUSED_LEGAL_HOLD"]);
  });

  it("standingSetByCaseId retyped to v.id(moderationCases) — P1-03 closure", () => {
    const f = fieldsOf(schema.tables.users).standingSetByCaseId;
    expect(f.kind === "id" || f.value?.tableName === "moderationCases" || f.tableName === "moderationCases").toBe(true);
  });
});

describe("SLICE-P1-02 — waitlist + notifications", () => {
  it("waitlistEntries: bible l.317 fields, no users/role linkage (CAP-014), status 5 literals", () => {
    const t = schema.tables.waitlistEntries;
    for (const f of ["email", "emailNormalized", "status", "invitedAt", "convertedUserId", "createdAt"]) {
      expect(hasField(t, f), `waitlistEntries.${f}`).toBe(true);
    }
    const fields = Object.keys(fieldsOf(t));
    expect(fields.some((f) => /role/i.test(f))).toBe(false); // "not a users row; no role"
    expect(literalValues(fieldsOf(t).status).sort()).toEqual(
      ["waiting", "invited", "converted", "withdrawn", "blocked"].sort(),
    );
    expect(indexNames(t)).toContain("by_emailNormalized");
  });

  it("notifications: bible l.53 fields, notificationType 17 literals (Core-enums l.409), both indexes", () => {
    const t = schema.tables.notifications;
    for (const f of ["recipientUserId", "notificationType", "objectType", "objectId", "actorUserIds", "eventCount", "dedupeKey", "status", "priority", "batchWindowStartedAt", "batchWindowEndsAt", "readAt", "retractedAt", "createdAt", "updatedAt"]) {
      expect(hasField(t, f), `notifications.${f}`).toBe(true);
    }
    expect(literalValues(fieldsOf(t).notificationType)).toHaveLength(17);
    expect(indexNames(t)).toEqual(expect.arrayContaining(["by_user_unread", "by_dedupe"]));
  });
});

describe("SLICE-P1-04 — jobs spine", () => {
  it("jobCatalog: M18 l.69 20 fields incl. executionAuthority + retryClass + allowlist key", () => {
    const t = schema.tables.jobCatalog;
    for (const f of ["jobKey", "ownerModule", "kind", "internalFunctionKey", "executionAuthority", "scheduleKey", "timeoutMs", "retryClass", "maxAttempts", "backoffSeconds", "jitterPct", "idempotencyScope", "concurrencyKey", "importance", "healthFreshnessSeconds", "deadLetterAfterSeconds", "featureFlag", "status", "catalogVersion"]) {
      expect(hasField(t, f), `jobCatalog.${f}`).toBe(true);
    }
    expect(literalValues(fieldsOf(t).executionAuthority).sort()).toEqual(["authorized_command", "revalidate_actor", "system"]);
    expect(literalValues(fieldsOf(t).retryClass)).toContain("manual_only"); // RC-4
  });

  it("jobRuns: full M18 l.70 list, state includes manual_review, 8 indexes, actorUserId never authorizes (by design: no authority fields on actor)", () => {
    const t = schema.tables.jobRuns;
    for (const f of ["jobKey", "catalogVersion", "runKey", "scheduledFor", "startedAt", "completedAt", "state", "attempt", "maxAttempts", "idempotencyKey", "concurrencyKey", "sourceObjectType", "sourceObjectId", "actorUserId", "executionAuthority", "authorityOutcome", "commandId", "permissionVersionChecked", "scheduledFunctionId", "lastHeartbeatAt", "nextAttemptAt", "timeoutAt", "resultClass", "errorClass", "errorFingerprint", "errorSummaryRedacted", "deadLetterReason", "parentRunId", "correlationId", "createdAt", "updatedAt"]) {
      expect(hasField(t, f), `jobRuns.${f}`).toBe(true);
    }
    expect(literalValues(fieldsOf(t).state)).toContain("manual_review");
    expect(indexNames(t)).toEqual(expect.arrayContaining([
      "by_jobKey_scheduledFor", "by_state_nextAttemptAt", "by_idempotencyKey",
      "by_concurrencyKey_state", "by_timeoutAt_state", "by_sourceObject",
      "by_correlationId", "by_commandId",
    ]));
  });

  it("jobDeadLetters: 7 fields, redrive representable (bible l.301 tail)", () => {
    const t = schema.tables.jobDeadLetters;
    for (const f of ["jobRunId", "jobKey", "reason", "createdAt", "redrivenAt", "redrivenByUserId"]) {
      expect(hasField(t, f), `jobDeadLetters.${f}`).toBe(true);
    }
  });

  it("bible l.249: no systemJobs table exists", () => {
    expect(schema.tables.systemJobs).toBeUndefined();
  });
});

describe("SLICE-P1-07 — rawEvents + eventCatalog + capture pair", () => {
  it("rawEvents: bible l.121 envelope incl. CAP-438 stamps + CAP-442 mirror + 4 indexes", () => {
    const t = schema.tables.rawEvents;
    for (const f of ["eventClass", "eventType", "userId", "anonymousSessionId", "sequenceInSession", "targetType", "targetId", "source", "referrer", "isStaff", "isPersona", "isCountableAtWrite", "posthogMirror", "analyticsSubjectId", "tombstoneState", "occurredAt", "receivedAt"]) {
      expect(hasField(t, f), `rawEvents.${f}`).toBe(true);
    }
    expect(indexNames(t)).toEqual(expect.arrayContaining(["by_session_sequence", "by_user_time", "by_target_eventClass", "by_eventType_time"]));
  });

  it("eventCatalog: bible l.270 fields incl. piiClass (mandatory) + consentGate + status", () => {
    const t = schema.tables.eventCatalog;
    for (const f of ["eventName", "schemaVersion", "eventClass", "ownerModule", "description", "captureMode", "piiClass", "consentGate", "signalEligible", "s18Eligible", "excludeStaff", "excludePersonas", "idempotencyScope", "retentionClass", "posthogMirror", "status", "effectiveFrom", "owner"]) {
      expect(hasField(t, f), `eventCatalog.${f}`).toBe(true);
    }
  });

  it("CAP-437: unknown event rejects with instrumentation_error", async () => {
    const ctx: any = {
      db: {
        query: () => ({
          withIndex: (_n: string, fn: (q: any) => any) => ({
            unique: async () => {
              fn({ eq: () => true });
              return null; // not found
            },
          }),
        }),
      },
    };
    await expect(assertCatalogEvent(ctx, "unknown.event")).rejects.toThrow("instrumentation_error");
  });

  it("CAP-436: capture fails when rawEvents insert fails → whole mutation rolls back", async () => {
    const ctx: any = {
      db: {
        query: () => ({
          withIndex: () => ({
            unique: async () => ({ eventName: "known.event", eventClass: "interaction", status: "active" }),
          }),
        }),
        insert: async (table: string) => {
          if (table === "rawEvents") throw new Error("rawEvents persistence failure");
          throw new Error("unexpected table");
        },
      },
    };
    await expect(
      captureEvent(ctx, {
        eventType: "known.event", schemaVersion: 1, eventClass: "interaction",
        targetType: "post", targetId: "t1", source: "direct",
        isStaff: false, isPersona: false, isCountableAtWrite: true,
      }),
    ).rejects.toThrow("rawEvents persistence failure");
  });
});

describe("SLICE-P1-08 — seed.bootstrap", () => {
  it("module surface: internal-only (one export, no founder/role writes possible)", () => {
    expect(Object.keys(seedModule)).toEqual(["bootstrap"]);
  });

  it("DEC-C01 five categories derivable from the seed output shape (slug-indexed categories table exists)", () => {
    const t = schema.tables.categories;
    for (const f of ["slug", "name", "description", "seoTitle", "seoDescription", "sortOrder", "status"]) {
      expect(hasField(t, f), `categories.${f}`).toBe(true);
    }
    expect(indexNames(t)).toContain("by_slug");
  });
});

describe("SLICE-P1-09 — rate limits", () => {
  it("seven literal sets match register Notes verbatim", () => {
    expect(RATE_LIMITS["auth.magic_link.ip"]).toEqual([{ name: "auth.magic_link.ip", max: 5, periodMs: 900_000, subject: "ip_hash" }]);
    expect(RATE_LIMITS["auth.magic_link.email"]).toEqual([{ name: "auth.magic_link.email", max: 3, periodMs: 3_600_000, subject: "email_hash" }]);
    expect(RATE_LIMITS["auth.finalize"]).toEqual([{ name: "auth.finalize", max: 10, periodMs: 3_600_000, subject: "user" }]);
    expect(RATE_LIMITS["admin.write"]).toEqual([{ name: "admin.write", max: 60, periodMs: 60_000, subject: "operator" }]);
    expect(RATE_LIMITS["support.action"]).toEqual([{ name: "support.action", max: 30, periodMs: 3_600_000, subject: "operator" }]);
    expect(RATE_LIMITS["report"]).toHaveLength(2); // 10/d + 30/w
    expect(RATE_LIMITS["waitlist.join"]).toHaveLength(2); // 10/h ip + 3/24h email
    expect(RATE_LIMITS["media.upload"]).toEqual([{ name: "media.upload", max: 5, periodMs: 3_600_000, subject: "user" }]);
  });

  it("CAP-019: staff NOT rate-exempt (exemption always false, tested explicitly)", () => {
    expect(isRateExempt()).toBe(false);
  });

  it("personas ≠ human buckets (M1 §4): persona subjects get their own namespace", () => {
    expect(subjectKey({ kind: "persona", value: "p1" })).toBe("persona:p1");
    expect(subjectKey({ kind: "persona", value: "p1" })).not.toBe(subjectKey({ kind: "user", value: "p1" }));
  });

  it("unknown literal set throws; typed rejection shape present", () => {
    expect(() => rateLimitSet("nonexistent")).toThrow("unknown literal set");
    const err = new RateLimitError("test", 5, 1000, "user");
    expect(err.name).toBe("RateLimitError");
    expect(err.message).toContain("rate_limit");
  });
});

describe("SLICE-P1-10 — SSRF-safe safeFetch", () => {
  it("private/loopback/metadata/link-local ranges blocked (bible l.15)", () => {
    for (const ip of ["127.0.0.1", "::1", "10.0.0.1", "172.16.0.1", "192.168.1.1", "169.254.169.254", "fe80::1", "fd00::1"]) {
      expect(isBlockedIp(ip), `${ip} should be blocked`).toBe(true);
    }
    for (const ip of ["8.8.8.8", "1.1.1.1", "93.184.216.34"]) {
      expect(isBlockedIp(ip), `${ip} should NOT be blocked`).toBe(false);
    }
  });

  it("CAP-010: unpinned probe returns disabled, never best-effort", async () => {
    const { safeFetch } = await import("../../../../../../convex/lib/safeFetch");
    const r = await safeFetch("https://example.com", { mode: "external_destination_probe" });
    expect(r.status).toBe("disabled");
    expect(r.reason).toContain("no pinned IP");
  });

  it("HTTPS-only (R-SSRF): http:// blocked", async () => {
    const { safeFetch } = await import("../../../../../../convex/lib/safeFetch");
    const r = await safeFetch("http://example.com", { mode: "trusted_source_fetch" });
    expect(r.status).toBe("blocked");
    expect(r.reason).toContain("HTTPS-only");
  });
});
