"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ArrowUp, Bookmark, ChevronsUp, MessageCircle, MoreHorizontal, TrendingUp } from "lucide-react";

import { Component as AvatarWithName } from "@/components/ui/avatar-with-name";
import { formatCompactNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

import { FeedAvatar, PersonaLabel } from "./feed-avatar";
import type { FeedCardData, FeedCommentPreview, FeedPerson } from "./feed-display-types";
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

function AuthorLine({ person, timeLabel, typeLabel }: { person: FeedPerson; timeLabel: string; typeLabel: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <FeedAvatar person={person} size="md" />
      <div className="min-w-0">
        <p className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-heading-xs font-semibold text-text-primary">{person.name}</span>
          {person.isPersona ? <PersonaLabel /> : null}
        </p>
        <p className="truncate font-mono text-label-sm font-light text-text-muted">
          {person.handle ? `@${person.handle} · ` : null}
          {timeLabel}
          {/* Type label is a hover reveal at lg+; below lg it lives here (no hover-only affordances, S00 §6). */}
          <span className="lg:hidden"> · {typeLabel}</span>
        </p>
      </div>
    </div>
  );
}

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

function MenuItem({ onSelect, danger, children }: { onSelect: () => void; danger?: boolean; children: ReactNode }) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className={"text-body-sm " + cn(
        "cursor-pointer rounded-md px-2 py-2 outline-none transition-colors duration-fast data-highlighted:bg-bg-overlay",
        danger ? "text-feedback-error" : "text-text-primary",
      )}
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
          className="focus-ring inline-flex size-11 items-center justify-center rounded-full text-text-secondary transition-colors duration-fast hover:bg-bg-overlay hover:text-text-primary lg:size-8"
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

function InteractionRow({ card, onToggleValued, onToggleSaved }: FeedCardProps) {
  const UpIcon = card.isValued ? ChevronsUp : ArrowUp;
  const meta = postTypeMeta(card.type);
  const pill =
    "focus-ring inline-flex min-h-11 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-1.5 transition-[transform,color,background-color] duration-fast ease-out-cubic active:scale-97 sm:px-2 lg:min-h-0 lg:py-1 lg:hover:-translate-y-0.5";

  return (
    <div className="relative z-10 flex items-center justify-between gap-2 rounded-menu border border-border-subtle bg-bg-overlay/20 px-2 py-1 sm:px-3 lg:py-2">
      <div className="flex min-w-0 flex-1 items-center gap-1.5 text-caption text-text-secondary sm:gap-3">
        <button
          type="button"
          onClick={onToggleValued}
          disabled={!onToggleValued}
          aria-pressed={card.isValued}
          aria-label={card.isValued ? "Remove valuable" : "Mark valuable"}
          className={cn(pill, card.isValued && "text-brand-primary")}
        >
          <UpIcon className={cn("size-3.5 shrink-0", card.isValued && "scale-110")} />
          {formatCompactNumber(card.valuableCount)}
        </button>

        <span className={cn(pill, "lg:hover:translate-y-0")} aria-label={`${card.replyCount} replies`}>
          <MessageCircle className="size-3.5 shrink-0" />
          {formatCompactNumber(card.replyCount)}
        </span>

        <button
          type="button"
          onClick={onToggleSaved}
          disabled={!onToggleSaved}
          aria-pressed={card.isSaved}
          aria-label={card.isSaved ? "Remove favorite" : "Add favorite"}
          className={cn(pill, "group lg:hover:bg-bg-overlay/55", card.isSaved && "text-brand-primary")}
        >
          <Bookmark
            className={cn(
              "size-3.5 shrink-0 transition-transform duration-normal lg:group-hover:scale-110",
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
          icon={<meta.Icon className={cn("size-5", meta.text)} />}
          className="relative z-10"
          motionClassName="[&>span]:size-8 sm:[&>span]:size-9"
          avatarClassName="size-8 border border-border-default bg-bg-surface sm:size-9"
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

function Title({ card }: { card: FeedCardData }) {
  const heading = (
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
  return card.href ? (
    <Link href={card.href} className="focus-ring block rounded-sm">
      {heading}
    </Link>
  ) : (
    heading
  );
}

/**
 * FeedCard — the one feed card (S02). Prototype `post-card.tsx` +
 * `post-interaction-row.tsx` rebuilt on S00 tokens. Two layouts: cover
 * image (text left, 208px image right at md+) and text-only.
 */
export function FeedCard(props: FeedCardProps) {
  const { card, className } = props;
  const [isHovered, setIsHovered] = useState(false);

  const body = (
    <>
      <Title card={card} />
      <p className="mt-2 line-clamp-3 break-words text-body-sm text-text-secondary">{card.summary}</p>
      {card.commentPreviews.length > 0 ? (
        <div className="mt-4">
          <CommentPreviewCycler comments={card.commentPreviews} isActive={isHovered} />
        </div>
      ) : null}
    </>
  );

  return (
    <article
      className={cn(
        "card-surface group relative overflow-hidden p-4 transition-[transform,border-color,box-shadow] duration-normal ease-out-cubic",
        "lg:hover:-translate-y-0.5 lg:hover:border-border-active/60 lg:hover:shadow-md",
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

      <div className="mb-3 pr-10">
        <AuthorLine person={card.author} timeLabel={card.timeLabel} typeLabel={card.typeLabel} />
      </div>

      {card.coverImageUrl ? (
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_208px] md:items-end">
          <div className="min-w-0">{body}</div>
          <div className="relative h-33 w-full overflow-hidden rounded-menu md:h-35">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.coverImageUrl}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-transform duration-slow ease-out lg:group-hover:scale-102"
            />
          </div>
        </div>
      ) : (
        <div className="pr-10">{body}</div>
      )}

      <div className="mt-4">
        <InteractionRow {...props} />
      </div>
    </article>
  );
}
