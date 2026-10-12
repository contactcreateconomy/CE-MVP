"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Bell, Home, PlusCircle, Search, User } from "lucide-react";

import { startSheetLayoutId } from "@/components/feed/feed-start-sheet";
import { usePrefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useStartSheet } from "@/stores/start-sheet-store";

const tabs = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/discover", label: "Search", icon: Search },
  { href: null, label: "Create", icon: PlusCircle },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
] as const;

/** Press: scale 0.97 within 100ms (L-74); reduced motion keeps the dim only. */
const PRESS = "active:scale-97 active:duration-press motion-reduce:active:scale-100";
const TAB =
  "focus-ring flex w-full flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-label-sm transition-[color,scale] duration-normal";

/**
 * Phone tab bar (FEED-DESIGN §8, Bible §13): full-width frosted bar
 * (L2 → frost-subtle), safe-area padded. Active = brand colour + heavier
 * label. Create has no glow at rest (L-69) and grows into the Start sheet
 * (§9.3) — the sheet shrinks back into it on close. Inactive labels are
 * text-secondary: never text-muted on frost-subtle (Bible §4 rule 2).
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const show = useStartSheet((s) => s.show);
  const sheetOpen = useStartSheet((s) => s.open);
  const reduced = usePrefersReducedMotion();

  return (
    <nav aria-label="Main" className="frost-subtle fixed inset-x-0 bottom-0 z-sticky border-t border-border-subtle pb-safe pl-safe pr-safe lg:hidden">
      <ul className="mx-auto grid h-(--tabbar-h) max-w-md grid-cols-5 items-center gap-1 px-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const label = <span data-tab-label>{tab.label}</span>;

          if (tab.href === null) {
            return (
              <li key={tab.label}>
                <motion.button
                  type="button"
                  aria-label={tab.label}
                  aria-haspopup="dialog"
                  aria-expanded={sheetOpen}
                  layoutId={reduced ? undefined : startSheetLayoutId("tab")}
                  onClick={() => show("tab")}
                  className={cn(TAB, PRESS, "text-text-secondary")}
                >
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                  {label}
                </motion.button>
              </li>
            );
          }

          const active = pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
                className={cn(TAB, PRESS, active ? "font-semibold text-brand-primary" : "text-text-secondary")}
              >
                <Icon className="size-5" strokeWidth={active ? 2 : 1.75} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
