/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results untyped at the client edge */
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

import { useQuery } from "convex/react";

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
  const own = useQuery(
    api.store.public.listOwnProducts,
    configured ? {} : "skip",
  );
  if (!configured || own === undefined) return null;
  const products = (own.products ?? []) as TaggedProduct[];
  if (products.length === 0) return null; // no approved products → no block

  const isSelected = (p: TaggedProduct) =>
    selected.some((s) => s.productId === p.productId);
  const atCap = selected.length >= 5; // CAP-244: ≤5

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
      </div>
      <p className="text-xs text-(--text-muted)">
        {selected.length}/5 tagged · products render as live reference blocks ·
        affiliate disclosure applies
      </p>
    </div>
  );
}
