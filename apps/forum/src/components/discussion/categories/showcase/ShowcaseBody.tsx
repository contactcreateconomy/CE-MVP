"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Crosshair, Maximize2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DiscussionThread } from "@/types/discussion";

import { FormattedBody } from "../../formatted-body";
import { useThreadDiscussion } from "../../thread-discussion-context";

export function ShowcaseBody({ thread, isMax }: { thread: Extract<DiscussionThread, { category: "showcase" }>; isMax: boolean }) {
  const b = thread.categoryBody;
  const media = b.media ?? [];
  const feedbackChips = b.feedbackChips ?? [];
  const versions = b.versions ?? [];
  const [idx, setIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const primary = media[idx] ?? media[0];
  const { showcaseMediaPinMode, setShowcaseMediaPinMode, prependMainComposer, focusMainComposer, mediaHighlightCoords, setMediaHighlightCoords } =
    useThreadDiscussion();

  const onHeroImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isMax || !showcaseMediaPinMode || primary?.type !== "image") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    prependMainComposer(`📍 Media feedback at ${x}%, ${y}% (slide ${idx + 1})`);
    setShowcaseMediaPinMode(false);
    focusMainComposer();
  };

  return (
    <div className="space-y-4">
      <div
        id="showcase-media"
        className={cn(
          "relative overflow-hidden rounded-menu border border-(--border-default) bg-black/20 transition-[box-shadow] duration-500",
          mediaHighlightCoords ? "ring-4 ring-(--brand-primary) ring-offset-2 ring-offset-(--bg-canvas)" : "",
          isMax && showcaseMediaPinMode && "cursor-crosshair",
        )}
      >
        {primary?.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primary.src}
            alt={primary.caption}
            className="aspect-video w-full object-cover"
            onClick={onHeroImageClick}
          />
        ) : null}
        <div className="absolute left-2 top-2 flex flex-wrap gap-2">
          {isMax ? (
            <Button
              type="button"
              size="sm"
              variant={showcaseMediaPinMode ? "primary" : "secondary"}
              className="border-0 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setShowcaseMediaPinMode(!showcaseMediaPinMode)}
            >
              <Crosshair className="mr-1 h-3.5 w-3.5" />
              {showcaseMediaPinMode ? "Click image to pin" : "Comment on this"}
            </Button>
          ) : null}
        </div>
        <button
          type="button"
          className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white"
          aria-label="Fullscreen"
          onClick={() => setFullscreen(true)}
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] snap-x snap-mandatory md:snap-none">
        {media.map((m, i) => (
          <button
            key={m.src}
            type="button"
            onClick={() => {
              setIdx(i);
              setShowcaseMediaPinMode(false);
              setMediaHighlightCoords(null);
            }}
            className={cn(
              "h-16 w-28 shrink-0 snap-center overflow-hidden rounded-lg border-2 transition-colors",
              i === idx ? "border-(--brand-primary)" : "border-transparent opacity-80 hover:opacity-100",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.thumb ?? m.src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <p className="text-sm text-(--text-secondary)">{primary?.caption}</p>

      <div className="border-l-4 border-(--feedback-info) bg-(--bg-inset) py-3 pl-4 pr-3">
        <p className="text-xs font-semibold uppercase text-(--text-muted)">Creator&apos;s intent</p>
        <p className="mt-2 text-sm text-(--text-secondary)">{b.creatorIntent}</p>
      </div>

      <div>
        <p className="text-xs font-semibold text-(--text-muted)">Feedback requested on</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {feedbackChips.map((c) => (
            <span key={c} className="rounded-full border border-(--border-default) bg-(--bg-surface) px-3 py-1 text-xs text-(--text-secondary)">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-(--text-muted)">Versions</p>
        <div className="flex flex-wrap gap-2">
          {versions.map((v) => (
            <span
              key={v.version}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                v.current ? "border-(--brand-primary) bg-(--brand-primary)/10 font-medium" : "border-(--border-default) text-(--text-secondary)",
              )}
            >
              {v.version} · {new Date(v.date).toLocaleDateString()}
            </span>
          ))}
        </div>
      </div>

      {isMax ? (
        <p className="text-xs text-(--text-muted)">Use Feedback by theme in the comment section to group replies (MAX).</p>
      ) : null}

      <Dialog.Root open={fullscreen} onOpenChange={setFullscreen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(96vw,1200px)] -translate-x-1/2 -translate-y-1/2 p-2">
            {primary ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={primary.src} alt={primary.caption} className="max-h-[85vh] w-full object-contain" />
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <FormattedBody body={thread.body} />
    </div>
  );
}
