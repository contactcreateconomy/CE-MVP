/**
 * Route: /category/[slug] — the live feed filtered by post type (S00-SPEC
 * §11, D-012: no fabricated data). The slug is validated against the
 * canonical post-type literals via POST_TYPE_META (schema.ts posts.type);
 * unknown slugs 404. Header label + one-liner come from the label map
 * (Discover copy). The static "Maya Chen" seed preview was deleted with
 * this task; S06 later designs the fuller category home.
 */
import { notFound } from "next/navigation";

import { CanonicalFeedClient } from "@/components/feed/canonical-feed-client";
import { POST_TYPE_META } from "@/lib/labels";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const meta = POST_TYPE_META[slug];
  if (!meta) notFound();

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-(--text-primary)">{meta.label}</h1>
        {meta.description ? (
          <p className="text-sm text-(--text-muted)">{meta.description}</p>
        ) : null}
      </header>
      <CanonicalFeedClient
        initialTypeFilter={slug}
        emptyState={{
          heading: `No ${meta.label} posts yet`,
          actionLabel: "Write one",
          actionHref: `/new-post?type=${slug}`,
        }}
      />
    </section>
  );
}
