import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  BookOpen,
  ClipboardList,
  Gauge,
  Handshake,
  Home,
  Link2,
  Store,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";

/**
 * Visual grouping for CAP-392 permitted widgets. Groups are presentation
 * only — they do not add screens. Unknown routeKeys fall into Other.
 * `/admin/personas/genome` is never listed (shell contract §1).
 */
export interface NavItem {
  key: string;
  title: string;
  routeKey: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const ROUTE_META: Record<string, { group: string; order: number; icon: LucideIcon }> = {
  "/admin/home": { group: "Overview", order: 1, icon: Home },
  "/admin/moderation": { group: "Trust", order: 10, icon: ShieldAlert },
  "/admin/support": { group: "Trust", order: 11, icon: Handshake },
  "/admin/audit": { group: "Trust", order: 12, icon: ClipboardList },
  "/admin/config": { group: "Operations", order: 20, icon: Settings2 },
  "/admin/roles": { group: "Operations", order: 21, icon: Users },
  "/admin/affiliate-inventory": { group: "Operations", order: 22, icon: Store },
  "/admin/wiki": { group: "Operations", order: 23, icon: BookOpen },
  "/admin/readiness": { group: "Platform", order: 30, icon: ShieldCheck },
  "/admin/reliability": { group: "Platform", order: 31, icon: Activity },
  "/admin/analytics": { group: "Growth", order: 40, icon: BarChart3 },
  "/admin/utm": { group: "Growth", order: 41, icon: Link2 },
  "/admin/seo": { group: "Growth", order: 42, icon: Search },
};

const GROUP_ORDER = ["Overview", "Trust", "Operations", "Platform", "Growth", "Other"];

export function iconForRoute(routeKey: string): LucideIcon {
  return ROUTE_META[routeKey]?.icon ?? Gauge;
}

export function groupNavItems(items: NavItem[]): NavGroup[] {
  const buckets = new Map<string, NavItem[]>();
  for (const item of items) {
    if (item.routeKey === "/admin/personas/genome") continue;
    const group = ROUTE_META[item.routeKey]?.group ?? "Other";
    const list = buckets.get(group) ?? [];
    list.push(item);
    buckets.set(group, list);
  }
  return GROUP_ORDER.flatMap((label) => {
    const list = buckets.get(label);
    if (!list?.length) return [];
    list.sort((a, b) => (ROUTE_META[a.routeKey]?.order ?? 99) - (ROUTE_META[b.routeKey]?.order ?? 99));
    return [{ label, items: list }];
  });
}
