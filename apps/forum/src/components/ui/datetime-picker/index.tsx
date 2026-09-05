"use client";

import * as React from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/skeleton";

/**
 * DatetimePicker — STYLE-KIT §11.14, SLICE-P3-06(2).
 *
 * Composes Text Input + dropdown popover + calendar grid of ghost
 * buttons — no new calendar skin. Scheduling consumers (Phases 4–5):
 * personas-queue CAP-175 `scheduledFor`, curation CAP-191/192
 * `startAt`/`endAt` (two instances share min/max fences), admin-
 * resources CAP-210 releaseDate.
 *
 * IANA-safe output (P3-06 acceptance): the picker works in wall-clock
 * terms of `timeZone` (IANA, default = browser) and `onChange` emits an
 * ISO-8601 string carrying that zone's UTC offset. Keyboard: arrows
 * move the focused day; PgUp/PgDn change month. Mobile (<768px) degrades
 * to a native datetime-local input per §12.2 posture — same value shape.
 */

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/** Wall-clock parts of a Date in an IANA zone. */
function wallParts(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "longOffset",
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  const offset =
    parts.timeZoneName && parts.timeZoneName !== "GMT"
      ? parts.timeZoneName.replace("GMT", "UTC")
      : "Z";
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour === "24" ? "00" : parts.hour,
    minute: parts.minute,
    offset: offset === "Z" ? "+00:00" : offset,
    iso: `${parts.year}-${parts.month}-${parts.day}T${parts.hour === "24" ? "00" : parts.hour}:${parts.minute}:00${offset === "Z" ? "Z" : offset}`,
  };
}

function parseISO(iso?: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export interface DatetimePickerProps {
  /** ISO-8601 with offset (emitted shape); undefined = empty. */
  value?: string | null;
  onChange?: (iso: string | null) => void;
  /** IANA zone for wall-clock display; default = browser zone. */
  timeZone?: string;
  /** ISO fences: days outside are disabled (text/disabled). */
  min?: string | null;
  max?: string | null;
  /** Optional time-of-day selects (§11.14). */
  withTime?: boolean;
  disabled?: boolean;
  /** §11.14 error: input error border + helper body/xs error text. */
  error?: string;
  helperText?: string;
  placeholder?: string;
  /** §11.14 loading: spinner in the popover (timezone fetch etc.). */
  loading?: boolean;
  className?: string;
  id?: string;
}

export function DatetimePicker({
  value,
  onChange,
  timeZone: timeZoneProp,
  min,
  max,
  withTime = true,
  disabled = false,
  error,
  helperText,
  placeholder = "Select date & time",
  loading = false,
  className,
  id,
}: DatetimePickerProps) {
  const timeZone = React.useMemo(
    () =>
      timeZoneProp ??
      (typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "UTC"),
    [timeZoneProp],
  );

  const selected = parseISO(value);
  const minDate = parseISO(min);
  const maxDate = parseISO(max);

  const now = new Date();
  const [open, setOpen] = React.useState(false);
  const [viewYear, setViewYear] = React.useState(
    selected ? Number(wallParts(selected, timeZone).year) : now.getFullYear(),
  );
  const [viewMonth, setViewMonth] = React.useState(
    selected ? Number(wallParts(selected, timeZone).month) - 1 : now.getMonth(),
  );
  const // draft = the pending selection; committed on Apply (§11.14 actions)
    [draft, setDraft] = React.useState<Date | null>(selected);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const dayRefs = React.useRef(new Map<string, HTMLButtonElement>());

  React.useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  // Month matrix: Monday-first weeks with leading/trailing outside days.
  const weeks = React.useMemo(() => {
    const first = new Date(Date.UTC(viewYear, viewMonth, 1));
    // Monday-first offset: ISO weekday (Mon=1..Sun=7) → index 0..6
    const firstIdx = (first.getUTCDay() + 6) % 7;
    const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
    const cells: { key: string; date: Date; inMonth: boolean }[] = [];
    const prevDays = new Date(Date.UTC(viewYear, viewMonth, 0)).getUTCDate();
    for (let i = firstIdx - 1; i >= 0; i--) {
      cells.push({
        key: `prev-${i}`,
        date: new Date(Date.UTC(viewYear, viewMonth - 1, prevDays - i)),
        inMonth: false,
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ key: `day-${d}`, date: new Date(Date.UTC(viewYear, viewMonth, d)), inMonth: true });
    }
    let next = 1;
    while (cells.length % 7 !== 0) {
      cells.push({
        key: `next-${next}`,
        date: new Date(Date.UTC(viewYear, viewMonth + 1, next++)),
        inMonth: false,
      });
    }
    const out: (typeof cells)[] = [];
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
    return out;
  }, [viewYear, viewMonth]);

  const fenceDisabled = (d: Date) =>
    (minDate !== null && d.getTime() < minDate.getTime()) ||
    (maxDate !== null && d.getTime() > maxDate.getTime());

  const sameDay = (a: Date | null, b: Date) =>
    a !== null &&
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate();

  const todayCell = sameDay(now, new Date(Date.UTC(viewYear, viewMonth, now.getDate()))) ||
    weeks.some((w) => w.some((c) => c.inMonth && sameDay(now, c.date)));

  const shiftMonth = (delta: number) => {
    const m = viewMonth + delta;
    setViewMonth(((m % 12) + 12) % 12);
    setViewYear((y) => y + Math.floor(m / 12));
  };

  const draftWall = draft ? wallParts(draft, timeZone) : null;
  const displayValue = value ? value.replace("T", " ").slice(0, withTime ? 16 : 10) : "";

  const setDraftTime = (hour?: string, minute?: string) => {
    const base = draft ?? selected ?? new Date();
    const next = new Date(base);
    if (hour !== undefined) next.setHours(Number(hour));
    if (minute !== undefined) next.setMinutes(Number(minute));
    setDraft(next);
  };

  const focusDay = (key: string) => dayRefs.current.get(key)?.focus();

  const onGridKeyDown = (e: React.KeyboardEvent) => {
    const map: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    if (e.key in map) {
      e.preventDefault();
      const [dx, dy] = map[e.key];
      for (let w = 0; w < weeks.length; w++) {
        for (let c = 0; c < weeks[w].length; c++) {
          if (document.activeElement === dayRefs.current.get(weeks[w][c].key)) {
            const nw = Math.min(Math.max(w + dy, 0), weeks.length - 1);
            const nc = Math.min(Math.max(c + dx, 0), 6);
            focusDay(weeks[nw][nc].key);
            return;
          }
        }
      }
    } else if (e.key === "PageUp") {
      e.preventDefault();
      shiftMonth(-1);
    } else if (e.key === "PageDown") {
      e.preventDefault();
      shiftMonth(1);
    }
  };

  const monthLabel = new Date(Date.UTC(viewYear, viewMonth, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div ref={rootRef} className={cn("relative", className)} id={id}>
      {/* Desktop trigger (§11.14): Text Input md + trailing calendar icon */}
      <button
        type="button"
        hidden={typeof window !== "undefined" ? undefined : false}
        className={cn(
          "hidden h-9 w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left font-mono text-sm outline-hidden md:flex",
          "transition-[border-color,box-shadow] duration-normal ease-out-cubic",
          error ? "border-feedback-error" : "border-border-default",
          !error && "hover:border-border-prominent",
          open ? "border-border-active shadow-glow-primary-border" : "bg-bg-surface",
          "text-text-primary focus-visible:border-border-active focus-visible:shadow-glow-primary-border",
          "disabled:cursor-not-allowed disabled:bg-bg-inset disabled:text-text-disabled",
        )}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setDraft(selected);
          setOpen((o) => !o);
        }}
      >
        <span className={cn("truncate", !displayValue && "text-text-muted font-sans")}>
          {displayValue || placeholder}
        </span>
        <Calendar className="size-4 shrink-0 text-text-muted" aria-hidden />
      </button>

      {/* Mobile degrade (§12.2 posture): native input, same value shape */}
      <input
        type={withTime ? "datetime-local" : "date"}
        value={value ? value.slice(0, withTime ? 16 : 10) : ""}
        min={min ? min.slice(0, 16) : undefined}
        max={max ? max.slice(0, 16) : undefined}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value ? `${e.target.value}:00` : null)}
        aria-invalid={error ? true : undefined}
        className={cn(
          "h-9 w-full rounded-md border bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-[border-color,box-shadow] duration-normal ease-out-cubic md:hidden",
          error ? "border-feedback-error" : "border-border-default hover:border-border-prominent",
        )}
      />

      {open ? (
        <div
          role="dialog"
          aria-label="Choose date and time"
          className={cn(
            // §11.14 popover: dropdown container, min 280px, z/dropdown,
            // shadow/md, radius/md, padding space/3; fade only (admin)
            "absolute top-full z-dropdown mt-1 w-full min-w-70 rounded-md border border-border-default bg-bg-surface-elevated p-3 shadow-md outline-hidden",
            "animate-overlay-fade-in",
          )}
        >
          {loading ? (
            // §11.14 loading: spinner icon/sm in the popover
            <div className="flex items-center justify-center gap-2 py-6">
              <Spinner />
              <span className="text-sm text-text-secondary">Loading…</span>
            </div>
          ) : (
            <>
              {/* §11.14 header: heading/xs + ghost chevrons (aria-labels) */}
              <div className="mb-2 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => shiftMonth(-1)}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <p className="text-sm font-semibold text-text-primary">{monthLabel}</p>
                <Button size="sm" variant="ghost" onClick={() => shiftMonth(1)} aria-label="Next month">
                  <ChevronRight className="size-4" />
                </Button>
              </div>

              <div role="grid" aria-label={monthLabel} onKeyDown={onGridKeyDown}>
                <div role="row" className="grid grid-cols-7">
                  {WEEKDAYS.map((d) => (
                    <span
                      key={d}
                      role="columnheader"
                      className="flex h-8 items-center justify-center text-xs font-medium tracking-widest text-text-muted"
                    >
                      {d}
                    </span>
                  ))}
                </div>
                {weeks.map((week) => (
                  <div role="row" key={week[0].key} className="grid grid-cols-7">
                    {week.map((cell) => {
                      const isSelected = sameDay(draft, cell.date);
                      const isToday = sameDay(now, cell.date);
                      const fenced = fenceDisabled(cell.date);
                      return (
                        <button
                          key={cell.key}
                          ref={(el) => {
                            if (el) dayRefs.current.set(cell.key, el);
                            else dayRefs.current.delete(cell.key);
                          }}
                          type="button"
                          role="gridcell"
                          aria-selected={isSelected}
                          aria-disabled={fenced || undefined}
                          tabIndex={isSelected ? 0 : -1}
                          disabled={fenced}
                          onClick={() => setDraft(cell.date)}
                          className={cn(
                            // §11.14 day cells: 32px ghost buttons, radius/md
                            "flex size-8 items-center justify-center rounded-md text-xs outline-hidden transition-colors duration-fast ease-out-cubic",
                            isSelected
                              ? // selected: brand fill + white
                                "bg-brand-primary text-text-inverse"
                              : "text-text-primary hover:bg-bg-overlay",
                            // today: 1px border/active outline, not filled
                            isToday && !isSelected && "border border-border-active",
                            // outside month / disabled: text/disabled
                            (!cell.inMonth || fenced) && "text-text-disabled",
                            fenced && "pointer-events-none",
                          )}
                        >
                          {cell.date.getUTCDate()}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              {todayCell ? null : null}

              {withTime ? (
                // §11.14 time: two Selects (hour/minute), field gap space/4
                <div className="mt-3 flex items-center gap-4">
                  <Select
                    value={draftWall ? draftWall.hour : undefined}
                    onValueChange={(h) => setDraftTime(h)}
                  >
                    <SelectTrigger className="h-8 w-full" aria-label="Hour">
                      <SelectValue placeholder="hh" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, h) => (
                        <SelectItem key={h} value={String(h).padStart(2, "0")}>
                          {String(h).padStart(2, "0")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={draftWall ? draftWall.minute : undefined}
                    onValueChange={(m) => setDraftTime(undefined, m)}
                  >
                    <SelectTrigger className="h-8 w-full" aria-label="Minute">
                      <SelectValue placeholder="mm" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 60 }, (_, m) => m).map((m) => (
                        <SelectItem key={m} value={String(m).padStart(2, "0")}>
                          {String(m).padStart(2, "0")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {/* §11.14 actions: Clear (ghost) left · Apply (primary) right */}
              <div className="mt-3 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDraft(null);
                    onChange?.(null);
                    setOpen(false);
                  }}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (draft) {
                      const wall = wallParts(draft, timeZone);
                      onChange?.(wall.iso);
                    }
                    setOpen(false);
                  }}
                >
                  Apply
                </Button>
              </div>
            </>
          )}
        </div>
      ) : null}

      {/* §11.14 error/helper: body/xs below the input */}
      {error ? (
        <p className="mt-1 text-xs text-feedback-error" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-text-muted">{helperText}</p>
      ) : null}
    </div>
  );
}
