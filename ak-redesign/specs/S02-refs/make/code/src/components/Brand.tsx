import { motion } from 'motion/react'
import { glide, useMotionSafe } from '../motion'

/** Logo mark with the 3-segment reveal: semicircle → quarter → square (~500ms). */
export function LogoMark({ size = 28, reveal = false }: { size?: number; reveal?: boolean }) {
  const { reduced } = useMotionSafe()
  const seg = (i: number, from: object) =>
    reveal
      ? reduced
        ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2, delay: i * 0.1 } }
        : { initial: { opacity: 0, ...from }, animate: { opacity: 1, x: 0, y: 0, scale: 1 }, transition: { ...glide, stiffness: 220, delay: i * 0.15 } }
      : {}
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden className="shrink-0 text-fg">
      {/* dark mode: gaps widened ~15% (8 → 9.2) so they read equal to light mode */}
      <g className="logo-a"><motion.path d="M46 4 A46 46 0 0 0 46 96 Z" fill="currentColor" {...seg(0, { x: -18 })} /></g>
      <g className="logo-b"><motion.path d="M54 4 A42 42 0 0 1 96 46 L54 46 Z" fill="currentColor" {...seg(1, { y: -14 })} style={{ transformOrigin: '54px 46px' }} /></g>
      <g className="logo-c"><motion.rect x="54" y="54" width="42" height="42" fill="currentColor" {...seg(2, { scale: 0.6 })} style={{ transformOrigin: '75px 75px' }} /></g>
    </svg>
  )
}

export function Wordmark({ reveal, size }: { reveal?: boolean; size?: number }) {
  return (
    <a href="#" className="flex items-center gap-2.5 rounded-md" aria-label="Createconomy home">
      <LogoMark reveal={reveal} size={size} />
      <span className="text-base font-semibold tracking-tight text-fg">Createconomy</span>
    </a>
  )
}

/** Human avatars are real photos. */
const FACES = ['1544005313-94ddf0286df2', '1507003211169-0a1dd7228f2d', '1607569708758-0270aa4651bd', '1600603406200-5b2a104684ac', '1604072366595-e75dc92d6bdc']
export function Avatar({ seed = 0, size = 32 }: { seed?: number; size?: number }) {
  const id = FACES[seed % FACES.length]
  return (
    <img
      src={`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&crop=faces&w=${size * 3}&h=${size * 3}&q=70`}
      alt="" width={size} height={size} draggable={false}
      className="shrink-0 rounded-full bg-overlay object-cover" style={{ width: size, height: size }}
    />
  )
}

/** AI personas: illustrated, clearly non-human (geometric glyph, never a face). */
export function AiAvatar({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0 rounded-full">
      <rect width="40" height="40" rx="20" fill="var(--brand-900)" />
      <path d="M20 8 L31 14.5 V25.5 L20 32 L9 25.5 V14.5Z" fill="none" stroke="var(--brand-300)" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="4" fill="var(--brand-300)" />
    </svg>
  )
}
