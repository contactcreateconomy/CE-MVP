"use client";

import { ContentPage } from "@/components/content/content-page";
import { seedThread, seedComments } from "../../content/_seed";

interface CategoryPreviewLoaderProps {
  categoryKey: string;
}

// Static seed — zero Convex, zero DB.
// Each category preview renders the mother content template.
// The polymorphic block per category will be wired here once designed.
export function CategoryPreviewLoader({ categoryKey: _categoryKey }: CategoryPreviewLoaderProps) {
  return <ContentPage mode="max" thread={seedThread} comments={seedComments} />;
}
