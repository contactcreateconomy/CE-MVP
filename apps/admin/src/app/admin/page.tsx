"use client";

/**
 * Route: /admin — SLICE-P3-02
 * Landing inside the shell. Widget cards come from the CAP-392 catalog
 * already loaded by the layout (no extra screens).
 */

import Link from "next/link";

import { useConsoleShell } from "@/components/layout/console-shell-context";
import { iconForRoute } from "@/components/layout/nav-config";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLandingPage() {
  const { navItems, openPalette } = useConsoleShell();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Console"
        description="Select a console from the sidebar, or search with ⌘K."
        actions={
          <Button variant="secondary" size="sm" onClick={openPalette}>
            Search consoles
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {navItems.map((item) => {
          const Icon = iconForRoute(item.routeKey);
          return (
            <Link key={item.key} href={item.routeKey} className="block text-text-primary no-underline hover:text-text-primary hover:no-underline">
              <Card className="h-full transition-[border-color,box-shadow] duration-normal ease-out-cubic hover:border-border-prominent hover:shadow-sm">
                <CardHeader className="items-start">
                  <div className="flex size-8 items-center justify-center rounded-md bg-bg-overlay text-text-secondary">
                    <Icon className="size-4" aria-hidden />
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 pt-0">
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.routeKey}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Badge tone="info">{navItems.length} consoles registered</Badge>
    </div>
  );
}
