export const APP_IDS = ["forum", "seller", "admin", "marketplace"];

export function getConvexUrl() {
  return process.env.NEXT_PUBLIC_CONVEX_URL ?? null;
}

export function isConvexConfigured() {
  return Boolean(getConvexUrl());
}
