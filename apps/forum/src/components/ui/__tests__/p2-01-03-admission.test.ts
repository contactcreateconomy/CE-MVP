import { describe, it, expect } from "vitest";

/* SLICE-P2-01/02/03 acceptance tests — admission gate + bootstrap txn +
 * finalizeBootstrap + assertCustomerCapability precedence chain.
 * Sources: FATAL-M1A-01/02, CAP-001/002/003/004/005/393 Notes; bible
 * l.243/265/274/307; M15 R-CUSTOMER-GUARD; DECISIONS-LOCKED #2. */

// eslint-disable-next-line @typescript-eslint/no-var-requires
import schemaDefault from "../../../../../../convex/schema";
import { assertCustomerCapability, AuthzError, PROTECTED_CAPABILITIES } from "../../../../../../convex/lib/authz";
import { checkAdmission, effectiveSignupMode } from "../../../../../../convex/admission";
import { SIGNUP_EVENT_CATALOG_ROW } from "../../../../../../convex/bootstrap";

const schema = schemaDefault as any;
const fieldsOf = (t: any) => t.validator.fields;
const hasField = (t: any, f: string) => Boolean(fieldsOf(t)?.[f]);
const literalValues = (field: any): string[] => {
  if (!field) return [];
  if (field.kind === "union") return field.members.map((l: any) => l.value);
  if (field.kind === "literal") return [field.value];
  return [];
};

/* ── fake ctx for admission/authz ── */
function ctxWith(overrides: {
  signupMode?: string;
  readiness?: { overall: string } | null;
  user?: any;
  restrictions?: any[];
  stopActive?: boolean;
}) {
  const configRows = [
    { key: "signup.mode", status: "active", value: overrides.signupMode ?? "waitlist" },
    ...(overrides.stopActive ? [{ key: "ops.stop.active", status: "active", value: true }] : []),
  ];
  const registryRows = [
    { key: "signup.mode", valueType: "string", default: "waitlist", enumValues: ["open", "waitlist", "closed"], sealed: false },
  ];
  function makeQuery(table: string) {
    const chain = {
      withIndex: (_n: string, fn: (q: any) => any) => {
        let matchKey: string | undefined;
        const q = { eq: (_f: string, v: any) => { matchKey = v; return q; } };
        fn(q);
        const resolve = () => {
          if (table === "launchReadinessResults") return overrides.readiness ?? null;
          if (table === "systemConfig") return configRows.find((c) => c.key === matchKey) ?? null;
          if (table === "configKeyRegistry") return registryRows.find((c) => c.key === matchKey) ?? null;
          if (table === "capabilityRestrictions") return overrides.restrictions?.[0] ?? null;
          return null;
        };
        return { first: async () => resolve(), unique: async () => resolve() };
      },
      first: async () => {
        if (table === "launchReadinessResults") return overrides.readiness ?? null;
        return null;
      },
    };
    return chain;
  }
  return {
    auth: { userId: overrides.user?._id ?? null },
    db: {
      get: async (id: string) => (overrides.user?._id === id ? overrides.user : null),
      query: makeQuery,
    },
  };
}

describe("SLICE-P2-01 — admission core", () => {
  it("launchReadinessResults schema: bible l.307 (5 fields, overall 4 literals)", () => {
    const t = schema.tables.launchReadinessResults;
    for (const f of ["evaluatedAt", "overall", "blockers", "warnings", "evidence"]) {
      expect(hasField(t, f), `launchReadinessResults.${f}`).toBe(true);
    }
    expect(literalValues(fieldsOf(t).overall).sort()).toEqual(["blocked", "ready", "revoked", "warning"]);
  });

  it("FATAL-M1A-02: effectiveSignupMode = readiness ? signup.mode : closed (fail-closed)", async () => {
    // no readiness row → closed
    expect(await effectiveSignupMode(ctxWith({ signupMode: "open", readiness: null }))).toBe("closed");
    // readiness blocked → closed (even if mode=open)
    expect(await effectiveSignupMode(ctxWith({ signupMode: "open", readiness: { overall: "blocked" } }))).toBe("closed");
    // readiness ready + mode=open → open
    expect(await effectiveSignupMode(ctxWith({ signupMode: "open", readiness: { overall: "ready" } }))).toBe("open");
    // readiness ready + mode=waitlist → waitlist
    expect(await effectiveSignupMode(ctxWith({ signupMode: "waitlist", readiness: { overall: "ready" } }))).toBe("waitlist");
  });

  it("CAP-001: 3 modes — open→proceed, waitlist→waitlist, closed→reject", async () => {
    expect(await checkAdmission(ctxWith({ signupMode: "open", readiness: { overall: "ready" } }))).toBe("proceed");
    expect(await checkAdmission(ctxWith({ signupMode: "waitlist", readiness: { overall: "ready" } }))).toBe("waitlist");
    expect(await checkAdmission(ctxWith({ signupMode: "closed", readiness: { overall: "ready" } }))).toBe("reject");
  });
});

describe("SLICE-P2-02 — finalizeBootstrap", () => {
  it("identityJoins schema: bible l.274 (3 fields + unique index)", () => {
    const t = schema.tables.identityJoins;
    for (const f of ["anonymousSessionId", "userId", "joinedAt"]) {
      expect(hasField(t, f), `identityJoins.${f}`).toBe(true);
    }
    const names = (t.indexes ?? []).map((i: any) => i.indexDescriptor);
    expect(names).toContain("by_anonymousSessionId");
  });

  it("CAP-004: signup eventCatalog row satisfies CAP-437 (has required fields)", () => {
    const row = SIGNUP_EVENT_CATALOG_ROW;
    expect(row.eventName).toBe("signup");
    expect(row.captureMode).toBe("same_mutation");
    expect(row.consentGate).toBe("strictly_necessary");
    expect(row.posthogMirror).toBe(false); // FATAL-M1C-01
    expect(row.excludeStaff).toBe(true);
  });
});

describe("SLICE-P2-03 — assertCustomerCapability", () => {
  it("capabilityRestrictions schema: bible l.243 (7 fields)", () => {
    const t = schema.tables.capabilityRestrictions;
    for (const f of ["userId", "capabilityKey", "reasonCode", "caseId", "startsAt", "endsAt", "appealable"]) {
      expect(hasField(t, f), `capabilityRestrictions.${f}`).toBe(true);
    }
  });

  it("CAP-393 applies-to registry: 11 protected capabilities (rate_tool added 2026-09-05, SLICE-P4-05)", () => {
    // 10 original keys transcribed from CAP-393's Notes + `rate_tool`:
    // CONTRACT-2-tool-profile §1 gates rating submission on R-CUSTOMER-GUARD
    // while CAP-393's enumerated list omits it — contract-favor resolution,
    // flagged in the P4-05 session report.
    expect(PROTECTED_CAPABILITIES).toHaveLength(11);
    expect(PROTECTED_CAPABILITIES).toContain("create_post");
    expect(PROTECTED_CAPABILITIES).toContain("resource_acquire");
    expect(PROTECTED_CAPABILITIES).toContain("rate_tool");
  });

  it("CAP-005 precedence: TERMINATED > SUSPENDED > RESTRICTED > STOP > FLAG > ELIGIBILITY", async () => {
    const base = { _id: "u1", bootstrapState: "complete", postingEligibilityState: "eligible" };

    // TERMINATED wins over everything
    await expect(
      assertCustomerCapability(ctxWith({ user: { ...base, accountStanding: "terminated" } }), "create_post"),
    ).rejects.toThrow("terminated");

    // SUSPENDED (when not terminated)
    await expect(
      assertCustomerCapability(ctxWith({ user: { ...base, accountStanding: "suspended" } }), "create_post"),
    ).rejects.toThrow("suspended");

    // STOP active (when standing is good)
    await expect(
      assertCustomerCapability(ctxWith({ user: { ...base, accountStanding: "good" }, stopActive: true }), "create_post"),
    ).rejects.toThrow("STOP");

    // ELIGIBILITY: temporarily_restricted
    await expect(
      assertCustomerCapability(ctxWith({ user: { ...base, accountStanding: "good", postingEligibilityState: "temporarily_restricted" } }), "create_post"),
    ).rejects.toThrow("temporarily_restricted");
  });

  it("CAP-005 fail-closed: missing accountStanding → ACCOUNT_STANDING_UNKNOWN", async () => {
    await expect(
      assertCustomerCapability(ctxWith({ user: { _id: "u1", bootstrapState: "complete", postingEligibilityState: "eligible" } }), "create_post"),
    ).rejects.toThrow();
  });

  it("bootstrap incomplete → protected write rejected (routing convention rule 4, server-side)", async () => {
    await expect(
      assertCustomerCapability(ctxWith({ user: { _id: "u1", bootstrapState: "pending_context", accountStanding: "good", postingEligibilityState: "eligible" } }), "create_post"),
    ).rejects.toThrow("pending_context");
  });

  it("good standing + complete bootstrap + eligible → passes", async () => {
    await expect(
      assertCustomerCapability(ctxWith({ user: { _id: "u1", bootstrapState: "complete", accountStanding: "good", postingEligibilityState: "eligible" } }), "create_post"),
    ).resolves.toBeUndefined();
  });

  it("capabilityRestrictions active → RESTRICTED; expired → passes", async () => {
    const base = { _id: "u1", bootstrapState: "complete", accountStanding: "good", postingEligibilityState: "eligible" };
    const now = Date.now();
    await expect(
      assertCustomerCapability(ctxWith({ user: base, restrictions: [{ userId: "u1", capabilityKey: "create_post", reasonCode: "brigade", startsAt: now - 1000, endsAt: now + 100000 }] }), "create_post"),
    ).rejects.toThrow("restricted");
    await expect(
      assertCustomerCapability(ctxWith({ user: base, restrictions: [{ userId: "u1", capabilityKey: "create_post", reasonCode: "brigade", startsAt: now - 200000, endsAt: now - 100000 }] }), "create_post"),
    ).resolves.toBeUndefined();
  });
});
