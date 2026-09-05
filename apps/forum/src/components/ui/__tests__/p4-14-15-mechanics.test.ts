/* eslint-disable @typescript-eslint/no-explicit-any -- schema introspection + pure-gate tests */
import { describe, it, expect } from "vitest";

/* SLICE-P4-14 + P4-15 acceptance tests. The mechanic mutations exercise
 * live once posts publish + members authenticate (phase exit-gate E2E);
 * here we pin the CAP-100 URL admission (pure, exhaustive) and the module
 * surfaces + schema substrate.
 *
 * Sources: CAP-093–100 Notes; CONTRACT-2-post-detail States B/C/D. */

import schemaDefault from "../../../../../../convex/schema";
import * as debate from "../../../../../../convex/posts/debate";
import * as listItems from "../../../../../../convex/posts/listItems";
import * as help from "../../../../../../convex/posts/help";
import * as showcase from "../../../../../../convex/posts/showcase";

const schema = schemaDefault as any;
const fieldsOf = (t: any) => t.validator.fields;
const hasField = (t: any, f: string) => Boolean(fieldsOf(t)?.[f]);
const literalValues = (field: any): string[] => {
  if (!field) return [];
  if (field.kind === "union") return field.members.map((l: any) => l.value);
  if (field.kind === "literal") return [field.value];
  return [];
};

describe("SLICE-P4-14 — module surface + schema", () => {
  it("debate: cast/change are public mutations", () => {
    expect((debate.cast as any).isMutation).toBe(true);
    expect((debate.cast as any).isPublic).toBe(true);
    expect((debate.change as any).isMutation).toBe(true);
  });

  it("listItems: add/remove/toggleVote are public mutations", () => {
    for (const fn of [listItems.add, listItems.remove, listItems.toggleVote]) {
      expect((fn as any).isMutation).toBe(true);
      expect((fn as any).isPublic).toBe(true);
    }
  });

  it("postListItems carries content + derived voteCount (bible l.93)", () => {
    const t = schema.tables.postListItems;
    for (const f of ["postListId", "content", "createdByUserId", "voteCount", "sortOrder"]) {
      expect(hasField(t, f), `postListItems.${f}`).toBe(true);
    }
  });
});

describe("SLICE-P4-15 — module surface + schema", () => {
  it("help: accept/reopen are public mutations", () => {
    expect((help.accept as any).isMutation).toBe(true);
    expect((help.reopen as any).isMutation).toBe(true);
  });

  it("showcase: submitProjectUrl is a public mutation; approvalStatus enum (bible l.94/359)", () => {
    expect((showcase.submitProjectUrl as any).isMutation).toBe(true);
    const t = schema.tables.postShowcases;
    expect(literalValues(fieldsOf(t).approvalStatus).sort()).toEqual(["approved", "none", "pending", "rejected"].sort());
  });
});

describe("SLICE-P4-15 — CAP-100 URL admission (pure, exhaustive)", () => {
  const allow = ["notion.so", "mytool.example.com"];

  it("accepts exact + authorized-subdomain HTTPS hosts", () => {
    expect(showcase.validateProjectUrl("https://notion.so/page", allow)).toMatchObject({ ok: true });
    expect(showcase.validateProjectUrl("https://www.notion.so/page", allow)).toMatchObject({ ok: true });
    expect(showcase.validateProjectUrl("https://app.mytool.example.com/", allow)).toMatchObject({ ok: true });
  });

  it("rejects: non-HTTPS, creds, unauthorized host/subdomain, IP literals, localhost, malformed", () => {
    expect(showcase.validateProjectUrl("http://notion.so", allow).ok).toBe(false);
    expect(showcase.validateProjectUrl("https://user:pass@notion.so", allow).ok).toBe(false);
    expect(showcase.validateProjectUrl("https://evil.com/", allow).ok).toBe(false);
    expect(showcase.validateProjectUrl("https://notion.so.evil.com/", allow).ok).toBe(false);
    expect(showcase.validateProjectUrl("https://fakenotion.so/", allow).ok).toBe(false);
    expect(showcase.validateProjectUrl("https://192.168.1.1/", allow).ok).toBe(false);
    expect(showcase.validateProjectUrl("https://localhost/", allow).ok).toBe(false);
    expect(showcase.validateProjectUrl("not a url", allow).ok).toBe(false);
  });

  it("empty allowlist rejects everything (fail-closed pre-configuration posture)", () => {
    expect(showcase.validateProjectUrl("https://notion.so/", []).ok).toBe(false);
  });
});
