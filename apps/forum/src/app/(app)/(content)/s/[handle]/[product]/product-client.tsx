/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results untyped at the client edge */
"use client";

/**
 * ProductDetailClient — SLICE-P6-18: the live product reference (CAP-245),
 * BUY → /go ONLY when approved_locked, Amazon interim-tier copy slot
 * (CAP-524 — standard /go, never a click-row divergence), the CAP-255
 * conflicted-review label, and the Product Discussion on the CAP-560
 * shadow post with the CAP-561 owner hide-for-review (never delete).
 */

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import { useAuth } from "@cemvp/auth-ui";
import { cn } from "@/lib/utils";

interface ThreadComment {
  id: string;
  body: string | null;
  depth: number;
  tombstone?: boolean;
  authorName?: string | null;
}

export function ProductDetailClient({ handle, product }: { handle: string; product: string }) {
  const configured = isConvexConfigured();
  const { authStatus } = useAuth();
  const detail = useQuery(
    api.store.public.getProductDetail,
    configured ? ({ handle, product } as any) : "skip",
  );
  const shadowPostId = detail?.shadowPostId ?? null;
  const thread = useQuery(
    api.comments.reads.list,
    configured && shadowPostId
      ? ({ postId: shadowPostId, sortMode: "best" } as any)
      : "skip",
  );
  const createComment = useMutation(api.comments.create);
  const hideForReview = useMutation(api.store.public.hideForReview);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState<string | null>(null);

  if (!configured || detail === undefined) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--border-default) border-t-(--brand-primary)" />
      </div>
    );
  }

  // The parent store's Group B states pass through (same family as the
  // storefront page — commerce surface of the store, not independent)
  if (detail.state === "not_found" || detail.state === "product_not_found") {
    return (
      <Card><CardContent className="space-y-2 py-10 text-center">
        <h1 className="text-lg font-semibold text-(--text-primary)">Product not found</h1>
        <p className="text-sm text-(--text-muted)">
          This product doesn&apos;t exist or isn&apos;t available.{" "}
          <Link href={`/s/${handle}`} className="underline">Back to the store</Link>
        </p>
      </CardContent></Card>
    );
  }
  if (detail.state === "paused" || detail.state === "no_longer_available") {
    return (
      <Card><CardContent className="space-y-2 py-10 text-center">
        <h1 className="text-lg font-semibold text-(--text-primary)">
          {detail.state === "paused" ? "Temporarily unavailable" : "This store is no longer available"}
        </h1>
        <p className="text-sm text-(--text-muted)">{detail.notice}</p>
      </CardContent></Card>
    );
  }

  const comments: ThreadComment[] = (thread?.page ?? []) as ThreadComment[];

  return (
    <div className="space-y-8">
      <nav className="text-sm text-(--text-muted)">
        <Link href={`/s/${handle}`} className="hover:underline">
          ← {detail.ownerName}&apos;s store
        </Link>
      </nav>

      {/* The live reference (CAP-245) */}
      <Card>
        <CardContent className="space-y-4 py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-(--text-muted)">
                {detail.category ?? "Product"}
              </p>
              <h1 className="text-2xl font-semibold text-(--text-primary)">{detail.name}</h1>
              {detail.merchant ? (
                <p className="text-sm text-(--text-secondary)">Sold by {detail.merchant}</p>
              ) : null}
            </div>
            {detail.platformCurated ? <Badge tone="info">Platform-curated store</Badge> : null}
          </div>

          <p className="text-sm text-(--text-secondary)">{detail.description}</p>
          {detail.claims ? (
            <p className="text-sm text-(--text-muted)">Claims: {detail.claims}</p>
          ) : null}

          {/* Disclosure + regions from the locked version */}
          <div className="flex flex-wrap items-center gap-2">
            {detail.disclosureClass ? (
              <Badge tone="warning">Affiliate — {detail.disclosureClass}</Badge>
            ) : (
              <Badge tone="warning">Affiliate disclosure applies</Badge>
            )}
            {/* CAP-255 — conflicted review: readable + labeled, not hidden;
                label not hideable (quoted) */}
            {detail.conflictedLabel ? <Badge tone="error">{detail.conflictedLabel}</Badge> : null}
            {detail.regions?.length ? (
              <span className="text-xs text-(--text-muted)">
                Regions: {detail.regions.join(", ")}
              </span>
            ) : null}
          </div>

          {/* BUY → /go ONLY (CAP-247; the route re-verifies the lock) */}
          <div className="space-y-2">
            {detail.buyHref ? (
              <Link href={detail.buyHref} className={cn(buttonVariants())}>
                {detail.ctaLabel ?? "Buy"}
              </Link>
            ) : (
              // Degrades: BUY disabled, historical commercial context
              // preserved (CAP-245 — R-BLOCK)
              <Button disabled>{detail.ctaLabel ?? "Buy"}</Button>
            )}
            {/* CAP-524 copy slot: Amazon clicks use the SAME standard /go;
                the wording is fenced (sell OQ4) — generic copy, keyed slot */}
            {detail.isAmazon ? (
              <p className="text-xs text-(--text-muted)">
                Amazon purchases are tracked as traffic only — commissions
                can&apos;t be network-verified for this store&apos;s score.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Product Discussion (CAP-253) — hosted on the CAP-560 shadow post;
          legitimacy-weighted default sort (M6 "best") */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-(--text-primary)">Product discussion</h2>
        {!shadowPostId ? (
          <p className="text-sm text-(--text-muted)">
            The discussion thread opens when this product is approved.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-sm text-(--text-muted)">No discussion yet.</p>
              ) : (
                comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="space-y-1 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          {comment.authorName ? (
                            <p className="text-xs text-(--text-muted)">{comment.authorName}</p>
                          ) : null}
                          <p className="text-sm text-(--text-primary)">
                            {comment.tombstone ? "[removed]" : comment.body}
                          </p>
                        </div>
                        {/* CAP-561 — owner hide-for-moderator-review; NEVER
                            delete (the comment goes held + a shared-queue
                            case; moderator disposition per M13) */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            void hideForReview({ commentId: comment.id as any })
                              .then(() => setNote("Comment hidden for moderator review."))
                              .catch((e) => setNote(String(e?.message ?? e)));
                          }}
                        >
                          Hide for review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {authStatus === "authenticated" ? (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!reply.trim()) return;
                  void createComment({ postId: shadowPostId as any, body: reply })
                    .then(() => { setReply(""); setNote("Comment posted."); })
                    .catch((e) => setNote(String(e?.message ?? e)));
                }}
              >
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Ask or share experience with this product…"
                  className="flex-1 rounded-md border border-(--border-default) bg-(--bg-default) px-3 py-2 text-sm text-(--text-primary)"
                />
                <Button type="submit" size="sm">Post</Button>
              </form>
            ) : (
              <p className="text-sm text-(--text-muted)">Sign in to join the discussion.</p>
            )}
            {note ? <p className="text-xs text-(--text-muted)">{note}</p> : null}
          </>
        )}
      </section>
    </div>
  );
}
