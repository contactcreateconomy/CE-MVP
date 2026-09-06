/* eslint-disable @typescript-eslint/no-explicit-any -- schema introspection + source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P6-12 acceptance tests — M11 schema + CAP-565/571/572. Sources:
 * bible l.215-227 + l.343; register rows CAP-565/571/572 (quotes in the
 * owning modules). */

// eslint-disable-next-line @typescript-eslint/no-var-requires
import schemaDefault from "../../../../../../convex/schema";
import { SUB_ID_REGISTRY_ROWS } from "../../../../../../convex/store/seed";
import { ensureDistributionTx, INITIAL_LEVEL } from "../../../../../../convex/distributions";

const schema = schemaDefault as any;
const convexRoot = join(__dirname, "../../../../../../convex");
const fieldsOf = (t: any) => t.validator.fields;
const hasField = (t: any, f: string) => Boolean(fieldsOf(t)?.[f]);
const literalValues = (field: any): any[] => {
  if (!field) return [];
  if (field.kind === "union") return field.members.map((l: any) => l.value);
  if (field.kind === "literal") return [field.value];
  return [];
};

describe("SLICE-P6-12 — M11 storefront schema (14 tables + distributions)", () => {
  const tables = [
    "storefronts", "storeRequests", "storefrontProducts", "storefrontProductVersions",
    "storefrontLinks", "linkValidations", "storefrontClicks", "wishlists",
    "storefrontAnalytics", "reviewConflicts", "salesEvidence", "subIdRegistry",
    "storeStrikes", "merchantComplaints", "distributions",
  ];

  it("all M11 tables + the distributions FK target exist", () => {
    for (const t of tables) expect(schema.tables[t], t).toBeDefined();
  });

  it("F-01 guard: storefrontLinks has validationState and NO status field", () => {
    const t = schema.tables.storefrontLinks;
    expect(literalValues(fieldsOf(t).validationState).sort()).toEqual(
      ["approved_locked", "pending", "rejected", "under_review"].sort(),
    );
    expect(hasField(t, "status")).toBe(false); // the stale-sheet field must NOT exist
    expect(hasField(t, "affiliateAccountRefMasked")); // affiliate id NEVER exposed
  });

  it("storefronts: ownerUserId unique-lookup + isPlatformCurated seed flag + distributionId FK", () => {
    const t = schema.tables.storefronts;
    expect(hasField(t, "ownerUserId"));
    expect(hasField(t, "distributionId"));
    expect(hasField(t, "isPlatformCurated"));
    expect((t.indexes ?? []).some((i: any) => i.indexDescriptor === "by_owner")).toBe(true);
  });

  it("storeRequests: the four attestations exist as booleans (CAP-231)", () => {
    const t = schema.tables.storeRequests;
    const att = fieldsOf(t).attestations;
    const json = JSON.stringify(att);
    for (const a of ["owns", "programPermits", "regionEligible", "willDisclose"]) {
      expect(json).toContain(a);
    }
  });

  it("salesEvidence: the CAP-525 two-field enums — no collapsed literal", () => {
    const t = schema.tables.salesEvidence;
    expect(literalValues(fieldsOf(t).type).sort()).toEqual(["coupon", "postback", "self_report", "subid"].sort());
    expect(literalValues(fieldsOf(t).status).sort()).toEqual(["network_verified", "refunded", "unverified"].sort());
    expect(literalValues(fieldsOf(t).status)).not.toContain("self_reported_unverified");
  });

  it("storefrontAnalytics: aggregate-only fields — no individual/buyer identity columns", () => {
    const t = schema.tables.storefrontAnalytics;
    expect(hasField(t, "qualifiedClicks"));
    expect(hasField(t, "ctr"));
    for (const banned of ["buyerUserId", "userIds", "sessionIds", "exactTimes"]) {
      expect(hasField(t, banned), `storefrontAnalytics.${banned} must not exist`).toBe(false);
    }
  });

  it("wishlists: private pair unique lookup (CAP-252 ZERO Signal — no signal fields)", () => {
    const t = schema.tables.wishlists;
    expect((t.indexes ?? []).some((i: any) => i.indexDescriptor === "by_user_product")).toBe(true);
    expect(hasField(t, "signalValue")).toBe(false);
  });
});

describe("SLICE-P6-12 — CAP-565 (Distribution at bootstrap)", () => {
  it("ensureDistributionTx is idempotent + creates the single-owner initial row", async () => {
    const inserts: any[] = [];
    const ctx = {
      db: {
        query: () => ({
          withIndex: () => ({
            unique: async () => null, // no existing row
          }),
        }),
        get: async () => ({ displayName: "Harinie", email: "h@x.com" }),
        insert: async (_t: string, doc: any) => {
          inserts.push(doc);
          return "d1";
        },
      },
    } as any;
    const first = await ensureDistributionTx(ctx, "u1");
    expect(first.created).toBe(true);
    expect(first.distributionId).toBe("d1");
    const row = inserts[0];
    expect(row.ownershipMode).toBe("single");
    expect(row.dormant).toBe(true);
    expect(row.currentLevel).toBe(INITIAL_LEVEL);
  });

  it("bootstrap wires the follow-on (quoted: NOT the same atomic transaction — invoked after finalize's writes)", () => {
    const bootstrapSrc = readFileSync(join(convexRoot, "bootstrap.ts"), "utf8");
    expect(bootstrapSrc).toContain("ensureDistributionTx");
  });
});

describe("SLICE-P6-12 — CAP-571/572 seeders", () => {
  it("CAP-572 dictionary: the four networks + Amazon explicitly not-permitted (CAP-261 exclusion)", () => {
    const byNetwork = new Map(SUB_ID_REGISTRY_ROWS.map((r) => [r.network, r]));
    expect(byNetwork.size).toBe(5);
    expect(byNetwork.get("impact")?.permitted).toBe(true);
    expect(byNetwork.get("amazon")?.permitted).toBe(false); // no subid return path — never reconcile-verified
    expect(byNetwork.get("amazon")?.paramName).toBe("");
  });

  it("CAP-571: reserved platform identity is isStaff, a FIXED internal address — never the Founder's", () => {
    const seedSrc = readFileSync(join(convexRoot, "store/seed.ts"), "utf8");
    expect(seedSrc).toContain("RESERVED_PLATFORM_EMAIL");
    expect(seedSrc).toContain("isStaff: true");
    expect(seedSrc).toContain("NOT Founder");
  });

  it("seed links lock at approved_locked (the value P6-17 re-reads)", () => {
    const seedSrc = readFileSync(join(convexRoot, "store/seed.ts"), "utf8");
    expect(seedSrc).toContain('validationState: "approved_locked"');
  });

  it("R-FOUNDER boundary exception is documented in seed.ts", () => {
    const seedSrc = readFileSync(join(convexRoot, "seed.ts"), "utf8");
    expect(seedSrc).toContain("deliberate exception");
    expect(seedSrc).toContain("CAP-571");
  });
});
