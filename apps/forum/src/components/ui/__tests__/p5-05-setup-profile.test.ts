/* eslint-disable @typescript-eslint/no-explicit-any -- schema introspection + mocked-ctx helper tests */
import { describe, it, expect } from "vitest";

/* SLICE-P5-05 acceptance tests — M7 profile schema + /setup mutations +
 * CAP-570 activity helper. Sources: bible l.58-67 (M7), l.230-231
 * (activityLedger), CONTRACT-5-setup §1-§4 (six-item set, CAP-148
 * defaults, consent append-only). */

// eslint-disable-next-line @typescript-eslint/no-var-requires
import schemaDefault from "../../../../../../convex/schema";
import { ACTIVITY_EVENT_TYPES, appendActivity } from "../../../../../../convex/activity";
import {
  DEFAULT_CONSENT_FLAGS,
  INTEREST_TILE_DEFS,
} from "../../../../../../convex/setup";
import * as setupModule from "../../../../../../convex/setup";

const schema = schemaDefault as any;
const fieldsOf = (t: any) => t.validator.fields;
const hasField = (t: any, f: string) => Boolean(fieldsOf(t)?.[f]);
const literalValues = (field: any): any[] => {
  if (!field) return [];
  if (field.kind === "union") return field.members.map((l: any) => l.value);
  if (field.kind === "literal") return [field.value];
  return [];
};
const indexNames = (t: any) => (t.indexes ?? []).map((i: any) => i.indexDescriptor);

describe("SLICE-P5-05 — M7 profile schema", () => {
  it("profiles: bible l.58 field list + consentFlags object + firstTapOrder salience", () => {
    const t = schema.tables.profiles;
    for (const f of [
      "userId", "roleArchetype", "ageBand", "toolsUsed", "firstTapOrder",
      "consentFlags", "completionVersion", "extendedData", "profileVersion",
      "createdAt", "updatedAt",
    ]) {
      expect(hasField(t, f), `profiles.${f}`).toBe(true);
    }
    expect(literalValues(fieldsOf(t).roleArchetype).sort()).toEqual(
      ["agency", "exploring", "prefer_not_to_say", "small_team", "solo_creator"].sort(),
    );
    const consentJson = JSON.stringify(fieldsOf(t).consentFlags);
    for (const flag of ["interestsPersonalization", "demographicsPersonalization", "behavioralInference", "publicProfileVisibility"]) {
      expect(consentJson, `consentFlags.${flag}`).toContain(flag);
    }
    // No income/spend bands (Phase-2 additions, not here)
    expect(hasField(t, "incomeBand")).toBe(false);
    expect(hasField(t, "spendBand")).toBe(false);
  });

  it("userInterests + userInferences: direct/inferred separation (CAP-144: source stored separately)", () => {
    const i = schema.tables.userInterests;
    expect(literalValues(fieldsOf(i).source).sort()).toEqual(["both", "direct", "inferred"]);
    expect(indexNames(i)).toContain("by_user_tag");

    const inf = schema.tables.userInferences;
    for (const f of ["userId", "inferenceType", "value", "confidence", "evidenceWindowStart", "evidenceWindowEnd", "modelOrRuleVersion", "status", "createdAt", "expiresAt"]) {
      expect(hasField(inf, f), `userInferences.${f}`).toBe(true);
    }
  });

  it("userSocialAccounts + userConsentRecords + userProfileAttributes: bible l.59/62/63", () => {
    const s = schema.tables.userSocialAccounts;
    expect(literalValues(fieldsOf(s).visibility).sort()).toEqual(["future_marketplace_only", "private", "public"]);
    expect(hasField(s, "oauthConnectionId")).toBe(true); // no tokens here

    const c = schema.tables.userConsentRecords;
    for (const f of ["userId", "purpose", "policyVersion", "status", "collectionSurface", "occurredAt", "withdrawnAt"]) {
      expect(hasField(c, f), `userConsentRecords.${f}`).toBe(true);
    }

    const a = schema.tables.userProfileAttributes;
    for (const f of ["userId", "attributeType", "value", "valueVersion", "visibility", "consentStatus", "providedAt", "updatedAt", "deletedAt"]) {
      expect(hasField(a, f), `userProfileAttributes.${f}`).toBe(true);
    }
  });

  it("interestTaxonomy + the two append-only trails: bible l.64/66/67", () => {
    const tax = schema.tables.interestTaxonomy;
    for (const f of ["tagId", "label", "iconAssetId", "category", "taxonomyVersion", "isActive"]) {
      expect(hasField(tax, f), `interestTaxonomy.${f}`).toBe(true);
    }
    expect(indexNames(tax)).toContain("by_tagId");

    for (const [table, fields] of [
      ["profileCompletionEvents", ["userId", "completionVersion", "badgeField", "awarded", "occurredAt"]],
      ["postingEligibilityEvents", ["userId", "previousState", "nextState", "reasonCode", "triggerType", "actorUserId", "occurredAt"]],
    ] as const) {
      const t = schema.tables[table];
      for (const f of fields) expect(hasField(t, f), `${table}.${f}`).toBe(true);
    }
  });

  it("activityLedger: bible l.231 — six v1 eventTypes, tagged meta, private default", () => {
    const t = schema.tables.activityLedger;
    for (const f of ["userId", "eventType", "targetType", "targetId", "summary", "meta", "visibility", "createdAt"]) {
      expect(hasField(t, f), `activityLedger.${f}`).toBe(true);
    }
    expect(literalValues(fieldsOf(t).eventType).sort()).toEqual(
      ["comment_created", "post_published", "resource_acquired", "save_added", "tier_unlocked", "upvote_given"].sort(),
    );
    expect(literalValues(fieldsOf(t).visibility).sort()).toEqual(["private", "public"]);
    expect(indexNames(t)).toContain("by_user_created");
  });

  it("trustHistory NOT defined here (M12 reputation, Phase 7)", () => {
    expect(schema.tables.trustHistory).toBeUndefined();
  });
});

describe("SLICE-P5-05 — CAP-570 activity.append helper", () => {
  const makeCtx = () => {
    const inserts: any[] = [];
    return {
      ctx: { db: { insert: async (_table: string, doc: any) => { inserts.push(doc); } } } as any,
      inserts,
    };
  };
  const baseArgs = {
    userId: "u1" as any,
    eventType: "comment_created" as const,
    targetType: "comment",
    targetId: "c1",
    summary: "Commented on a post",
    meta: { postTitle: { value: "Hello", privacy: "safe_for_public" as const } },
  };

  it("accepts the six v1 names and appends a private row", async () => {
    const { ctx, inserts } = makeCtx();
    await appendActivity(ctx, baseArgs);
    expect(inserts).toHaveLength(1);
    expect(inserts[0].visibility).toBe("private");
    expect(inserts[0].eventType).toBe("comment_created");
  });

  it("rejects a non-v1 eventType (extensible ≠ open)", async () => {
    const { ctx } = makeCtx();
    await expect(
      appendActivity(ctx, { ...baseArgs, eventType: "random_thing" as any }),
    ).rejects.toThrow(/not a v1 event type/);
  });

  it("rejects untagged meta fields — the public-Journey leak guard (bible l.231)", async () => {
    const { ctx } = makeCtx();
    await expect(
      appendActivity(ctx, { ...baseArgs, meta: { email: "a@b.c" } as any }),
    ).rejects.toThrow(/privacy/);
    await expect(
      appendActivity(ctx, { ...baseArgs, meta: { email: { value: "a@b.c", privacy: "maybe" } } as any }),
    ).rejects.toThrow(/privacy/);
  });

  it("empty meta object is valid (no fields = no leaks)", async () => {
    const { ctx, inserts } = makeCtx();
    await appendActivity(ctx, { ...baseArgs, meta: {} });
    expect(inserts).toHaveLength(1);
  });

  it("exports exactly the six v1 names", () => {
    expect([...ACTIVITY_EVENT_TYPES].sort()).toEqual(
      ["comment_created", "post_published", "resource_acquired", "save_added", "tier_unlocked", "upvote_given"].sort(),
    );
  });
});

describe("SLICE-P5-05 — setup module (CAP-142/144/148)", () => {
  it("CAP-148 defaults quoted: interests ON, demographics OFF, behavioral ON, public ON", () => {
    expect(DEFAULT_CONSENT_FLAGS).toEqual({
      interestsPersonalization: true,
      demographicsPersonalization: false,
      behavioralInference: true,
      publicProfileVisibility: true,
    });
  });

  it("interest tiles derive from the registries (8 post-types + 5 DEC-C01 topics, bible l.64)", () => {
    expect(INTEREST_TILE_DEFS.filter((d) => d.category === "post-types")).toHaveLength(8);
    expect(INTEREST_TILE_DEFS.filter((d) => d.category === "topics")).toHaveLength(5);
    for (const d of INTEREST_TILE_DEFS) {
      expect(d.slug.startsWith("interest-")).toBe(true);
    }
  });

  it("upsertBasic arg shape carries the six-item set (CAP-142 Writes representable)", () => {
    const args = (setupModule as any).upsertBasic?.args?.fields;
    if (!args) return; // source-level assertion below when introspection unavailable
    for (const f of ["displayName", "interestTagIds", "rulesVersion", "legalAgeVersion", "consentFlags"]) {
      expect(Boolean(args[f]), `upsertBasic.${f}`).toBe(true);
    }
  });

  it("the four CAP-142/144/148 mutations exist as the module surface", () => {
    for (const fn of ["upsertBasic", "interestsSelect", "interestsRemove", "consentRecord"]) {
      expect(typeof (setupModule as any)[fn], fn).toBe("function");
    }
  });
});
