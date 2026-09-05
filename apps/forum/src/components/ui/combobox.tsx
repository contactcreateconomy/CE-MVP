"use client";

import * as React from "react";
import { CheckCircle2, ChevronDown, Plus, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Tag } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/skeleton";

/**
 * SearchableCombobox — STYLE-KIT §11.15. Select + Search Input fused;
 * panel = dropdown container (§11.7), width matches trigger, max-height
 * 300px scrollable (max-h-75 — the §11.2/§11.15 literal). Primary named
 * consumer: /welcome IANA timezone chooser (CONTRACT-1-welcome §6 — "the
 * combined pattern is undefined"; this component defines it). Browser
 * auto-detect prefill vs manual search stays with the consumer (welcome
 * OQ4) — `value` is controlled.
 *
 * States per §11.8 matrix: default/hover/focus/error/disabled/loading/
 * active(open). Error = feedback/error trigger border + body/xs helper
 * (§11.2 error pattern); Loading = spinner in the panel (options fetch).
 *
 * A11Y: listbox/option roles; typeahead rides the search input.
 * Multi-select mode renders selected values as §11.5 Tags in the
 * trigger with X dismiss.
 */

export interface ComboboxOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  keywords?: string[];
}

export interface ComboboxProps {
  options: ComboboxOption[];
  /** Single-select value. */
  value?: string;
  onChange?: (value: string) => void;
  /** Multi-select (filters) — Tags in the trigger, X dismiss. */
  multiple?: boolean;
  values?: string[];
  onValuesChange?: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  /** §11.8 Error: feedback/error trigger border + helper below (§11.2). */
  error?: string;
  helperText?: string;
  /** §11.8 Loading: spinner in the panel while options resolve. */
  loading?: boolean;
  /** Optional create-new slot (§11.15): last item, plus icon, text/link. */
  onCreateNew?: (query: string) => void;
  createNewLabel?: string;
  emptyLabel?: string;
  className?: string;
  id?: string;
}

export function SearchableCombobox({
  options,
  value,
  onChange,
  multiple = false,
  values,
  onValuesChange,
  placeholder = "Select…",
  disabled = false,
  error,
  helperText,
  loading = false,
  onCreateNew,
  createNewLabel = "Create",
  emptyLabel = "No options.",
  className,
  id,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();
  const filtered = React.useMemo(
    () =>
      options.filter(
        (o) =>
          !q ||
          o.label.toLowerCase().includes(q) ||
          o.keywords?.some((k) => k.toLowerCase().includes(q)),
      ),
    [options, q],
  );

  const selectedValues = multiple ? (values ?? []) : value !== undefined ? [value] : [];

  React.useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    requestAnimationFrame(() => searchRef.current?.focus());
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  React.useEffect(() => setActiveIndex(0), [q, open]);

  const commit = (option: ComboboxOption) => {
    if (option.disabled) return;
    if (multiple) {
      const next = selectedValues.includes(option.value)
        ? selectedValues.filter((v) => v !== option.value)
        : [...selectedValues, option.value];
      onValuesChange?.(next);
    } else {
      onChange?.(option.value);
      setOpen(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const option = filtered[activeIndex];
      if (option) commit(option);
      else if (onCreateNew && q) {
        onCreateNew(query.trim());
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const selectedLabel = (v: string) => options.find((o) => o.value === v)?.label ?? v;

  return (
    <div ref={rootRef} className={cn("relative", className)} id={id}>
      {/* §11.15 trigger: Select-like input + chevron (rotates when open) */}
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-invalid={error ? true : undefined}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border bg-bg-surface px-3 py-1.5 text-left text-sm text-text-primary outline-hidden",
          "transition-[border-color,box-shadow] duration-normal ease-out-cubic",
          // §11.8 error state: feedback/error border wins over hover/open
          error ? "border-feedback-error" : "border-border-default hover:border-border-prominent",
          "focus-visible:border-border-active focus-visible:shadow-glow-primary-border",
          "disabled:cursor-not-allowed disabled:bg-bg-inset disabled:text-text-disabled",
          !error && open && "border-border-active shadow-glow-primary-border",
        )}
      >
        {multiple && selectedValues.length > 0 ? (
          <span className="flex flex-wrap items-center gap-1 py-0.5">
            {selectedValues.map((v) => (
              <Tag key={v}>
                {selectedLabel(v)}
                <button
                  type="button"
                  className="rounded-sm text-text-muted outline-hidden transition-colors duration-fast ease-out-cubic hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand-primary-hover"
                  aria-label={`Remove ${selectedLabel(v)}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onValuesChange?.(selectedValues.filter((x) => x !== v));
                  }}
                >
                  <span aria-hidden className="text-xs">
                    ×
                  </span>
                </button>
              </Tag>
            ))}
          </span>
        ) : !multiple && value !== undefined && value !== "" ? (
          <span className="min-w-0 flex-1 truncate py-1">{selectedLabel(value)}</span>
        ) : (
          <span className="min-w-0 flex-1 truncate py-1 text-text-muted">{placeholder}</span>
        )}
        <ChevronDown
          className={cn(
            "ml-auto size-4 shrink-0 text-text-muted transition-transform duration-fast ease-out-cubic",
            open ? "rotate-180" : "",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-multiselectable={multiple || undefined}
          className={cn(
            // §11.15 panel: dropdown container, width = trigger, 300px max (§11.2)
            "absolute top-full z-dropdown mt-1 max-h-75 w-full overflow-hidden rounded-menu border border-border-default bg-bg-surface-elevated p-1 shadow-lg outline-hidden",
            "animate-soft-float",
          )}
          onKeyDown={onKeyDown}
        >
          {/* §11.15 first row: Search Input sm, border/subtle bottom */}
          <div className="relative mb-1 border-b border-border-subtle p-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
              aria-hidden
            />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="h-8 w-full rounded-md bg-transparent pl-9 pr-3 text-sm text-text-primary outline-none placeholder:text-text-muted"
              aria-label="Filter options"
            />
          </div>

          <div className="max-h-52 overflow-y-auto">
            {loading ? (
              // §11.8 Loading: spinner while options resolve
              <div className="flex items-center justify-center gap-2 py-4">
                <Spinner />
                <span className="text-sm text-text-secondary">Loading…</span>
              </div>
            ) : filtered.length === 0 ? (
              // §11.15 empty: body/sm text/muted, padding space/4
              <p className="p-4 text-sm text-text-muted">{emptyLabel}</p>
            ) : (
              filtered.map((option, idx) => {
                const isSelected = selectedValues.includes(option.value);
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => commit(option)}
                    className={cn(
                      "flex h-9 w-full items-center gap-2 rounded-menu-item px-2.5 text-sm outline-hidden transition-colors duration-fast ease-out-cubic",
                      // §11.15 active: bg/overlay + text/link
                      isActive && !option.disabled ? "bg-bg-overlay text-text-link" : "text-text-primary",
                      // §11.15 selected: text/link + check-circle right
                      isSelected && "text-text-link",
                      // §11.15 disabled: 40%, not hoverable
                      "disabled:pointer-events-none disabled:opacity-40",
                    )}
                  >
                    {option.icon ? (
                      <span className="shrink-0 [&_svg]:size-4" aria-hidden>
                        {option.icon}
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1 truncate text-left">{option.label}</span>
                    {isSelected ? (
                      <CheckCircle2 className="size-3.5 shrink-0 text-text-link" aria-hidden />
                    ) : null}
                  </button>
                );
              })
            )}

            {/* §11.15 create-new slot: last item, plus icon, text/link */}
            {!loading && onCreateNew && q && filtered.length === 0 ? (
              <button
                type="button"
                onClick={() => {
                  onCreateNew(query.trim());
                  setOpen(false);
                }}
                className="flex h-9 w-full items-center gap-2 rounded-menu-item px-2.5 text-sm text-text-link outline-hidden transition-colors duration-fast ease-out-cubic hover:bg-bg-overlay"
              >
                <Plus className="size-4" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-left">
                  {createNewLabel} “{query.trim()}”
                </span>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* §11.2 error/helper: body/xs below the trigger */}
      {error ? (
        <p className="mt-1 text-xs text-feedback-error-text" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-text-muted">{helperText}</p>
      ) : null}
    </div>
  );
}
