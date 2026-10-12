"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bookmark, Check, Link2, MessageCircle, MoreHorizontal, Orbit, Pin, Share2 } from "lucide-react";

import { CreateconomyLogoMark } from "@/components/ui/createconomy-logo-mark";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { FeedAvatar } from "./feed-avatar";
import type { FeedCardData, FeedFacet, FeedPerson, FeedWhyCare } from "./feed-display-types";
import { stringsLabel } from "./feed-format";
import { FeedGSwitch } from "./feed-g-switch";

/** Handlers — a control or menu item renders only when its handler is passed,
 *  so the wiring decides the product set. */
export interface FeedCardActions {
  /** Tap G (L-63). */
  onAppreciate?: () => void;
  onToggleSaved?: () => void;
  onShare?: () => void;
  /** Strings → open the thread with the composer. */
  onOpenStrings?: () => void;
  onVote?: (choice: "agree" | "disagree") => void;
  onWhy?: () => void;
  /** Private "Not for me" (L-64) — never public, feeds hidden mass only. */
  onNotForMe?: () => void;
  onHide?: () => void;
  onMute?: () => void;
  onReport?: () => void;
  /** L-79: a hidden card collapses in place to "Hidden · Undo". */
  onUndoHide?: () => void;
}

export interface FeedCardProps extends FeedCardActions {
  card: FeedCardData;
  /** Hidden by the viewer this session → the inline "Hidden · Undo" row (L-79). */
  hidden?: boolean;
  className?: string;
}

const Mono = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cn("font-mono tabular-nums", className)}>{children}</span>
);

/* ── 1 · identity ─────────────────────────────────────────────────────── */

function Face({ person }: { person: FeedPerson }) {
  if (person.isEditorial) {
    return (
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-text-primary">
        <CreateconomyLogoMark size={16} markColor="var(--bg-canvas)" />
      </span>
    );
  }
  return <FeedAvatar person={person} size="md" />;
}

const Label = ({ children }: { children: string }) => (
  <span className="shrink-0 rounded-full border border-border-default px-1.5 text-micro font-medium text-text-secondary">
    {children}
  </span>
);

function Identity({ card, menu }: { card: FeedCardData; menu: ReactNode }) {
  const { author } = card;
  const name = <span className="truncate text-body-sm font-semibold text-text-primary">{author.name}</span>;
  return (
    <header className="flex items-center gap-2.5">
      <Face person={author} />
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {author.handle ? (
          <Link href={`/users/${encodeURIComponent(author.handle)}`} className="focus-ring min-w-0 truncate rounded-sm hover:underline">
            {name}
          </Link>
        ) : (
          name
        )}
        {author.levelLabel && !author.isEditorial ? (
          <span title={`Level ${author.levelLabel}`} className="shrink-0 text-brand-primary">
            <Orbit className="size-3.5" strokeWidth={1.75} aria-hidden />
            <span className="sr-only">Level {author.levelLabel}</span>
          </span>
        ) : null}
        {author.isPersona ? <Label>AI persona</Label> : null}
        {author.isEditorial ? <Label>Createconomy</Label> : null}
        <span className="shrink-0 text-caption text-text-muted">
          · <Mono>{card.timeLabel}</Mono>
          {card.updated ? <span> · Updated</span> : null}
        </span>
      </div>
      {menu}
    </header>
  );
}

/* ── 4 · facets (§10.2) ───────────────────────────────────────────────── */

function Stars({ v, className }: { v: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="text-feedback-warning" aria-hidden>
        ★
      </span>
      <Mono>{Number.isInteger(v) ? v : v.toFixed(1)}</Mono>
    </span>
  );
}

function ToolChip({ name, extra }: { name: string; extra?: ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border-subtle bg-bg-surface pl-1 pr-2.5 text-caption text-text-primary">
      <span aria-hidden className="inline-flex size-5 items-center justify-center rounded-full bg-bg-overlay text-micro font-semibold text-text-secondary">
        {name.slice(0, 1)}
      </span>
      <span className="font-medium">{name}</span>
      {extra}
    </span>
  );
}

function DebateFacet({ facet, onVote }: { facet: Extract<FeedFacet, { kind: "debate" }>; onVote?: FeedCardActions["onVote"] }) {
  const voted = facet.viewerVote ?? null;
  const choices = [
    { key: "agree", label: "Agree" },
    { key: "disagree", label: "Disagree" },
  ] as const;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-caption text-text-muted">
        <Mono className="text-text-secondary">{facet.votes}</Mono>
        {voted === null && onVote ? " voted · take a side" : " voted"}
      </p>
      {voted === null ? (
        onVote ? (
          // L-37: binary choices weigh equally; colour only after the choice.
          <div className="flex gap-2" role="group" aria-label="Your vote">
            {choices.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => onVote(c.key)}
                className="focus-ring h-9 min-w-26 rounded-full border border-border-default bg-bg-surface px-5 text-body-sm font-semibold text-text-primary transition-[border-color,scale] duration-normal hover:border-border-prominent active:scale-97 active:duration-press"
              >
                {c.label}
              </button>
            ))}
          </div>
        ) : null
      ) : typeof facet.agreePct === "number" ? (
        // L-29: the split appears only after the viewer voted.
        <div className="flex max-w-90 flex-col gap-1.5" aria-live="polite">
          <div className="flex h-2 gap-1 overflow-hidden rounded-full">
            {[facet.agreePct, 100 - facet.agreePct].map((pct, i) => (
              <div
                key={i}
                style={{ width: `${pct}%` }}
                className={cn("h-full rounded-full", (i === 0) === (voted === "agree") ? "bg-brand-primary" : "bg-text-disabled")}
              />
            ))}
          </div>
          <div className="flex justify-between text-caption">
            {choices.map((c, i) => {
              const mine = voted === c.key;
              const pct = i === 0 ? facet.agreePct! : 100 - facet.agreePct!;
              return (
                <span key={c.key} className={cn("flex items-center gap-1", mine ? "font-semibold text-text-primary" : "text-text-muted")}>
                  {mine ? <Check className="size-3.5 text-brand-primary" strokeWidth={2} aria-hidden /> : null}
                  {c.label} <Mono>{pct}%</Mono>
                </span>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-caption text-text-secondary">You voted {voted === "agree" ? "Agree" : "Disagree"}</p>
      )}
    </div>
  );
}

function FacetView({ facet, onVote }: { facet: FeedFacet; onVote?: FeedCardActions["onVote"] }) {
  switch (facet.kind) {
    case "review":
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-caption">
            <ToolChip name={facet.tool.name} extra={facet.tool.price ? <Mono className="text-text-muted">{facet.tool.price}</Mono> : null} />
            {typeof facet.verdict === "number" ? (
              <span className="text-text-muted">
                Verdict <Stars v={facet.verdict} className="font-semibold text-text-primary" />
              </span>
            ) : null}
            {typeof facet.community === "number" ? (
              <span className="text-text-muted">
                Community <Stars v={facet.community} className="text-text-secondary" />
              </span>
            ) : null}
          </div>
          {facet.pro || facet.con ? (
            <ul className="grid gap-0.5 text-caption text-text-secondary">
              {facet.pro ? (
                <li className="flex gap-1.5">
                  <span className="w-3 font-mono text-feedback-success" aria-label="Pro">+</span>
                  {facet.pro}
                </li>
              ) : null}
              {facet.con ? (
                <li className="flex gap-1.5">
                  <span className="w-3 font-mono text-feedback-error" aria-label="Con">−</span>
                  {facet.con}
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
      );
    case "compare":
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            {facet.tools.map((t) => (
              <ToolChip key={t.name} name={t.name} extra={typeof t.community === "number" ? <Stars v={t.community} className="text-text-secondary" /> : null} />
            ))}
          </div>
          {facet.row ? (
            <p className="flex flex-wrap items-center gap-2 text-caption text-text-muted">
              {facet.row.label}:
              {facet.row.values.map((v, i) => (
                <span key={i} className="text-text-secondary">
                  {i > 0 ? <span className="mr-2 text-text-disabled">/</span> : null}
                  {v}
                </span>
              ))}
            </p>
          ) : null}
        </div>
      );
    case "debate":
      return <DebateFacet facet={facet} onVote={onVote} />;
    case "help":
      return (
        <div className="flex items-center gap-2.5 text-caption">
          {facet.problem ? <p className="min-w-0 flex-1 truncate text-text-secondary">{facet.problem}</p> : <span className="flex-1" />}
          {facet.resolvedBy ? (
            <span className="shrink-0 rounded-full bg-feedback-success/15 px-2 py-0.5 font-medium text-feedback-success">
              Resolved ✓ by @{facet.resolvedBy}
            </span>
          ) : (
            <span className="shrink-0 rounded-full border border-border-default px-2 py-0.5 font-medium text-text-secondary">Open</span>
          )}
        </div>
      );
    case "list":
      return (
        <ol className="flex flex-col gap-1 text-caption">
          {facet.items.slice(0, 3).map((item, i) => (
            <li key={item.label} className="flex items-center gap-2">
              <Mono className="w-3 text-text-muted">{i + 1}</Mono>
              <span className="flex-1 text-text-secondary">{item.label}</span>
              <Mono className="text-text-muted">▲ {item.votes}</Mono>
            </li>
          ))}
          {facet.more ? (
            <li className="pl-5 text-text-muted">
              +<Mono>{facet.more}</Mono> more
            </li>
          ) : null}
        </ol>
      );
    case "showcase":
      return (
        <div className="flex items-center gap-2.5 text-caption">
          {facet.thing ? <p className="min-w-0 flex-1 truncate text-text-secondary">{facet.thing}</p> : <span className="flex-1" />}
          {facet.linkApproved ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-text-secondary">
              <Link2 className="size-3.5" strokeWidth={1.5} aria-hidden />
              Project link
              <Check className="size-3 text-feedback-success" strokeWidth={2} aria-label="approved" />
            </span>
          ) : null}
        </div>
      );
    case "news":
      return (
        <p className="flex items-center gap-2 text-caption">
          {facet.claim ? <span className="min-w-0 flex-1 truncate text-text-secondary">{facet.claim}</span> : <span className="flex-1" />}
          {facet.domain ? <span className="shrink-0 font-mono text-text-muted">{facet.domain}</span> : null}
        </p>
      );
    case "meta":
      return facet.parts.length ? (
        <p className="flex flex-wrap items-center gap-1.5 text-caption text-text-secondary">
          {facet.parts.map((part, i) => (
            <span key={`${part}-${i}`} className="flex items-center gap-1.5">
              {i > 0 ? <span className="text-text-disabled" aria-hidden>·</span> : null}
              {part}
            </span>
          ))}
        </p>
      ) : null;
  }
}

/* ── 5 · why care now (one fixed-height line, §10.3) ──────────────────── */

function WhyCare({ why }: { why: FeedWhyCare }) {
  const [open, setOpen] = useState(false);
  if (why.kind === "comment") {
    // Established: best human comment — tap expands to 3 lines in place.
    return (
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="focus-ring block w-full rounded-sm text-left">
        <p className={cn("text-caption text-text-secondary", open ? "line-clamp-3" : "line-clamp-1")}>
          <span className="font-medium text-text-primary">@{why.author}:</span> {why.body}
        </p>
      </button>
    );
  }
  return (
    <p className="h-5 truncate text-caption leading-5 text-text-secondary">
      {why.rising ? <span className="text-brand-primary">↗ Rising · </span> : null}
      {why.text}
      {why.detail ? (
        // Hover adds depth, never layout (Bible §10.3): same line, fades in.
        <span className="text-text-muted opacity-0 transition-opacity duration-normal group-hover/card:opacity-100 group-focus-within/card:opacity-100">
          {" "}· {why.detail}
        </span>
      ) : null}
    </p>
  );
}

/* ── ⋯ menu ───────────────────────────────────────────────────────────── */

function MenuItem({ onSelect, danger, children }: { onSelect: () => void; danger?: boolean; children: ReactNode }) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className={cn(
        "flex h-9 cursor-pointer items-center rounded-md px-2.5 text-body-sm outline-none transition-colors duration-fast data-highlighted:bg-bg-overlay",
        danger ? "text-feedback-error" : "text-text-secondary data-highlighted:text-text-primary",
      )}
    >
      {children}
    </DropdownMenu.Item>
  );
}

function CardMenu({ card, onWhy, onNotForMe, onHide, onMute, onReport }: FeedCardActions & { card: FeedCardData }) {
  if (!onWhy && !onNotForMe && !onHide && !onMute && !onReport) return null;
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="More options"
          className="focus-ring inline-flex size-11 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors duration-normal hover:bg-bg-overlay hover:text-text-primary lg:size-8"
        >
          <MoreHorizontal className="size-4" strokeWidth={1.5} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={6} className="frost-strong z-dropdown w-56 rounded-lg border border-border-subtle p-1">
          {onWhy ? <MenuItem onSelect={onWhy}>Why am I seeing this?</MenuItem> : null}
          {onNotForMe ? <MenuItem onSelect={onNotForMe}>Not for me</MenuItem> : null}
          {onHide ? <MenuItem onSelect={onHide}>Hide</MenuItem> : null}
          {onMute ? <MenuItem onSelect={onMute}>{card.author.handle ? `Mute @${card.author.handle}` : "Mute"}</MenuItem> : null}
          {onReport ? (
            <MenuItem onSelect={onReport} danger>
              Report
            </MenuItem>
          ) : null}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/* ── 6 · footer ───────────────────────────────────────────────────────── */

const iconBtn =
  "focus-ring inline-flex h-8 items-center gap-1.5 rounded-full px-2 text-caption text-text-muted transition-[background-color,color,scale] duration-normal hover:bg-bg-overlay hover:text-text-primary active:scale-97 active:duration-press disabled:pointer-events-none";

function Footer(props: FeedCardProps) {
  const { card, onAppreciate, onToggleSaved, onShare, onOpenStrings } = props;
  const saved = !!card.viewer.saved;
  return (
    <footer className="-mx-1 mt-1.5 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center">
        <FeedGSwitch gravity={card.gravity} viewer={card.viewer} onAppreciate={onAppreciate} />
        <button type="button" onClick={onOpenStrings} disabled={!onOpenStrings} className={cn(iconBtn, "min-w-0")}>
          <MessageCircle className="size-3.75 shrink-0" strokeWidth={1.5} aria-hidden />
          <span className="truncate">{stringsLabel(card.strings)}</span>
        </button>
        {onToggleSaved ? (
          <button
            type="button"
            onClick={onToggleSaved}
            aria-pressed={saved}
            aria-label={saved ? "Saved" : "Save"}
            className={cn(iconBtn, "size-8 justify-center px-0", saved && "text-brand-primary")}
          >
            <Bookmark className={cn("size-3.75", saved && "fill-current")} strokeWidth={1.5} aria-hidden />
          </button>
        ) : null}
        {onShare ? (
          <button type="button" onClick={onShare} aria-label="Share" className={cn(iconBtn, "size-8 justify-center px-0")}>
            <Share2 className="size-3.75" strokeWidth={1.5} aria-hidden />
          </button>
        ) : null}
      </div>
      {card.participants.length > 0 ? (
        // L-82: faces only — no "N discussing" count (Gravity and Strings are the public numbers, L-64).
        <span data-faces className="flex shrink-0 -space-x-1.5">
          {card.participants.slice(0, 3).map((p, i) => (
            <FeedAvatar key={`${p.handle ?? p.name}-${i}`} person={p} size="xs" className="ring-2 ring-bg-surface" />
          ))}
        </span>
      ) : null}
    </footer>
  );
}

/* ── card ─────────────────────────────────────────────────────────────── */

/**
 * FeedCard — the one feed card (FEED-DESIGN §10, founder-approved Make look).
 * Skeleton for every type: identity · kind chip · title · facet · why-care-now
 * · footer (G-switch + Gravity, strings, save, share · faces, L-82).
 * Material: frost-look (L1 — translucent + 1px highlight + shadow-xs, no live
 * blur, L-39/L-73). No glow at rest (L-38); hover adds depth only.
 */
export function FeedCard(props: FeedCardProps) {
  const { card, className, onVote } = props;
  if (props.hidden) {
    return (
      <div role="status" className={cn("frost-look flex h-11 items-center justify-between rounded-lg border border-border-subtle px-4 text-body-sm text-text-muted", className)}>
        Hidden
        {props.onUndoHide ? (
          <button
            type="button"
            onClick={props.onUndoHide}
            className="focus-ring rounded-full px-2 py-1 font-medium text-text-primary transition-[color,scale] duration-normal hover:text-brand-primary active:scale-97 active:duration-press"
          >
            Undo
          </button>
        ) : null}
      </div>
    );
  }
  const spark = card.type === "spark";
  const title = (
    <h3 className={cn("font-semibold text-text-primary", spark ? "text-heading-sm" : "text-body-lg")}>{card.title}</h3>
  );

  return (
    <article
      className={cn(
        "group/card frost-look rounded-lg border border-border-subtle p-4 transition-[translate,box-shadow] duration-normal ease-out-cubic lg:hover:-translate-y-px lg:hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      {card.pinned ? (
        <p className="mb-2 flex items-center gap-1.5 text-micro font-medium text-text-muted">
          <Pin className="size-3" strokeWidth={1.5} aria-hidden />
          Pinned by Createconomy
        </p>
      ) : null}

      <Identity card={card} menu={<CardMenu {...props} />} />

      <div className="mt-3 flex gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <p className="flex items-center gap-1 text-caption">
            <span className="font-medium text-brand-primary">{card.typeLabel}</span>
            {card.topicLabel ? (
              <>
                <span className="text-text-disabled" aria-hidden>·</span>
                <span className="text-text-secondary">{card.topicLabel}</span>
              </>
            ) : null}
          </p>
          {card.href ? (
            <Link href={card.href} className="focus-ring rounded-sm hover:underline">
              {title}
            </Link>
          ) : (
            title
          )}
          {card.facet ? <FacetView facet={card.facet} onVote={onVote} /> : null}
        </div>
        {card.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.coverImageUrl}
            alt=""
            loading="lazy"
            className="size-21 shrink-0 rounded-md bg-bg-overlay object-cover md:h-25 md:w-37"
          />
        ) : null}
      </div>

      {card.whyCare ? (
        <div className="mt-3 border-t border-border-subtle pt-2.5">
          <WhyCare why={card.whyCare} />
        </div>
      ) : null}

      <Footer {...props} />
    </article>
  );
}

/** Same geometry as the card (Make `FeedCardSkeleton`). */
export function FeedCardSkeleton() {
  return (
    <div className="frost-look rounded-lg border border-border-subtle p-4" aria-hidden>
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-9 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
      <div className="mt-4 flex gap-4">
        <div className="flex flex-1 flex-col gap-2.5">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/5" />
        </div>
        <Skeleton className="size-21 shrink-0 rounded-md md:h-25 md:w-37" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-4">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-6" />
        </div>
        <div className="flex -space-x-1.5">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="size-6 rounded-full" />
        </div>
      </div>
    </div>
  );
}
