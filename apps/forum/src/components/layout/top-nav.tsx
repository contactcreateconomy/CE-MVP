"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, LogOut, Moon, Plus, Search, Settings, Sun, UserCircle2 } from "lucide-react";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeDate } from "@/lib/format";
import { CreateconomyLogoMark } from "@/components/ui/createconomy-logo-mark";
import { useQuery, useMutation } from "convex/react";

import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import { useSharedData } from "@/providers/shared-data-context";
import { motionFor, usePrefersReducedMotion } from "@/lib/motion";
import { useStartSheet } from "@/stores/start-sheet-store";
import { applyTheme, runThemeSwitch } from "@/lib/theme-transition";
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

/* Logo 3-segment reveal plays on the first load only (§11.1, L-42): the
   server and the first client mount reveal; any later mount (client-side
   navigation into another layout) shows the mark at rest. */
let logoRevealed = false;

/** Test-only: forget that the logo already revealed in this document. */
export function resetLogoRevealForTests() {
  logoRevealed = false;
}

function useFirstLoadLogoReveal(): boolean {
  const [reveal] = useState(() => typeof window === "undefined" || !logoRevealed);
  useEffect(() => {
    logoRevealed = true;
  }, []);
  return reveal;
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
    api.notifications.reads.list,
    authStatus === "authenticated" ? {} : "skip",
  );
  const markRead = useMutation(api.notifications.reads.markRead);

  const handleMarkRead = useCallback(
    async (notificationId: string) => {
      try {
        await markRead({ notificationId: notificationId as import("@/lib/convex").Id<"notifications"> });
      } catch {
        /* ignore */
      }
    },
    [markRead],
  );

  // Canonical rows → the bell's row shape (P7-CLEANUP port)
  type ReadRow = {
    id: string;
    notificationType: string;
    actorCount: number;
    eventCount: number;
    createdAt: number;
    readAt: number | null;
    // /discussions/<slug|postId> ref resolved server-side (reads.list):
    // postSeoMeta slug when one exists, raw posts._id otherwise — the
    // [slug] resolver tolerates both. Null for objects with no thread
    // surface (distribution/drip_batch/resource_quota).
    postSlug: string | null;
  };
  const rows: NotificationRow[] = (
    (notificationList as { page?: ReadRow[] } | undefined)?.page ?? []
  ).map((n) => ({
    id: n.id,
    type: "system" as const,
    title: n.notificationType.replace(/_/g, " "),
    message: `${n.actorCount > 1 ? `${n.actorCount} members` : "Someone"}${n.eventCount > 1 ? ` · ${n.eventCount} events` : ""}`,
    createdAt: new Date(n.createdAt).toISOString(),
    read: Boolean(n.readAt),
    postSlug: n.postSlug ?? undefined,
  }));

  return (
    <TopNavInner
      convexNotificationsEnabled
      notificationList={rows}
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
  const reducedMotion = usePrefersReducedMotion();
  const { authStatus, user, openAuthModal, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  // §9.1: the island deepens its shadow after 8px of scroll (settle spring).
  const scrolled = useScroll(8);
  const sheetOpen = useStartSheet((s) => s.open);
  const logoReveal = useFirstLoadLogoReveal();
  const springs = motionFor(reducedMotion).springs;

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
    // Menu bar = a floating frosted island (FEED-DESIGN §8/§9.1, Bible §1/§3):
    // L2 functional → frost-strong (L-68), sticky 8px from the top on phones
    // and 12px on desktop, container width, radius xl. Content scrolls under
    // it and is separated by a scroll-edge fade, never a line (§3.2 r4).
    <header className="sticky top-2 z-sticky px-2 lg:top-3 lg:px-3">
      <div
        data-testid="menu-edge-fade"
        aria-hidden
        className={cn(
          "scroll-edge-fade absolute inset-x-0 -top-2 z-behind h-20 transition-opacity duration-slow lg:-top-3",
          scrolled ? "opacity-100" : "opacity-0",
        )}
      />
      {/* L-88 (Bible §3.2 r3): while the Start sheet (L3 frost + scrim) is
          open, the island behind it goes solid — bg-surface, no blur. */}
      <div
        data-testid="menu-island"
        className={cn(
          "relative mx-auto w-full max-w-250 rounded-xl border border-border-subtle",
          sheetOpen ? "bg-surface" : "frost-strong",
        )}
      >
        {/* Deeper shadow once scrolled: a shadow-lg layer that fades in
            (opacity only — Bible §9.2 r5); reduced motion → crossfade. */}
        <motion.div
          data-testid="menu-island-raised"
          data-raised={scrolled ? "true" : "false"}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl shadow-lg"
          initial={false}
          animate={{ opacity: scrolled ? 1 : 0 }}
          transition={springs.settle}
        />
          <div className="relative z-10 flex h-14 w-full items-center gap-3 px-2 sm:px-3 md:px-4">
            <Link href="/feed" className="group flex shrink-0 items-center gap-2">
              <CreateconomyLogoMark size={34} markColor="var(--text-primary)" reveal={logoReveal} />
              <span className="text-body-md font-semibold tracking-tight text-text-primary sm:text-body-lg">Createconomy</span>
            </Link>

            <form
              action="/search"
              method="get"
              className="hidden flex-1 justify-center px-2 md:flex"
              role="search"
            >
              {currentCategory ? <input type="hidden" name="category" value={currentCategory} /> : null}
              {/* Focus widens the field (state change, not an animated width). */}
              <label
                data-testid="menu-search-field"
                className="group relative w-full max-w-(--container-search) focus-within:max-w-(--container-reading)"
                aria-label="Search"
              >
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
                  onClick={(e) => {
                    // L-67: Iris — the new theme opens as a circle from this button.
                    const to = resolvedTheme === "dark" ? "light" : "dark";
                    const r = e.currentTarget.getBoundingClientRect();
                    runThemeSwitch({
                      to,
                      reducedMotion,
                      origin: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
                      apply: () => applyTheme(to, setTheme),
                    });
                  }}
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
                    <Bell className="h-4 w-4" />
                    {/* Unread = a dot (§9.1); the count is in the label. */}
                    {unread > 0 ? (
                      <span
                        data-testid="unread-dot"
                        aria-hidden
                        className="absolute right-1.5 top-1.5 size-2 rounded-full bg-feedback-error ring-2 ring-bg-surface"
                      />
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
                                  {formatRelativeDate(notification.createdAt)}
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
