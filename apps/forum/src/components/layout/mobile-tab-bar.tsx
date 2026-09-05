"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, PlusCircle, Search, User } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/discover", label: "Search", icon: Search },
  { href: "/new-post", label: "Create", icon: PlusCircle, highlight: true },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-(--border-subtle) bg-(--bg-surface)/95 px-3 pb-4 pt-2 backdrop-blur-sm lg:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href;

          return (
            <li key={`${tab.href}-${tab.label}`}>
              <Link
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center rounded-md px-2 py-2 text-label-sm",
                  tab.highlight
                    ? "text-(--text-inverse)"
                    : active
                    ? "text-(--brand-primary)"
                    : "text-(--text-muted)",
                )}
              >
                <span
                  className={cn(
                    "mb-1 flex h-8 w-8 items-center justify-center rounded-full",
                    tab.highlight ? "electric-glow bg-(--brand-primary)" : active ? "bg-(--bg-overlay)" : "",
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
