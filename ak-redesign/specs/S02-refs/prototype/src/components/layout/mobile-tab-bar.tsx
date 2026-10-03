"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, LogIn, PlusCircle, Search, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

const baseTabs = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/discover", label: "Search", icon: Search },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/settings", label: "Profile", icon: User },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const { authStatus, openAuthModal } = useAuth();
  const isAuthenticated = authStatus === "authenticated";

  const actionTab = isAuthenticated
    ? { href: "/new-post", label: "Create", icon: PlusCircle }
    : { href: "#", label: "Log In", icon: LogIn };

  const tabs = [baseTabs[0], baseTabs[1], actionTab, baseTabs[2], baseTabs[3]];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 px-3 pb-4 pt-2 backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.href !== "#" && pathname === tab.href;

          if (tab.href === "#") {
            return (
              <li key={tab.label}>
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="flex w-full flex-col items-center justify-center rounded-[var(--radius-md)] px-2 py-2 text-[11px] text-[var(--text-muted)]"
                >
                  <span className="mb-1 flex h-8 w-8 items-center justify-center rounded-full">
                    <Icon className="h-4 w-4" />
                  </span>
                  {tab.label}
                </button>
              </li>
            );
          }

          return (
            <li key={`${tab.href}-${tab.label}`}>
              <Link
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center rounded-[var(--radius-md)] px-2 py-2 text-[11px]",
                  active ? "text-[var(--brand-primary)]" : "text-[var(--text-muted)]",
                )}
              >
                <span
                  className={cn(
                    "mb-1 flex h-8 w-8 items-center justify-center rounded-full",
                    active ? "bg-[var(--bg-overlay)]" : "",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
