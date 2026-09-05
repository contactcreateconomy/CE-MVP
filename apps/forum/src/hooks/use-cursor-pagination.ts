"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cursor-pagination accumulator — salvaged 2026-08-31 from the archived
 * /saved route (archive/routes/saved/). Reusable infrastructure (bucket C):
 * wraps a Convex paginated query result and accumulates pages across loads,
 * de-duplicating posts/comments/users by id.
 *
 * Usage:
 *   const [cursor, setCursor] = useState<string | null>(null);
 *   const page = useQuery(api.forum.queries.listFeedPage, { sort, cursor, limit: 24 });
 *   const { items, loadMore, canLoadMore } = useCursorPagination(page);
 *   // feed loadMore's cursor back into the query:
 *   useEffect(() => { if (nextCursor !== undefined) setCursor(nextCursor); }, [nextCursor]);
 */

export interface CursorPaginationEntities {
  posts: Array<{ id: string }>;
  comments: Array<{ id: string }>;
  users: Array<{ id: string }>;
}

export interface CursorPageShape extends Partial<CursorPaginationEntities> {
  continueCursor?: string;
  isDone?: boolean;
}

export interface CursorPaginationState<T extends CursorPaginationEntities> {
  /** Accumulated, de-duplicated entities across all loaded pages. */
  items: T;
  /** Advances to the next page (call from a Load-more button). */
  loadMore: () => void;
  /** True when another page exists. */
  canLoadMore: boolean;
  /** The cursor for the NEXT query fetch, once loadMore fires (undefined until then). */
  nextCursor: string | undefined;
}

function mergeById<T extends { id: string }>(prev: T[], next: T[]): T[] {
  const seen = new Set(prev.map((x) => x.id));
  const out = [...prev];
  for (const x of next) {
    if (!seen.has(x.id)) {
      seen.add(x.id);
      out.push(x);
    }
  }
  return out;
}

export function useCursorPagination<T extends CursorPaginationEntities>(
  page: CursorPageShape | undefined,
): CursorPaginationState<T> {
  const [items, setItems] = useState<T>({} as T);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const appendNextRef = useRef(false);

  useEffect(() => {
    if (page === undefined || page === null) return;
    if (appendNextRef.current) {
      appendNextRef.current = false;
      setItems((prev) => {
        const p = (prev ?? {}) as CursorPaginationEntities;
        return {
          posts: mergeById(p.posts ?? [], page.posts ?? []),
          comments: mergeById(p.comments ?? [], page.comments ?? []),
          users: mergeById(p.users ?? [], page.users ?? []),
        } as T;
      });
      return;
    }
    setItems({
      posts: [...(page.posts ?? [])],
      comments: [...(page.comments ?? [])],
      users: [...(page.users ?? [])],
    } as T);
  }, [page]);

  const loadMore = useCallback(() => {
    if (!page?.continueCursor || page.isDone) return;
    appendNextRef.current = true;
    setNextCursor(page.continueCursor);
  }, [page]);

  const canLoadMore = Boolean(page && !page.isDone && page.continueCursor);

  return { items, loadMore, canLoadMore, nextCursor };
}
