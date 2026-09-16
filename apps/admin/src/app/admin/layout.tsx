"use client";

/**
 * Route: /admin/* — SLICE-P3-02 layout
 * STYLE-KIT §12.4: 48px header + 220px sidebar + dense content.
 * Chrome per CAP-390: env badge · role · search · command palette ·
 * alert count · operational-mode indicator · Wiki · profile.
 *
 * Visual composition follows shadcn-admin (grouped sidebar, command
 * search, user menu) on STYLE-KIT tokens only. Genome back-door NEVER
 * in the palette (§1).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { ShieldCheck } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import { useAuth } from "@cemvp/auth-ui";
import { CommandPalette, type CommandSection } from "@/components/ui/command-palette";
import { buttonVariants } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ConsoleShellProvider } from "@/components/layout/console-shell-context";
import { iconForRoute, type NavItem } from "@/components/layout/nav-config";

const EMPTY_WIDGETS: { widgetKey: string; title: string; routeKey: string }[] = [];
const FORUM_ORIGIN = process.env.NEXT_PUBLIC_FORUM_ORIGIN ?? "http://localhost:3000";

export default function AdminLayout({ children }: { children?: React.ReactNode }) {
  if (!isConvexConfigured()) {
    return (
      <div className="p-8 text-body-sm text-text-muted">
        Admin console requires a Convex deployment (set NEXT_PUBLIC_CONVEX_URL).
      </div>
    );
  }
  return <AdminLayoutInner>{children}</AdminLayoutInner>;
}

function AdminLayoutInner({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const { authStatus, logout } = useAuth();
  const isAuthenticated = authStatus === "authenticated";
  const authLoading = authStatus === "loading";

  const widgetsQuery = useQuery(
    api.admin.shell.getWidgetCatalog,
    isAuthenticated ? {} : "skip",
  );
  const widgets = widgetsQuery ?? EMPTY_WIDGETS;
  const catalogLoaded = isAuthenticated && widgetsQuery !== undefined;

  const navItems: NavItem[] = useMemo(() => {
    return (widgets as { widgetKey: string; title: string; routeKey: string }[] | undefined)
      ?.filter((w) => w.routeKey !== "/admin/personas/genome")
      .map((w) => ({
        key: w.widgetKey,
        title: w.title,
        routeKey: w.routeKey,
      })) ?? [];
  }, [widgets]);

  const paletteSections: CommandSection[] = useMemo(() => {
    const items = navItems.map((n) => {
      const Icon = iconForRoute(n.routeKey);
      return {
        id: n.key,
        label: n.title,
        keywords: [n.routeKey],
        icon: <Icon />,
        onSelect: () => router.push(n.routeKey),
      };
    });
    return items.length > 0 ? [{ label: "Consoles", items }] : [];
  }, [navItems, router]);

  const wikiHref = navItems.find((n) => n.routeKey === "/admin/wiki")?.routeKey ?? null;

  const handleSignOut = useCallback(async () => {
    await logout();
    router.push("/admin");
  }, [logout, router]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-canvas p-6 text-body-sm text-text-muted">
        Loading…
      </div>
    );
  }
  if (!isAuthenticated) {
    return <div className="min-h-screen bg-bg-canvas" />;
  }
  if (!catalogLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-canvas p-6 text-body-sm text-text-muted">
        Loading…
      </div>
    );
  }
  if (navItems.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg-canvas p-6 text-center">
        <ShieldCheck className="size-8 text-text-muted" />
        <h1 className="text-heading-sm font-semibold text-text-primary">No admin access</h1>
        <p className="max-w-sm text-body-sm text-text-muted">
          This account has no staff role assigned. Ask a Founder to grant one (roles console, CAP-413).
        </p>
        <a href={`${FORUM_ORIGIN}/feed`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Back to the feed
        </a>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <ConsoleShellProvider value={{ navItems, openPalette: () => setPaletteOpen(true) }}>
        <div className="flex min-h-screen bg-bg-canvas">
          <a
            href="#admin-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-max focus:rounded-md focus:bg-bg-surface focus:px-3 focus:py-2 focus:text-body-sm"
          >
            Skip to content
          </a>

          <aside className="hidden w-[220px] shrink-0 border-r border-border-subtle bg-bg-surface md:flex md:flex-col">
            <AppSidebar navItems={navItems} />
          </aside>

          <DialogPrimitive.Root open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay className="fixed inset-0 z-dropdown bg-black/60 backdrop-blur-[length:var(--blur-overlay)] data-[state=open]:animate-overlay-fade-in data-[state=closed]:animate-overlay-fade-out md:hidden" />
              <DialogPrimitive.Content
                aria-describedby={undefined}
                className={cn(
                  "fixed inset-y-0 left-0 z-dropdown w-[220px] border-r border-border-subtle bg-bg-surface shadow-lg outline-hidden md:hidden",
                  "data-[state=open]:animate-overlay-fade-in data-[state=closed]:animate-overlay-fade-out",
                )}
              >
                <DialogPrimitive.Title className="sr-only">Admin navigation</DialogPrimitive.Title>
                <AppSidebar navItems={navItems} onNavigate={() => setMobileNavOpen(false)} />
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>

          <div className="flex min-w-0 flex-1 flex-col">
            <AppHeader
              onOpenPalette={() => setPaletteOpen(true)}
              onOpenMobileNav={() => setMobileNavOpen(true)}
              onSignOut={() => void handleSignOut()}
              wikiHref={wikiHref}
            />
            <main id="admin-content" className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
              {children}
            </main>
          </div>

          <CommandPalette
            open={paletteOpen}
            onOpenChange={setPaletteOpen}
            sections={paletteSections}
            placeholder="Search admin consoles…"
          />
        </div>
      </ConsoleShellProvider>
    </TooltipProvider>
  );
}
