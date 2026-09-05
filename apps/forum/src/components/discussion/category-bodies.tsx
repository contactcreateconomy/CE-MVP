"use client";

import { Suspense } from "react";

import type { DiscussionThread } from "@/types/discussion";
import type { User } from "@/types";

import { GenericBody } from "./categories/GenericBody";
import { getCategoryTemplate } from "./categories/registry";

export function CategoryThreadBody({
  thread,
  isMax,
  author,
  ensureAuthenticated,
}: {
  thread: DiscussionThread;
  isMax: boolean;
  author: User | null;
  ensureAuthenticated: () => boolean;
}) {
  const tpl = getCategoryTemplate(thread.category);
  if (tpl) {
    return (
      <Suspense fallback={<div className="animate-pulse h-32 rounded-lg bg-(--surface-2)" />}>
        <tpl.Body thread={thread} isMax={isMax} author={author} ensureAuthenticated={ensureAuthenticated} />
      </Suspense>
    );
  }
  return <GenericBody thread={thread} />;
}
