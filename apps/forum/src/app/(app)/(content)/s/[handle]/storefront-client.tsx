/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results untyped at the client edge */
"use client";

/**
 * StorefrontClient — SLICE-P6-18: the Group B public-lifecycle renders.
 * Pre-activation → not-found; paused → resolvable notice, NO cards/BUY;
 * suspended/closed → "no longer available", NO cards/BUY/affiliate nav;
 * active → cards with BUY toward /go ONLY when the link is locked.
 * CAP-269: platform-curated seed stores are LABELED, not user-owned.
 * CAP-252: wishlist = private toggle, ZERO Signal.
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

interface ProductCard {
  productId: string;
  name: string;
  category: string | null;
  useCase: string | null;
  description: string | null;
  buyHref: string | null;
  network: string | null;
}

export function StorefrontClient({ handle }: { handle: string }) {
  const configured = isConvexConfigured();
  const { authStatus } = useAuth();
  const store = useQuery(
    api.store.public.getStorefront,
    configured ? ({ handle } as any) : "skip",
  );
  const toggleWishlist = useMutation(api.store.public.toggleWishlist);
  const [wishlisted, setWishlisted] = useState<Record<string, boolean>>({});
  const [preview, setPreview] = useState<ProductCard | null>(null);

  if (!configured || store === undefined) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--border-default) border-t-(--brand-primary)" />
      </div>
    );
  }

  // Pre-activation: not public — the anonymous hit sees no store (quoted)
  if (store.state === "not_found") {
    return (
      <Card><CardContent className="space-y-2 py-10 text-center">
        <h1 className="text-lg font-semibold text-(--text-primary)">Store not found</h1>
        <p className="text-sm text-(--text-muted)">
          No store exists at this address, or it isn&apos;t public yet.
        </p>
      </CardContent></Card>
    );
  }

  // Paused (owner-initiated, reversible — softer copy; NO cards, NO BUY)
  if (store.state === "paused") {
    return (
      <Card><CardContent className="space-y-2 py-10 text-center">
        <h1 className="text-lg font-semibold text-(--text-primary)">Temporarily unavailable</h1>
        <p className="text-sm text-(--text-muted)">{store.notice}</p>
      </CardContent></Card>
    );
  }

  // Suspended/closed (operator action — explained state, not a 404; NO
  // cards, NO BUY, NO affiliate navigation)
  if (store.state === "no_longer_available") {
    return (
      <Card><CardContent className="space-y-2 py-10 text-center">
        <h1 className="text-lg font-semibold text-(--text-primary)">This store is no longer available</h1>
        <p className="text-sm text-(--text-muted)">{store.notice}</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-(--text-primary)">{store.ownerName}</h1>
          {/* CAP-269 — seed stores labeled platform-curated, not user-owned */}
          {store.platformCurated ? (
            <Badge tone="info">Platform-curated store</Badge>
          ) : null}
        </div>
        <p className="text-sm text-(--text-muted)">
          Products link out through Createconomy&apos;s redirect layer — buy
          decisions stay yours.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {(store.products as ProductCard[]).map((product) => (
          <Card key={product.productId}>
            <CardContent className="flex h-full flex-col gap-3 py-4">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-(--text-muted)">
                  {product.category ?? "Product"}
                </p>
                {/* CAP-246 — hover/tap opens the card preview (merchant +
                    sold-by + disclosure + wishlist; disclosure survives
                    collapse) */}
                <button
                  type="button"
                  className="text-left font-medium text-(--text-primary) hover:underline"
                  onClick={() => setPreview(product)}
                >
                  {product.name}
                </button>
                <p className="line-clamp-2 text-sm text-(--text-secondary)">
                  {product.useCase ?? product.description}
                </p>
              </div>
              <div className="mt-auto flex items-center gap-2">
                {product.buyHref ? (
                  <Link href={product.buyHref} className={cn(buttonVariants({ size: "sm" }))}>
                    Buy
                  </Link>
                ) : (
                  // BUY disabled when the link isn't locked — degrades, the
                  // commercial context stays (CAP-245)
                  <Button size="sm" disabled>Buy</Button>
                )}
                <Link
                  href={`/s/${handle}/${product.productId}`}
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  Details
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => {
                    if (authStatus !== "authenticated") return;
                    void toggleWishlist({ storefrontProductId: product.productId as any })
                      .then((r) => setWishlisted((w) => ({ ...w, [product.productId]: r.wishlisted })))
                      .catch(() => undefined);
                  }}
                  aria-label={`Wishlist ${product.name}`}
                >
                  {wishlisted[product.productId] ? "♥" : "♡"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Card preview (CAP-246): merchant + sold-by + disclosure + wishlist.
          v1 renders inline below the grid — the §11.7 bottom-sheet is the
          mobile pattern this slot owns. */}
      {preview ? (
        <Card>
          <CardContent className="space-y-2 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium text-(--text-primary)">{preview.name}</h3>
                <p className="text-sm text-(--text-secondary)">{preview.description}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPreview(null)}>Close</Button>
            </div>
            <p className="text-xs text-(--text-muted)">
              Sold by {store.ownerName} · Affiliate disclosure applies.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
