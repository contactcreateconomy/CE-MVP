/**
 * Createconomy motion system — the single source for all motion.
 *
 * Character: elegant, calm, cinematic. Springs, never linear curves (the
 * skeleton sweep is the only linear loop, and it is CSS, not motion).
 *
 * Rules
 * 1. User-caused motion starts instantly. System-caused changes never move
 *    content under the user's eyes; they wait for a boundary
 *    (`useBoundary` holds a system value until the user is idle).
 * 2. Nothing animates outside the user's point of focus — entrances run
 *    once, in view, and never loop.
 * 3. Max ONE glow moment on screen at a time (`useGlowMoment`).
 * 4. Reduced motion → opacity crossfades only (`useMotionSafe` + every
 *    variant below collapses automatically).
 * 5. Hover adds depth (shadow / surface), never changes layout height.
 */
import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useReducedMotion, type Transition, type Variants } from 'motion/react'

/* ── Spring presets ── */
export const feedback = { type: 'spring', stiffness: 520, damping: 34, mass: 0.6 } as const satisfies Transition
export const settle = { type: 'spring', stiffness: 260, damping: 30 } as const satisfies Transition
export const glide = { type: 'spring', stiffness: 140, damping: 22 } as const satisfies Transition
export const crossfade = { duration: 0.2, ease: 'easeOut' } as const satisfies Transition
export const STAGGER = 0.05

/* ── Reduced motion (OS setting OR prototype simulation) ── */
export const SimulatedReducedMotion = createContext(false)
export function useMotionSafe() {
  const os = useReducedMotion()
  const sim = useContext(SimulatedReducedMotion)
  return { reduced: Boolean(os || sim) }
}

/* ── Signature entrance: FOCUS PULL ── */
const FOCUS_FROM = { opacity: 0, filter: 'blur(10px)', scale: 0.985, y: 6 }
const FOCUS_TO = { opacity: 1, filter: 'blur(0px)', scale: 1, y: 0 }

export function focusPull(reduced: boolean): Variants {
  if (reduced) {
    return {
      hidden: { opacity: 0 },
      shown: { opacity: 1, transition: crossfade },
      exit: { opacity: 0, transition: crossfade },
    }
  }
  return {
    hidden: FOCUS_FROM,
    shown: { ...FOCUS_TO, transition: { ...glide, opacity: { duration: 0.35 }, filter: { duration: 0.4 } } },
    // reverse fade: soften, never travel
    exit: { opacity: 0, filter: 'blur(6px)', scale: 0.985, transition: { duration: 0.18 } },
  }
}

export function staggerChildren(reduced: boolean, delay = 0): Variants {
  return {
    hidden: {},
    shown: { transition: { staggerChildren: reduced ? 0 : STAGGER, delayChildren: delay } },
  }
}

/** Convenience: `<motion.div {...useFocusPull()} />` */
export function useFocusPull() {
  const { reduced } = useMotionSafe()
  return { variants: focusPull(reduced), initial: 'hidden', animate: 'shown', exit: 'exit' } as const
}

/** Press feedback for buttons — instant, on the feedback spring. */
export function usePress() {
  const { reduced } = useMotionSafe()
  return reduced ? {} : { whileTap: { scale: 0.94 }, transition: feedback }
}

/* ── Rule 3: one glow moment at a time ──
 * Claimants are ranked by priority (ties → most recent). Only the top one
 * glows. Priorities: 1 ambient CTA (hero, tab bar) · 2 Start Discussion ·
 * 3 user focus (search). Unmount / want=false releases the claim. */
export const GLOW = { ambient: 1, startDiscussion: 2, focus: 3 } as const
let glowClaims: { id: string; pri: number; at: number }[] = []
let glowOwner: string | null = null
let glowSeq = 0
const glowSubs = new Set<() => void>()
function recompute() {
  const top = [...glowClaims].sort((a, b) => b.pri - a.pri || b.at - a.at)[0]
  glowOwner = top?.id ?? null
  glowSubs.forEach((f) => f())
}
export function useGlowMoment(id: string, want: boolean, pri: number = GLOW.ambient) {
  const owner = useSyncExternalStore(
    (cb) => (glowSubs.add(cb), () => glowSubs.delete(cb)),
    () => glowOwner,
  )
  useEffect(() => {
    if (!want) return
    glowClaims = [...glowClaims.filter((c) => c.id !== id), { id, pri, at: ++glowSeq }]
    recompute()
    return () => {
      glowClaims = glowClaims.filter((c) => c.id !== id)
      recompute()
    }
  }, [id, want, pri])
  return want && owner === id
}

/* ── Rule 2 helper: things that run "once" per session (count-ups, draws, teases) ── */
const played = new Set<string>()
export function playOnce(key: string) {
  if (played.has(key)) return false
  played.add(key)
  return true
}
export function sessionOnce(key: string) {
  try {
    if (sessionStorage.getItem(key)) return false
    sessionStorage.setItem(key, '1')
  } catch {}
  return true
}

/* ── Rule 1: system changes wait for a boundary ── */
export function useBoundary<T>(value: T, busy: boolean, idleMs = 600) {
  const [shown, setShown] = useState(value)
  const t = useRef<number>(0)
  useEffect(() => {
    window.clearTimeout(t.current)
    if (!busy) t.current = window.setTimeout(() => setShown(value), idleMs)
    return () => window.clearTimeout(t.current)
  }, [value, busy, idleMs])
  return shown
}
