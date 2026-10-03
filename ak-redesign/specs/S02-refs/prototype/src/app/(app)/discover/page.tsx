/**
 * Route: /discover
 * Auth requirement: Optional
 * Data dependencies: categories
 * Backend endpoints needed:
 * - GET /api/categories
 */
import Link from "next/link";
import { Compass } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getCategories } from "@/lib/adapters/content";

export default function DiscoverPage() {
  const categories = getCategories();
  return (
    <section className="animate-route-emerge space-y-4">
      <Card>
        <CardHeader>
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-[var(--text-primary)]">
            <Compass className="h-5 w-5" /> Discover
          </h1>
        </CardHeader>

        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.key}
              href={`/feed?category=${category.key}`}
              className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 transition-colors hover:border-[var(--border-active)] hover:bg-[var(--bg-overlay)]"
            >
              <p className="text-sm font-semibold text-[var(--text-primary)]">{category.name}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{category.description}</p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
