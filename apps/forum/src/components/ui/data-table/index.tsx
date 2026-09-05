"use client";

import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Lock, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Banner } from "@/components/ui/banner";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonText } from "@/components/ui/skeleton";

/**
 * DataTable (A1) — STYLE-KIT §11.10, SLICE-P3-04.
 *
 * Highest-frequency F-24 gap (~13 admin screens). Composition: §11.2
 * inputs + §11.5 pills (caller cells) + §11.1 ghost/icon buttons +
 * §11.9 skeletons + §11.13 Banner (error) + §11.23 empty-state.
 * Admin console motion: fade only, duration/fast.
 *
 * v1 fence (SLICE-P3-04, no cited consumer demands more): no
 * virtualization, no column reorder, no inline cell editing.
 *
 * Pagination is CURSOR-based (§11.10: "cursor pagination (no page
 * numbers)") — the Convex `.paginate()` + `usePaginatedQuery` contract,
 * never offset paging. Consumers own the cursor stack; the footer only
 * signals prev/next availability.
 *
 * Masked values (audit contract §6 "masked-value rendering", visual
 * only): a column with `masked(row) === true` renders caption + lock
 * icon/xs instead of the cell value.
 */

export type SortDirection = "asc" | "desc";

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  /** Cell renderer; omit for a plain-text `row[key]` fallback. */
  cell?: (row: T) => React.ReactNode;
  /** Provide to make the column sortable (client or server side). */
  sortValue?: (row: T) => string | number;
  /** §11.10 masked-value hook: caption + lock icon/xs, text/muted. */
  masked?: (row: T) => boolean;
  align?: "left" | "right" | "center";
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  /** compact 40px rows (admin default) / comfortable 48px (member Journal). */
  density?: "compact" | "comfortable";
  /** §11.10 zebra optional: even rows bg/wash. */
  zebra?: boolean;
  /** Bulk-select leading checkbox column (§11.10). */
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  isRowSelectable?: (row: T) => boolean;
  /** Row-level action slot (§11.10 body-row actions). */
  renderRowActions?: (row: T) => React.ReactNode;
  /** §11.10 STATES loading: 8 skeleton rows. */
  loading?: boolean;
  /** §11.10 STATES error: Banner/error above; last-good rows stay mounted. */
  error?: React.ReactNode;
  /** §11.10 STATES empty: §11.23 empty-state inside the container. */
  emptyState?: React.ReactNode;
  /** Controlled sort (server-side); omit for internal client sort. */
  sortKey?: string;
  sortDir?: SortDirection;
  onSortChange?: (key: string, dir: SortDirection) => void;
  /** Row click (keyboard focusable; use row actions for mutations). */
  onRowClick?: (row: T) => void;
  className?: string;
}

const alignClass = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

export function DataTable<T>({
  columns,
  data,
  getRowId,
  density = "compact",
  zebra = false,
  selectable = false,
  selectedIds,
  onSelectionChange,
  isRowSelectable,
  renderRowActions,
  loading = false,
  error,
  emptyState,
  sortKey: controlledSortKey,
  sortDir: controlledSortDir,
  onSortChange,
  onRowClick,
  className,
}: DataTableProps<T>) {
  // Internal sort state when uncontrolled (client-side sort via sortValue).
  const [internalSortKey, setInternalSortKey] = React.useState<string | null>(null);
  const [internalSortDir, setInternalSortDir] = React.useState<SortDirection>("asc");
  const controlled = onSortChange !== undefined;
  const sortKey = controlled ? controlledSortKey : internalSortKey;
  const sortDir = controlled ? (controlledSortDir ?? "asc") : internalSortDir;

  const toggleSort = (key: string) => {
    const nextDir: SortDirection = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    if (controlled) {
      onSortChange?.(key, nextDir);
    } else {
      setInternalSortKey(key);
      setInternalSortDir(nextDir);
    }
  };

  const rows = React.useMemo(() => {
    if (controlled || !internalSortKey) return data;
    const col = columns.find((c) => c.key === internalSortKey);
    if (!col?.sortValue) return data;
    const sorted = [...data].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av).localeCompare(String(bv));
    });
    return internalSortDir === "desc" ? sorted.reverse() : sorted;
  }, [data, columns, controlled, internalSortKey, internalSortDir]);

  const effectiveSelected = selectedIds ?? [];
  const selectableRows = isRowSelectable ? rows.filter(isRowSelectable) : rows;
  const allOnPageSelected =
    selectableRows.length > 0 &&
    selectableRows.every((r) => effectiveSelected.includes(getRowId(r)));
  const someOnPageSelected =
    !allOnPageSelected && selectableRows.some((r) => effectiveSelected.includes(getRowId(r)));

  const setPageSelected = (checked: boolean) => {
    if (!onSelectionChange) return;
    const pageIds = selectableRows.map(getRowId);
    const next = checked
      ? Array.from(new Set([...effectiveSelected, ...pageIds]))
      : effectiveSelected.filter((id) => !pageIds.includes(id));
    onSelectionChange(next);
  };

  const toggleRow = (id: string, checked: boolean) => {
    if (!onSelectionChange) return;
    onSelectionChange(
      checked ? [...effectiveSelected, id] : effectiveSelected.filter((x) => x !== id),
    );
  };

  const rowHeight = density === "compact" ? "h-10" : "h-12";
  const showEmpty = !loading && rows.length === 0;

  return (
    <div className={cn("rounded-lg border border-border-subtle bg-bg-surface", className)}>
      {error ? (
        <div className="p-3">
          <Banner variant="error">{error}</Banner>
        </div>
      ) : null}

      {/* Desktop ≥768px: the table proper (§11.10). */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-bg-inset">
              {selectable ? (
                <th scope="col" className="w-10 border-b border-border-subtle px-3 py-2">
                  <Checkbox
                    checked={allOnPageSelected}
                    indeterminate={someOnPageSelected}
                    onCheckedChange={setPageSelected}
                    aria-label="Select page"
                  />
                </th>
              ) : null}
              {columns.map((col) => {
                const sortable = Boolean(col.sortValue) || controlled;
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={isSorted ? (sortDir === "asc" ? "ascending" : "descending") : sortable ? "none" : undefined}
                    className={cn(
                      "border-b border-border-subtle px-3 py-2 text-xs font-medium text-text-secondary",
                      alignClass[col.align ?? "left"],
                      col.headerClassName,
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-sm outline-hidden transition-colors duration-fast ease-out-cubic hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand-primary-hover",
                          isSorted ? "text-text-link" : "text-text-secondary",
                        )}
                      >
                        {col.header}
                        <ChevronDown
                          className={cn(
                            "size-3 transition-transform duration-fast ease-out-cubic",
                            isSorted && sortDir === "desc" ? "rotate-180" : "",
                            isSorted ? "text-text-link" : "text-text-muted",
                          )}
                          aria-hidden
                        />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
              {renderRowActions ? (
                <th scope="col" className="border-b border-border-subtle px-3 py-2 text-xs font-medium text-text-secondary">
                  <span className="sr-only">Actions</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  // §11.10 loading: 8 skeleton rows (§11.9 text-line)
                  <tr key={`skeleton-${i}`} className={rowHeight}>
                    {selectable ? (
                      <td className="px-3 py-2">
                        <SkeletonText className="w-4" />
                      </td>
                    ) : null}
                    {columns.map((col) => (
                      <td key={col.key} className="px-3 py-2">
                        <SkeletonText className={i % 3 === 0 ? "w-full" : i % 3 === 1 ? "w-4/5" : "w-3/5"} />
                      </td>
                    ))}
                    {renderRowActions ? (
                      <td className="px-3 py-2">
                        <SkeletonText className="w-8" />
                      </td>
                    ) : null}
                  </tr>
                ))
              : rows.map((row, rowIndex) => {
                  const id = getRowId(row);
                  const isSelected = effectiveSelected.includes(id);
                  const rowSelectable = !isRowSelectable || isRowSelectable(row);
                  return (
                    <tr
                      key={id}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={cn(
                        "border-b border-border-subtle transition-colors duration-fast ease-out-cubic last:border-b-0",
                        rowHeight,
                        zebra && rowIndex % 2 === 1 && !isSelected && "bg-bg-wash",
                        "hover:bg-bg-overlay",
                        isSelected && "border-l-2 border-l-brand-primary bg-brand-primary/10",
                        onRowClick && "cursor-pointer",
                        "focus-within:shadow-glow-primary-border",
                      )}
                    >
                      {selectable ? (
                        <td className="px-3 py-2">
                          <Checkbox
                            checked={isSelected}
                            disabled={!rowSelectable}
                            onCheckedChange={(checked) => toggleRow(id, checked)}
                            aria-label={`Select row ${rowIndex + 1}`}
                          />
                        </td>
                      ) : null}
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            "px-3 py-2 text-sm text-text-primary",
                            alignClass[col.align ?? "left"],
                            col.className,
                          )}
                        >
                          {col.masked?.(row) ? (
                            // §11.10 masked: caption + lock icon/xs, text/muted
                            <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                              <Lock className="size-3" aria-hidden />
                              <span aria-hidden>•••</span>
                              <span className="sr-only">masked</span>
                            </span>
                          ) : (
                            (col.cell?.(row) ?? String((row as Record<string, unknown>)[col.key] ?? ""))
                          )}
                        </td>
                      ))}
                      {renderRowActions ? (
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">{renderRowActions(row)}</div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Mobile <768px: §11.10 collapse — stacked definition-list cards
          (Card compact, label/md + body/sm pairs), not a mini table. */}
      {!loading && rows.length > 0 ? (
        <div className="divide-y divide-border-subtle md:hidden">
          {rows.map((row) => {
            const id = getRowId(row);
            const isSelected = effectiveSelected.includes(id);
            return (
              <div
                key={id}
                className={cn(
                  "space-y-1.5 p-3",
                  isSelected && "border-l-2 border-l-brand-primary bg-brand-primary/10",
                )}
              >
                {selectable ? (
                  <Checkbox
                    checked={isSelected}
                    disabled={isRowSelectable ? !isRowSelectable(row) : false}
                    onCheckedChange={(checked) => toggleRow(id, checked)}
                    aria-label={`Select row for ${columns[0]?.header ?? "row"}`}
                  />
                ) : null}
                {columns.map((col) => (
                  <div key={col.key} className="flex flex-col gap-0.5">
                    <span className="text-xs text-text-secondary">{col.header}</span>
                    <span className="text-sm text-text-primary">
                      {col.masked?.(row) ? (
                        <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                          <Lock className="size-3" aria-hidden />
                          <span aria-hidden>•••</span>
                          <span className="sr-only">masked</span>
                        </span>
                      ) : (
                        (col.cell?.(row) ?? String((row as Record<string, unknown>)[col.key] ?? ""))
                      )}
                    </span>
                  </div>
                ))}
                {renderRowActions ? (
                  <div className="flex items-center gap-1 pt-1">{renderRowActions(row)}</div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {showEmpty ? (
        emptyState ?? (
          <EmptyState
            compact
            icon={<ChevronRight className="size-5" />}
            heading="No rows"
          />
        )
      ) : null}
    </div>
  );
}

/**
 * §11.10 TOOLBAR — 40px, search input sm left, filter selects, bulk-action
 * slot right, border/subtle bottom. Slots, not consumer logic.
 */
export function DataTableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  filters,
  bulkActions,
  className,
}: {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  bulkActions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-10 items-center gap-2 border-b border-border-subtle px-3",
        className,
      )}
    >
      {onSearchChange ? (
        <div className="relative w-full max-w-64">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 w-full rounded-md border border-border-default bg-bg-surface pl-9 pr-3 text-sm text-text-primary outline-none transition-[border-color,box-shadow] duration-normal ease-out-cubic placeholder:text-text-muted hover:border-border-prominent focus-visible:border-border-active focus-visible:shadow-glow-primary-border"
          />
        </div>
      ) : null}
      {filters ? <div className="flex items-center gap-2">{filters}</div> : null}
      {bulkActions ? (
        <div className="ml-auto flex items-center gap-2">{bulkActions}</div>
      ) : null}
    </div>
  );
}

/**
 * §11.10 PAGINATION FOOTER — 40px, caption text/muted, ghost sm
 * « Prev | Next », CURSOR pagination (no page numbers), 40% disabled.
 */
export function DataTablePagination({
  onPrev,
  onNext,
  prevDisabled = false,
  nextDisabled = false,
  loadingMore = false,
  label,
  className,
}: {
  onPrev?: () => void;
  onNext?: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  loadingMore?: boolean;
  label?: React.ReactNode;
  className?: string;
}) {
  const ghost =
    "inline-flex h-8 items-center gap-1 rounded-md px-3 text-sm text-text-secondary outline-hidden transition-colors duration-fast ease-out-cubic hover:bg-bg-overlay hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand-primary-hover disabled:pointer-events-none disabled:opacity-40";
  return (
    <div
      className={cn(
        "flex h-10 items-center justify-between border-t border-border-subtle px-3 text-xs text-text-muted",
        className,
      )}
    >
      <span>{label}</span>
      <div className="flex items-center gap-1">
        <button type="button" className={ghost} onClick={onPrev} disabled={prevDisabled}>
          <ChevronLeft className="size-4" aria-hidden />
          Prev
        </button>
        <button type="button" className={ghost} onClick={onNext} disabled={nextDisabled || loadingMore}>
          Next
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
