/**
 * Route: /category/[slug]
 * Static design preview — renders the shared mother `ContentPage` template with seed data.
 * No Convex / DB. The `slug` is validated only; a per-category polymorphic block can be
 * wired in `CategoryPreviewLoader` when those designs exist. Production discussions live
 * under `/discussions/[slug]` and are separate from this sandbox.
 */
import { notFound } from "next/navigation";

import { CategoryPreviewLoader } from "./category-preview-loader";

const KNOWN_CATEGORIES = new Set([
  "news",
  "review",
  "compare",
  "launch-pad",
  "debate",
  "help",
  "qa",
  "list",
  "showcase",
  "gigs",
]);

interface CategoryPreviewPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPreviewPage({ params }: CategoryPreviewPageProps) {
  const { slug } = await params;

  if (!KNOWN_CATEGORIES.has(slug)) {
    notFound();
  }

  return <CategoryPreviewLoader categoryKey={slug} />;
}
