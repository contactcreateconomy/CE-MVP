"use client";

import { useQuery } from "convex/react";

import { api } from "@/lib/convex";

/**
 * Resolves a coverImage value to a displayable URL.
 * - If it starts with "http", it's already a URL (legacy or external).
 * - Otherwise, it's a Convex storageId and needs server resolution.
 */
export function useCoverImageUrl(coverImage: string | undefined): string | undefined {
  const isUrl = coverImage?.startsWith("http") ?? false;
  const resolved = useQuery(
    api.forum.queries.getStorageUrl,
    isUrl || !coverImage ? "skip" : { storageId: coverImage },
  );
  if (!coverImage) return undefined;
  if (isUrl) return coverImage;
  return resolved ?? undefined;
}
