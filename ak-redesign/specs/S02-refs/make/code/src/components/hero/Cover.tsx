import type { FrameKind } from './data'

export const photo = (id: string, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`

/** Real photo covers — creator / tech themes. */
export const COVER_PHOTO: Record<FrameKind, string> = {
  post: '1741466071751-c62474d2d3ae',
  answer: '1515879218367-8466d910aaa4',
  debate: '1764096534662-a194a348c4a0',
  tool: '1519217651866-847339e674d4',
  topic: '1516259762381-22954d7d3ad2',
  milestone: '1604072366595-e75dc92d6bdc',
}

export default function Cover({ kind, className = '', w = 800 }: { kind: FrameKind; className?: string; w?: number }) {
  return (
    <img
      src={photo(COVER_PHOTO[kind], w)} alt="" draggable={false} loading="eager"
      className={`block h-full w-full select-none bg-overlay object-cover ${className}`}
    />
  )
}

/** Illustrated tool logo tile. */
export function ToolTile({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden className="shrink-0 rounded-md">
      <rect width="44" height="44" rx="10" fill="var(--brand-600)" />
      <path d="M12 30 C16 14, 28 14, 32 30" fill="none" stroke="var(--brand-50)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="22" cy="16" r="3.5" fill="var(--brand-200)" />
    </svg>
  )
}
