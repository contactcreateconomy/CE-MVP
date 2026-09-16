"use client";

import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Bell, BookOpen, Menu, Moon, Search, Sun } from "lucide-react";

import { useAuth } from "@cemvp/auth-ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const FORUM_ORIGIN = process.env.NEXT_PUBLIC_FORUM_ORIGIN ?? "http://localhost:3000";

function initials(name: string, email: string): string {
  const source = name.trim() || email.trim();
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? "C") + (parts[1]?.[0] ?? "");
  return letters.toUpperCase().slice(0, 2);
}

export function AppHeader({
  onOpenPalette,
  onOpenMobileNav,
  onSignOut,
  wikiHref,
  className,
}: {
  onOpenPalette: () => void;
  onOpenMobileNav: () => void;
  onSignOut: () => void;
  wikiHref: string | null;
  className?: string;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const envLabel = process.env.NODE_ENV === "development" ? "DEV" : "PROD";
  const roleLabel = user?.role === "admin" ? "administrator" : (user?.role ?? "staff");

  return (
    <header
      className={cn(
        "flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border-subtle bg-bg-surface px-3 md:px-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="md:hidden"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
        >
          <Menu className="size-4" />
        </Button>
        <Badge tone="neutral" className="text-micro">
          {envLabel}
        </Badge>
        <Badge tone="brand" className="hidden text-micro sm:inline-flex">
          {roleLabel}
        </Badge>
        <Badge tone="success" className="hidden text-micro lg:inline-flex">
          normal
        </Badge>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={onOpenPalette}
          aria-label="Open command palette"
          className="hidden min-w-44 justify-between gap-3 text-text-muted sm:inline-flex"
        >
          <span className="flex items-center gap-2">
            <Search className="size-4" />
            <span className="text-label-md">Search…</span>
          </span>
          <kbd className="rounded-sm border border-border-default bg-bg-inset px-1.5 py-0.5 font-mono text-micro text-text-muted">
            ⌘K
          </kbd>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="sm:hidden"
          onClick={onOpenPalette}
          aria-label="Open command palette"
        >
          <Search className="size-4" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          aria-label="Alerts"
          className="relative"
          onClick={() => router.push("/admin/home")}
        >
          <Bell className="size-4" />
        </Button>

        {wikiHref ? (
          <Button
            size="sm"
            variant="ghost"
            aria-label="Admin wiki"
            onClick={() => router.push(wikiHref)}
          >
            <BookOpen className="size-4" />
          </Button>
        ) : null}

        <Button
          size="sm"
          variant="ghost"
          aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          <Sun className="size-4 dark:hidden" />
          <Moon className="hidden size-4 dark:block" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Profile"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 px-1.5")}
          >
              <Avatar className="size-7 ring-1 ring-border-default">
                {user?.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
                <AvatarFallback className="text-micro">
                  {initials(user?.name ?? "", user?.email ?? "")}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-28 truncate text-label-md text-text-secondary lg:inline">
                {user?.name || user?.email || "Staff"}
              </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="truncate text-text-primary">{user?.name || "Staff"}</p>
              <p className="truncate font-normal text-text-muted">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href={`${FORUM_ORIGIN}/feed`} className="no-underline">
                Back to the feed
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => onSignOut()}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
