"use client";

/**
 * ComposerProductBlock — SLICE-P6-18, CAP-244: "Composer Add Products →
 * tag own active/approved products ≤5 with structured token". R-COMPOSER
 * gates: no raw URL ever — the token carries the internal product id only
 * (≤50% commercial density is enforced server-side at the B2 cutover,
 * where the posts/postAffiliateLinks writes land).
 *
 * Token format [[product:<id>]] is a FE-owned choice (format unspecified
 * in the register) — flagged in the tracker.
 */

import { useState } from "react";
import { useConvex, useQuery } from "convex/react";

import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import { cn } from "@/lib/utils";

export interface TaggedProduct {
  productId: string;
  name: string;
}

export function productTokens(products: TaggedProduct[]): string {
  return products.map((p) => `[[product:${p.productId}]]`).join(" ");
}

export function ComposerProductBlock({
  selected,
  onToggle,
}: {
  selected: TaggedProduct[];
  onToggle: (product: TaggedProduct) => void;
}) {
  const configured = isConvexConfigured();
  const convex = useConvex();
  // listOwnProducts pages (20/page, cursor continuation — the picker must
  // reach products beyond the first page); appended pages accumulate in
  // local state, same idiom as the tool-profile ratings continuation.
  const own = useQuery(
    api.store.public.listOwnProducts,
    configured ? {} : "skip",
  );
  const [extraPages, setExtraPages] = useState<
    { products: TaggedProduct[]; nextCursor: string | null }[]
  >([]);
  const [loadingMore, setLoadingMore] = useState(false);
  if (!configured || own === undefined) return null;
  const products = [
    ...((own.products ?? []) as TaggedProduct[]),
    ...extraPages.flatMap((p) => p.products),
  ];
  if (products.length === 0) return null; // no approved products → no block

  const effectiveCursor =
    extraPages.length > 0 ? extraPages[extraPages.length - 1].nextCursor : (own.nextCursor ?? null);
  const canContinue = effectiveCursor !== null && effectiveCursor !== undefined;

  async function loadMore() {
    if (!canContinue || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await convex.query(api.store.public.listOwnProducts, {
        cursor: effectiveCursor ?? undefined,
      });
      setExtraPages((prev) => [
        ...prev,
        { products: (page.products ?? []) as TaggedProduct[], nextCursor: page.nextCursor ?? null },
      ]);
    } finally {
      setLoadingMore(false);
    }
  }

  const isSelected = (p: TaggedProduct) =>
    selected.some((s) => s.productId === p.productId);
  const atCap = selected.length >= 5; // CAP-244: ≤5 TAGS per post (not the picker page size)

  return (
    <div className="space-y-2 rounded-lg border border-(--border-default) p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-(--text-muted)">
        Tag your store products (affiliate)
      </p>
      <div className="flex flex-wrap gap-2">
        {products.map((product) => {
          const selectedNow = isSelected(product);
          return (
            <button
              key={product.productId}
              type="button"
              disabled={!selectedNow && atCap}
              onClick={() => onToggle(product)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                selectedNow
                  ? "border-(--brand-primary) bg-(--brand-primary)/10 text-(--text-primary)"
                  : "border-(--border-default) text-(--text-secondary) hover:text-(--text-primary)",
                !selectedNow && atCap && "opacity-50",
              )}
            >
              {product.name}
            </button>
          );
        })}
        {canContinue ? (
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="rounded-full border border-(--border-default) px-3 py-1 text-xs text-(--text-secondary) transition-colors hover:text-(--text-primary) disabled:opacity-50"
          >
            {loadingMore ? "Loading…" : "Show more"}
          </button>
        ) : null}
      </div>
      <p className="text-xs text-(--text-muted)">
        {selected.length}/5 tagged · products render as live reference blocks ·
        affiliate disclosure applies
      </p>
    </div>
  );
}
