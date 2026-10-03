import {
  GitCompare,
  HelpCircle,
  Home,
  LayoutList,
  Newspaper,
  Sparkles,
  Star,
  Swords,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Icon + accent per product post type (the current set is final — founder,
 * 2026-10-03). Accents are the STYLE-KIT `--cat-*` tokens; the prototype's
 * per-slide rgb accents are replaced by these. Labels are NOT here: they
 * come from data (postTypeConfig.label) per COPY-1.
 */
export interface PostTypeMeta {
  Icon: LucideIcon;
  /** Text colour class (icon tint). */
  text: string;
  /** Soft wash for hero image fallbacks. */
  wash: string;
}

const META: Record<string, PostTypeMeta> = {
  news: { Icon: Newspaper, text: "text-cat-news", wash: "bg-cat-news/15" },
  review: { Icon: Star, text: "text-cat-review", wash: "bg-cat-review/15" },
  compare: { Icon: GitCompare, text: "text-cat-compare", wash: "bg-cat-compare/15" },
  help: { Icon: HelpCircle, text: "text-cat-help", wash: "bg-cat-help/15" },
  spark: { Icon: Zap, text: "text-cat-spark", wash: "bg-cat-spark/15" },
  debate: { Icon: Swords, text: "text-cat-debate", wash: "bg-cat-debate/15" },
  list: { Icon: LayoutList, text: "text-cat-list", wash: "bg-cat-list/15" },
  showcase: { Icon: Sparkles, text: "text-cat-showcase", wash: "bg-cat-showcase/15" },
};

const FALLBACK: PostTypeMeta = { Icon: Sparkles, text: "text-brand-primary", wash: "bg-brand-primary/15" };
const HOME: PostTypeMeta = { Icon: Home, text: "text-brand-primary", wash: "bg-brand-primary/15" };

export function postTypeMeta(type: string | null | undefined): PostTypeMeta {
  if (type === "home") return HOME;
  return (type && META[type]) || FALLBACK;
}
