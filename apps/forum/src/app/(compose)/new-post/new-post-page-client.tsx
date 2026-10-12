"use client";

import { lazy, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { isConvexConfigured } from "@cemvp/convex-client";
import { useSharedData } from "@/providers/shared-data-context";
import { composerTypeFromParam } from "@/lib/new-post/composer-type-param";
import type { Category } from "@/types";

const NewPostComposer = lazy(() =>
  import("@/components/new-post/new-post-composer").then((m) => ({
    default: m.NewPostComposer,
  })),
);

function NewPostPageWithConvex() {
  const { categories, categoriesLoading } = useSharedData();
  // FEED-U3: the Start sheet routes here with ?type=<chosen post type>.
  const initialType = composerTypeFromParam(useSearchParams().get("type"));

  if (categoriesLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-(--text-muted)">
        Loading editor…
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-(--text-muted)">
          Loading editor…
        </div>
      }
    >
      <NewPostComposer categories={categories as Category[]} initialType={initialType} />
    </Suspense>
  );
}

export function NewPostPageClient() {
  if (!isConvexConfigured()) {
    return (
      <p className="text-sm text-(--text-muted)">
        Connect Convex to load categories and publish posts.
      </p>
    );
  }

  return <NewPostPageWithConvex />;
}
