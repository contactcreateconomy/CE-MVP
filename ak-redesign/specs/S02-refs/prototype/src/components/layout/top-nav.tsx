"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Bell, LogOut, Moon, Plus, Search, Settings, Sun, UserCircle2 } from "lucide-react";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateconomyLogoMark } from "@/components/ui/createconomy-logo-mark";
import { getNotificationsForUser, getUnreadNotifications } from "@/lib/adapters/content";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useScroll } from "@/components/ui/use-scroll";

const TYPE_ACCENT_CLASS: Record<"comment" | "upvote" | "follow" | "system", string> = {
  comment: "bg-[var(--brand-primary)]",
  upvote: "bg-[var(--feedback-warning)]",
  follow: "bg-[var(--feedback-success)]",
  system: "bg-[var(--text-muted)]",
};

function formatRelativeNotificationTime(createdAt: string) {
  const created = new Date(createdAt).getTime();
  const diffMs = Date.now() - created;
  const minuteMs = 60_000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (diffMs < hourMs) {
    const minutes = Math.max(1, Math.floor(diffMs / minuteMs));
    return `${minutes}m ago`;
  }

  if (diffMs < dayMs) {
    const hours = Math.max(1, Math.floor(diffMs / hourMs));
    return `${hours}h ago`;
  }

  const days = Math.max(1, Math.floor(diffMs / dayMs));
  return `${days}d ago`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TopNav() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { authStatus, user, openAuthModal, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const scrolled = useScroll(10);

  const viewerId = authStatus === "authenticated" ? user?.id ?? null : null;

  const unread = useMemo(() => {
    if (!viewerId) {
      return 0;
    }

    return getUnreadNotifications(viewerId).length;
  }, [viewerId]);

  const latestNotifications = useMemo(() => {
    if (!viewerId) {
      return [];
    }

    return getNotificationsForUser(viewerId)
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [viewerId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-canvas)]">
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6 lg:px-8">
        <div
          className={cn(
            "w-full border border-transparent transition-[transform,background-color,border-color,box-shadow,border-radius] duration-300 ease-out will-change-transform md:translate-y-0",
            scrolled
              ? "md:translate-y-2 md:rounded-xl md:border-[var(--border-subtle)] md:bg-[color:var(--bg-canvas)]/92 md:shadow-[var(--shadow-sm)] md:backdrop-blur"
              : "border-x-transparent border-t-transparent border-b-[var(--border-subtle)] bg-[color:var(--bg-canvas)]/90 backdrop-blur",
          )}
        >
          <div className="flex h-14 w-full items-center gap-3 px-2 sm:px-3 md:px-4">
            <Link href="/feed" className="group flex shrink-0 items-center gap-2">
              <CreateconomyLogoMark
                size={32}
                markColor="var(--text-primary)"
                className="transition-[filter] duration-200 group-hover:drop-shadow-[0_0_8px_rgba(9,9,11,0.42)] dark:group-hover:drop-shadow-[0_0_6px_rgba(250,250,250,0.35)]"
              />
              <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)] sm:text-base">Createconomy</span>
            </Link>

            <div className="hidden flex-1 justify-center px-2 md:flex">
              <label className="relative w-full max-w-[480px]" aria-label="Search">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="search"
                  placeholder="Search"
                  className="h-9 w-full appearance-none rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none transition-[border-color] duration-200 placeholder:text-[var(--text-muted)] hover:border-[var(--border-prominent)] focus:border-[var(--border-active)] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                />
              </label>
            </div>

            <button
              aria-label="Toggle theme"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="ml-auto rounded-full p-2 text-[var(--text-secondary)] transition-[transform,colors] duration-200 hover:-translate-y-px hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)] md:hidden"
            >
              {!mounted ? <Moon className="h-4 w-4" /> : resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <div className="ml-auto hidden items-center gap-1 sm:gap-2 md:flex">
              <Link
                href="/new-post"
                aria-label="Create"
                className={cn(
                  "inline-flex rounded-full p-2 text-[var(--text-secondary)] transition-[transform,colors] duration-200 hover:-translate-y-px hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]",
                  pathname === "/new-post" && "text-[var(--brand-primary)]",
                )}
              >
                <Plus className="h-4 w-4" />
              </Link>

              <button
                aria-label="Toggle theme"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="rounded-full p-2 text-[var(--text-secondary)] transition-[transform,colors] duration-200 hover:-translate-y-px hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]"
              >
                {!mounted ? <Moon className="h-4 w-4" /> : resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              <DropdownMenu.Root open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    aria-label={
                      authStatus === "authenticated"
                        ? `Notifications${unread > 0 ? `, ${unread} unread` : ""}`
                        : "Notifications. Sign in to unlock"
                    }
                    className={cn(
                      "relative rounded-full p-2 text-[var(--text-secondary)] transition-[transform,colors] duration-200 hover:-translate-y-px hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]",
                      (pathname === "/notifications" || notificationsOpen) && "text-[var(--brand-primary)]",
                    )}
                  >
                    <Bell className={cn("h-4 w-4", unread > 0 && !notificationsOpen && "animate-pulse-glow")} />
                    {unread > 0 ? (
                      <span className="absolute -right-0.5 -top-0.5 rounded-full bg-[var(--feedback-error)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {unread}
                      </span>
                    ) : null}
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={10}
                    className="animate-soft-float z-50 w-[340px] overflow-hidden rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]"
                  >
                    {authStatus === "authenticated" ? (
                      <>
                        <div className="h-0.5 w-full bg-[var(--brand-primary)]/85" />
                        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">Latest notifications</p>
                          <span className="rounded-full bg-[var(--bg-overlay)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
                            {unread} unread
                          </span>
                        </div>

                        <div className="max-h-[320px] overflow-y-auto p-1.5">
                          {latestNotifications.map((notification) => (
                            <DropdownMenu.Item
                              key={notification.id}
                              className="group relative cursor-pointer rounded-[10px] px-3 py-2.5 outline-none transition-[background-color,transform] duration-200 data-[highlighted]:bg-[var(--bg-overlay)] data-[highlighted]:translate-x-[2px]"
                            >
                              <div className="pr-12">
                                <div className="flex items-start gap-2">
                                  <span
                                    className={cn(
                                      "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                                      notification.read ? "bg-[var(--border-default)]" : TYPE_ACCENT_CLASS[notification.type],
                                    )}
                                  />
                                  <p className={cn("text-sm text-[var(--text-primary)]", !notification.read && "font-semibold")}>
                                    {notification.title}
                                  </p>
                                </div>
                                <p className="mt-1 line-clamp-2 pl-3.5 text-xs text-[var(--text-secondary)]">{notification.message}</p>
                              </div>
                              <span className="absolute right-3 top-2.5 text-[11px] text-[var(--text-muted)]">
                                {formatRelativeNotificationTime(notification.createdAt)}
                              </span>
                            </DropdownMenu.Item>
                          ))}
                        </div>

                        <div className="border-t border-[var(--border-subtle)] p-1.5">
                          <DropdownMenu.Item asChild>
                            <Link
                              href="/profile#notifications"
                              className="flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-sm font-medium text-[var(--brand-primary)] outline-none transition-colors hover:bg-[var(--bg-overlay)] focus:bg-[var(--bg-overlay)]"
                            >
                              <span>View all notifications</span>
                              <span aria-hidden="true">→</span>
                            </Link>
                          </DropdownMenu.Item>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3 p-4">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">Sign in to view notifications</p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          Stay synced with comments, milestones, and creator activity in one place.
                        </p>
                        <button
                          type="button"
                          className="w-full rounded-[10px] bg-[var(--brand-primary)] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-primary-hover)]"
                          onClick={() => {
                            setNotificationsOpen(false);
                            openAuthModal("login");
                          }}
                        >
                          Login to continue
                        </button>
                      </div>
                    )}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>

              {authStatus === "authenticated" && user ? (
                <DropdownMenu.Root open={profileMenuOpen} onOpenChange={setProfileMenuOpen}>
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      aria-label="Account menu"
                      className={cn(
                        "rounded-full p-0.5 text-[var(--text-secondary)] transition-[transform,colors] duration-200 hover:-translate-y-px hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]",
                        profileMenuOpen && "bg-[var(--bg-overlay)]",
                      )}
                    >
                      <Avatar className="h-8 w-8 border border-[var(--border-default)]">
                        {user.avatar ? <AvatarImage src={user.avatar} alt={`${user.name} avatar`} /> : null}
                        <AvatarFallback className="bg-[var(--bg-overlay)] text-[11px] font-semibold text-[var(--text-primary)]">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenu.Trigger>

                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      align="end"
                      sideOffset={10}
                      className="animate-soft-float z-50 w-[252px] overflow-hidden rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-1.5 shadow-[var(--shadow-lg)]"
                    >
                      <div className="rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2.5">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{user.name}</p>
                        <p className="mt-0.5 text-xs text-[var(--text-secondary)]">@{user.handle}</p>
                      </div>

                      <div className="mt-1.5 space-y-0.5">
                        <DropdownMenu.Item asChild>
                          <Link
                            href="/profile"
                            className="flex items-center gap-2 rounded-[9px] px-2.5 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors data-[highlighted]:bg-[var(--bg-overlay)]"
                          >
                            <UserCircle2 className="h-4 w-4 text-[var(--text-secondary)]" />
                            <span>Profile</span>
                          </Link>
                        </DropdownMenu.Item>

                        <DropdownMenu.Item asChild>
                          <Link
                            href="/settings"
                            className="flex items-center gap-2 rounded-[9px] px-2.5 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors data-[highlighted]:bg-[var(--bg-overlay)]"
                          >
                            <Settings className="h-4 w-4 text-[var(--text-secondary)]" />
                            <span>Settings</span>
                          </Link>
                        </DropdownMenu.Item>

                        <DropdownMenu.Item asChild>
                          <Link
                            href="/notifications"
                            className="flex items-center gap-2 rounded-[9px] px-2.5 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors data-[highlighted]:bg-[var(--bg-overlay)]"
                          >
                            <Bell className="h-4 w-4 text-[var(--text-secondary)]" />
                            <span>Notifications</span>
                          </Link>
                        </DropdownMenu.Item>
                      </div>

                      <DropdownMenu.Separator className="my-1.5 h-px bg-[var(--border-subtle)]" />

                      <DropdownMenu.Item
                        className="flex cursor-pointer items-center gap-2 rounded-[9px] px-2.5 py-2 text-sm text-[var(--feedback-error)] outline-none transition-colors data-[highlighted]:bg-[var(--bg-overlay)]"
                        onSelect={() => logout()}
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="inline-flex h-9 items-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 text-sm font-semibold text-[var(--text-primary)] transition-[transform,colors] duration-200 hover:-translate-y-px hover:border-[var(--border-active)] hover:bg-[var(--bg-overlay)]"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
