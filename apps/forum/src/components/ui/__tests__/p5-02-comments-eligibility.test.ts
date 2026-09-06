/* eslint-disable @typescript-eslint/no-explicit-any -- mocked-ctx helper + source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P5-02 acceptance tests — CAP-120/121/122 comment CRUD + the
 * CAP-140/141/152/153/154 gate chain. Sources: register rows CAP-120/121/
 * 122/140/141/152/153/154/321; CONTRACT-5-discussion-thread §1-§4;
 * CONTRACT-5-setup §1 (gate logic). */

import {
  checkCommentEligibility,
  checkPostEligibility,
  EligibilityError,
} from "../../../../../../convex/eligibility";
import * as commentsModule from "../../../../../../convex/comments";
import { checkNoUrls } from "../../../../../../convex/posts";
import { RATE_LIMITS } from "../../../../../../convex/lib/rateLimit";

const convexRoot = join(__dirname, "../../../../../../convex");

/** Minimal user-row mock for the eligibility machine (db.get → user). */
function eligibilityCtx(user: any) {
  const events: any[] = [];
  const patches: any[] = [];
  return {
    ctx: {
      db: {
        get: async () => user,
        insert: async (_t: string, doc: any) => {
          events.push(doc);
          return "e1";
        },
        patch: async (id: any, doc: any) => {
          patches.push({ id, doc });
        },
      },
    } as any,
    events,
    patches,
  };
}

const baseUser = {
  emailVerified: true,
  mobileVerified: true,
  accountStatus: "active",
  accountStanding: "good",
  basicProfileComplete: true,
  postingEligibilityState: "eligible",
};

describe("SLICE-P5-02 — CAP-141 comment eligibility (no profile gate)", () => {
  it("verified member passes WITHOUT any profile fields (quoted: 'no profile gate')", async () => {
    const { ctx } = eligibilityCtx({ ...baseUser, basicProfileComplete: false });
    await expect(checkCommentEligibility(ctx, "u1" as any)).resolves.toBeUndefined();
  });

  it("mobile unverified → typed rejection naming the missing decision (CAP-551 G6 fence)", async () => {
    const { ctx } = eligibilityCtx({ ...baseUser, mobileVerified: false });
    await expect(checkCommentEligibility(ctx, "u1" as any)).rejects.toThrow(EligibilityError);
    try {
      await checkCommentEligibility(ctx, "u1" as any);
    } catch (e) {
      expect((e as EligibilityError).reasonCode).toBe("mobile_verified");
    }
  });

  it("email unverified → not_verified with both missing codes", async () => {
    const { ctx } = eligibilityCtx({ ...baseUser, emailVerified: false, mobileVerified: false });
    try {
      await checkCommentEligibility(ctx, "u1" as any);
      expect.unreachable();
    } catch (e) {
      expect((e as EligibilityError).missing.sort()).toEqual(["email_verified", "mobile_verified"]);
    }
  });

  it("restricted standing → temporarily_restricted, never eligible", async () => {
    const { ctx } = eligibilityCtx({ ...baseUser, accountStanding: "restricted" });
    await expect(checkCommentEligibility(ctx, "u1" as any)).rejects.toThrow(EligibilityError);
  });
});

describe("SLICE-P5-02 — CAP-140 post eligibility (basic-profile gate + missing decisions)", () => {
  it("incomplete → NOT a throw: returns missing=['basic_profile'] for draft-preserve", async () => {
    const { ctx } = eligibilityCtx({ ...baseUser, basicProfileComplete: false, postingEligibilityState: "not_verified" });
    const result = await checkPostEligibility(ctx, "u1" as any);
    expect(result.eligible).toBe(false);
    expect(result.missing).toEqual(["basic_profile"]);
    expect(result.state).toBe("basic_incomplete");
  });

  it("state transitions append postingEligibilityEvents (append-only machine)", async () => {
    const { ctx, events } = eligibilityCtx({ ...baseUser, postingEligibilityState: "not_verified" });
    await checkPostEligibility(ctx, "u1" as any);
    expect(events).toHaveLength(1);
    expect(events[0].nextState).toBe("eligible");
    expect(events[0].previousState).toBe("not_verified");
  });

  it("no transition event when state unchanged", async () => {
    const { ctx, events } = eligibilityCtx(baseUser);
    await checkPostEligibility(ctx, "u1" as any);
    expect(events).toHaveLength(0);
  });
});

describe("SLICE-P5-02 — comments module surface (CAP-120/121/122)", () => {
  it("create/edit/softDelete mutations exist", () => {
    for (const fn of ["create", "edit", "softDelete"]) {
      expect(typeof (commentsModule as any)[fn], fn).toBe("function");
    }
  });

  it("the three rawEvents catalog rows carry the full CAP-437 shape", () => {
    const rows = commentsModule.COMMENT_EVENT_CATALOG_ROWS;
    expect(rows.map((r) => r.eventName).sort()).toEqual(["comment.created", "comment.deleted", "comment.edited"]);
    for (const row of rows) {
      for (const field of ["signalEligible", "s18Eligible", "excludeStaff", "excludePersonas", "idempotencyScope", "retentionClass", "posthogMirror", "effectiveFrom", "owner"]) {
        expect(field in row, `${row.eventName}.${field}`).toBe(true);
      }
      expect(row.captureMode).toBe("same_mutation"); // CAP-436 atomicity
    }
  });

  it("INV-2 reuses the composer's URL guard (CAP-155: one helper, two call sites)", () => {
    expect(() => checkNoUrls("see https://example.com")).toThrow(/URL/);
    expect(() => checkNoUrls("plain body text")).not.toThrow();
    const source = readFileSync(join(convexRoot, "comments.ts"), "utf8");
    expect(source).toContain('from "./posts"'); // shared import, no fork
  });
});

describe("SLICE-P5-02 — composer gate chain (CAP-152/153/154) source assertions", () => {
  const postsSource = readFileSync(join(convexRoot, "posts.ts"), "utf8");

  it("CAP-152: member.posts.hour rolling limit registered (flagged default 10/h)", () => {
    const set = RATE_LIMITS["member.posts.hour"];
    expect(set).toBeDefined();
    expect(set[0].subject).toBe("user");
    expect(set[0].periodMs).toBe(60 * 60_000);
    expect(postsSource).toContain('checkRateLimit(ctx, "member.posts.hour"');
  });

  it("CAP-140: preserve-draft outcome + missing decisions in the return contract", () => {
    expect(postsSource).toContain("preservedAsDraft");
    expect(postsSource).toContain("missingBasic");
    expect(postsSource).toMatch(/publishing && !preservedAsDraft/);
    // B1 resolved (founder 2026-09-06): classifier-pass ⇒ auto-publish
    expect(postsSource).toMatch(/moderationStatus = "passed";\n        lifecycleStatus = "published"/);
  });

  it("CAP-153: deterministic length + exact-dup gates present", () => {
    expect(postsSource).toContain("duplicate_post");
    expect(postsSource).toContain("body_too_long");
  });

  it("CAP-154: classifier fail-closed (unavailable ⇒ pending hold + case)", () => {
    expect(postsSource).toContain("classifier_unavailable");
    expect(postsSource).toContain("moderationCases");
  });

  it("CAP-570 post_published call-site wired at the member publish attempt", () => {
    expect(postsSource).toContain('eventType: "post_published"');
  });
});
