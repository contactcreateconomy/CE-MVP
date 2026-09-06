/**
 * Route: /s/[handle] — the public storefront (SLICE-P6-18).
 * [handle] = the owner's CAP-550 username (storefronts carry no handle
 * field — resolution composes handle → user → their store).
 * Group B lifecycle renders live in the client (getStorefront).
 */
import { StorefrontClient } from "./storefront-client";

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  return <StorefrontClient handle={decodeURIComponent(handle)} />;
}
