"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Flame, Bookmark, TrendingUp, Clock3 } from "lucide-react";

import { cn } from "@/lib/utils";

const sortItems = [
  { key: "top", label: "Top", Icon: TrendingUp },
  { key: "hot", label: "Hot", Icon: Flame },
  { key: "new", label: "New", Icon: Clock3 },
  { key: "fav", label: "Fav", Icon: Bookmark },
] as const;

export function TrendSorter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawSort = searchParams.get("sort");
  const selectedSort = rawSort && sortItems.some((item) => item.key === rawSort) ? rawSort : "top";
  const activeIndex = sortItems.findIndex((item) => item.key === selectedSort);

  return (
    <div className="relative mx-auto w-full max-w-[864px] rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)]/70 p-1 backdrop-blur-md">
      <div
        className="pointer-events-none absolute bottom-1 left-1 top-1 w-[calc(25%-0.25rem)] rounded-full bg-[var(--brand-primary)] transition-transform duration-300 ease-out shadow-[0_8px_24px_rgba(14,165,233,0.28)]"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />

      <div className="relative z-10 grid grid-cols-4">
        {sortItems.map(({ key, label, Icon }) => {
          const isActive = selectedSort === key;
          const next = new URLSearchParams(searchParams.toString());
          next.set("sort", key);

          return (
            <Link
              key={key}
              href={`${pathname}?${next.toString()}`}
              className={cn(
                "flex h-9 items-center justify-center gap-1.5 rounded-full text-base font-semibold transition-colors duration-200",
                isActive
                  ? "text-black"
                  : "text-[var(--text-primary)] hover:text-[var(--brand-primary)]",
              )}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
