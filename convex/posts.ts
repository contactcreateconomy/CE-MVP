/**
 * posts — SLICE-P4-02: posts.create / posts.update / draft save / My Drafts.
 *
 * CAP-086: "Auth required; runs R-TYP, R-URL, R-GATE, INV-2; inserts posts +
 * matching extension row transactionally (1:1)."
 * CAP-087 (R-URL): "authorType='user' AND body matches URL patterns AND
 * field ≠ postShowcases.projectUrl → reject 422 POST_URL_NOT_ALLOWED.
 * Runs before persistence + before moderation."
 * CAP-531: "one draft state with three entry triggers, not three parallel systems."
 * verdictScore W2-E4: "auto-computed same-transaction as the average of
 * per-dimension scores (excluding value_for_money when not_applicable)."
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertCustomerCapability } from "./lib/authz";
import { writeAudited, newCorrelationId } from "./lib/audit";
import { checkRateLimit } from "./lib/rateLimit";
import { checkPostEligibility } from "./eligibility";
import { classifySafety } from "./lib/classifier";
import { autoGateTx, openCaseDeduped } from "./moderation/autoGate";
import { captureEvent } from "./lib/events";
import { appendActivity } from "./activity";
import { ensurePostDistributionScoreTx, ensurePostSeoMetaTx } from "./lib/distributionScores";

// ── R-URL pattern (CAP-087): https?://, www., bare domain.tld, obfuscation ──
const URL_PATTERNS = [
  /https?:\/\//i,
  /www\./i,
  /\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b/i, // bare domain.tld — alpha TLD ≥2 chars, so decimals ("4.5", "v1.2") don't match
  /\s*\(\s*(?:dot|\.)\s*\)\s*/i,   // obfuscation: "example (dot) com"
  /\s*\[\s*(?:dot|\.)\s*\]\s*/i,
];

/** CAP-087 — R-URL check on the BODY. The postShowcases.projectUrl FIELD is
 *  the sole exempt location — the body itself is always checked (field ≠
 *  body: an exempt field never exempts the body). Exported for P4-11's
 *  CAP-046 publish-time re-run (edits can reintroduce URLs). */
export function checkNoUrls(body: string): void {
  for (const pattern of URL_PATTERNS) {
    if (pattern.test(body)) {
      throw new Error("POST_URL_NOT_ALLOWED: user posts cannot contain URLs (CAP-087)");
    }
  }
}

/** CAP-244 — the composer product-tag token (FE-owned format, see
 *  composer-product-block): [[product:<id>]], internal id only, never a
 *  raw URL. Extractors below dedupe and are shared by the density gate. */
const PRODUCT_TAG_SOURCE = "\\[\\[product:([a-z0-9]+)\\]\\]";
export function productTagIds(body: string): string[] {
  const re = new RegExp(PRODUCT_TAG_SOURCE, "g");
  return [...new Set([...body.matchAll(re)].map((m) => m[1]))];
}
export function hasProductTag(body: string): boolean {
  return new RegExp(PRODUCT_TAG_SOURCE).test(body);
}

/** Showcase projectUrl field validation — the single controlled outbound
 *  URL. P4-15's submitProjectUrl adds the allowlist + approval flow; here
 *  only transport + shape are checked. (The allowlist admission itself
 *  lives in posts/showcase.ts and is enforced on EVERY write path — see
 *  updatePost, scan 2026-09-13 finding 9.) */
function validateProjectUrlShape(url: string): void {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") throw new Error();
  } catch {
    throw new Error("POST_URL_NOT_ALLOWED: showcase projectUrl must be a valid HTTPS URL");
  }
}
const validateProjectUrl = validateProjectUrlShape;

/** W2-E4 — verdictScore auto-compute (average of dimensions, excluding not_applicable vfm). */
function computeVerdictScore(dimensionScores: Record<string, number | "not_applicable">): number {
  const valid = Object.entries(dimensionScores).filter(([, val]) => typeof val === "number") as [string, number][];
  if (valid.length === 0) throw new Error("verdictScore: at least one numeric dimension required");
  const sum = valid.reduce((acc, [, score]) => acc + score, 0);
  return Math.round((sum / valid.length) * 10) / 10;
}

// ── Extension data validators (per post type) ──
const extensionData = v.optional(v.any()); // typed per-extension in the handler

/** CAP-244 (R-COMPOSER) shared gate — runs on EVERY body write (create AND
 *  edit): updatePost re-exposes the same surface, so the register's gates
 *  (own approved products only, ≤5, active storefront CAP-233, ≤50%
 *  commercial density rolling 30d) live HERE, not inline in one caller.
 *  `publishing` scopes only the density check (drafts don't consume the
 *  rolling window; edits to already-published posts re-check it). */
async function assertProductTagGates(ctx: any, userId: any, body: string, publishing: boolean): Promise<void> {
  const taggedIds = productTagIds(body);
  if (taggedIds.length === 0) return;
  if (taggedIds.length > 5) {
    throw new Error("R-COMPOSER: at most 5 product tags per post (CAP-244)");
  }
  const store = await ctx.db
    .query("storefronts")
    .withIndex("by_owner", (q: any) => q.eq("ownerUserId", userId))
    .unique();
  if (!store || store.status !== "active") {
    throw new Error("R-COMPOSER: product tags require an active storefront (CAP-233)");
  }
  for (const pid of taggedIds) {
    const product: any = await ctx.db.get(pid as any);
    if (!product || product.storefrontId !== store._id || product.status !== "approved") {
      throw new Error(`R-COMPOSER: product ${pid} is not one of your approved products`);
    }
  }
  if (publishing) {
    // ≤50% commercial density rolling 30d — the author's PUBLISHED posts
    // in the window (drafts never pad the denominator), counting those
    // carrying product tags.
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recent = await ctx.db
      .query("posts")
      .withIndex("by_author_type_authorUserId", (q: any) =>
        q.eq("authorType", "user").eq("authorUserId", userId))
      .order("desc")
      .take(50);
    const inWindow = recent.filter((p: any) =>
      p.lifecycleStatus === "published" && (p.publishedAt ?? p.createdAt) >= since);
    const commercial = inWindow.filter((p: any) => hasProductTag(p.body)).length;
    if ((commercial + 1) / (inWindow.length + 1) > 0.5) {
      throw new Error("R-COMPOSER: ≤50% commercial density rolling 30d (CAP-244)");
    }
  }
}

export const createPost = mutation({
  args: {
    type: v.union(
      v.literal("review"), v.literal("compare"), v.literal("help"),
      v.literal("spark"), v.literal("debate"), v.literal("list"), v.literal("showcase"),
    ),
    title: v.string(),
    body: v.string(),
    categoryId: v.string(),
    toolIds: v.optional(v.array(v.string())),
    extensionData: v.optional(v.any()),
    // Review-specific: per-dimension scores for verdictScore computation
    dimensionScores: v.optional(v.any()),
    // Showcase-specific: the SINGLE controlled outbound URL
    projectUrl: v.optional(v.string()),
    // Draft or publish
    asDraft: v.optional(v.boolean()),
  },
  returns: v.object({
    postId: v.optional(v.id("posts")),
    lifecycleStatus: v.string(),
    moderationStatus: v.string(),
    preservedAsDraft: v.boolean(),
    missingBasic: v.array(v.string()),
    rejectionReasons: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    // R-GATE: assertCustomerCapability with the create_post key
    await assertCustomerCapability(ctx, "create_post");

    // R-TYP: type must be active in postTypeConfig (locked types hidden — CAP-104)
    const typeConfig = await ctx.db
      .query("postTypeConfig")
      .withIndex("by_type", (q: any) => q.eq("type", args.type))
      .unique();
    if (!typeConfig || typeConfig.state !== "active") {
      throw new Error(`R-TYP: post type "${args.type}" is not active (locked or unregistered)`);
    }

    // R-URL: CAP-087 — check body for URLs (before persistence, before
    // moderation); the showcase projectUrl FIELD is validated separately.
    checkNoUrls(args.body);
    if (args.type === "showcase" && args.projectUrl) validateProjectUrl(args.projectUrl);

    // INV-2: user posts must have authorUserId, no personaId
    const userId = await getAuthUserId(ctx) as any;
    if (!userId) throw new Error("posts.create: authentication required");

    // ── SLICE-P5-02: the composer-boundary gate chain (CAP-140/152/153/154)
    // — the gates P4-02 stubbed. Drafts bypass: one draft state, three
    // entry triggers (CAP-531/CAP-140/CAP-153 all land lifecycleStatus=draft).
    const publishing = !args.asDraft;
    let preservedAsDraft = false;
    const missingBasic: string[] = [];
    const rejectionReasons: string[] = [];

    // ── CAP-244 (R-COMPOSER) — the composer product-tag gate, wired at the
    // B2 canonical cutover (2026-09-12). The [[product:<id>]] structured
    // token is the FE-owned format (composer-product-block docblock); the
    // register's gates are enforced HERE server-side (shared with the edit
    // path via assertProductTagGates — edits re-expose the same surface):
    // own approved products only, ≤5, ≤50% commercial density rolling 30d.
    // No raw URL ever rides a tag (R-URL above already rejects body URLs).
    await assertProductTagGates(ctx, userId, args.body, publishing);

    if (publishing) {
      // CAP-152 — "N posts/hour, tier-independent. O(1) rolling counter,
      // compute-at-write" (rate-limiter fixed window; N config-documented).
      await checkRateLimit(ctx, "member.posts.hour", { kind: "user", value: userId });

      // CAP-140 — post-path eligibility; incomplete → PRESERVE the draft +
      // return the missing basic decisions (quoted outcome, not a rejection)
      const eligibility = await checkPostEligibility(ctx, userId);
      if (!eligibility.eligible) {
        preservedAsDraft = true;
        missingBasic.push(...eligibility.missing);
      }

      // CAP-153 — deterministic pre-publish checks (quoted class: "Body-
      // length, no-user-URL, dup… repeated-title, nonsense, mention limits,
      // required fields, velocity, account-state"). Implemented: length +
      // exact dup vs the member's recent posts. Near-dup/nonsense/mention
      // mechanics are register-unnamed — NOT invented (flagged).
      if (args.title.trim().length === 0) rejectionReasons.push("title_required");
      if (args.title.length > 300) rejectionReasons.push("title_too_long");
      if (args.body.length > 50_000) rejectionReasons.push("body_too_long");
      if (!preservedAsDraft && rejectionReasons.length === 0) {
        const recent = await ctx.db
          .query("posts")
          .withIndex("by_author_type_authorUserId", (q: any) =>
            q.eq("authorType", "user").eq("authorUserId", userId))
          .order("desc")
          .take(10);
        if (recent.some((p: any) => p.title === args.title && p.body === args.body)) {
          rejectionReasons.push("duplicate_post");
        }
      }
    }

    // B1 RESOLVED (founder, 2026-09-06): member posts AUTO-PUBLISH at create
    // when the safety classifier passes (lifecycleStatus=published +
    // moderationStatus=passed, same transaction). Held paths stay ready/
    // draft + a moderation case — M13 owns disposition. Founder decision
    // recorded in the wiki Founder-Review-Queue (B1 struck).
    let lifecycleStatus: "draft" | "ready" | "published" = "draft";
    let moderationStatus: "not_required" | "passed" | "pending" | "held" = "not_required";
    if (publishing && !preservedAsDraft && rejectionReasons.length === 0) {
      // CAP-154 — full safety moderation pre-publish (fail-closed): the
      // classifier seam (G4) unavailable ⇒ pending hold + a case; unsafe ⇒
      // held + a case; safe ⇒ published.
      const safety = await classifySafety(`${args.title}\n${args.body}`);
      if (!safety.available) {
        moderationStatus = "pending";
        lifecycleStatus = "ready";
      } else if (safety.unsafe) {
        moderationStatus = "held";
        lifecycleStatus = "ready";
      } else {
        moderationStatus = "passed";
        lifecycleStatus = "published";
      }
    }

    let createdPostId: Id<"posts"> | undefined;
    await writeAudited(ctx, async (actx) => {
      // 1. Insert the posts row
      const postId = await actx.db.insert("posts", {
        authorType: "user",
        authorUserId: userId,
        type: args.type,
        title: args.title,
        body: args.body,
        categoryId: args.categoryId,
        toolIds: args.toolIds ?? [],
        lifecycleStatus,
        moderationStatus,
        visibility: lifecycleStatus === "draft" ? "private" : "public",
        publishedAt: lifecycleStatus === "published" ? Date.now() : undefined,
        createdAt: Date.now(),
      });
      createdPostId = postId;

      // SLICE-P7E-11 (CAP-321/102): the NAMED auto-gate — deterministic
      // obfuscation/velocity layer AFTER the classifier seam. Not a
      // replacement for CAP-154 above (dedupe holds the line); a gate
      // hold overrides the status (fail-closed direction) same-tx.
      const gate = await autoGateTx(actx, {
        kind: "post", userId, targetId: postId, body: `${args.title}\n${args.body}`,
      });
      if (gate.decision !== "pass") {
        await actx.db.patch(postId, {
          moderationStatus: "held",
          lifecycleStatus: lifecycleStatus === "published" ? "ready" : lifecycleStatus,
          publishedAt: undefined,
        });
      }

      // CAP-154 case rows for the hold outcomes (M13 owns disposition)
      if (moderationStatus === "pending" || moderationStatus === "held") {
        await actx.db.insert("moderationCases", {
          caseType: "ugc_safety",
          targetType: "post",
          targetId: postId,
          policyFamily: "quality_guidelines",
          severity: moderationStatus === "held" ? "s2_medium" : "s3_low",
          priority: moderationStatus === "held" ? 2 : 3,
          status: "open",
          reasonCode: moderationStatus === "held" ? "classifier_unsafe" : "classifier_unavailable",
          policyVersion: "m7.v1",
          reporterCountDistinct: 0,
          reporterClusterCount: 0,
          agingLevel: 0,
          createdAt: Date.now(),
        });
      }

      // 2. Insert the matching extension row (transactional 1:1 — CAP-086)
      await insertExtensionRow(actx, postId, args);

      // 3. Create revision 1
      await actx.db.insert("postRevisions", {
        postId, revisionNumber: 1, title: args.title, body: args.body,
        changeType: "create", changedByUserId: userId, createdAt: Date.now(),
      });

      // 4. CAP-570 + feed ranking + slug: only when the row is still
      //    published after autoGateTx (a hold patches lifecycle to ready).
      const live = await actx.db.get(postId);
      if (live?.lifecycleStatus === "published") {
        const publishedAt = live.publishedAt ?? Date.now();
        await ensurePostDistributionScoreTx(actx, postId, publishedAt);
        await ensurePostSeoMetaTx(actx, {
          postId,
          title: args.title,
          body: args.body,
          type: args.type,
          now: publishedAt,
        });
        await appendActivity(actx, {
          userId,
          eventType: "post_published",
          targetType: "post",
          targetId: postId,
          summary: `Published a ${args.type} post`,
          meta: {
            postType: { value: args.type, privacy: "safe_for_public" },
            moderationStatus: { value: live.moderationStatus, privacy: "safe_for_public" },
          },
        });
      }

      return {
        actorId: userId,
        action: "posts.create",
        target: `post:${postId}`,
        prev: null,
        next: { type: args.type, lifecycleStatus, moderationStatus },
        correlationId: newCorrelationId(),
        reversible: true,
      };
    });

    // Domain result (CAP-140: "return missing basic decisions"; CAP-153:
    // "UI: inline rejection reason" — the preserved-draft outcomes ride the
    // same response, never a throw)
    return {
      postId: createdPostId,
      lifecycleStatus,
      moderationStatus,
      preservedAsDraft,
      missingBasic,
      rejectionReasons,
    };
  },
});

/** Insert the type-specific extension row (1:1 with posts). */
async function insertExtensionRow(actx: any, postId: string, args: any): Promise<void> {
  const data = args.extensionData ?? {};
  switch (args.type) {
    case "review": {
      const verdictScore = args.dimensionScores ? computeVerdictScore(args.dimensionScores) : undefined;
      await actx.db.insert("postReviews", {
        postId,
        toolId: data.toolId ?? "",
        verdictScore,
        // bible l.88 verdict-block passthrough — written only when the
        // composer supplies them (form spec flagged, not invented)
        ...(data.verdictSummary !== undefined ? { verdictSummary: data.verdictSummary } : {}),
        ...(Array.isArray(data.pros) ? { pros: data.pros } : {}),
        ...(Array.isArray(data.cons) ? { cons: data.cons } : {}),
      });
      break;
    }
    case "compare":
      await actx.db.insert("postCompares", { postId, toolIds: args.toolIds ?? [], qualitativeGrid: data.qualitativeGrid });
      break;
    case "spark":
      await actx.db.insert("postSparks", { postId, statement: data.statement ?? args.title });
      break;
    case "debate":
      await actx.db.insert("postDebates", { postId, proposition: data.proposition ?? args.title, agreeCount: 0, disagreeCount: 0, abstainCount: 0 });
      break;
    case "list":
      await actx.db.insert("postLists", { postId, mode: data.mode ?? "community_ranked", intro: data.intro ?? "" });
      break;
    case "showcase":
      await actx.db.insert("postShowcases", { postId, theThing: data.theThing ?? args.body, projectUrl: args.projectUrl });
      break;
    case "help":
      await actx.db.insert("postHelps", { postId, problemStatement: data.problemStatement ?? args.title, resolvedStatus: "open" });
      break;
  }
}

export const updatePost = mutation({
  args: {
    postId: v.id("posts"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    toolIds: v.optional(v.array(v.string())),
    extensionData: v.optional(v.any()),
    dimensionScores: v.optional(v.any()),
    projectUrl: v.optional(v.string()),
    asDraft: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await assertCustomerCapability(ctx, "create_post");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("posts.update: not found");
    const actorId = (await getAuthUserId(ctx)) as any;
    if (post.authorUserId !== actorId) {
      throw new Error("posts.update: not the author");
    }

    const body = args.body ?? post.body;
    // CAP-087 on the update path too — the body is always checked; the
    // showcase projectUrl FIELD (on postShowcases, not posts) is validated
    // separately below.
    checkNoUrls(body);
    if (post.type === "showcase" && args.projectUrl !== undefined) {
      // SECURITY (scan 2026-09-13, finding 9): the edit path validated only
      // transport+shape — an APPROVED showcase URL could be swapped for any
      // HTTPS host while approvalStatus stayed "approved" (approved-looking
      // CTA to an arbitrary destination). The edit path now runs the SAME
      // CAP-100 allowlist admission as posts/showcase.submitProjectUrl and
      // resets approval to pending whenever the URL changes.
      const showcaseRow = await ctx.db
        .query("postShowcases")
        .withIndex("by_postId", (q: any) => q.eq("postId", args.postId))
        .unique() as any;
      if (showcaseRow && showcaseRow.projectUrl !== args.projectUrl) {
        const { validateProjectUrl: validateAgainstAllowlist } = await import("./posts/showcase");
        const config = await ctx.db
          .query("systemConfig")
          .withIndex("by_key", (q: any) => q.eq("key", "showcase.allowedDomains"))
          .first();
        if (!config) {
          throw new Error("updatePost: showcase.allowedDomains is not configured — fail-closed (CAP-100)");
        }
        const allowlist = Array.isArray(config.value) ? (config.value as string[]) : [];
        const check = validateAgainstAllowlist(args.projectUrl, allowlist);
        if (!check.ok) throw new Error(`updatePost: ${check.reason}`);
      }
      validateProjectUrlShape(args.projectUrl);
    }

    // CAP-244 on the update path — edits re-expose the composer surface:
    // the same product-tag gates as createPost (tag ownership, ≤5, active
    // storefront; density re-checked when the post is already published —
    // pre-B2 edits could inject arbitrary [[product:<id>]] tokens).
    const republishing = args.asDraft ? false : post.lifecycleStatus === "draft" || post.lifecycleStatus === "ready";
    await assertProductTagGates(ctx, actorId, body, republishing || post.lifecycleStatus === "published");
    if (republishing) {
      // SECURITY (scan 2026-09-13, finding 19): a draft edit that lands on
      // publish previously skipped the rate limit, eligibility, and body
      // cap that createPost enforces — a suspended-tier member could park
      // a draft then publish past every gate.
      await checkRateLimit(ctx, "member.posts.hour", { kind: "user", value: actorId });
      const eligibility = await checkPostEligibility(ctx, actorId);
      if (!eligibility.eligible) {
        throw new Error(`updatePost: publishing requires eligibility (missing: ${eligibility.missing.join(", ")})`);
      }
      if (body.length > 50_000) throw new Error("updatePost: body exceeds 50,000 chars (CAP-153)");
    }

    // SECURITY (scan 2026-09-13, finding 4): an edit previously wrote new
    // title/body with NO moderation — a published post kept moderationStatus
    // "passed" over unmoderated content. Every content-bearing edit now
    // replays the create-path sequence: classifier (CAP-154) → autoGateTx
    // (CAP-321/102) → status flip + case. Editing to a DRAFT also
    // re-moderates: the next publish (create or edit) can never inherit a
    // stale "passed".
    const contentChanged =
      (args.title !== undefined && args.title !== post.title) || (args.body !== undefined && args.body !== post.body);
    let moderationStatus: "not_required" | "passed" | "pending" | "held" = "not_required";
    let gateDecision: { decision: "pass" | "hold" | "hard_reject"; reasonCode?: string } | null = null;
    if (contentChanged) {
      const safety = await classifySafety(`${args.title ?? post.title}\n${body}`);
      moderationStatus = !safety.available ? "pending" : safety.unsafe ? "held" : "passed";
      if (moderationStatus === "pending" || moderationStatus === "held") {
        // Pre-compute the hold so the status flip + case land in the SAME
        // transaction as the content write (mirrors createPost).
        gateDecision = { decision: "hold", reasonCode: safety.unsafe ? "classifier_unsafe" : "classifier_unavailable" };
      }
    }

    return await writeAudited(ctx, async (actx) => {
      const latestRev = await actx.db
        .query("postRevisions")
        .withIndex("by_postId_revisionNumber", (q: any) => q.eq("postId", args.postId))
        .order("desc")
        .first();
      const nextRev = (latestRev?.revisionNumber ?? 0) + 1;

      const nextStatus = contentChanged
        ? moderationStatus
        : ((post.moderationStatus ?? "not_required") as typeof moderationStatus);
      // A held/pending edit pulls the post OUT of published (CAP-154's
      // fail-closed direction — same as create: held ⇒ ready, never live).
      const nextLifecycle =
        args.asDraft ? "draft"
        : gateDecision ? (post.lifecycleStatus === "published" ? "ready" : post.lifecycleStatus)
        : post.lifecycleStatus;

      await actx.db.patch(args.postId, {
        title: args.title ?? post.title,
        body,
        lifecycleStatus: nextLifecycle,
        moderationStatus: nextStatus,
        toolIds: args.toolIds !== undefined ? args.toolIds : post.toolIds,
        ...(gateDecision && post.lifecycleStatus === "published" ? { publishedAt: undefined } : {}),
      });

      await actx.db.insert("postRevisions", {
        postId: args.postId, revisionNumber: nextRev,
        title: args.title ?? post.title, body,
        changeType: "update",
        changedByUserId: actorId,
        createdAt: Date.now(),
      });

      // SECURITY (finding 4): the named auto-gate + case rows on the edit
      // path — the same CAP-321/102 layer + CAP-154 case semantics as
      // createPost. REVIEW-FIX: the case goes through openCaseDeduped (the
      // bible l.239 "one open case per target+policyFamily+window" rule) —
      // a raw insert would stack duplicate open cases on repeat edits.
      if (contentChanged) {
        const gate = await autoGateTx(actx, {
          kind: "post", userId: actorId, targetId: args.postId, body: `${args.title ?? post.title}\n${body}`,
        });
        if (gate.decision !== "pass" && !gateDecision) {
          gateDecision = { decision: gate.decision, reasonCode: gate.reasonCode };
          await actx.db.patch(args.postId, {
            moderationStatus: "held",
            ...(post.lifecycleStatus === "published" ? { lifecycleStatus: "ready", publishedAt: undefined } : {}),
          });
        }
        if (moderationStatus === "pending" || moderationStatus === "held") {
          await openCaseDeduped(actx, {
            targetType: "post",
            targetId: args.postId,
            policyFamily: "quality_guidelines",
            caseType: "ugc_safety",
            severity: moderationStatus === "held" ? "s2_medium" : "s3_low",
            reasonCode: moderationStatus === "held" ? "classifier_unsafe" : "classifier_unavailable",
          });
        }
      }

      // W2-E4 — extension updates ride the SAME transaction as the post
      // update (verdictScore recomputed on edit, extension fields applied).
      await patchExtensionRow(actx, args.postId, post.type, args);

      return {
        actorId,
        action: "posts.update",
        target: `post:${args.postId}`,
        prev: { title: post.title, body: post.body },
        next: { title: args.title ?? post.title, body },
        correlationId: newCorrelationId(),
        reversible: true,
      };
    });
  },
});

/** Patch the type-specific extension row in the same transaction (W2-E4).
 *  Only provided fields are applied — undefined args leave the stored value. */
async function patchExtensionRow(actx: any, postId: string, type: string, args: any): Promise<void> {
  const data = args.extensionData ?? {};
  switch (type) {
    case "review": {
      const row = (await actx.db.query("postReviews").withIndex("by_postId", (q: any) => q.eq("postId", postId)).unique()) as any;
      if (!row) break;
      const patch: Record<string, unknown> = {};
      if (data.toolId !== undefined) patch.toolId = data.toolId;
      if (data.verdictSummary !== undefined) patch.verdictSummary = data.verdictSummary;
      if (data.pros !== undefined) patch.pros = data.pros;
      if (data.cons !== undefined) patch.cons = data.cons;
      if (args.dimensionScores) patch.verdictScore = computeVerdictScore(args.dimensionScores);
      if (Object.keys(patch).length) await actx.db.patch(row._id, patch);
      break;
    }
    case "compare": {
      const row = (await actx.db.query("postCompares").withIndex("by_postId", (q: any) => q.eq("postId", postId)).unique()) as any;
      if (!row) break;
      const patch: Record<string, unknown> = {};
      if (args.toolIds !== undefined) patch.toolIds = args.toolIds;
      if (data.qualitativeGrid !== undefined) patch.qualitativeGrid = data.qualitativeGrid;
      if (Object.keys(patch).length) await actx.db.patch(row._id, patch);
      break;
    }
    case "spark": {
      const row = (await actx.db.query("postSparks").withIndex("by_postId", (q: any) => q.eq("postId", postId)).unique()) as any;
      if (!row) break;
      if (data.statement !== undefined) await actx.db.patch(row._id, { statement: data.statement });
      break;
    }
    case "debate": {
      const row = (await actx.db.query("postDebates").withIndex("by_postId", (q: any) => q.eq("postId", postId)).unique()) as any;
      if (!row) break;
      if (data.proposition !== undefined) await actx.db.patch(row._id, { proposition: data.proposition });
      break;
    }
    case "list": {
      const row = (await actx.db.query("postLists").withIndex("by_postId", (q: any) => q.eq("postId", postId)).unique()) as any;
      if (!row) break;
      const patch: Record<string, unknown> = {};
      if (data.mode !== undefined) patch.mode = data.mode;
      if (data.intro !== undefined) patch.intro = data.intro;
      if (Object.keys(patch).length) await actx.db.patch(row._id, patch);
      break;
    }
    case "showcase": {
      const row = (await actx.db.query("postShowcases").withIndex("by_postId", (q: any) => q.eq("postId", postId)).unique()) as any;
      if (!row) break;
      const patch: Record<string, unknown> = {};
      if (data.theThing !== undefined) patch.theThing = data.theThing;
      if (args.projectUrl !== undefined) {
        patch.projectUrl = args.projectUrl;
        // SECURITY (scan 2026-09-13, finding 9): any URL change on an
        // approved showcase resets approval to pending — the CTA keeps
        // rendering but never as "approved" for a swapped destination
        // (approve/reject itself is P7E-13 CAP-101's, never invented here).
        if (row.projectUrl !== args.projectUrl) patch.approvalStatus = "pending";
      }
      if (Object.keys(patch).length) await actx.db.patch(row._id, patch);
      break;
    }
    case "help": {
      const row = (await actx.db.query("postHelps").withIndex("by_postId", (q: any) => q.eq("postId", postId)).unique()) as any;
      if (!row) break;
      if (data.problemStatement !== undefined) await actx.db.patch(row._id, { problemStatement: data.problemStatement });
      break;
    }
  }
}

/** CAP-532 — My Drafts: lifecycleStatus=draft AND authorUserId=self. */
export const myDrafts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx) as any;
    if (!userId) return [];
    return await ctx.db
      .query("posts")
      .withIndex("by_author_type_authorUserId", (q: any) =>
        q.eq("authorType", "user").eq("authorUserId", userId),
      )
      .filter((q: any) => q.eq(q.field("lifecycleStatus"), "draft"))
      .collect();
  },
});

/** CAP-105 — postTypeConfig.list for the composer (active types only). */
export const listActiveTypes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("postTypeConfig")
      .filter((q: any) => q.eq(q.field("state"), "active"))
      .take(12); // bounded: 10 registry rows max (bible l.86)
  },
});
