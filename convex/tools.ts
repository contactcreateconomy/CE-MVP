/**
 * tools — SLICE-P4-04: tool registry backend + /tools + /tools/[slug].
 *
 * CAP-108 (Editor): "Operator creates tool (tools.create)" — "Operator-
 * curated; slug uniqueness." Writes tools + toolTags + auditLog.
 * CAP-109 (Editor): tools.update — metadata edits + CAP-119 archive flip.
 * CAP-110 (member): tools.getProfile — "Returns {tool, aggregate,
 *   editorialVerdicts, ratingsPage}; TWO labeled segments — aggregate (from
 *   tools) vs editorialVerdicts; honest zero-state when ratingCount=0."
 *   editorialVerdicts read from the tools editorialVerdict* fields (CAP-535's
 *   write target — 2026-08-23 correction, NOT postReviews.verdictScore).
 * CAP-111 (member): tools.list — "Paginated/filterable (category, tag,
 *   search)." Directory indexability unspecified = NOINDEX by default
 *   (FATAL-M17-01 fail-closed) — the page ships noindex, enforced in UI
 *   metadata, not here.
 * CAP-118: "Page ships noindex in Wave 2, flips to indexable only when
 *   CAP-468 ships in Wave 7" — indexability is NOT this module's concern.
 * CAP-119: archived → "Aggregate frozen; profile shows 'archived' banner."
 *   Frozen = no aggregate-affecting write may run against an archived tool
 *   (the P4-05 rating mutations own that guard); this module only flips
 *   status and the profile render shows the banner.
 *
 * Ratings submit/update/withdraw are SLICE-P4-05 — this module ships the
 * profile with ZERO-STATE aggregates only (no rating writes exist here).
 *
 * Public Read Queries rule (bible l.33): both queries serve anonymous and
 * member actors → two explicit branches per query (anonymous-safe view vs
 * full member view), implemented and documented below.
 */

import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission } from "./lib/authz";
import { writeAudited, newCorrelationId } from "./lib/audit";
import { recomputeFromRatings } from "./toolRatings";

/** The four rating dimensions (bible l.354 — toolRating.dimension). */
const DIMENSIONS = ["ease_of_use", "output_quality", "reliability", "value_for_money"] as const;

/** Zero-aggregate initializer for tools.create (INV-1: ratings feed only). */
const zeroSums = () => ({ ease_of_use: 0, output_quality: 0, reliability: 0, value_for_money: 0 });

/** Editor gate — CAP-108/109 Actor=Editor (register authoritative). */
async function assertEditor(ctx: any): Promise<Id<"users">> {
  const roles = await assertAdminPermission(ctx);
  if (!roles.includes("editor")) {
    throw new Error("tools: Editor role required (CAP-108/109)");
  }
  const userId = (await getAuthUserId(ctx)) as Id<"users">;
  if (!userId) throw new Error("tools: authentication required");
  return userId;
}

/**
 * Pure projection — the community aggregate segment (CAP-110 / R-VERDICT).
 * Honest zero-state: overall is null and every dimension avg is null when
 * there is nothing to average — never 0 masquerading as a score, never an
 * editorial verdict standing in. not_applicable dims carry count-only
 * honesty (sum/count are already N/A-exclusive by INV-3).
 */
export function aggregateView(tool: {
  ratingSum: number;
  ratingCount: number;
  dimensionSums: Record<(typeof DIMENSIONS)[number], number>;
  dimensionCounts: Record<(typeof DIMENSIONS)[number], number>;
}) {
  const dimensions = {} as Record<(typeof DIMENSIONS)[number], { avg: number | null; count: number }>;
  for (const dim of DIMENSIONS) {
    const count = tool.dimensionCounts[dim];
    dimensions[dim] = {
      avg: count > 0 ? Math.round((tool.dimensionSums[dim] / count) * 10) / 10 : null,
      count,
    };
  }
  return {
    overall: tool.ratingCount > 0 ? Math.round((tool.ratingSum / tool.ratingCount) * 10) / 10 : null,
    ratingCount: tool.ratingCount,
    dimensions,
  };
}

/**
 * Pure projection — the editorialVerdicts segment source (CAP-535 write
 * target on the tools row; display-only). Nullable fields = no curated
 * verdict → the segment renders its empty state (contract State 1).
 */
export function editorialVerdictView(tool: {
  editorialVerdictScore?: number;
  editorialVerdictSummary?: string;
  editorialVerdictAssignedByUserId?: Id<"users">;
  editorialVerdictUpdatedAt?: number;
}) {
  if (tool.editorialVerdictScore === undefined && tool.editorialVerdictSummary === undefined) {
    return null;
  }
  return {
    score: tool.editorialVerdictScore ?? null,
    summary: tool.editorialVerdictSummary ?? null,
    assignedByUserId: tool.editorialVerdictAssignedByUserId ?? null,
    updatedAt: tool.editorialVerdictUpdatedAt ?? null,
  };
}

/** CAP-108 — Editor creates a tool (slug unique; zero aggregates; tag joins). */
export const create = mutation({
  args: {
    // Mirror the tools schema validators (bible l.143)
    name: v.string(),
    slug: v.string(),
    logoAssetId: v.optional(v.string()),
    categoryIds: v.array(v.string()),
    pricing: v.optional(v.any()),
    officialUrl: v.string(),
    status: v.optional(v.union(v.literal("active"), v.literal("draft"), v.literal("archived"))),
    tagIds: v.optional(v.array(v.id("tags"))), // writes toolTags joins (CAP-108 Writes)
  },
  handler: async (ctx, args) => {
    const editorId = await assertEditor(ctx);

    // CAP-108: slug uniqueness
    const existing = await ctx.db
      .query("tools")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .unique();
    if (existing) throw new Error(`tools.create: slug "${args.slug}" already exists`);

    // Tag joins constrained to the active taxonomy (CAP-534 discipline,
    // same server-side constraint as posts — select-from-list, not free text)
    const tagIds = [...new Set(args.tagIds ?? [])];
    for (const tagId of tagIds) {
      const tag = await ctx.db.get(tagId);
      if (!tag || tag.status !== "active") {
        throw new Error(`tools.create: tag ${tagId} is not an active taxonomy entry`);
      }
    }

    return await writeAudited(ctx, async (actx) => {
      // Fail-closed default: a fresh registry row is draft (CAP-118: draft →
      // noindex; not publicly listable) until the Editor flips it active.
      const toolId = await actx.db.insert("tools", {
        name: args.name,
        slug: args.slug,
        logoAssetId: args.logoAssetId,
        categoryIds: args.categoryIds,
        pricing: args.pricing,
        officialUrl: args.officialUrl,
        status: args.status ?? "draft",
        ratingSum: 0,
        ratingCount: 0,
        dimensionSums: zeroSums(),
        dimensionCounts: zeroSums(),
      });
      for (const tagId of tagIds) {
        await actx.db.insert("toolTags", { toolId: toolId as Id<"tools">, tagId, createdAt: Date.now() });
      }
      return {
        actorId: editorId,
        role: "editor",
        action: "tools.create",
        target: `tool:${toolId}`,
        prev: null,
        next: { slug: args.slug, status: args.status ?? "draft" },
        correlationId: newCorrelationId(),
        reversible: true,
      };
    });
  },
});

/**
 * CAP-109 — Editor updates a tool. Slug is IMMUTABLE here (profile links
 * and CAP-110 lookups key on it; rename is not a named capability).
 * CAP-119: status→archived freezes the aggregate — this mutation never
 * touches aggregate fields (they are not args), and the P4-05 rating
 * mutations must reject aggregate-affecting writes on archived tools.
 */
export const update = mutation({
  args: {
    toolId: v.id("tools"),
    name: v.optional(v.string()),
    logoAssetId: v.optional(v.string()),
    categoryIds: v.optional(v.array(v.string())),
    pricing: v.optional(v.any()),
    officialUrl: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("draft"), v.literal("archived"))),
    tagIds: v.optional(v.array(v.id("tags"))),
  },
  handler: async (ctx, args) => {
    const editorId = await assertEditor(ctx);

    const tool = await ctx.db.get(args.toolId);
    if (!tool) throw new Error("tools.update: not found");

    if (args.tagIds !== undefined) {
      const tagIds = [...new Set(args.tagIds)];
      for (const tagId of tagIds) {
        const tag = await ctx.db.get(tagId);
        if (!tag || tag.status !== "active") {
          throw new Error(`tools.update: tag ${tagId} is not an active taxonomy entry`);
        }
      }
    }

    return await writeAudited(ctx, async (actx) => {
      const { toolId, tagIds, ...fields } = args;
      const patch: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(fields)) {
        if (val !== undefined) patch[k] = val;
      }
      if (Object.keys(patch).length > 0) {
        await actx.db.patch(toolId, patch);
      }

      if (tagIds !== undefined) {
        const joins = await actx.db
          .query("toolTags")
          .withIndex("by_toolId_tagId", (q: any) => q.eq("toolId", toolId))
          .collect();
        const existing = new Set(joins.map((j: any) => j.tagId));
        const submitted = new Set(tagIds);
        for (const join of joins) {
          if (!submitted.has(join.tagId)) await actx.db.delete(join._id);
        }
        for (const tagId of submitted) {
          if (!existing.has(tagId)) {
            await actx.db.insert("toolTags", { toolId, tagId: tagId as Id<"tags">, createdAt: Date.now() });
          }
        }
      }

      return {
        actorId: editorId,
        role: "editor",
        action: "tools.update",
        target: `tool:${toolId}`,
        prev: { name: tool.name, status: tool.status, categoryIds: tool.categoryIds },
        next: patch,
        correlationId: newCorrelationId(),
        reversible: true,
      };
    });
  },
});

/**
 * CAP-111 — tools.list for the directory. Paginated/filterable by category
 * (DEC-C01 slug), tag (toolTags join), and search (name).
 *
 * Public Read Queries rule (bible l.33) — two explicit branches: the
 * anonymous-safe view and the member view. The tools catalog carries no
 * personal fields, so both branches project the SAME field set; the branch
 * exists and is documented rather than silently collapsed (no member-only
 * field is defined on tools by any capability).
 *
 * status=active only (fail-closed): archived/draft rows are not listable —
 * directory status-inclusion was an open question (contract OQ#3); the
 * FATAL-M17-01 fail-closed resolution for indexability applies to
 * listability too. CAP-119 keeps archived PROFILES renderable (getProfile),
 * not directory-listed.
 */
export const list = query({
  args: {
    category: v.optional(v.string()), // category slug
    tag: v.optional(v.id("tags")),
    search: v.optional(v.string()),
    cursor: v.optional(v.string()),
    numItems: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // branch marker (bible l.33): anonymous and member project identically
    // here — catalog fields only; no member-only field exists on tools.
    const numItems = Math.min(Math.max(args.numItems ?? 20, 1), 100);

    let page;
    let continueCursor: string | null;
    if (args.search) {
      const q = ctx.db
        .query("tools")
        .withSearchIndex("search_name", (q: any) => q.search("name", args.search!))
        .filter((q: any) => q.eq(q.field("status"), "active"));
      const result = await q.paginate({ cursor: args.cursor ?? null, numItems });
      page = result.page;
      continueCursor = result.continueCursor;
    } else {
      const q = ctx.db
        .query("tools")
        .withIndex("by_status", (q: any) => q.eq("status", "active"));
      const result = await q.paginate({ cursor: args.cursor ?? null, numItems });
      page = result.page;
      continueCursor = result.continueCursor;
    }

    let tools = page;
    if (args.category) {
      tools = tools.filter((t: any) => t.categoryIds.includes(args.category!));
    }
    if (args.tag) {
      const joins = await ctx.db
        .query("toolTags")
        .withIndex("by_tagId", (q: any) => q.eq("tagId", args.tag!))
        .collect();
      const taggedToolIds = new Set(joins.map((j: any) => j.toolId));
      tools = tools.filter((t: any) => taggedToolIds.has(t._id));
    }

    // Directory card projection: catalog fields + live aggregate summary
    // (which tools fields render is contract OQ#2 — unspecified; this is the
    // minimal honest set the archetype names: name, pricing, aggregate)
    return {
      tools: tools.map((t: any) => ({
        _id: t._id,
        name: t.name,
        slug: t.slug,
        logoAssetId: t.logoAssetId,
        categoryIds: t.categoryIds,
        pricing: t.pricing,
        overall: t.ratingCount > 0 ? Math.round((t.ratingSum / t.ratingCount) * 10) / 10 : null,
        ratingCount: t.ratingCount,
      })),
      continueCursor,
      isDone: page.length < numItems,
    };
  },
});

/**
 * CAP-110 — tools.getProfile. Lookup key = tools.slug (unique).
 * Returns {tool, aggregate, editorialVerdicts, ratingsPage} — the TWO
 * labeled segments per R-VERDICT; honest zero-state when ratingCount=0.
 *
 * Public Read Queries rule (bible l.33): anonymous branch = tool +
 * aggregate + editorialVerdicts with an EMPTY ratingsPage (user-identity-
 * bearing ratings withheld); member branch = full ratingsPage. Anonymous
 * ratings-page scope was contract OQ#4 (unspecified) — withheld is the
 * fail-closed reading. Ratings display list: status=active AND
 * moderationStatus=passed (removed/held are not publicly displayed; held
 * awaits moderation — CAP-114 display rules).
 */
export const getProfile = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const tool = await ctx.db
      .query("tools")
      .withIndex("by_slug", (q: any) => q.eq("slug", slug))
      .unique();
    if (!tool) return null;

    const aggregate = aggregateView(tool);
    const editorialVerdicts = editorialVerdictView(tool);

    // ratingsPage — member branch only (see doc comment)
    const userId = await getAuthUserId(ctx);
    let ratingsPage: {
      items: { userId: Id<"users">; overallScore: number; dimensionScores: (typeof tool)["dimensionSums"]; reviewText: string | undefined }[];
      isDone: boolean;
      nextCursor: string | null; // continuation for tools.listRatings (Action 5)
    };
    if (userId) {
      const result = await ctx.db
        .query("toolRatings")
        .withIndex("by_toolId", (q: any) => q.eq("toolId", tool._id))
        .filter((q: any) =>
          q.and(
            q.eq(q.field("status"), "active"),
            q.eq(q.field("moderationStatus"), "passed"),
          ),
        )
        .paginate({ cursor: null, numItems: 10 });
      ratingsPage = {
        items: result.page.map((r: any) => ({
          userId: r.userId,
          overallScore: r.overallScore,
          dimensionScores: r.dimensionScores,
          reviewText: r.reviewText,
        })),
        isDone: result.isDone,
        nextCursor: result.isDone ? null : result.continueCursor,
      };
    } else {
      ratingsPage = { items: [], isDone: true, nextCursor: null };
    }

    // The viewer's own ACTIVE rating (contract State 6: existing active →
    // edit mode; owner-only edit/withdraw CAP-113/117). Anonymous → null.
    let myRating: {
      ratingId: string; overallScore: number;
      dimensionScores: Record<string, number | "not_applicable">; reviewText: string | undefined;
    } | null = null;
    if (userId) {
      const own = await ctx.db
        .query("toolRatings")
        .withIndex("by_toolId_userId", (q: any) => q.eq("toolId", tool._id).eq("userId", userId))
        .filter((q: any) => q.eq(q.field("status"), "active"))
        .first();
      if (own) {
        myRating = {
          ratingId: own._id,
          overallScore: own.overallScore,
          dimensionScores: own.dimensionScores,
          reviewText: own.reviewText,
        };
      }
    }

    return {
      tool: {
        _id: tool._id,
        name: tool.name,
        slug: tool.slug,
        logoAssetId: tool.logoAssetId,
        categoryIds: tool.categoryIds,
        pricing: tool.pricing,
        officialUrl: tool.officialUrl,
        status: tool.status, // archived → UI renders the CAP-119 banner
      },
      aggregate, // labeled segment 1 — community (from tools row)
      editorialVerdicts, // labeled segment 2 — curated (CAP-535 fields)
      ratingsPage,
      myRating, // contract State 6 — drives the form's edit/withdraw modes
    };
  },
});

/**
 * Ratings-page continuation (contract Action 5 / OQ#6 — cursor mechanics
 * were unspecified; this follows the platform's standard Convex cursor
 * pagination). Member-only, same display filter as getProfile's page.
 */
export const listRatings = query({
  args: { toolId: v.id("tools"), cursor: v.optional(v.string()), numItems: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { items: [], isDone: true, nextCursor: null };
    const result = await ctx.db
      .query("toolRatings")
      .withIndex("by_toolId", (q: any) => q.eq("toolId", args.toolId))
      .filter((q: any) =>
        q.and(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("moderationStatus"), "passed"),
        ),
      )
      .paginate({ cursor: (args.cursor ?? null) as any, numItems: args.numItems ?? 10 });
    return {
      items: result.page.map((r: any) => ({
        userId: r.userId,
        overallScore: r.overallScore,
        dimensionScores: r.dimensionScores,
        reviewText: r.reviewText,
      })),
      isDone: result.isDone,
      nextCursor: result.isDone ? null : result.continueCursor,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════════
// SLICE-P4-05 additions — editorial verdict (CAP-535), recompute (CAP-115),
// drift monitor (CAP-116)
// ═══════════════════════════════════════════════════════════════════════

/**
 * CAP-535 — "Staff assigns/updates curated editorial verdict for a tool."
 * Gate: "staff role check (editor+; server-enforced)". Writes the four
 * tools editorialVerdict* fields + auditLog. Display-only — NEVER feeds the
 * community aggregate (DEC-M5-AGG / schema-rating-integrity), which holds
 * by construction: this mutation touches no aggregate field.
 *
 * editor+ reading: the editorial chain (editor · publisher · administrator)
 * — moderator/store/support are not editorial writers. Flagged in the
 * session report; no formal role hierarchy exists in code to cite.
 *
 * Clearing: `score: null` clears the verdict (absent/nullable fields = no
 * curated verdict → the segment renders its empty state). Score scale is
 * validated 1–5 int to match the profile's "score / 5" display — the
 * register bounds it nowhere.
 */
export const setEditorialVerdict = mutation({
  args: {
    toolId: v.id("tools"),
    score: v.union(v.number(), v.null()),
    summary: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const roles = await assertAdminPermission(ctx);
    const isEditorial = roles.some((r) => r === "editor" || r === "publisher" || r === "administrator");
    if (!isEditorial) {
      throw new Error("tools.setEditorialVerdict: editor+ role required (CAP-535)");
    }
    const staffId = (await getAuthUserId(ctx)) as Id<"users">;
    if (!staffId) throw new Error("tools.setEditorialVerdict: authentication required");

    if (args.score !== null && (!Number.isInteger(args.score) || args.score < 1 || args.score > 5)) {
      throw new Error(`editorialVerdictScore: expected integer 1-5 or null, got ${args.score}`);
    }

    const tool = await ctx.db.get(args.toolId);
    if (!tool) throw new Error("tools.setEditorialVerdict: not found");

    return await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.toolId, {
        editorialVerdictScore: args.score ?? undefined,
        editorialVerdictSummary: args.summary ?? undefined,
        editorialVerdictAssignedByUserId: staffId,
        editorialVerdictUpdatedAt: Date.now(),
      });
      return {
        actorId: staffId,
        role: "editor",
        action: "tools.setEditorialVerdict",
        target: `tool:${args.toolId}`,
        prev: {
          score: tool.editorialVerdictScore ?? null,
          summary: tool.editorialVerdictSummary ?? null,
        },
        next: { score: args.score, summary: args.summary ?? null },
        correlationId: newCorrelationId(),
        reversible: true,
      };
    });
  },
});

/**
 * CAP-115 — tools.recomputeAggregate (internal; "Repair-only; rebuild from
 * scratch; used after drift"). Folds ONLY eligible ratings (active+passed —
 * CAP-114's exclusion rule binds recompute: "held/removed/withdrawn
 * excluded from aggregate regardless of score"). No auditLog write — the
 * register's Writes column names tools only (register-faithful, CAP-054
 * discipline).
 */
export const recomputeAggregate = internalMutation({
  args: { toolId: v.id("tools") },
  handler: async (ctx, { toolId }) => {
    const tool = await ctx.db.get(toolId);
    if (!tool) throw new Error("tools.recomputeAggregate: not found");

    const ratings = await ctx.db
      .query("toolRatings")
      .withIndex("by_toolId", (q: any) => q.eq("toolId", toolId))
      .collect();

    const rebuilt = recomputeFromRatings(ratings);
    await ctx.db.patch(toolId, {
      ratingSum: rebuilt.ratingSum,
      ratingCount: rebuilt.ratingCount,
      dimensionSums: rebuilt.dimensionSums,
      dimensionCounts: rebuilt.dimensionCounts,
    });
    return {
      toolId,
      before: { ratingSum: tool.ratingSum, ratingCount: tool.ratingCount },
      after: { ratingSum: rebuilt.ratingSum, ratingCount: rebuilt.ratingCount },
      changed:
        tool.ratingSum !== rebuilt.ratingSum ||
        tool.ratingCount !== rebuilt.ratingCount,
    };
  },
});

/**
 * CAP-116 drift-check machinery — the audit actions that can move a tool's
 * community aggregate (every aggregate-affecting write goes through
 * writeAudited, so auditLog by_action_createdAt IS the change-feed for the
 * incremental pass below).
 */
const DRIFT_SOURCE_ACTIONS = [
  "toolRatings.submit",
  "toolRatings.update",
  "toolRatings.withdraw",
  "toolRatings.moderate",
] as const;

/** Job-state watermarks — systemConfig System-writer rows (same precedent
 * as admin/homeAlertWriters' ingest.throttle). Deliberately NOT
 * config-registry keys: getConfigValue throws on unregistered keys, and
 * these are cron plumbing, not an admin config surface. */
const DRIFT_WATERMARK_KEY = "tools.ratings.driftCheck.auditSeenAt";
const DRIFT_FULL_PASS_KEY = "tools.ratings.driftCheck.lastFullPassAt";
/** Cushion against the commit-vs-createdAt race: a mutation that began
 * just before this pass and committed just after it can carry a createdAt
 * below the new watermark. Re-scanning the trailing 10 minutes of audit
 * rows closes it; re-verifying a tool twice is idempotent. */
const DRIFT_WATERMARK_OVERLAP_MS = 10 * 60_000;
/** Full-pass cadence (semantics-drift backstop, above). */
const DRIFT_FULL_PASS_INTERVAL_MS = 24 * 60 * 60_000;
/** Audit-read bound per source action. If a burst saturates it the
 * watermark does NOT advance, so the next hourly run re-scans the same
 * window — nothing is silently skipped, the work is only spread. */
const DRIFT_AUDIT_BATCH_CAP = 1000;

async function readDriftFlag(ctx: any, key: string): Promise<number | null> {
  const row = await ctx.db
    .query("systemConfig")
    .withIndex("by_key", (q: any) => q.eq("key", key))
    .first();
  return row && typeof row.value === "number" ? row.value : null;
}

async function writeDriftFlag(ctx: any, key: string, value: number): Promise<void> {
  const row = await ctx.db
    .query("systemConfig")
    .withIndex("by_key", (q: any) => q.eq("key", key))
    .first();
  if (row) {
    await ctx.db.patch(row._id, { value, updatedAt: Date.now() });
  } else {
    await ctx.db.insert("systemConfig", {
      key,
      value,
      valueType: "number",
      scope: "global",
      status: "active",
      updatedAt: Date.now(),
    });
  }
}

/**
 * CAP-116 — aggregate drift monitor (internal; cron-registered): "Periodic
 * recompute vs stored; alert on mismatch." Alert-only — this NEVER repairs
 * (repair is CAP-115, run after a human/automation reacts to the alert).
 * The alert lands in adminInterventionAlerts (bible l.263, transcribed this
 * slice); the register's "Writes: none (alert only)" reads as no DOMAIN
 * writes (tools/toolRatings untouched). Deduplicated per open alert.
 *
 * INCREMENTAL (was: hourly full-table re-verification): the hourly pass
 * re-verifies only tools with rating activity since the last watermark
 * (DRIFT_SOURCE_ACTIONS above); the comparison and the alert are
 * byte-identical to the full scan. A full pass still runs when ≥24h has
 * passed since the last one (or args.full is forced), because a deploy can
 * change the eligibility semantics inside recomputeFromRatings and re-drift
 * EVERY tool with zero new rating activity — the incremental feed cannot
 * see that.
 */
export const driftCheck = internalMutation({
  args: { full: v.optional(v.boolean()) }, // operator-forced full pass (e.g. after a repair)
  returns: v.object({ checked: v.number(), drifts: v.number(), mode: v.string() }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const lastSeen = await readDriftFlag(ctx, DRIFT_WATERMARK_KEY);
    const lastFull = await readDriftFlag(ctx, DRIFT_FULL_PASS_KEY);
    const fullPass =
      args.full === true || lastFull === null || now - lastFull >= DRIFT_FULL_PASS_INTERVAL_MS;

    let toolIds: Id<"tools">[];
    if (fullPass) {
      const tools = await ctx.db.query("tools").collect();
      toolIds = tools.map((tool: any) => tool._id as Id<"tools">);
      // Everything was verified as of now — both watermarks advance.
      await writeDriftFlag(ctx, DRIFT_FULL_PASS_KEY, now);
      await writeDriftFlag(ctx, DRIFT_WATERMARK_KEY, now);
    } else {
      // Incremental: only tools with rating activity since the watermark.
      const since = Math.max(0, (lastSeen ?? 0) - DRIFT_WATERMARK_OVERLAP_MS);
      const candidates = new Set<Id<"tools">>();
      let saturated = false;
      for (const action of DRIFT_SOURCE_ACTIONS) {
        const auditRows = await ctx.db
          .query("auditLog")
          .withIndex("by_action_createdAt", (q: any) => q.eq("action", action).gte("createdAt", since))
          .take(DRIFT_AUDIT_BATCH_CAP);
        if (auditRows.length === DRIFT_AUDIT_BATCH_CAP) saturated = true;
        for (const row of auditRows) {
          // targets: `toolRatings:<id>` (member mutations) / `toolRating:<id>` (moderate)
          const ratingId = row.target.slice(row.target.indexOf(":") + 1) as Id<"toolRatings">;
          const rating = await ctx.db.get(ratingId);
          if (rating) candidates.add(rating.toolId);
        }
      }
      toolIds = [...candidates];
      // Advance only when the whole audit window was read (see cap note).
      if (!saturated) await writeDriftFlag(ctx, DRIFT_WATERMARK_KEY, now);
    }

    const drifts: { toolId: string; slug: string; stored: number; expected: number }[] = [];

    for (const toolId of toolIds) {
      const tool = await ctx.db.get(toolId);
      if (!tool) continue;
      const ratings = await ctx.db
        .query("toolRatings")
        .withIndex("by_toolId", (q: any) => q.eq("toolId", toolId))
        .collect();
      const expected = recomputeFromRatings(ratings);
      if (
        tool.ratingSum !== expected.ratingSum ||
        tool.ratingCount !== expected.ratingCount
      ) {
        drifts.push({
          toolId: tool._id,
          slug: tool.slug,
          stored: tool.ratingCount,
          expected: expected.ratingCount,
        });
      }
    }

    for (const drift of drifts) {
      const alertKey = `tools.aggregate.drift:${drift.toolId}`;
      const openAlert = await ctx.db
        .query("adminInterventionAlerts")
        .withIndex("by_alertKey_status", (q: any) => q.eq("alertKey", alertKey).eq("status", "open"))
        .first();
      if (openAlert) continue; // dedupe: one open alert per drifted tool

      await ctx.db.insert("adminInterventionAlerts", {
        alertKey,
        severity: "medium",
        title: `Aggregate drift on tool "${drift.slug}"`,
        whatHappening: `Stored ratingCount=${drift.stored} disagrees with the eligible-ratings recompute (${drift.expected}).`,
        whatToDo: `Run tools.recomputeAggregate for tool ${drift.toolId} after investigating the cause (CAP-115).`,
        deepLinkRouteKey: "admin.tools.profile",
        status: "open",
        createdAt: Date.now(),
      });
    }

    return { checked: toolIds.length, drifts: drifts.length, mode: fullPass ? "full" : "incremental" };
  },
});
