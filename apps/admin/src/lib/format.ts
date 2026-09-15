export function fmtCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".0", "")}K`;
  return String(n);
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPoints(value: number): string {
  return `${new Intl.NumberFormat("en-US").format(value)} pts`;
}

export function formatRelativeDate(value: string): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) {
    const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-rose-500",
];

export function avatarBg(id: string): string {
  let hash = 0;
  for (const c of id) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
