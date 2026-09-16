"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CreateconomyLogoMark } from "@/components/ui/createconomy-logo-mark";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { groupNavItems, iconForRoute, type NavItem } from "./nav-config";

export function AppSidebar({
  navItems,
  onNavigate,
}: {
  navItems: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const groups = groupNavItems(navItems);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 items-center gap-2 px-3">
        <CreateconomyLogoMark className="size-5" />
        <div className="min-w-0">
          <p className="truncate text-label-md font-semibold text-text-primary">Createconomy</p>
          <p className="text-micro text-text-muted">console</p>
        </div>
      </div>
      <Separator />
      <nav className="min-h-0 flex-1 overflow-y-auto p-2" aria-label="Admin navigation">
        {groups.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="px-2 py-1.5 text-overline font-medium uppercase text-text-muted">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = iconForRoute(item.routeKey);
                const active =
                  pathname === item.routeKey || pathname.startsWith(`${item.routeKey}/`);
                return (
                  <li key={item.key}>
                    <Link
                      href={item.routeKey}
                      onClick={onNavigate}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-body-sm no-underline outline-hidden transition-colors duration-fast ease-out-cubic hover:no-underline",
                        active
                          ? "bg-bg-overlay text-text-link shadow-glow-primary-sm"
                          : "text-text-secondary hover:bg-bg-overlay hover:text-text-primary",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
