"use client";

import { lazy, Suspense } from "react";

import { isConvexConfigured } from "@cemvp/convex-client";
import { useSharedData } from "@/providers/shared-data-context";
import type { Category } from "@/types";

const NewPostComposer = lazy(() =>
  import("@/components/new-post/new-post-composer").then((m) => ({
    default: m.NewPostComposer,
  })),
);

function NewPostPageWithConvex() {
  const { categories, categoriesLoading } = useSharedData();

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
      <NewPostComposer categories={categories as Category[]} />
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
