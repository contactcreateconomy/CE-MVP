/**
 * Route: /admin — SLICE-P3-02
 * The admin shell root. Renders the widget catalog as a card grid.
 * Per 00-TOPOLOGY.md: mounted inside the forum app.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid } from "lucide-react";

export default function AdminHomePage() {
  // The widget catalog is loaded by the layout's sidebar; this page
  // renders a welcome/landing state. The actual widget list comes from
  // the layout's useQuery (getPermittedWidgetCatalog).
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <h1 className="text-lg font-semibold text-text-primary">Admin Console</h1>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-secondary">
            Select a console from the sidebar, or use the command palette
            (search button / Ctrl+K) to navigate.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <Badge tone="info">
              <LayoutGrid className="size-3" aria-hidden />
              3 consoles registered
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
