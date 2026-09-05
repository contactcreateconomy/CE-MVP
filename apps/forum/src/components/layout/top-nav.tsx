"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, LogOut, Moon, Plus, Search, Settings, Sun, UserCircle2 } from "lucide-react";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateconomyLogoMark } from "@/components/ui/createconomy-logo-mark";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { useQuery, useMutation } from "convex/react";

import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import { useSharedData } from "@/providers/shared-data-context";
import { cn } from "@/lib/utils";
import { useAuth } from "@cemvp/auth-ui";
import { useScroll } from "@/components/ui/use-scroll";
import { signalNavigationStart } from "@/providers/navigation-progress-provider";

const TYPE_ACCENT_CLASS: Record<"comment" | "upvote" | "follow" | "system", string> = {
  comment: "bg-(--brand-primary)",
  upvote: "bg-(--feedback-warning)",
  follow: "bg-(--feedback-success)",
  system: "bg-(--text-muted)",
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

type NotificationRow = {
  id: string;
  type: "comment" | "upvote" | "follow" | "system";
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  postSlug?: string;
};

function TopNavWithConvexNotifications() {
  const { authStatus } = useAuth();
  const { unreadNotificationCount } = useSharedData();
  const notificationList = useQuery(
    api.forum.queries.listNotificationsForViewer,
    authStatus === "authenticated" ? {} : "skip",
  );
  const markRead = useMutation(api.forum.mutations.markNotificationRead);

  const handleMarkRead = useCallback(
    async (notificationId: string) => {
      try {
        await markRead({ notificationId: notificationId as import("@/lib/convex").Id<"forumNotifications"> });
      } catch {
        /* ignore */
      }
    },
    [markRead],
  );

  return (
    <TopNavInner
      convexNotificationsEnabled
      notificationList={notificationList}
      unreadCountOverride={unreadNotificationCount}
      onMarkRead={handleMarkRead}
    />
  );
}

/**
 * When Convex URL is missing, do not call `useQuery` (no provider during Vercel prerender).
 * `notificationList` is ignored; notifications UI shows sign-in / empty as appropriate.
 */
function TopNavInner({
  convexNotificationsEnabled,
  notificationList,
  unreadCountOverride,
  onMarkRead,
}: {
  convexNotificationsEnabled: boolean;
  notificationList?: NotificationRow[] | undefined;
  unreadCountOverride?: number;
  onMarkRead?: (notificationId: string) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");
  const { resolvedTheme, setTheme } = useTheme();
  const { authStatus, user, openAuthModal, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const scrolled = useScroll(10);

  const effectiveList: NotificationRow[] = useMemo(() => {
    if (!convexNotificationsEnabled || authStatus !== "authenticated") {
      return [];
    }
    return (notificationList ?? []) as NotificationRow[];
  }, [convexNotificationsEnabled, authStatus, notificationList]);

  const unread = unreadCountOverride ?? effectiveList.filter((n) => !n.read).length;

  const latestNotifications = useMemo(() => {
    return [...effectiveList]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [effectiveList]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40">
      {/* Anti-bleed solid mask above the floating pill */}
      <div 
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-[-1] bg-(--bg-canvas) transition-all duration-slow ease-out",
          scrolled ? "h-3 opacity-100" : "h-0 opacity-0"
        )} 
      />
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6 lg:px-8">
        <div
          className={cn(
            "relative w-full border transition-[transform,background-color,border-color,box-shadow,border-radius] duration-slow ease-out will-change-transform",
            scrolled
              ? "translate-y-2 rounded-xl border-white/40 [.dark_&]:border-white/[0.12] bg-white/45 [.dark_&]:bg-[rgba(20,20,20,0.55)] shadow-[0_8px_32px_rgba(0,0,0,0.08)] [.dark_&]:shadow-[0_8px_32px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl"
              : "translate-y-1.5 rounded-xl border-white/30 [.dark_&]:border-(--border-subtle) bg-white/25 [.dark_&]:bg-[rgba(20,20,20,0.35)] backdrop-blur-2xl shadow-[0_1px_0_rgba(0,0,0,0.04)] [.dark_&]:shadow-[0_1px_0_rgba(255,255,255,0.04)]",
          )}
        >
          <GlowingEffect
            spread={50}
            glow
            disabled={false}
            proximity={80}
            inactiveZone={0.01}
            borderWidth={1}
            movementDuration={0.65}
          />
          <div className="relative z-10 flex h-14 w-full items-center gap-3 px-2 sm:px-3 md:px-4">
            <Link href="/feed" className="group flex shrink-0 items-center gap-2">
              <CreateconomyLogoMark
                size={34}
                markColor="var(--text-primary)"
                className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.12)] [.dark_&]:drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-[filter] duration-normal group-hover:drop-shadow-[0_0_8px_rgba(9,9,11,0.42)] [.dark_&]:group-hover:drop-shadow-[0_0_6px_rgba(250,250,250,0.35)]"
              />
              <span className="text-[0.95rem] font-semibold tracking-tight text-text-primary drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)] [.dark_&]:drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] sm:text-[1.05rem]">Createconomy</span>
            </Link>

            <form
              action="/search"
              method="get"
              className="hidden flex-1 justify-center px-2 md:flex"
              role="search"
            >
              {currentCategory ? <input type="hidden" name="category" value={currentCategory} /> : null}
              <label className="group relative w-full max-w-[480px]" aria-label="Search">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  name="q"
                  type="search"
                  placeholder={currentCategory ? `Search in ${currentCategory}…` : "Search"}
                  className="search-input h-9 w-full appearance-none rounded-full border border-(--border-default) bg-(--bg-surface) pl-9 pr-3 text-sm text-text-primary outline-hidden transition-[border-color,box-shadow] duration-normal placeholder:text-text-muted hover:shadow-glow-primary-sm focus:outline-hidden"
                />
              </label>
            </form>

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <NavTooltip label="Create">
                <Link
                  href="/new-post"
                  aria-label="Create"
                  className={cn(
                    // Avoid hover translate inside backdrop-blur (subpixel layer = fuzzy SVG/icons)
                    "inline-flex rounded-full p-2 text-text-secondary transition-[colors,box-shadow] duration-normal hover:bg-(--bg-overlay) hover:text-text-primary hover:shadow-glow-primary-sm",
                    pathname === "/new-post" && "text-brand-primary",
                  )}
                >
                  <Plus className="h-4 w-4 shrink-0" />
                </Link>
              </NavTooltip>

              <NavTooltip label={mounted && resolvedTheme === "dark" ? "Light mode" : "Dark mode"}>
                <button
                  aria-label="Toggle theme"
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  className="rounded-full p-2 text-text-secondary transition-[transform,colors,box-shadow] duration-normal hover:-translate-y-px hover:bg-(--bg-overlay) hover:text-text-primary hover:shadow-glow-primary-sm"
                >
                  {!mounted ? <Moon className="h-4 w-4" /> : resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </NavTooltip>

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
                      "relative rounded-full p-2 text-text-secondary transition-[transform,colors,box-shadow] duration-normal hover:-translate-y-px hover:bg-(--bg-overlay) hover:text-text-primary hover:shadow-glow-primary-sm",
                      (pathname === "/notifications" || notificationsOpen) && "text-brand-primary",
                    )}
                  >
                    <Bell className={cn("h-4 w-4", unread > 0 && !notificationsOpen && "animate-pulse-glow")} />
                    {unread > 0 ? (
                      <span className="absolute -right-0.5 -top-0.5 rounded-full bg-(--feedback-error) px-1.5 py-0.5 text-micro font-semibold text-white">
                        {unread}
                      </span>
                    ) : null}
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={10}
                    className="animate-soft-float z-dropdown w-85 overflow-hidden rounded-menu border border-border-default bg-bg-surface shadow-lg"
                  >
                    {authStatus === "authenticated" ? (
                      <>
                        <div className="h-0.5 w-full bg-brand-primary/105" />
                        <div className="flex items-center justify-between border-b border-(--border-subtle) px-4 py-3">
                          <p className="text-sm font-semibold text-text-primary">Latest notifications</p>
                          <span className="rounded-full bg-(--bg-overlay) px-2 py-0.5 text-label-sm font-medium text-text-secondary">
                            {unread} unread
                          </span>
                        </div>

                        <div className="max-h-[320px] overflow-y-auto p-1.5">
                          {convexNotificationsEnabled && notificationList === undefined ? (
                            <p className="px-3 py-4 text-sm text-text-muted">Loading…</p>
                          ) : (
                            latestNotifications.map((notification) => (
                              <DropdownMenu.Item
                                key={notification.id}
                                className="group relative cursor-pointer rounded-menu-item px-3 py-2.5 outline-hidden transition-[background-color,transform] duration-normal data-highlighted:bg-(--bg-overlay) data-highlighted:translate-x-[2px]"
                                onSelect={() => {
                                  if (!notification.read && onMarkRead) {
                                    onMarkRead(notification.id);
                                  }
                                  if (notification.postSlug) {
                                    signalNavigationStart();
                                    router.push(`/discussions/${notification.postSlug}`);
                                  }
                                }}
                              >
                                <div className="pr-12">
                                  <div className="flex items-start gap-2">
                                    <span
                                      className={cn(
                                        "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                                        notification.read ? "bg-(--border-default)" : TYPE_ACCENT_CLASS[notification.type],
                                      )}
                                    />
                                    <p className={cn("text-sm text-text-primary", !notification.read && "font-semibold")}>
                                      {notification.title}
                                    </p>
                                  </div>
                                  <p className="mt-1 line-clamp-2 pl-3.5 text-xs text-text-secondary">{notification.message}</p>
                                </div>
                                <span className="absolute right-3 top-2.5 text-label-sm text-text-muted">
                                  {formatRelativeNotificationTime(notification.createdAt)}
                                </span>
                              </DropdownMenu.Item>
                            ))
                          )}
                        </div>

                        <div className="border-t border-(--border-subtle) p-1.5">
                          <DropdownMenu.Item asChild>
                            <Link
                              href="/profile#notifications"
                              className="flex w-full items-center justify-between rounded-menu-item px-3 py-2 text-sm font-medium text-brand-primary outline-hidden transition-colors hover:bg-(--bg-overlay) focus:bg-(--bg-overlay)"
                            >
                              <span>View all notifications</span>
                              <span aria-hidden="true">→</span>
                            </Link>
                          </DropdownMenu.Item>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3 p-4">
                        <p className="text-sm font-semibold text-text-primary">Sign in to view notifications</p>
                        <p className="text-xs text-text-secondary">
                          Stay synced with comments, milestones, and creator activity in one place.
                        </p>
                        <button
                          type="button"
                          className="w-full rounded-menu-item bg-(--brand-primary) px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-(--brand-primary-hover)"
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
                        "rounded-full p-0.5 text-text-secondary transition-[transform,colors] duration-normal hover:-translate-y-px hover:bg-(--bg-overlay) hover:text-text-primary",
                        profileMenuOpen && "bg-(--bg-overlay)",
                      )}
                    >
                      <Avatar className="h-8 w-8 border border-(--border-default)">
                        {user.avatar ? <AvatarImage src={user.avatar} alt={`${user.name} avatar`} /> : null}
                        <AvatarFallback className="bg-(--bg-overlay) text-label-sm font-semibold text-text-primary">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenu.Trigger>

                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      align="end"
                      sideOffset={10}
                      className="animate-soft-float z-dropdown w-63 overflow-hidden rounded-menu border border-border-default bg-bg-surface p-1.5 shadow-lg"
                    >
                      <div className="rounded-menu-item border border-(--border-subtle) bg-(--bg-overlay) px-3 py-2.5">
                        <p className="text-sm font-semibold text-text-primary">{user.name}</p>
                        <p className="mt-0.5 text-xs text-text-secondary">@{user.handle}</p>
                      </div>

                      <div className="mt-1.5 space-y-0.5">
                        <DropdownMenu.Item asChild>
                          <Link
                            href="/profile"
                            className="flex items-center gap-2 rounded-menu-item px-2.5 py-2 text-sm text-text-primary outline-hidden transition-colors data-highlighted:bg-(--bg-overlay)"
                          >
                            <UserCircle2 className="h-4 w-4 text-text-secondary" />
                            <span>Profile</span>
                          </Link>
                        </DropdownMenu.Item>

                        <DropdownMenu.Item asChild>
                          <Link
                            href="/settings"
                            className="flex items-center gap-2 rounded-menu-item px-2.5 py-2 text-sm text-text-primary outline-hidden transition-colors data-highlighted:bg-(--bg-overlay)"
                          >
                            <Settings className="h-4 w-4 text-text-secondary" />
                            <span>Settings</span>
                          </Link>
                        </DropdownMenu.Item>

                        <DropdownMenu.Item asChild>
                          <Link
                            href="/notifications"
                            className="flex items-center gap-2 rounded-menu-item px-2.5 py-2 text-sm text-text-primary outline-hidden transition-colors data-highlighted:bg-(--bg-overlay)"
                          >
                            <Bell className="h-4 w-4 text-text-secondary" />
                            <span>Notifications</span>
                          </Link>
                        </DropdownMenu.Item>
                      </div>

                      <DropdownMenu.Separator className="my-1.5 h-px bg-(--border-subtle)" />

                      <DropdownMenu.Item
                        className="flex cursor-pointer items-center gap-2 rounded-menu-item px-2.5 py-2 text-sm text-feedback-error outline-hidden transition-colors data-highlighted:bg-(--bg-overlay)"
                        onSelect={() => logout()}
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              ) : authStatus === "loading" ? (
                <span
                  className="inline-flex h-9 w-20 animate-pulse rounded-full bg-(--bg-overlay)"
                  aria-hidden
                />
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="inline-flex h-9 items-center rounded-full border border-(--border-default) bg-(--bg-surface) px-4 text-sm font-semibold text-text-primary transition-[transform,colors,box-shadow] duration-normal hover:-translate-y-px hover:border-(--border-active) hover:bg-(--bg-overlay) hover:shadow-glow-primary-sm"
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

export function TopNav() {
  const [convexReady, setConvexReady] = useState(false);

  useEffect(() => {
    setConvexReady(isConvexConfigured());
  }, []);

  if (!convexReady) {
    return <TopNavInner convexNotificationsEnabled={false} />;
  }
  return <TopNavWithConvexNotifications />;
}

/* ── Motion tooltip matching the category-icon tooltip ── */
function NavTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-(--border-default) bg-popover px-2 py-1 text-xs shadow-lg"
          >
            <span className="font-medium text-popover-foreground">{label}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
