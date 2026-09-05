/**
 * ingest extract + cluster — SLICE-P4-08 (CAP-036/037).
 *
 * CAP-036 claims.extract: "Per-source + global budget enforced (R-COST)."
 * GLM action over un-processed contentExtractions; hash dedup means no GLM
 * on unchanged content (CAP-062); claims/extraction ceiling (CAP-063);
 * writes sourceClaims + generationRuns (the GLM run record).
 *
 * CAP-037 cluster.build: "Requires ≥2 claims from ≥2 INDEPENDENT domains
 * (syndication detection); single-source only first-party + operator ack."
 * Syndication = near-identical evidence from different domains collapses
 * to ONE independent domain (shingle-jaccard reuse from qualify/similarity
 * — extend, don't fork). Eligible clusters flip pending → ready.
 */

import { internalAction, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { glmScore } from "../lib/glm";
import { jaccard, shingles } from "../qualify/similarity";

/** CAP-063 ceilings (config-pending constants; registry-tunable later). */
export const CLAIMS_PER_EXTRACTION_CAP = 12;
export const GLM_ATTEMPTS_MAX = 3;
export const SYNDICATION_JACCARD = 0.7; // ≥ this between two claims' evidence = same story (one independent domain)

export interface ExtractedClaim {
  claimText: string;
  claimType: "fact" | "stat" | "quote" | "opinion" | "prediction" | "data_point";
  evidenceText: string;
  attributionRequired: boolean;
  confidence: number;
}

/**
 * Parse the GLM claims response (strict JSON). Pure — unit-tested.
 * Unparseable/out-of-cap output throws (budget discipline, not best-effort).
 */
export function parseClaimsResponse(raw: string, cap: number = CLAIMS_PER_EXTRACTION_CAP): ExtractedClaim[] {
  const parsed = JSON.parse(raw) as { claims?: Partial<ExtractedClaim>[] };
  const claims = parsed.claims ?? [];
  if (claims.length === 0) throw new Error("claims.extract: no claims in response");
  if (claims.length > cap) throw new Error(`claims.extract: ${claims.length} claims > cap ${cap} (R-LIMIT)`);
  return claims.map((c) => {
    if (typeof c.claimText !== "string" || typeof c.evidenceText !== "string" || !c.claimType) {
      throw new Error("claims.extract: malformed claim (claimText/evidenceText/claimType required)");
    }
    return {
      claimText: c.claimText,
      claimType: c.claimType,
      evidenceText: c.evidenceText,
      attributionRequired: c.attributionRequired === true || c.claimType === "quote",
      confidence: typeof c.confidence === "number" ? c.confidence : 0.5,
    };
  });
}

/** Un-processed extractions loader (pending/feed_summary-with-text). */
export const loadExtractableExtractions = internalMutation({
  args: { limit: v.number() },
  handler: async (ctx, { limit }) => {
    const extractions = await ctx.db.query("contentExtractions").collect();
    const out = [];
    for (const ex of extractions) {
      if (!ex.extractedText) continue;
      const claims = await ctx.db
        .query("sourceClaims")
        .withIndex("by_extraction", (q: any) => q.eq("contentExtractionId", ex._id))
        .first();
      if (claims) continue; // already extracted (hash-dedup by consequence)
      const source = await ctx.db.get(ex.sourceId);
      out.push({ extraction: ex, source });
      if (out.length >= limit) break;
    }
    return out;
  },
});

/** CAP-036 — claims.extract (cron-fired internalAction). */
export const extractClaims = internalAction({
  args: {},
  handler: async (ctx): Promise<{ extracted: number; skipped: string | null }> => {
    const apiKey = process.env.GLM_API_KEY;
    if (!apiKey) {
      return { extracted: 0, skipped: "GLM_API_KEY unset — claims.extract fail-closed (dependency error)" };
    }
    const batch = (await ctx.runMutation(internal.ingest.extract.loadExtractableExtractions, { limit: 5 })) as any[];
    let extracted = 0;

    for (const { extraction, source } of batch) {
      if (source.trustLevel === "blocked") continue; // R-COST: no GLM spend on blocked sources
      let attempt = 0;
      // ≤3 GLM attempts (CAP-062: "max ~3 GLM attempts/candidate" applied per extraction)
      while (attempt < GLM_ATTEMPTS_MAX) {
        attempt++;
        try {
          const result = await glmJsonClaims(extraction.extractedText!, extraction.extractedTitle ?? source.domain);
          const claims = parseClaimsResponse(result);
          const runId = await ctx.runMutation(internal.ingest.extract.recordGenerationRun, {
            contentExtractionId: extraction._id,
            provider: "glm",
            attemptNumber: attempt,
            status: "succeeded",
          });
          await ctx.runMutation(internal.ingest.extract.insertClaims, {
            contentExtractionId: extraction._id,
            sourceId: source._id,
            claims,
            generationRunId: runId,
          });
          extracted += claims.length;
          break;
        } catch (err) {
          if (attempt >= GLM_ATTEMPTS_MAX) {
            await ctx.runMutation(internal.ingest.extract.recordGenerationRun, {
              contentExtractionId: extraction._id,
              provider: "glm",
              attemptNumber: attempt,
              status: "failed",
              failureCode: (err as Error).message.slice(0, 200),
            });
          }
        }
      }
    }
    return { extracted, skipped: null };
  },
});

/** GLM structured-claims call (strict-JSON; throws on unparseable). */
async function glmJsonClaims(text: string, title: string): Promise<string> {
  const apiKey = process.env.GLM_API_KEY!;
  const baseUrl = process.env.GLM_API_BASE ?? "https://open.bigmodel.cn/api/paas/v4";
  const model = process.env.GLM_MODEL ?? "glm-4";
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You extract verifiable factual claims from source text for a fact-checking pipeline. " +
            'Reply with STRICT JSON only: {"claims": [{"claimText": string, "claimType": "fact"|"stat"|"quote"|"opinion"|"prediction"|"data_point", ' +
            '"evidenceText": string (the exact supporting span from the source), "attributionRequired": boolean, "confidence": 0.0-1.0}]} — max 12 claims.',
        },
        { role: "user", content: `TITLE: ${title}\n\nSOURCE TEXT:\n${text.slice(0, 60_000)}` },
      ],
      temperature: 0.1,
    }),
  });
  if (!response.ok) throw new Error(`glm: ${response.status}`);
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? "";
  JSON.parse(content); // validate strict-JSON before returning
  return content;
}

/** GLM run record (CAP-036 writes generationRuns). */
export const recordGenerationRun = internalMutation({
  args: {
    contentExtractionId: v.id("contentExtractions"),
    provider: v.string(),
    attemptNumber: v.number(),
    status: v.string(),
    failureCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("generationRuns", {
      contentCandidateId: args.contentExtractionId as unknown as Id<"contentCandidates">, // extraction-scoped run (no candidate yet)
      runType: "claims.extract",
      provider: args.provider,
      model: process.env.GLM_MODEL ?? "glm-4",
      promptVersion: "claims-extract/1",
      inputRef: args.contentExtractionId,
      outputRef: undefined,
      status: args.status,
      attemptNumber: args.attemptNumber,
      tokenUsage: 0,
      estimatedCost: 0,
      failureCode: args.failureCode,
      startedAt: Date.now(),
      completedAt: Date.now(),
    });
  },
});

/** Bulk claim insert (budget-checked upstream by the cap). */
export const insertClaims = internalMutation({
  args: {
    contentExtractionId: v.id("contentExtractions"),
    sourceId: v.id("sources"),
    generationRunId: v.optional(v.id("generationRuns")),
    claims: v.array(v.object({
      claimText: v.string(),
      claimType: v.union(
        v.literal("fact"), v.literal("stat"), v.literal("quote"), v.literal("opinion"),
        v.literal("prediction"), v.literal("data_point"),
      ),
      evidenceText: v.string(),
      attributionRequired: v.boolean(),
      confidence: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    for (const claim of args.claims) {
      await ctx.db.insert("sourceClaims", {
        contentExtractionId: args.contentExtractionId,
        sourceId: args.sourceId,
        claimText: claim.claimText,
        claimType: claim.claimType,
        evidenceText: claim.evidenceText,
        attributionRequired: claim.attributionRequired,
        verificationStatus: "unverified",
        confidence: claim.confidence,
        createdAt: Date.now(),
      });
    }
  },
});

// ── cluster.build (CAP-037) ───────────────────────────────────────────────

export interface ClusterInputClaim {
  claimId: string;
  sourceDomain: string;
  categoryId?: string;
  claimText: string;
  evidenceText: string;
  firstPartyAcknowledged: boolean;
}

export interface ClusterDecision {
  eligible: boolean;
  reason: string;
  independentDomains: string[];
}

/**
 * Pure cluster-eligibility decision (CAP-037, unit-tested): ≥2 claims from
 * ≥2 INDEPENDENT domains; syndication collapses near-identical evidence;
 * single-source clusters only when first-party + operator-acked.
 */
export function decideClusterEligibility(claims: ClusterInputClaim[]): ClusterDecision {
  if (claims.length < 2) {
    return { eligible: false, reason: `${claims.length} claim(s) < 2`, independentDomains: [] };
  }
  const domains = new Set(claims.map((c) => c.sourceDomain));
  // syndication detection: collapse domains whose claims' evidence is near-identical
  const independent = new Set(domains);
  const byDomain = new Map<string, ClusterInputClaim[]>();
  for (const c of claims) {
    byDomain.set(c.sourceDomain, [...(byDomain.get(c.sourceDomain) ?? []), c]);
  }
  const domainList = [...byDomain.keys()];
  for (let i = 0; i < domainList.length; i++) {
    for (let j = i + 1; j < domainList.length; j++) {
      const a = byDomain.get(domainList[i])!;
      const b = byDomain.get(domainList[j])!;
      const syndicated = a.some((ca) =>
        b.some((cb) => jaccard(shingles(ca.evidenceText), shingles(cb.evidenceText)) >= SYNDICATION_JACCARD),
      );
      if (syndicated) {
        // same story republished — the LATER-discovered domain collapses into the first
        independent.delete(domainList[j]);
      }
    }
  }
  if (independent.size >= 2) {
    return { eligible: true, reason: `${claims.length} claims, ${independent.size} independent domains`, independentDomains: [...independent] };
  }
  const firstPartyAcked = claims.every((c) => c.firstPartyAcknowledged);
  if (domains.size === 1 && firstPartyAcked) {
    return { eligible: true, reason: "single first-party source with operator ack", independentDomains: [...domains] };
  }
  return {
    eligible: false,
    reason: `${independent.size} independent domain(s) after syndication collapse (< 2); first-party-ack=${firstPartyAcked}`,
    independentDomains: [...independent],
  };
}

/** Un-clustered claims loader. */
export const loadUnclusteredClaims = internalMutation({
  args: { limit: v.number() },
  handler: async (ctx, { limit }) => {
    const claims = await ctx.db.query("sourceClaims").collect();
    const out = [];
    for (const claim of claims) {
      if (claim.clusterId) continue;
      const source = await ctx.db.get(claim.sourceId);
      if (!source) continue;
      out.push({
        claimId: claim._id,
        sourceDomain: source.domain,
        categoryId: claim.categoryId,
        claimText: claim.claimText,
        evidenceText: claim.evidenceText,
        firstPartyAcknowledged: source.trustLevel === "approved" && source.url.includes(source.domain),
      });
      if (out.length >= limit) break;
    }
    return out;
  },
});

/**
 * CAP-037 — cluster.build (cron). Groups un-clustered claims by category +
 * topic overlap (shingle jaccard ≥ 0.3 on claimText), applies the pure
 * eligibility decision, writes ready clusters + back-refs claim.clusterId.
 */
export const buildClusters = internalAction({
  args: {},
  handler: async (ctx): Promise<{ ready: number; pending: number }> => {
    const claims = (await ctx.runMutation(internal.ingest.extract.loadUnclusteredClaims, { limit: 200 })) as ClusterInputClaim[];
    // group by categoryId (nulls share one bucket), then by topic overlap
    const groups: ClusterInputClaim[][] = [];
    const TOPIC_JACCARD = 0.3;
    for (const claim of claims) {
      let placed = false;
      for (const group of groups) {
        const sameCategory = (group[0].categoryId ?? null) === (claim.categoryId ?? null);
        const related = group.some((g) => jaccard(shingles(g.claimText), shingles(claim.claimText)) >= TOPIC_JACCARD);
        if (sameCategory && related) {
          group.push(claim);
          placed = true;
          break;
        }
      }
      if (!placed) groups.push([claim]);
    }

    let ready = 0;
    let pending = 0;
    for (const group of groups) {
      const decision = decideClusterEligibility(group);
      if (!decision.eligible) {
        pending++;
        continue;
      }
      await ctx.runMutation(internal.ingest.extract.createCluster, {
        topicLabel: group[0].claimText.slice(0, 80),
        categoryId: group[0].categoryId ?? "uncategorized",
        claimIds: group.map((c) => c.claimId) as any, // pure interface carries strings; loader supplies Ids
        sourceDomainCount: decision.independentDomains.length,
      });
      ready++;
    }
    return { ready, pending };
  },
});

/** Cluster + back-ref writer. */
export const createCluster = internalMutation({
  args: {
    topicLabel: v.string(),
    categoryId: v.string(),
    claimIds: v.array(v.id("sourceClaims")),
    sourceDomainCount: v.number(),
  },
  handler: async (ctx, args) => {
    const clusterId = await ctx.db.insert("claimClusters", {
      topicLabel: args.topicLabel,
      categoryId: args.categoryId,
      claimIds: args.claimIds,
      sourceDomainCount: args.sourceDomainCount,
      status: "ready",
      createdAt: Date.now(),
    });
    for (const claimId of args.claimIds) {
      await ctx.db.patch(claimId as Id<"sourceClaims">, { clusterId });
    }
    return clusterId;
  },
});
