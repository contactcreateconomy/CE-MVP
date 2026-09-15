"use client";

/**
 * Route: /admin/* — SLICE-P3-02 layout
 * §12.4 Admin Console Layout: 48px header (Mark + "console" + name + sign out),
 * 220px fixed sidebar (widget navigation), dense content area.
 * Chrome per CAP-390: env badge · role · search · command palette ·
 * alert count · operational-mode indicator · Wiki · profile.
 *
 * Operational-mode indicator per shell contract States E: normal / degraded /
 * STOP-active. Genome back-door NEVER in the palette (§1).
 */

import { useState, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import {
  LayoutGrid, ShieldCheck, Bell, FileQuestion, User,
  Search,
} from "lucide-react";

import { api } from "../../../../../../convex/_generated/api";
import { isConvexConfigured } from "@cemvp/convex-client";
import { useAuth } from "@cemvp/auth-ui";
import { CommandPalette, type CommandSection } from "@/components/ui/command-palette";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateconomyLogoMark } from "@/components/ui/createconomy-logo-mark";
import { Banner } from "@/components/ui/banner";

const EMPTY_WIDGETS: { widgetKey: string; title: string; routeKey: string }[] = [];

export default function AdminLayout({ children }: { children?: React.ReactNode }) {
  // Prerender/build guard: without NEXT_PUBLIC_CONVEX_URL there is no
  // ConvexProvider, and useQuery throws even in "skip" mode.
  if (!isConvexConfigured()) {
    return <div className="p-8 text-sm text-neutral-400">Admin console requires a Convex deployment (set NEXT_PUBLIC_CONVEX_URL).</div>;
  }
  return <AdminLayoutInner>{children}</AdminLayoutInner>;
}

function AdminLayoutInner({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Same Google/password session as /feed (AppAuthProvider). Do NOT send
  // staff to /signin — that page is the magic-link entry surface and was
  // a second, disconnected auth flow.
  const { authStatus, openAuthModal, logout } = useAuth();
  const isAuthenticated = authStatus === "authenticated";
  const authLoading = authStatus === "loading";

  // Widget catalog — filtered by the user's staff roles (CAP-392); skip
  // until the shared session is ready so a loading query isn't treated as
  // "no staff role". EMPTY_WIDGETS is module-stable so useMemo deps don't churn.
  const widgetsQuery = useQuery(
    api.admin.shell.getWidgetCatalog,
    isAuthenticated ? {} : "skip",
  );
  const widgets = widgetsQuery ?? EMPTY_WIDGETS;
  const catalogLoaded = isAuthenticated && widgetsQuery !== undefined;

  // Permitted widgets for the sidebar
  const navItems = useMemo(() => {
    return (widgets as { widgetKey: string; title: string; routeKey: string }[] | undefined)?.map((w) => ({
      key: w.widgetKey,
      title: w.title,
      routeKey: w.routeKey,
    })) ?? [];
  }, [widgets]);

  const paletteSections: CommandSection[] = useMemo(() => {
    const items = navItems.map((n) => ({
      id: n.key,
      label: n.title,
      keywords: [n.routeKey],
      onSelect: () => router.push(n.routeKey),
    }));
    return items.length > 0 ? [{ label: "Consoles", items }] : [];
  }, [navItems, router]);

  const handleSignOut = useCallback(async () => {
    await logout();
    router.push("/feed");
  }, [logout, router]);

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-bg-canvas p-6 text-sm text-text-muted">Loading…</div>;
  }
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg-canvas p-6 text-center">
        <ShieldCheck className="size-8 text-text-muted" />
        <h1 className="text-lg font-semibold text-text-primary">Admin console</h1>
        <p className="max-w-sm text-sm text-text-muted">
          Staff access required. Sign in with your authorized account to continue.
        </p>
        <Button variant="primary" size="sm" onClick={() => openAuthModal("login")}>Sign in</Button>
      </div>
    );
  }
  if (!catalogLoaded) {
    return <div className="flex min-h-screen items-center justify-center bg-bg-canvas p-6 text-sm text-text-muted">Loading…</div>;
  }
  if ((widgets as unknown as { widgetKey: string }[]).length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg-canvas p-6 text-center">
        <ShieldCheck className="size-8 text-text-muted" />
        <h1 className="text-lg font-semibold text-text-primary">No admin access</h1>
        <p className="max-w-sm text-sm text-text-muted">
          This account has no staff role assigned. Ask a Founder to grant one (roles console, CAP-413).
        </p>
        <Button variant="ghost" size="sm" onClick={() => router.push("/feed")}>Back to the feed</Button>
      </div>
    );
  }

  // Palette sections — from the same permitted catalog; genome NEVER included
  return (
    <div className="flex min-h-screen flex-col bg-bg-canvas">
      {/* §12.4 Admin Header — 48px compact */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border-subtle bg-bg-surface px-4">
        <div className="flex items-center gap-3">
          <CreateconomyLogoMark className="size-5" />
          <span className="text-sm font-semibold text-text-secondary">console</span>
          <Badge tone="neutral" className="text-micro">
            {process.env.NODE_ENV === "development" ? "DEV" : "PROD"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* CAP-390 chrome: search → command palette */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPaletteOpen(true)}
            aria-label="Open command palette"
          >
            <Search className="size-4" />
            <span className="hidden text-xs text-text-muted sm:inline">Search…</span>
          </Button>

          {/* Alert count */}
          <Button size="sm" variant="ghost" aria-label="Alerts" className="relative">
            <Bell className="size-4" />
            <span className="absolute right-1 top-1 size-1.5 rounded-full bg-feedback-error" aria-hidden />
          </Button>

          {/* Operational-mode indicator (States E: normal / degraded / STOP-active) */}
          <Badge tone="success" className="hidden md:inline-flex">
            normal
          </Badge>

          {/* Wiki */}
          <Button size="sm" variant="ghost" aria-label="Admin wiki">
            <FileQuestion className="size-4" />
          </Button>

          {/* Profile */}
          <Button size="sm" variant="ghost" aria-label="Profile">
            <User className="size-4" />
          </Button>

          <Button size="sm" variant="secondary" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </header>

      {/* §12.4: 220px fixed sidebar + dense content */}
      <div className="flex flex-1">
        <aside className="hidden w-[220px] shrink-0 border-r border-border-subtle bg-bg-surface md:block">
          <nav className="space-y-1 p-2" aria-label="Admin navigation">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.routeKey);
              return (
                <button
                  key={item.key}
                  onClick={() => router.push(item.routeKey)}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm outline-hidden transition-colors duration-fast ease-out-cubic ${
                    active
                      ? "bg-bg-overlay text-text-link"
                      : "text-text-secondary hover:bg-bg-overlay hover:text-text-primary"
                  }`}
                >
                  <LayoutGrid className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{item.title}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Dense content area */}
        <main className="min-w-0 flex-1 p-4">
          {/* STOP-active banner placeholder (operational-mode chrome) */}
          {pathname === "/admin" && (
            <div className="mb-4">
              <Banner variant="info">
                Admin console — widget catalog active. Use the command palette (Ctrl+K or the search button) to navigate.
              </Banner>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* A11 Command Palette — from the permitted widget catalog */}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        sections={paletteSections}
        placeholder="Search admin consoles…"
      />
    </div>
  );
}
