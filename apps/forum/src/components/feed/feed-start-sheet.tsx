"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

import { motionFor } from "@/lib/motion";
import type { StartSheetOrigin } from "@/stores/start-sheet-store";

import { postTypeMeta } from "./feed-post-type-meta";

export interface StartSheetType {
  /** postTypeConfig.type (data) — routed to the composer as ?type=. */
  key: string;
  /** postTypeConfig.label (data, COPY-1). */
  label: string;
  /** One line from data; empty → the row shows the label only. */
  description: string;
}

export interface StartDiscussionSheetProps {
  open: boolean;
  /** The trigger the sheet grows from and shrinks back into. */
  origin: StartSheetOrigin | null;
  member: boolean;
  types: StartSheetType[];
  onChoose: (key: string) => void;
  onSignIn: () => void;
  onClose: () => void;
  /** prefers-reduced-motion → crossfade, no shared-element grow (Bible §9.2 r11). */
  reduced?: boolean;
}

/** Shared-element id: the rail pill / Create tab carry the same id (§9.3). */
export const startSheetLayoutId = (origin: StartSheetOrigin) => `start-sheet-${origin}`;

/**
 * Start Discussion sheet (FEED-DESIGN §9.3, L-34; Bible §3.1 L3, §9.4 "grow
 * from the trigger"). Display only — the shell's StartDiscussionHost feeds
 * it. The trigger grows into a frosted sheet (shared element, glide spring)
 * and the sheet returns along the same path. Phones: bottom sheet; lg+: a
 * centred panel. Members pick one of the post types (labels + one line from
 * data); visitors see sign-in instead. Blocking → scrim.
 */
export function StartDiscussionSheet({ open, origin, member, types, onChoose, onSignIn, onClose, reduced = false }: StartDiscussionSheetProps) {
  const m = motionFor(reduced);
  const grow = !reduced && origin != null;

  return (
    <Dialog.Root open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-dropdown bg-(--scrim)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={m.springs.glide}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                layoutId={grow ? startSheetLayoutId(origin) : undefined}
                data-motion={grow ? "grow" : "fade"}
                data-origin={origin ?? undefined}
                initial={grow ? undefined : { opacity: 0 }}
                animate={grow ? undefined : { opacity: 1 }}
                exit={grow ? undefined : { opacity: 0 }}
                transition={m.springs.glide}
                style={{ borderRadius: "var(--sheet-radius)" }}
                className="frost-strong shadow-lg fixed inset-x-0 bottom-0 z-dropdown max-h-(--sheet-max-h) overflow-y-auto border border-border-subtle px-4 pb-[calc(var(--safe-bottom)+1rem)] pt-3 outline-hidden lg:inset-x-0 lg:bottom-auto lg:top-24 lg:mx-auto lg:w-(--container-modal) lg:px-5 lg:pb-5"
              >
                <div className="mx-auto mb-3 h-(--sheet-handle-h) w-(--sheet-handle-w) rounded-full bg-border-default lg:hidden" aria-hidden />
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Dialog.Title className="text-heading-sm font-semibold text-text-primary">What do you want to start?</Dialog.Title>
                  <Dialog.Close
                    aria-label="Close"
                    className="focus-ring inline-flex size-8 items-center justify-center rounded-full text-text-secondary transition-[background-color,scale] duration-normal hover:bg-bg-overlay active:scale-97 active:duration-press motion-reduce:active:scale-100"
                  >
                    <X className="size-4" aria-hidden />
                  </Dialog.Close>
                </div>

                {member ? (
                  <ul className="flex flex-col gap-1">
                    {types.map((t) => {
                      const { Icon, text } = postTypeMeta(t.key);
                      return (
                        <li key={t.key}>
                          <button
                            type="button"
                            data-type={t.key}
                            onClick={() => onChoose(t.key)}
                            className="focus-ring flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-[background-color,scale] duration-normal hover:bg-bg-overlay active:scale-97 active:duration-press motion-reduce:active:scale-100"
                          >
                            <Icon className={`mt-0.5 size-4 shrink-0 ${text}`} strokeWidth={1.75} aria-hidden />
                            <span className="min-w-0">
                              <span className="block text-body-sm font-semibold text-text-primary">{t.label}</span>
                              {t.description ? <span className="block text-caption text-text-secondary">{t.description}</span> : null}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="flex flex-col gap-3 py-2">
                    <p className="text-body-sm text-text-secondary">Sign in to start a discussion.</p>
                    <button
                      type="button"
                      onClick={onSignIn}
                      className="hover:glow-cta focus-ring inline-flex h-9 items-center justify-center rounded-full bg-brand-primary px-4 text-body-sm font-semibold text-text-inverse transition-[background-color,box-shadow,scale] duration-normal hover:bg-brand-primary-hover active:scale-97 active:duration-press motion-reduce:active:scale-100"
                    >
                      Sign in
                    </button>
                  </div>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
