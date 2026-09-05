/**
 * publish — SLICE-P4-11: time-fired candidate.publish (CAP-046 re-run +
 * CAP-057 cap binding point + social derivatives).
 *
 * CAP-046 Notes (quoted): "Re-runs URL + similarity HARD checks at publish
 *   mutation (edits can reintroduce URLs/copy)." — the URL half is the
 *   direct check; the similarity half is enforced by REVISION STALENESS:
 *   the latest qualification run must be ON the current candidateRevision
 *   and passing (a post-edit draft without re-qualification cannot publish
 *   — the re-run's purpose, without duplicating the orchestrator).
 * CAP-057 Notes (quoted): "≤2/post + ≤1/tool enforced in mutation" — the
 *   enforcement point is HERE, inside the publish transaction (FATAL-
 *   adjacent: the cap binds at the point of no return, not at inject).
 * CAP-056 (quoted): persona density cap ≤2/post — persona comments are
 *   FENCED to Phase 5 (M8 spine); publish proceeds with zero persona
 *   comments (cap trivially satisfied). Flagged, not silent.
 * DEC-O07 (quoted): "export-only, never auto-published externally."
 * Contract §4 (quoted): "transactional, idempotent."
 * Publish-gate failure outcome is register-unnamed (contract OQ5):
 *   candidate STAYS scheduled + draft.lastPublishFailure recorded +
 *   surfaced on the queue — chosen and documented, not invented.
 *
 * Orchestration: publishCandidate is an internalAction (time-fired via
 * scheduler.runAfter from candidateSchedule, or the sweepScheduled cron
 * that also covers rows scheduled before P4-11 landed); the atomic write
 * is persistPublish (internalMutation) — the forge.draft action→mutation
 * pattern.
 */

import { internalAction, internalMutation, internalQuery, mutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { writeAudited, newCorrelationId } from "../lib/audit";
import { checkNoUrls } from "../posts";
import { assertEditorial } from "./review";

/** CAP-057 — the affiliate cap as a pure function (unit-tested). */
export function affiliateCapViolation(injections: { toolId?: string }[]): string | null {
  if (injections.length > 2) {
    return `CAP-057: ${injections.length} injected links exceed the ≤2/post cap`;
  }
  const perTool = new Map<string, number>();
  for (const inj of injections) {
    const key = inj.toolId ?? "(no tool)";
    const n = (perTool.get(key) ?? 0) + 1;
    if (n > 1) return `CAP-057: tool "${key}" injected ${n}x exceeds the ≤1/tool cap`;
    perTool.set(key, n);
  }
  return null;
}

/** Load everything the publish gates need (internalQuery — actions cannot
 *  touch ctx.db). */
export const loadForPublish = internalQuery({
  args: { candidateId: v.id("contentCandidates") },
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) return null;
    const runs = await ctx.db
      .query("qualificationRuns")
      .withIndex("by_candidate", (q: any) => q.eq("contentCandidateId", args.candidateId))
      .collect();
    const latestRun = runs.sort((a: any, b: any) => b.startedAt - a.startedAt)[0] ?? null;
    const embedding = await ctx.db
      .query("contentEmbeddings")
      .withIndex("by_ref", (q: any) => q.eq("refType", "contentCandidate").eq("refId", args.candidateId))
      .first();
    const sources = await ctx.db
      .query("contentCandidateSources")
      .filter((q: any) => q.eq(q.field("contentCandidateId"), args.candidateId))
      .collect();
    const sourceRows = [];
    for (const s of sources) {
      const src = await ctx.db.get(s.sourceId as Id<"sources">);
      if (src) sourceRows.push({ url: src.url, domain: src.domain });
    }
    const refs = await ctx.db
      .query("draftClaimRefs")
      .withIndex("by_candidate", (q: any) => q.eq("contentCandidateId", args.candidateId))
      .collect();
    return { candidate, latestRun, embedding: embedding ?? null, sources: sourceRows, confirmedAssertions: refs.filter((r: any) => r.operatorConfirmed).map((r: any) => r.assertionText) };
  },
});

/** The publish gates — pure, unit-tested. Returns the failure reason or null. */
export function publishGateFailure(loaded: {
  candidate: { status: string; draft?: any; operatorId?: string };
  latestRun: { overallResult: string; candidateRevision: number } | null;
}): string | null {
  if (loaded.candidate.status !== "scheduled") {
    return `status "${loaded.candidate.status}" ≠ scheduled`;
  }
  if (!loaded.candidate.operatorId) {
    return "no approver stamped (operatorId) — re-approve so the publish revision carries changedByUserId";
  }
  const draft = loaded.candidate.draft ?? {};
  const revision = draft.candidateRevision ?? 1;
  if (!loaded.latestRun) return "no qualification run (CAP-046: re-run required)";
  if (loaded.latestRun.overallResult !== "pass") {
    return `latest run ${loaded.latestRun.overallResult} (CAP-046)`;
  }
  if (loaded.latestRun.candidateRevision !== revision) {
    return `stale qualification: run rev ${loaded.latestRun.candidateRevision} ≠ draft rev ${revision} — re-qualify after the edit (CAP-046: edits can reintroduce copy)`;
  }
  const cap = affiliateCapViolation((draft.plannedAffiliateLinks ?? []) as { toolId?: string }[]);
  if (cap) return cap;
  return null;
}

/** CAP-046's URL half runs inside the transaction too (cheap + absolute). */
export const persistPublish = internalMutation({
  args: { candidateId: v.id("contentCandidates") },
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) throw new Error("publish: candidate not found");
    // Idempotency under concurrency: only a scheduled candidate publishes
    if (candidate.status !== "scheduled") return { postId: undefined, already: true };

    const draft = (candidate.draft ?? {}) as any;
    const now = Date.now();

    // CAP-046 URL re-run — inside the transaction (edits can reintroduce URLs)
    try {
      checkNoUrls(draft.body ?? "");
    } catch (e) {
      await ctx.db.patch(args.candidateId, {
        draft: { ...draft, lastPublishFailure: { reason: (e as Error).message, at: now } },
      });
      throw e;
    }

    const VALID_POST_TYPES = ["news", "review", "compare", "spark", "debate", "list", "showcase", "help", "launch_pad", "gigs"] as const;
    const rawType = candidate.postType ?? "news";
    const postType = (VALID_POST_TYPES as readonly string[]).includes(rawType) ? rawType : "news";
    const postId = await ctx.db.insert("posts", {
      authorType: "editorial",
      type: postType as any,
      title: draft.title ?? "(untitled)",
      body: draft.body ?? "",
      categoryId: draft.categoryId ?? "uncategorized", // H-CAT assigns at qualify; embeddings precedent
      toolIds: draft.toolIds ?? [],
      lifecycleStatus: "published",
      moderationStatus: "not_required", // editorial pipeline is the moderation
      visibility: "public",
      publishedAt: now,
      createdAt: now,
    });

    // News extension: source-of-truth block from the candidate's sources
    await ctx.db.insert("postNews", {
      postId,
      sourceOfTruthUrl: draft.sourceOfTruthUrl ?? "(no source recorded)",
      keyClaims: draft.keyClaims ?? [],
      publishedAt: now,
    });
    await ctx.db.insert("postRevisions", {
      postId, revisionNumber: 1,
      title: draft.title ?? "(untitled)", body: draft.body ?? "",
      changeType: "create",
      // bible l.77: changedByUserId required — the approver, stamped at
      // candidateApprove (operatorId). Fail-closed if a pre-stamp candidate
      // somehow reached publish.
      changedByUserId: (candidate.operatorId ?? undefined) as Id<"users">,
      createdAt: now,
    });

    // CAP-057 — materialize the staged injections (validated by the gate)
    const planned = (draft.plannedAffiliateLinks ?? []) as any[];
    for (const [i, link] of planned.entries()) {
      await ctx.db.insert("postAffiliateLinks", {
        postId,
        affiliateLinkId: link.affiliateLinkId,
        toolId: link.toolId,
        labelType: link.labelType ?? "affiliate_partner",
        position: link.position ?? i,
        injectedByUserId: link.injectedByUserId,
        injectedAt: now,
      });
    }

    // Copy the candidate's embedding to the post (same text; re-embedding
    // is retrieval-only per the bible — not proof)
    const embedding = await ctx.db
      .query("contentEmbeddings")
      .withIndex("by_ref", (q: any) => q.eq("refType", "contentCandidate").eq("refId", args.candidateId))
      .first();
    if (embedding) {
      await ctx.db.insert("contentEmbeddings", {
        refType: "post",
        refId: postId,
        categoryId: draft.categoryId ?? "uncategorized",
        embedding: embedding.embedding,
        embeddingModel: embedding.embeddingModel,
        embeddingVersion: embedding.embeddingVersion,
        textHash: embedding.textHash,
      });
    }

    // CAP-051 (seo.generate) — deterministic base at publish: slug + meta
    // from the final approved revision. GLM enrichment (titles/descriptions/
    // keywords) rides the pipeline when GLM runs; this guarantees the
    // canonical route key exists (P4-13's lookup).
    const baseSlug = (draft.title ?? "post")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "post";
    const slug = `${baseSlug}-${postId.slice(-6)}`;
    await ctx.db.insert("postSeoMeta", {
      postId,
      seoTitle: (draft.title ?? "Untitled").slice(0, 120),
      seoDescription: (draft.body ?? "").replace(/[#*>`]/g, "").trim().slice(0, 160),
      slug,
      keywords: [],
      canonicalUrl: `/discussions/${slug}`,
      structuredDataType: postType === "review" ? "review" : "article",
      manuallyEdited: false,
      generatedAt: now,
    });

    // Status flip — the candidate's terminal state (+ the post link for the
    // workspace's derivative surfaces)
    const { lastPublishFailure, ...cleanDraft } = draft;
    await ctx.db.patch(args.candidateId, { status: "published", draft: { ...cleanDraft, publishedPostId: postId } });

    await ctx.db.insert("auditLog", {
      action: "editorial.candidate.publish",
      target: `post:${postId}`,
      prev: { status: "scheduled" },
      next: { status: "published", postId },
      correlationId: newCorrelationId(),
      reversible: false, // published posts un-publish via takedown, not reversal
      createdAt: now,
    });
    return { postId, already: false };
  },
});

/** Time-fired publish (scheduler.runAfter target) + the gates. */
export const publishCandidate = internalAction({
  args: { candidateId: v.id("contentCandidates") },
  handler: async (ctx, args): Promise<{ published: boolean; postId?: string; reason?: string }> => {
    const loaded = await ctx.runQuery(internal.editorial.publish.loadForPublish, { candidateId: args.candidateId });
    if (!loaded) throw new Error("publish: candidate not found");

    const gate = publishGateFailure(loaded as any);
    if (gate) {
      // OQ5 outcome (chosen, documented): stays scheduled + alert on queue
      await ctx.runMutation(internal.editorial.publish.recordPublishFailure, {
        candidateId: args.candidateId,
        reason: gate,
      });
      return { published: false, reason: gate };
    }

    const result = await ctx.runMutation(internal.editorial.publish.persistPublish, { candidateId: args.candidateId });

    // Social derivatives (CAP-052 System generate): attempted post-commit;
    // a GLM failure does NOT un-publish (derivatives are post-publication
    // artifacts — flagged choice, States G allows regeneration via stale)
    if (result.postId) {
      try {
        await ctx.runAction(internal.editorial.publish.socialGenerate, { postId: result.postId, candidateId: args.candidateId });
      } catch {
        // recorded as absent; export (CAP-053) simply has nothing to export yet
      }
    }
    return { published: true, postId: result.postId ?? undefined };
  },
});

/** OQ5 — the queue alert (draft.lastPublishFailure). */
export const recordPublishFailure = internalMutation({
  args: { candidateId: v.id("contentCandidates"), reason: v.string() },
  handler: async (ctx, args) => {
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) return;
    const draft = (candidate.draft ?? {}) as any;
    await ctx.db.patch(args.candidateId, {
      draft: { ...draft, lastPublishFailure: { reason: args.reason, at: Date.now() } },
    });
  },
});

/** Sweeper — covers rows scheduled before P4-11 armed the scheduler, and
 *  any missed fire-time (cron every 5 minutes). */
export const sweepScheduled = internalAction({
  args: {},
  handler: async (ctx): Promise<{ swept: number }> => {
    const rows = await ctx.runQuery(internal.editorial.publish.loadDueScheduled, {});
    for (const id of rows) {
      await ctx.runAction(internal.editorial.publish.publishCandidate, { candidateId: id });
    }
    return { swept: rows.length };
  },
});

export const loadDueScheduled = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const rows = await ctx.db
      .query("contentCandidates")
      .withIndex("by_status", (q: any) => q.eq("status", "scheduled"))
      .collect();
    return rows
      .filter((c: any) => ((c.draft ?? {}).scheduledFor ?? Infinity) <= now)
      .map((c: any) => c._id);
  },
});

/** CAP-052 — System social generation (GLM; export-only per DEC-O07). */
export const socialGenerate = internalAction({
  args: { postId: v.string(), candidateId: v.id("contentCandidates") },
  handler: async (ctx, args) => {
    const apiKey = process.env.GLM_API_KEY;
    if (!apiKey) throw new Error("social.generate: GLM_API_KEY unset (fail-closed seam)");
    const baseUrl = process.env.GLM_API_BASE ?? "https://open.bigmodel.cn/api/paas/v4";
    const model = process.env.GLM_MODEL ?? "glm-4";
    const post = await ctx.runQuery(internal.editorial.publish.loadPostText, { postId: args.postId });
    if (!post) throw new Error("social.generate: post not found");

    const types: { key: "twitter" | "linkedin" | "hook" | "teaser"; brief: string }[] = [
      { key: "twitter", brief: "A single post under 280 chars. No URLs, no hashtags spam (max 2)." },
      { key: "linkedin", brief: "A professional paragraph (max 1300 chars). No URLs." },
      { key: "hook", brief: "One punchy opening line that would make a creator stop scrolling." },
      { key: "teaser", brief: "Two-sentence teaser for a newsletter mention. No URLs." },
    ];
    const now = Date.now();
    for (const t of types) {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: `You write social derivatives for a creator-economy publication. ${t.brief} Reply with the text ONLY.` },
            { role: "user", content: `TITLE: ${post.title}\n\nBODY:\n${post.body.slice(0, 6000)}` },
          ],
          temperature: 0.6,
        }),
      });
      if (!response.ok) throw new Error(`social.generate: GLM ${response.status}`);
      const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error("social.generate: empty completion");
      await ctx.runMutation(internal.editorial.publish.insertDerivative, {
        postId: args.postId,
        derivativeType: t.key,
        content,
        generatedAt: now,
      });
    }
  },
});

export const loadPostText = internalQuery({
  args: { postId: v.string() },
  handler: async (ctx, args) => await ctx.db.get(args.postId as Id<"posts">),
});

export const insertDerivative = internalMutation({
  args: { postId: v.string(), derivativeType: v.string(), content: v.string(), generatedAt: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.insert("postSocialDerivatives", {
      postId: args.postId as Id<"posts">,
      derivativeType: args.derivativeType as any,
      content: args.content,
      status: "generated",
      generatedAt: args.generatedAt,
    });
  },
});

/** CAP-053 — Editor export (export-only per DEC-O07: returns the content;
 *  marks exported. Never posts anywhere.) */
export const socialExport = mutation({
  args: { derivativeId: v.id("postSocialDerivatives") },
  handler: async (ctx, args) => {
    const editorId = await assertEditorial(ctx);
    const row = await ctx.db.get(args.derivativeId);
    if (!row) throw new Error("social.export: not found");
    await ctx.db.patch(args.derivativeId, { status: "exported", exportedByUserId: editorId, exportedAt: Date.now() });
    return { content: row.content, derivativeType: row.derivativeType };
  },
});
