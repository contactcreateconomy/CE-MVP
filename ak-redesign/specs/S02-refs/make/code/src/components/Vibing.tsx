/**
 * What's Vibing — what is moving right now. One hook at a time.
 * Rotation is sequential, never overlapping: outgoing fades + softly blurs
 * out (180ms), then incoming focus-pulls in: context → hook → meta (60ms apart).
 */
import { AnimatePresence, motion, type Variants } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Pause, Play, TrendingUp } from 'lucide-react'
import { focusPull, useMotionSafe } from '../motion'

export type VibingState = 'playing' | 'paused' | 'quiet' | 'featured'
type Hook = { context: string; short: string; hook: string; engaged: string; featured?: boolean }

const HOOKS: Hook[] = [
  { context: 'Trending in Review', short: 'Cursor reviews doubled', hook: 'Cursor reviews doubled since Monday → “Is Cursor still worth $20?”', engaged: '1,189' },
  { context: 'Trending in Debate', short: '“Label AI posts” at 62% agree', hook: '214 votes in a day on “AI-written posts should carry a label”', engaged: '864' },
  { context: 'Trending in Agents', short: 'Agent posts up 340%', hook: 'Agent posts up 340% this week → “Six weeks running my studio on three agents”', engaged: '2,031' },
  { context: 'Trending in Help', short: '27 answers on prompt pricing', hook: '27 answers in 6 hours → “How do I price a prompt bundle for agencies?”', engaged: '512' },
  { context: 'Trending in Showcase', short: 'Loomwright hit 4.4 stars', hook: 'Loomwright climbed to 4.4 stars from 212 ratings in its first week', engaged: '743' },
]
const QUIET: Hook = { ...HOOKS[2], context: 'Top across Createconomy' }
const PERIOD = 6000


/** Rotation clock: pausable without losing progress. */
function useRotation(n: number, paused: boolean) {
  const [i, setI] = useState(0)
  const elapsed = useRef(0)
  useEffect(() => {
    if (paused || n < 2) return
    let last = performance.now()
    const id = setInterval(() => {
      const now = performance.now()
      elapsed.current += now - last
      last = now
      if (elapsed.current >= PERIOD) { elapsed.current = 0; setI((x) => (x + 1) % n) }
    }, 100)
    return () => clearInterval(id)
  }, [paused, n])
  return i % Math.max(n, 1)
}

function hooksFor(state: VibingState, lens: string | null) {
  if (state === 'quiet') return [QUIET]
  if (state === 'featured') return [{ ...HOOKS[4], featured: true }, ...HOOKS.slice(0, 4)]
  if (lens) {
    const own = HOOKS.filter((h) => h.context.endsWith(lens))
    return own.length ? [...own, ...HOOKS.filter((h) => !own.includes(h))] : HOOKS
  }
  return HOOKS
}

/** Staggered in, blurred out — shared by card + ticker. */
function useSeq() {
  const { reduced } = useMotionSafe()
  const container: Variants = {
    hidden: {},
    shown: { transition: { staggerChildren: reduced ? 0 : 0.06 } },
    exit: { opacity: 0, filter: reduced ? 'none' : 'blur(4px)', transition: { duration: 0.18 } },
  }
  return { container, item: focusPull(reduced) }
}

export function VibingCard({ state, lens }: { state: VibingState; lens: string | null }) {
  const [hold, setHold] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  useEffect(() => setUserPaused(state === 'paused'), [state])
  const list = hooksFor(state, lens)
  const i = useRotation(list.length, hold || userPaused)
  const h = list[i]
  const { container, item } = useSeq()

  return (
    <section
      aria-label="What's Vibing" aria-roledescription="rotating highlights"
      onPointerEnter={() => setHold(true)} onPointerLeave={() => setHold(false)}
      onFocus={() => setHold(true)} onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setHold(false)}
      className="group/v rail-frost rounded-lg p-2.5 transition-shadow hover:shadow-md"
    >
      <header className="flex h-7 items-center gap-2 px-1">
        <TrendingUp size={15} strokeWidth={1.5} className="text-brand-fg" />
        <h2 className="flex-1 text-sm font-semibold text-fg">What's Vibing</h2>
        {list.length > 1 && (
          <button onClick={() => setUserPaused((p) => !p)} aria-label={userPaused ? 'Resume rotation' : 'Pause rotation'}
            className="flex size-7 items-center justify-center rounded-full text-fg-muted opacity-0 transition-opacity hover:bg-surface hover:text-fg focus-visible:opacity-100 group-hover/v:opacity-100 group-focus-within/v:opacity-100">
            {userPaused ? <Play size={12} strokeWidth={1.75} /> : <Pause size={12} strokeWidth={1.75} />}
          </button>
        )}
      </header>

      <a href="#" aria-live={hold || userPaused ? 'polite' : 'off'}
        className={`group mt-2 block h-[180px] rounded-md border bg-[color-mix(in_srgb,var(--bg-surface)_70%,transparent)] p-4 transition-colors hover:border-line ${h.featured ? 'border-line-active' : 'border-line-subtle'}`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={`${state}-${i}`} variants={container} initial="hidden" animate="shown" exit="exit" className="flex h-full flex-col">
            <motion.p variants={item} className="flex items-center gap-1.5 text-xs font-medium text-brand-fg">
              {h.featured && <span className="rounded-full border border-line-active px-1.5 font-mono text-2xs uppercase tracking-wider">Featured</span>}
              {state === 'quiet' ? <span>Quiet in {lens ?? 'Debate'} today · <span className="text-fg-muted">{h.context.replace('Top', 'top')}</span></span> : h.context}
            </motion.p>
            <motion.p variants={item} className="mt-2 line-clamp-3 text-[0.9375rem] font-semibold leading-[1.375rem] text-fg">{h.hook}</motion.p>
            <motion.div variants={item} className="mt-auto flex items-center justify-between">
              <span className="font-mono text-2xs uppercase tracking-[0.12em] text-fg-muted"><span className="text-fg-2">{h.engaged}</span> engaged</span>
              <ArrowUpRight size={15} strokeWidth={1.5} className="text-fg-muted transition-transform group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-fg" />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </a>
    </section>
  )
}

/** Mobile: one-line ticker under the sorter. Same sequence, pauses on touch. */
export function VibingTicker({ state, lens }: { state: VibingState; lens: string | null }) {
  const [hold, setHold] = useState(false)
  const list = hooksFor(state, lens)
  const i = useRotation(list.length, hold || state === 'paused')
  const h = list[i]
  const { container, item } = useSeq()
  return (
    <a
      href="#" aria-label={`What's Vibing: ${h.context}, ${h.short}`}
      onTouchStart={() => setHold(true)} onTouchEnd={() => setTimeout(() => setHold(false), 1500)}
      className="flex h-9 items-center gap-2 overflow-hidden rounded-full border border-line-subtle bg-[color-mix(in_srgb,var(--bg-surface)_70%,transparent)] px-3"
    >
      <TrendingUp size={14} strokeWidth={1.5} className="shrink-0 text-brand-fg" />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={`${state}-${i}`} variants={container} initial="hidden" animate="shown" exit="exit" className="flex min-w-0 flex-1 items-center gap-1 whitespace-nowrap text-xs">
          <motion.span variants={item} className="shrink-0 text-brand-fg">{state === 'quiet' ? `Quiet in ${lens ?? 'Debate'}` : h.featured ? 'Featured' : h.context}</motion.span>
          <motion.span variants={item} className="truncate text-fg-2">· {h.short}</motion.span>
          <motion.span variants={item} className="shrink-0 text-fg-muted">→</motion.span>
        </motion.span>
      </AnimatePresence>
    </a>
  )
}
