"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ArrowUp,
  Bookmark,
  ChevronsUp,
  MessageCircle,
  MoreHorizontal,
  Star,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";

import { Component as AvatarWithName } from "@/components/ui/avatar-with-name";
import { formatCompactNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

import { FeedAvatar, PersonaLabel } from "./feed-avatar";
import type { FeedCardData, FeedCardExtras, FeedCommentPreview, FeedPerson } from "./feed-display-types";
import { postTypeMeta } from "./feed-post-type-meta";

/** Overflow actions — an item renders only when its handler is passed, so
 *  the wiring decides the product set (Why / Share / Hide / Mute / Report). */
export interface FeedCardActions {
  onToggleValued?: () => void;
  onToggleSaved?: () => void;
  onWhy?: () => void;
  onShare?: () => void;
  onHide?: () => void;
  onMute?: () => void;
  onReport?: () => void;
}

export interface FeedCardProps extends FeedCardActions {
  card: FeedCardData;
  className?: string;
}

const COMMENT_CYCLE_MS = 1700;

/* ── Author row (v2: a link to the profile, soft hover wash) ───────────── */

function AuthorRow({ person, timeLabel, typeLabel }: { person: FeedPerson; timeLabel: string; typeLabel: string }) {
  const inner = (
    <>
      <FeedAvatar person={person} size="md" />
      <span className="min-w-0">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-heading-xs font-semibold text-text-primary">{person.name}</span>
          {person.isPersona ? <PersonaLabel /> : null}
        </span>
        <span className="block truncate font-mono text-label-sm font-light text-text-muted">
          {person.handle ? `@${person.handle} · ` : null}
          {timeLabel}
          {/* Type label is the chip's hover reveal at lg+; below lg it lives here (no hover-only affordances, S00 §6). */}
          <span className="lg:hidden"> · {typeLabel}</span>
        </span>
      </span>
    </>
  );
  const rowClass = "flex min-w-0 max-w-full items-center gap-2.5 rounded-lg";
  return person.handle ? (
    <Link
      href={`/users/${encodeURIComponent(person.handle)}`}
      className={cn(rowClass, "focus-ring transition-colors duration-normal hover:bg-bg-overlay/60")}
    >
      {inner}
    </Link>
  ) : (
    <div className={rowClass}>{inner}</div>
  );
}

/* ── Type-specific strip (v2 CardExtras) ───────────────────────────────── */

const VERDICT_TONE = {
  positive: "bg-feedback-success/15 text-feedback-success",
  caution: "bg-feedback-warning/15 text-feedback-warning",
  negative: "bg-feedback-error/15 text-feedback-error",
} as const;

function CardExtras({ extras }: { extras: FeedCardExtras }) {
  if (extras.kind === "review") {
    const stars = Math.max(0, Math.min(5, Math.round(extras.stars ?? 0)));
    if (!extras.verdict && stars === 0) return null;
    return (
      <div className="mt-1.5 flex items-center gap-2 text-caption">
        {extras.verdict ? (
          <span className={cn("rounded-full px-2 py-0.5 font-medium", VERDICT_TONE[extras.verdict.tone])}>
            {extras.verdict.label}
          </span>
        ) : null}
        {stars > 0 ? (
          <span className="flex items-center gap-0.5" aria-label={`${stars} out of 5`}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                aria-hidden
                className={cn("size-3", i < stars ? "fill-feedback-warning text-feedback-warning" : "text-text-muted/30")}
              />
            ))}
          </span>
        ) : null}
      </div>
    );
  }
  if (extras.kind === "debate") {
    const hasVotes = typeof extras.agree === "number" || typeof extras.disagree === "number";
    if (!hasVotes && !extras.proposition) return null;
    return (
      <div className="mt-1.5 flex items-center gap-2 text-caption text-text-secondary">
        {hasVotes ? (
          <>
            <span className="inline-flex items-center gap-1" aria-label={`${extras.agree ?? 0} agree`}>
              <ThumbsUp className="size-3 text-feedback-success" aria-hidden />
              {extras.agree ?? 0}
            </span>
            <span className="inline-flex items-center gap-1" aria-label={`${extras.disagree ?? 0} disagree`}>
              <ThumbsDown className="size-3 text-feedback-error" aria-hidden />
              {extras.disagree ?? 0}
            </span>
          </>
        ) : (
          <span className="truncate italic text-text-muted">{extras.proposition}</span>
        )}
      </div>
    );
  }
  if (extras.parts.length === 0) return null;
  return (
    <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-caption text-text-secondary">
      {extras.parts.map((part, i) => (
        <span key={`${part}-${i}`} className="flex items-center gap-1.5">
          {i > 0 ? (
            <span className="text-border-default" aria-hidden>
              ·
            </span>
          ) : null}
          {part}
        </span>
      ))}
    </p>
  );
}

/* ── Comment preview cycler ───────────────────────────────────────────── */

function CommentPreviewCycler({ comments, isActive }: { comments: FeedCommentPreview[]; isActive: boolean }) {
  const [index, setIndex] = useState(0);
  const visible = comments.slice(0, 4);

  useEffect(() => {
    if (!isActive || visible.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % visible.length), COMMENT_CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [isActive, visible.length]);

  if (visible.length === 0) return null;
  const active = visible[index % visible.length];

  return (
    <div className="flex h-10 items-center rounded-lg border border-border-subtle bg-bg-overlay/25 px-3">
      <p key={active.id} className="flex w-full min-w-0 items-center gap-1.5 text-body-sm text-text-secondary">
        <span className="shrink-0 font-mono text-caption text-text-muted">
          {active.author.handle ? `@${active.author.handle}` : active.author.name}
        </span>
        {active.author.isPersona ? <PersonaLabel /> : null}
        <span className="truncate">{active.body}</span>
      </p>
    </div>
  );
}

/* ── Overflow menu ────────────────────────────────────────────────────── */

function MenuItem({ onSelect, danger, children }: { onSelect: () => void; danger?: boolean; children: ReactNode }) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className={
        "text-body-sm " +
        cn(
          "cursor-pointer rounded-md px-2 py-2 outline-none transition-colors duration-fast data-highlighted:bg-bg-overlay",
          danger ? "text-feedback-error" : "text-text-primary",
        )
      }
    >
      {children}
    </DropdownMenu.Item>
  );
}

function CardMenu({ id, onWhy, onShare, onHide, onMute, onReport }: FeedCardActions & { id: string }) {
  if (!onWhy && !onShare && !onHide && !onMute && !onReport) return null;
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          id={`feed-card-menu-${id}`}
          type="button"
          aria-label="Post actions"
          className="focus-ring inline-flex size-11 items-center justify-center rounded-full text-text-secondary transition-colors duration-normal hover:bg-bg-overlay hover:text-text-primary lg:size-8"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-dropdown min-w-44 rounded-lg border border-border-default bg-bg-surface p-1 shadow-lg"
        >
          {onWhy ? <MenuItem onSelect={onWhy}>Why am I seeing this?</MenuItem> : null}
          {onShare ? <MenuItem onSelect={onShare}>Share</MenuItem> : null}
          {onHide ? <MenuItem onSelect={onHide}>Hide</MenuItem> : null}
          {onMute ? <MenuItem onSelect={onMute}>Mute</MenuItem> : null}
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

/* ── Interaction row ──────────────────────────────────────────────────── */

function InteractionRow({ card, onToggleValued, onToggleSaved }: FeedCardProps) {
  const UpIcon = card.isValued ? ChevronsUp : ArrowUp;
  const { Icon: TypeIcon } = postTypeMeta(card.type);
  // v2: every pill lifts 2px on hover (lg only — no hover affordances on touch).
  const pill =
    "focus-ring inline-flex min-h-11 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-1.5 transition-[transform,color,background-color] duration-normal ease-out-cubic sm:px-2 lg:min-h-0 lg:py-1 lg:hover:-translate-y-0.5";

  return (
    <div className="flex items-center justify-between gap-2 rounded-menu border border-border-subtle bg-bg-overlay/20 px-2 py-1 sm:px-3 lg:py-2">
      <div className="flex min-w-0 flex-1 items-center gap-1.5 text-caption text-text-secondary sm:gap-3">
        <button
          type="button"
          onClick={onToggleValued}
          disabled={!onToggleValued}
          aria-pressed={card.isValued}
          aria-label={card.isValued ? "Remove valuable" : "Mark valuable"}
          className={cn(pill, card.isValued && "text-brand-primary")}
        >
          <UpIcon
            className={cn(
              "size-3.5 shrink-0 transition-transform duration-fast motion-reduce:transition-none",
              card.isValued && "scale-110",
            )}
          />
          {formatCompactNumber(card.valuableCount)}
        </button>

        <span className={pill} aria-label={`${card.replyCount} replies`}>
          <MessageCircle className="size-3.5 shrink-0" />
          {formatCompactNumber(card.replyCount)}
        </span>

        <button
          type="button"
          onClick={onToggleSaved}
          disabled={!onToggleSaved}
          aria-pressed={card.isSaved}
          aria-label={card.isSaved ? "Remove favorite" : "Add favorite"}
          className={cn(
            pill,
            "group/fav min-w-0 active:scale-95 active:duration-75 lg:hover:scale-104 lg:hover:bg-bg-overlay/55",
            card.isSaved && "text-brand-primary",
          )}
        >
          <Bookmark
            className={cn(
              "size-3.5 shrink-0 transition-transform duration-normal group-active/fav:scale-125 lg:group-hover/fav:scale-110 motion-reduce:transition-none",
              card.isSaved && "scale-110 fill-current",
            )}
          />
          Fav
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <AvatarWithName
          name={card.typeLabel}
          direction="top"
          size="sm"
          icon={<TypeIcon className="size-5 text-text-primary transition-colors duration-normal" />}
          className="relative z-30"
          motionClassName="[&>span]:size-8 sm:[&>span]:size-9"
          avatarClassName="size-8 bg-bg-surface sm:size-9"
          nameClassName="border-border-default bg-bg-surface text-text-primary"
          labelStyle={{ left: "50%", translate: "-50% 0" }}
        />
        {card.participants.length > 0 ? (
          <div className="flex -space-x-1.5">
            {card.participants.slice(0, 3).map((person, index) => (
              <FeedAvatar
                key={`${person.handle ?? person.name}-${index}`}
                person={person}
                size="sm"
                className={cn(
                  "ring-2 ring-bg-surface",
                  index === 1 && "max-[340px]:hidden",
                  index === 2 && "max-[401px]:hidden",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ── Card ─────────────────────────────────────────────────────────────── */

function Title({ card }: { card: FeedCardData }) {
  return (
    <h3 className="line-clamp-3 text-heading-md font-bold text-text-primary">
      {card.isRising ? (
        <span className="mr-1.5 inline-flex -translate-y-px items-center gap-1 align-middle text-label-sm font-semibold text-brand-primary">
          <TrendingUp className="size-3.5" aria-hidden />
          Rising
        </span>
      ) : null}
      {card.title}
    </h3>
  );
}

/**
 * FeedCard — the one feed card (S02). prototype-v2 `post-card.tsx` +
 * `post-interaction-row.tsx` + category `CardExtras` on S00 tokens. Two
 * layouts: cover image (text left, 208px image right at md+; below the
 * text at 390) and text-only. The whole text block is one link (v2).
 */
export function FeedCard(props: FeedCardProps) {
  const { card, className } = props;
  const [isHovered, setIsHovered] = useState(false);

  const textBlock = (
    <>
      <Title card={card} />
      <p className="mt-2 line-clamp-3 break-words text-body-sm text-text-secondary">{card.summary}</p>
      {card.extras ? <CardExtras extras={card.extras} /> : null}
      {card.commentPreviews.length > 0 ? (
        <div className="mt-4">
          <CommentPreviewCycler comments={card.commentPreviews} isActive={isHovered} />
        </div>
      ) : null}
    </>
  );
  const body = card.href ? (
    <Link href={card.href} className="focus-ring block min-w-0 rounded-lg">
      {textBlock}
    </Link>
  ) : (
    <div className="min-w-0">{textBlock}</div>
  );

  return (
    <article
      className={cn(
        "card-surface group relative p-4 transition-[transform,box-shadow] duration-normal ease-out",
        // v2 `.feed-post-card`: 2px lift on hover / keyboard focus-within (lg only).
        // Its brand-tinted hover glow is not ported (D-007 / S00 §7) — neutral shadow instead.
        "lg:hover:-translate-y-0.5 lg:hover:shadow-md lg:focus-within:-translate-y-0.5 lg:focus-within:shadow-md motion-reduce:transform-none",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <div className="absolute right-1 top-1 z-20 lg:right-3 lg:top-3">
        <CardMenu id={card.id} {...props} />
      </div>

      <div className="mb-3 flex items-start pr-10">
        <AuthorRow person={card.author} timeLabel={card.timeLabel} typeLabel={card.typeLabel} />
      </div>

      {card.coverImageUrl ? (
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_208px] md:items-end">
          {body}
          {(() => {
            const image = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.coverImageUrl}
                alt=""
                loading="lazy"
                className="size-full object-cover transition-transform duration-slow ease-out lg:group-hover:scale-102 motion-reduce:transition-none"
              />
            );
            const frame = "relative block h-33 w-full overflow-hidden rounded-menu md:h-35";
            return card.href ? (
              <Link href={card.href} tabIndex={-1} aria-hidden className={frame}>
                {image}
              </Link>
            ) : (
              <div className={frame}>{image}</div>
            );
          })()}
        </div>
      ) : (
        <div className="pr-10">{body}</div>
      )}

      <div className="relative z-20 mt-4">
        <InteractionRow {...props} />
      </div>
    </article>
  );
}

/** v2 `PostCardSkeleton` — same geometry as the image card. */
export function FeedCardSkeleton() {
  const block = "animate-pulse rounded-sm bg-bg-overlay motion-reduce:animate-none";
  return (
    <div className="card-surface p-4" aria-hidden>
      <div className="mb-3 flex items-center gap-2.5 pr-10">
        <div className={cn(block, "size-9 rounded-full")} />
        <div className="space-y-1.5">
          <div className={cn(block, "h-3.5 w-24")} />
          <div className={cn(block, "h-2.5 w-16 bg-bg-overlay/50")} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_208px] md:items-end">
        <div>
          <div className={cn(block, "h-6 w-3/4")} />
          <div className="mt-3 space-y-2">
            <div className={cn(block, "h-3 w-full bg-bg-overlay/50")} />
            <div className={cn(block, "h-3 w-5/6 bg-bg-overlay/50")} />
          </div>
        </div>
        <div className={cn(block, "h-33 w-full rounded-menu bg-bg-overlay/40 md:h-35")} />
      </div>
      <div className="mt-4 flex items-center gap-4 border-t border-border-subtle pt-4">
        <div className={cn(block, "h-8 w-16 rounded-full bg-bg-overlay/50")} />
        <div className={cn(block, "h-8 w-16 rounded-full bg-bg-overlay/50")} />
        <div className={cn(block, "ml-auto size-4 rounded-full bg-bg-overlay/50")} />
      </div>
    </div>
  );
}
