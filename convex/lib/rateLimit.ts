/**
 * rateLimit — SLICE-P1-09: typed rate-limit subjects + the seven Phase-1
 * literal sets. Literal values quoted from the register Notes column.
 *
 * M1 §4: "personas ≠ human buckets" — persona subjects get their own
 * namespace prefix, never share a human's bucket.
 *
 * State lives in @convex-dev/rate-limiter (M1: "do not dual-write custom
 * buckets"). This module defines the literals + typed subjects so every
 * consumer is one helper call; over-limit returns a typed rejection.
 */

export type RateSubject =
  | { kind: "ip_hash"; value: string }
  | { kind: "email_hash"; value: string }
  | { kind: "user"; value: string }
  | { kind: "operator"; value: string }
  | { kind: "persona"; value: string };

export interface RateLimit {
  name: string;
  max: number;
  periodMs: number;
  subject: RateSubject["kind"];
}

/** The seven Phase-1 literal sets — values are register Notes, verbatim. */
export const RATE_LIMITS: Record<string, RateLimit[]> = {
  // CAP-016: "5 / 15m per ip_hash"
  "auth.magic_link.ip": [{ name: "auth.magic_link.ip", max: 5, periodMs: 15 * 60_000, subject: "ip_hash" }],
  // CAP-017: "3 / 1h per email_hash"
  "auth.magic_link.email": [{ name: "auth.magic_link.email", max: 3, periodMs: 60 * 60_000, subject: "email_hash" }],
  // CAP-018: "10 / 1h per user"
  "auth.finalize": [{ name: "auth.finalize", max: 10, periodMs: 60 * 60_000, subject: "user" }],
  // CAP-019: "60 / 1m per operator. Staff NOT rate-exempt"
  "admin.write": [{ name: "admin.write", max: 60, periodMs: 60_000, subject: "operator" }],
  // CAP-020: "30 / 1h per operator"
  "support.action": [{ name: "support.action", max: 30, periodMs: 60 * 60_000, subject: "operator" }],
  // CAP-021 (M13-owned literals): "10/d · 30/w per user"
  "report": [
    { name: "report.daily", max: 10, periodMs: 24 * 60 * 60_000, subject: "user" },
    { name: "report.weekly", max: 30, periodMs: 7 * 24 * 60 * 60_000, subject: "user" },
  ],
  // CAP-015: waitlist join "10/h ip + 3/24h email"
  "waitlist.join": [
    { name: "waitlist.join.ip", max: 10, periodMs: 60 * 60_000, subject: "ip_hash" },
    { name: "waitlist.join.email", max: 3, periodMs: 24 * 60 * 60_000, subject: "email_hash" },
  ],
  // CAP-013: "5 / 1h per user"
  "media.upload": [{ name: "media.upload", max: 5, periodMs: 60 * 60_000, subject: "user" }],
  // CAP-152 (SLICE-P5-02): "N posts/hour, tier-independent. O(1) rolling
  // counter, compute-at-write." N is register-unnamed — 10/h is a FLAGGED
  // default, documented as the configKeyRegistry row member.posts.perHour
  // (change = registry edit + this literal; never a silent tune).
  "member.posts.hour": [{ name: "member.posts.hour", max: 10, periodMs: 60 * 60_000, subject: "user" }],
  // CAP-176 (SLICE-P5-09): "rate-limited" with no literal — 5/day is a
  // FLAGGED default per member (revival-vote integrity).
  "revival.vote": [{ name: "revival.vote", max: 5, periodMs: 24 * 60 * 60_000, subject: "user" }],
};

/** Typed rejection — consumers see this shape, never a silent pass. */
export class RateLimitError extends Error {
  constructor(
    public readonly limitName: string,
    public readonly max: number,
    public readonly periodMs: number,
    public readonly subjectKind: string,
  ) {
    super(`rate_limit: ${limitName} exceeded (${max} per ${periodMs / 1000}s per ${subjectKind})`);
    this.name = "RateLimitError";
  }
}

/**
 * checkRateLimit — the single consumer-facing check. The reserve() call is
 * the @convex-dev/rate-limiter integration point (installed at consumer
 * time — Convex components need a component client, wired in the consuming
 * mutation's ctx.components). This function performs the literal lookup +
 * subject typing + typed rejection; the component call site is one line.
 */
export function rateLimitSet(name: string): RateLimit[] {
  const set = RATE_LIMITS[name];
  if (!set) throw new Error(`rate_limit: unknown literal set "${name}"`);
  return set;
}

export function subjectKey(subject: RateSubject): string {
  // Personas never share a human bucket (M1 §4)
  if (subject.kind === "persona") return `persona:${subject.value}`;
  return `${subject.kind}:${subject.value}`;
}

/** Staff exemption check — CAP-019: "Staff NOT rate-exempt". Always false. */
export function isRateExempt(): boolean {
  return false;
}

// ── @convex-dev/rate-limiter integration (SLICE-P1-09's consumer-time
//    install, wired 2026-09-05) ────────────────────────────────────────────
// Fixed-window counting matches the register's "N per period" literals.
// NOTE: ip_hash subjects need the client IP, which Convex functions do not
// receive (only httpAction headers do) — ip-side gates wire at their
// http/edge entry points, not here.
import { RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

const LIMIT_CONFIGS = Object.fromEntries(
  Object.values(RATE_LIMITS)
    .flat()
    .map((l) => [l.name, { kind: "fixed window" as const, rate: l.max, period: l.periodMs }]),
);

const limiter = new RateLimiter(components.rateLimiter, LIMIT_CONFIGS);

/**
 * checkRateLimit — the single consumer-facing check (SLICE-P1-09's promised
 * integration point). Evaluates the limits in the set whose subject kind
 * matches the provided subject (callers pass every subject they can see —
 * e.g. mutations never see the client IP, so ip_hash gates activate at
 * their http/edge entry points). Throws the typed RateLimitError on
 * exhaustion; a silent pass is never returned.
 */
export async function checkRateLimit(ctx: any, setName: string, subject: RateSubject): Promise<void> {
  const applicable = rateLimitSet(setName).filter((l) => l.subject === subject.kind);
  if (applicable.length === 0) {
    throw new Error(`rate_limit: set "${setName}" has no limit for subject kind ${subject.kind}`);
  }
  for (const limit of applicable) {
    const status = await limiter.limit(ctx, limit.name, { key: subjectKey(subject), throws: false });
    if (!status.ok) {
      throw new RateLimitError(limit.name, limit.max, limit.periodMs, subject.kind);
    }
  }
}
