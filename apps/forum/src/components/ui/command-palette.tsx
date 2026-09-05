"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Search, SearchX } from "lucide-react";

import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/skeleton";

/**
 * CommandPalette (A11) — STYLE-KIT §11.12 + CONTRACT-7-admin-shell §3 F.
 *
 * Composes Modal sm (§11.7, 420px) + Search Input + Dropdown menu items —
 * NOT a new overlay type. Admin motion: fade duration/fast only, no
 * scale reveal.
 *
 * Palette states (shell contract §3 F, verbatim):
 * "closed / open / authorized-results / no-match /
 *  unauthorized-excluded / back-door-genome-excluded."
 * The two *-excluded states are DATA states, not renders: results are
 * drawn only from the caller's pre-authorized `adminWidgets` reads —
 * permission filtering (unauthorized-excluded) and the
 * `/admin/personas/genome` back-door exclusion happen upstream, so this
 * component never receives them (shell §1: "must not become a normal
 * command-palette result"). Navigation only — no mutation surface
 * (shell §4); every item carries its own onSelect route action.
 *
 * v1 fence (SLICE-P3-02): widget-catalog navigation only; substring
 * match on label + keywords (no fuzzy engine).
 */

export interface CommandItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  /** Extra match terms (route key, aliases). */
  keywords?: string[];
  onSelect: () => void;
  disabled?: boolean;
}

export interface CommandSection {
  label: string;
  items: CommandItem[];
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-authorized sections; rendered in order, labels as overlines. */
  sections: CommandSection[];
  placeholder?: string;
  /** §11.8 matrix Loading ✓: spinner while the widget catalog resolves. */
  loading?: boolean;
  className?: string;
}

export function CommandPalette({
  open,
  onOpenChange,
  sections,
  placeholder = "Search…",
  loading = false,
  className,
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // §11.12 empty query → §11.23 empty-state compact; otherwise filtered.
  const q = query.trim().toLowerCase();
  const filtered = React.useMemo(
    () =>
      sections.map((s) => ({
        ...s,
        items: q
          ? s.items.filter(
              (it) =>
                it.label.toLowerCase().includes(q) ||
                it.keywords?.some((k) => k.toLowerCase().includes(q)),
            )
          : s.items,
      })),
    [sections, q],
  );
  const flatItems = React.useMemo(() => filtered.flatMap((s) => s.items), [filtered]);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // Focus the search field when the palette opens.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  React.useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(flatItems.length - 1, 0)));
  }, [flatItems.length]);

  // Keep the active item in view while keyboard-navigating.
  React.useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const runItem = (item: CommandItem) => {
    if (item.disabled) return;
    onOpenChange(false);
    item.onSelect();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (flatItems.length ? (i + 1) % flatItems.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) =>
        flatItems.length ? (i - 1 + flatItems.length) % flatItems.length : 0,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatItems[activeIndex];
      if (item) runItem(item);
    }
  };

  let runningIndex = -1;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* §11.12 overlay: Modal backdrop (60% + blur), same layer as dialogs */}
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-dropdown bg-black/60 backdrop-blur-[length:var(--blur-overlay)]",
            "data-[state=open]:animate-overlay-fade-in data-[state=closed]:animate-overlay-fade-out",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            // §11.12 container: Modal sm 420px, surface-elevated, radius/xl,
            // shadow/xl, padding 0 (list flush), centered, max-height 80vh.
            "fixed left-1/2 top-[20%] z-dropdown w-(--container-auth) max-h-[80vh] -translate-x-1/2",
            "flex flex-col overflow-hidden rounded-xl border border-border-default bg-bg-surface-elevated shadow-xl outline-hidden",
            // Admin motion: fade only, duration/fast — no scale reveal
            "data-[state=open]:animate-overlay-fade-in data-[state=closed]:animate-overlay-fade-out",
            "motion-reduce:duration-instant",
            className,
          )}
          onKeyDown={onKeyDown}
          aria-label="Command palette"
        >
          {/* §11.12 search: padded space/3 instead of nested radius */}
          <div className="p-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
                aria-hidden
              />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls="command-palette-list"
                aria-activedescendant={
                  flatItems[activeIndex] ? `command-option-${flatItems[activeIndex].id}` : undefined
                }
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder={placeholder}
                className="h-10 w-full rounded-md border border-border-default bg-bg-surface pl-9 pr-3 text-sm text-text-primary outline-none transition-[border-color,box-shadow] duration-normal ease-out-cubic placeholder:text-text-muted hover:border-border-prominent focus-visible:border-border-active focus-visible:shadow-glow-primary-border"
              />
            </div>
          </div>

          <div
            ref={listRef}
            id="command-palette-list"
            role="listbox"
            aria-label="Commands"
            className="min-h-0 flex-1 overflow-y-auto"
          >
            {loading ? (
              // §11.8 Loading: spinner while the catalog read resolves
              <div className="flex items-center justify-center gap-2 py-6">
                <Spinner />
                <span className="text-sm text-text-secondary">Loading…</span>
              </div>
            ) : q && flatItems.length === 0 ? (
              // §11.12 no results: body/sm text/muted, padding space/4
              <p className="p-4 text-sm text-text-muted">No results.</p>
            ) : !q && flatItems.length === 0 ? (
              <EmptyState compact icon={<Search className="size-5" />} heading="No commands" />
            ) : (
              <>
                {filtered.map((section, sIdx) =>
                  section.items.length === 0 ? null : (
                    <div key={section.label}>
                      {/* §11.12 section labels: overline, text/muted */}
                      {(sIdx > 0 || q) && <div className="mx-3 my-1 h-px bg-border-subtle" />}
                      <p className="px-3 py-2 text-xs font-medium tracking-widest text-text-muted">
                        {section.label}
                      </p>
                      {section.items.map((item) => {
                        runningIndex += 1;
                        const idx = runningIndex;
                        const isActive = idx === activeIndex;
                        return (
                          <button
                            key={item.id}
                            id={`command-option-${item.id}`}
                            type="button"
                            role="option"
                            aria-selected={isActive}
                            data-index={idx}
                            disabled={item.disabled}
                            // §11.12 active: bg/overlay + text/link (dropdown Active)
                            className={cn(
                              "flex w-full items-center gap-2 px-3 py-2 text-sm outline-hidden transition-colors duration-fast ease-out-cubic",
                              isActive
                                ? "bg-bg-overlay text-text-link"
                                : "text-text-primary",
                              "disabled:pointer-events-none disabled:opacity-40",
                            )}
                            onMouseEnter={() => setActiveIndex(idx)}
                            onClick={() => runItem(item)}
                          >
                            {item.icon ? (
                              <span className="shrink-0 [&_svg]:size-4" aria-hidden>
                                {item.icon}
                              </span>
                            ) : null}
                            <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ),
                )}
              </>
            )}
          </div>

          {/* §11.12 footer hint: caption, text/muted, border/subtle top */}
          <div className="flex items-center gap-2 border-t border-border-subtle px-3 py-2 text-xs text-text-muted">
            <SearchX className="size-3" aria-hidden />
            <span>↑↓ navigate · Enter open · Esc close</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
