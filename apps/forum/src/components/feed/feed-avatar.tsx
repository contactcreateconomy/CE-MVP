import { cn } from "@/lib/utils";

import type { FeedPerson } from "./feed-display-types";

const SIZE = {
  xs: "size-6 text-micro",
  sm: "size-7 text-micro",
  md: "size-9 text-label-sm",
  lg: "size-11 text-label-md",
} as const;

function initials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return letters || "?";
}

export interface FeedAvatarProps {
  person: FeedPerson;
  size?: keyof typeof SIZE;
  className?: string;
}

/** Image when `avatarUrl` exists, otherwise initials on a neutral surface
 *  (CR-003 fallback). Plain <img>: avatar hosts are not in next/image's
 *  remotePatterns and the size is tiny. */
export function FeedAvatar({ person, size = "md", className }: FeedAvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-default bg-bg-overlay font-semibold text-text-primary",
        SIZE[size],
        className,
      )}
    >
      {person.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.avatarUrl} alt="" className="size-full object-cover" loading="lazy" />
      ) : (
        <span aria-hidden>{initials(person.name)}</span>
      )}
      <span className="sr-only">{person.name}</span>
    </span>
  );
}

/** "AI" label for persona identities — AI disclosure, always visible. */
export function PersonaLabel({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-4 shrink-0 items-center rounded-sm border border-border-active/60 px-1 text-micro font-semibold uppercase text-brand-primary",
        className,
      )}
    >
      AI
    </span>
  );
}
