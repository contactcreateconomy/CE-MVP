"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileClock, PenLine, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  NEW_POST_DRAFT_STORAGE_KEY,
  type NewPostDraftPayload,
} from "@/lib/new-post/category-composer-fields";

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * My Drafts list (CAP-532) — shows the local draft saved by the composer's
 * Save-draft action (CAP-531 draft-save). Re-keyed to the locked capabilities
 * 2026-08-31 (reclassified D→A); the localStorage mechanism is the pre-spec
 * stand-in for the spec's server-side draft preservation.
 */
export function DraftsPageClient() {
  const [draft, setDraft] = useState<NewPostDraftPayload | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(NEW_POST_DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as NewPostDraftPayload;
        if (parsed && typeof parsed.title === "string") {
          setDraft(parsed);
        }
      }
    } catch {
      /* ignore corrupt draft */
    }
  }, []);

  const deleteDraft = () => {
    try {
      localStorage.removeItem(NEW_POST_DRAFT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setDraft(null);
  };

  return (
    <section className="animate-route-emerge space-y-4">
      <Card>
        <CardHeader>
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-(--text-primary)">
            <FileClock className="h-5 w-5" /> My Drafts
          </h1>
        </CardHeader>
        <CardContent className="space-y-3">
          {!mounted ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-(--border-default) border-t-(--brand-primary)" />
            </div>
          ) : draft ? (
            <div className="rounded-md border border-(--border-default) bg-(--bg-surface) p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-(--text-primary)">
                    {draft.title || "Untitled draft"}
                  </p>
                  <p className="mt-1 text-xs text-(--text-muted)">
                    Last edited {relativeTime(draft.updatedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Link
                    href="/new-post"
                    aria-label="Resume editing draft"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-(--text-secondary) transition-colors hover:bg-(--bg-overlay) hover:text-(--text-primary)"
                  >
                    <PenLine className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={deleteDraft}
                    aria-label="Delete draft"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-400 transition-colors hover:bg-(--bg-overlay) hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-(--text-muted)">No drafts yet.</p>
              <p className="mt-1 text-xs text-(--text-muted)">
                Drafts are saved automatically when you compose a new post.
              </p>
              <Link
                href="/new-post"
                className="mt-4 inline-flex h-8 items-center rounded-md border border-(--border-prominent) bg-transparent px-3 text-xs font-medium text-(--text-primary) transition-colors hover:bg-(--bg-overlay) hover:border-(--border-active)"
              >
                Write a post
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
