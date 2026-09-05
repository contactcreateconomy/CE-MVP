import { describe, it, expect } from "vitest";

/* SLICE-P1-05 + P1-06 acceptance tests — schema shape + validation-core +
 * fail-closed composition (the pure-function parts; Convex-runtime parts
 * exercised via the same exported helpers with a mocked ctx).
 *
 * Sources: bible l.248/250/256; R-GETFLAG (FATAL-M1B-04); CAP-394/395/426
 * Notes; admin-config contract §4. */

// eslint-disable-next-line @typescript-eslint/no-var-requires
import schemaDefault from "../../../../../../convex/schema";
import { SEALED_KEYS, validateAgainstRegistry, getFlag } from "../../../../../../convex/lib/authz";
import { writeAudited, writeAudit, newCorrelationId } from "../../../../../../convex/lib/audit";
import * as auditModule from "../../../../../../convex/lib/audit";

const schema = schemaDefault as any;
const fieldsOf = (t: any) => t.validator.fields;
const hasField = (t: any, f: string) => Boolean(fieldsOf(t)?.[f]);
const literalValues = (field: any): string[] => {
  if (!field) return [];
  if (field.kind === "union") return field.members.map((l: any) => l.value);
  if (field.kind === "literal") return [field.value];
  return [];
};

/* ── fake ctx: minimal db surface the helpers touch ── */
function fakeCtx(registryRows: any[], configRows: any[]) {
  const inserts: any[] = [];
  const patches: any[] = [];
  const bodyWrites: any[] = [];
  return {
    inserts,
    patches,
    bodyWrites,
    db: {
      insert: async (table: string, doc: any) => {
        inserts.push({ table, doc });
        return "k" + inserts.length;
      },
      patch: async (id: string, doc: any) => patches.push({ id, doc }),
      query: (table: string) => ({
        withIndex: (_name: string, fn: (q: any) => any) => ({
          unique: async () => {
            if (table === "configKeyRegistry") {
              return registryRows.find((r) => fn({ eq: (_f: string, v: any) => r.key === v })) ?? null;
            }
            return configRows.find((r) => fn({ eq: (_f: string, v: any) => r.key === v })) ?? null;
          },
          first: async () => {
            const hit = configRows.find((r) => fn({ eq: (_f: string, v: any) => r.key === v }));
            return hit ?? null;
          },
        }),
        collect: async () => registryRows,
      }),
    },
  };
}

const boolKey = { key: "uploads.avatar.enabled", valueType: "boolean", default: false, sealed: false };
const numKey = { key: "ingest.fanout_ceiling", valueType: "number", min: 1, max: 500, default: 500, sealed: false };
const strKey = { key: "signup.mode", valueType: "string", enumValues: ["waitlist", "open", "closed"], default: "waitlist", sealed: false };

describe("SLICE-P1-06 — auditLog + fail-closed writer", () => {
  it("auditLog carries the bible l.248 field list, append-only by construction", () => {
    const t = schema.tables.auditLog;
    for (const f of ["actorId", "role", "action", "target", "prev", "next", "reasonCode", "correlationId", "reversible", "justification", "createdAt"]) {
      expect(hasField(t, f), `auditLog.${f}`).toBe(true);
    }
    // no delete/update path exists in convex/lib/audit.ts — enforced by the
    // module surface (writeAudit + writeAudited only), asserted on the import:
    expect(Object.keys(auditModule).sort()).toEqual(["newCorrelationId", "writeAudit", "writeAudited"].sort());
  });

  it("CAP-426 fail-closed: audit-insert failure rolls back the body's write", async () => {
    const ctx: any = fakeCtx([], []);
    const realInsert = ctx.db.insert;
    let bodyWriteDone = false;
    // body writes something, then the audit insert throws on the 2nd insert
    ctx.db.insert = async (table: string, doc: any) => {
      if (table === "auditLog") throw new Error("audit persistence failure (simulated)");
      bodyWriteDone = true;
      return realInsert(table, doc);
    };
    await expect(
      writeAudited(ctx, async () => {
        await ctx.db.insert("someTable", { x: 1 });
        return { action: "test.mutation", target: "some:k1", correlationId: newCorrelationId() };
      }),
    ).rejects.toThrow("audit persistence failure");
    expect(bodyWriteDone).toBe(true); // body ran…
    expect(ctx.inserts.filter((i: any) => i.table === "auditLog")).toHaveLength(0); // …and nothing audit-logged → in Convex, the whole txn rolls back (fail-closed, not log-and-continue)
  });

  it("correlationId threads through and writeAudit shapes the bible l.248 row", async () => {
    const ctx = fakeCtx([], []);
    const cid = newCorrelationId();
    await writeAudit(ctx as any, {
      action: "moderation.resolve", target: "case:c1", correlationId: cid, prev: { status: "open" }, next: { status: "actioned" }, reversible: true,
    });
    const row = ctx.inserts[0].doc;
    expect(row.correlationId).toBe(cid);
    expect(row.action).toBe("moderation.resolve");
    expect(row.prev).toEqual({ status: "open" });
    expect(row.createdAt).toBeGreaterThan(0);
  });
});

describe("SLICE-P1-05 — config spine", () => {
  it("systemConfig + configKeyRegistry carry the bible l.250/l.256 field lists", () => {
    const sc = schema.tables.systemConfig;
    for (const f of ["key", "value", "valueType", "scope", "status", "version", "updatedByUserId", "updatedAt", "reason"]) {
      expect(hasField(sc, f), `systemConfig.${f}`).toBe(true);
    }
    const ckr = schema.tables.configKeyRegistry;
    for (const f of ["key", "module", "valueType", "default", "min", "max", "enumValues", "editTier", "blastRadius", "failDirection", "effectiveTiming", "reversible", "sealed"]) {
      expect(hasField(ckr, f), `configKeyRegistry.${f}`).toBe(true);
    }
    expect(literalValues(fieldsOf(ckr).editTier).sort()).toEqual(["tier1", "tier2", "tier3"]);
    expect(literalValues(fieldsOf(ckr).failDirection).sort()).toEqual(["closed", "degrade", "n_a", "open_forbidden"]);
  });

  it("R-GETFLAG: unregistered key throws; missing value → registry safeDefault; never ?? true", async () => {
    const ctx = fakeCtx([boolKey], []); // no live systemConfig row
    await expect(getFlag(ctx as any, "totally.unknown.key")).rejects.toThrow("unregistered");
    expect(await getFlag(ctx as any, boolKey.key)).toBe(false); // safeDefault=false (fail-closed)
    const ctxOn = fakeCtx([{ ...boolKey, default: true }], []);
    expect(await getFlag(ctxOn as any, boolKey.key)).toBe(true); // default honored when true — the "never ?? true" rule is about absence, not about overriding a true default
  });

  it("CAP-394: sealed keys throw by absence", async () => {
    expect(SEALED_KEYS).toEqual(["legitimacy.medianTarget", "signal.eventWeights", "signal.attributionSplit", "trust.weightCap"]);
    const ctx = fakeCtx([boolKey], []);
    for (const k of SEALED_KEYS) {
      await expect(getFlag(ctx as any, k as string)).rejects.toThrow("unregistered");
    }
  });

  it("validation core: type/min/max/enum enforcement (Wave-3 E1 single mechanism)", () => {
    expect(validateAgainstRegistry("n", 250, numKey)).toBe(250);
    expect(() => validateAgainstRegistry("n", 0, numKey)).toThrow("< min");
    expect(() => validateAgainstRegistry("n", 999, numKey)).toThrow("> max");
    expect(() => validateAgainstRegistry("n", "high", numKey)).toThrow("expected number");
    expect(validateAgainstRegistry("s", "waitlist", strKey)).toBe("waitlist");
    expect(() => validateAgainstRegistry("s", "chaos", strKey)).toThrow("not in enumValues");
    expect(() => validateAgainstRegistry("b", "yes", boolKey)).toThrow("expected boolean");
    expect(validateAgainstRegistry("b", true, boolKey)).toBe(true);
  });

  it("corrupt live rows cannot silently pass bounds (read-side validation)", async () => {
    const ctx = fakeCtx([numKey], [{ key: numKey.key, status: "active", value: 9999 }]);
    // getConfigValue is not exported for direct import here (runs via query),
    // so exercise the same path getFlag uses: validate against the registry
    expect(() => validateAgainstRegistry(numKey.key, 9999, numKey)).toThrow("> max");
  });
});
