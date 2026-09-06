/**
 * Route: /s/[handle]/[product] — product detail + discussion (SLICE-P6-18).
 * [product] resolves by product id (no slug field in the bible — none
 * invented). Discussion hosts on the CAP-560 shadow post.
 */
import { ProductDetailClient } from "./product-client";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ handle: string; product: string }>;
}) {
  const { handle, product } = await params;
  return (
    <ProductDetailClient
      handle={decodeURIComponent(handle)}
      product={decodeURIComponent(product)}
    />
  );
}
