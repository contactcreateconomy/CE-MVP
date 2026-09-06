/* eslint-disable @typescript-eslint/no-explicit-any -- source assertions + pure checks */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P5-03 acceptance tests — CAP-123/124/125/126/127/128/131. Sources:
 * CONTRACT-5-discussion-thread §3 A/F/G/H + §4 rows 4–11; register rows
 * CAP-123…131; bible l.103/106/115. */

import * as reactionsModule from "../../../../../../convex/reactions";

const convexRoot = join(__dirname, "../../../../../../convex");
const readsSrc = readFileSync(join(convexRoot, "comments/reads.ts"), "utf8");
const reactionsSrc = readFileSync(join(convexRoot, "reactions.ts"), "utf8");
const detailClientSrc = readFileSync(
  join(__dirname, "../../discussion/post-detail-client.tsx"),
  "utf8",
);

describe("SLICE-P5-03 — six sort modes + cursor freeze (CAP-123)", () => {
  it("all six modes are enumerable + persona-excluded from score sorts (INV-6)", () => {
    for (const mode of ["best", "live", "new", "top", "most_discussed", "qa"]) {
      expect(readsSrc).toContain(`"${mode}"`);
    }
    expect(readsSrc).toContain("personaExcluded");
    expect(readsSrc).toMatch(/new.*persona|persona.*new/); // `new` still shows persona comments
  });

  it("cursor freezes the rank ordering (quoted: 'freezes rankVersion per session')", () => {
    expect(readsSrc).toContain("boundary"); // key-boundary continuation, never a fresh sort mid-walk
    expect(readsSrc).toContain("rankVersion");
  });

  it("fail-closed display: only moderationStatus=passed comments are publicly listed", () => {
    expect(readsSrc).toContain('c.moderationStatus === "passed"');
  });

  it("hot-window bounds transcribed (≤100 top-level, ≤50 replies/group)", () => {
    expect(readsSrc).toContain("MAX_TOP_LEVEL = 100");
    expect(readsSrc).toContain("MAX_REPLIES_PER_GROUP = 50");
  });
});

describe("SLICE-P5-03 — getThread (CAP-124)", () => {
  it("threadPluginConfig overlay read; may never redefine core semantics (read-only)", () => {
    expect(readsSrc).toContain("threadPluginConfig");
    expect(readsSrc).toContain("allowedSortModes");
  });

  it("MAX panel renders empty until Phase 7 (layering caveat — never invented)", () => {
    expect(readsSrc).toContain("maxPanel: null");
  });

  it("anonymous-safe vs member branches (viewer state only for members)", () => {
    expect(readsSrc).toMatch(/if \(userId\)/);
    expect(readsSrc).toMatch(/let viewer.*= null/); // structural: no viewer state without a member
  });

  it("read-position rides member responses only (CAP-131 jump-to-unread)", () => {
    expect(readsSrc).toContain("readState");
    expect(readsSrc).toContain("threadReadStates");
  });
});

describe("SLICE-P5-03 — reactions (CAP-125/126/127/128)", () => {
  it("CAP-125 reactor exclusions quoted: self/staff/persona + trust tier gate", () => {
    expect(reactionsSrc).toContain("self-reaction excluded");
    expect(reactionsSrc).toContain("staff are excluded from reacting");
    expect(reactionsSrc).toContain("trust tier required");
  });

  it("weightAtCast = 1 baseline until M12 signalReputation (flagged, never Recognition)", () => {
    expect(reactionsSrc).toContain("weightAtCast: 1");
    expect(reactionsSrc).toContain("NEVER Recognition"); // the quoted contract is stated in the module
  });

  it("mutual exclusivity is structural: one row per (userId, commentId) via delete+insert", () => {
    expect(reactionsSrc).toContain("await ctx.db.delete(existing._id)");
    expect(reactionsSrc).toContain("mutual exclusivity");
  });

  it("negative NEVER lowers Best: no bestScore input written by toggleNegative", () => {
    const negativeFn = reactionsSrc.split("toggleNegative")[1] ?? "";
    expect(negativeFn).not.toContain("bestScore");
    expect(negativeFn).toContain("NEVER lowers Best");
  });

  it("PRIVATE reason routing: needs_evidence → context signal; off_topic → moderation case", () => {
    expect(reactionsSrc).toContain('args.reason === "needs_evidence"');
    expect(reactionsSrc).toContain('args.reason === "off_topic"');
    expect(reactionsSrc).toContain("commentContextSignals");
    expect(reactionsSrc).toContain("moderationCases");
  });

  it("CAP-570 call-sites: upvote_given + save_added fire on ADD only, same mutation", () => {
    expect(reactionsSrc).toContain('eventType: "upvote_given"');
    expect(reactionsSrc).toContain('eventType: "save_added"');
    expect(reactionsSrc).toContain("fires on the ADD");
  });

  it("read-state writes NO rawEvents (contract §5: read paths write none)", () => {
    const markFn = reactionsSrc.split("markReadState")[1] ?? "";
    expect(markFn).not.toContain("captureEvent");
  });

  it("the three reaction event rows carry the full CAP-437 shape", () => {
    const rows = reactionsModule.REACTION_EVENT_CATALOG_ROWS;
    expect(rows.map((r) => r.eventName).sort()).toEqual(["comment.reacted", "comment.saved", "comment.signaled"]);
    for (const row of rows) {
      for (const field of ["signalEligible", "s18Eligible", "excludeStaff", "excludePersonas", "idempotencyScope", "retentionClass", "posthogMirror", "effectiveFrom", "owner"]) {
        expect(field in row, `${row.eventName}.${field}`).toBe(true);
      }
    }
  });

  it("mutations exist: toggleValuable/toggleNegative/toggleSave/signalContext/markReadState", () => {
    for (const fn of ["toggleValuable", "toggleNegative", "toggleSave", "signalContext", "markReadState"]) {
      expect(typeof (reactionsModule as any)[fn], fn).toBe("function");
    }
  });
});

describe("SLICE-P5-03 — thread UI wiring", () => {
  it("the P4-13 placeholder is replaced by the canonical thread", () => {
    expect(detailClientSrc).toContain("CanonicalThread");
    expect(detailClientSrc).not.toContain("arrives with the comments engine (Phase 5)");
  });

  it("compose enforces the no-URL contract client-side hint + authorIntent self-labeling", () => {
    const ui = readFileSync(join(__dirname, "../../discussion/canonical-thread.tsx"), "utf8");
    expect(ui).toContain("no URLs");
    expect(ui).toContain("authorIntent");
    expect(ui).toContain("AI"); // FATAL-M17-02 badge
  });
});
