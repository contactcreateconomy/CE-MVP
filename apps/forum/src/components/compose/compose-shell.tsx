"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { CreateconomyLogoMark } from "@/components/ui/createconomy-logo-mark";
import { Button } from "@/components/ui/button";
import { signalNavigationStart } from "@/providers/navigation-progress-provider";

const COMPOSE_PUBLISH_BTN_ID = "compose-publish-btn";

export function triggerComposePublish() {
  if (typeof document === "undefined") return;
  document.getElementById(COMPOSE_PUBLISH_BTN_ID)?.click();
}

export function ComposeShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="relative min-h-screen bg-(--bg-canvas) text-(--text-primary)">
      <div className="canvas-dot-grid pointer-events-none absolute inset-0" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b border-(--border-subtle) bg-(--bg-canvas)/92 backdrop-blur-sm">
          <div className="mx-auto flex h-14 w-full max-w-[900px] items-center justify-between gap-3 px-4 md:px-6">
            <Link
              href="/feed"
              className="group flex shrink-0 items-center gap-2 rounded-md outline-offset-2 focus-visible:ring-2 focus-visible:ring-(--border-active)"
              aria-label="Back to feed"
            >
              <CreateconomyLogoMark
                size={28}
                markColor="var(--text-primary)"
                className="transition-[filter] duration-normal group-hover:drop-shadow-[var(--glow-primary-sm)]"
              />
            </Link>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 rounded-full px-3 text-(--text-secondary) hover:text-(--text-primary)"
                onClick={() => { signalNavigationStart(); router.push("/feed"); }}
                aria-label="Close editor"
              >
                <X className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="h-9 rounded-full px-5 font-semibold"
                onClick={() => triggerComposePublish()}
              >
                Publish
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[720px] flex-1 px-4 pb-28 pt-2 md:px-6 md:pt-4">{children}</main>
      </div>
    </div>
  );
}

export { COMPOSE_PUBLISH_BTN_ID };
