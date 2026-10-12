/**
 * Hero — a trailer for what's best right now. Never auto-rotates.
 * States: large (cover-flow) · compact (cascade) · subject band · absent.
 */
import { AnimatePresence, motion, useInView, type PanInfo } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X } from 'lucide-react'
import { focusPull, glide, sessionOnce, settle, useMotionSafe } from '../../motion'
import IconButton from '../IconButton'
import { HeroSlot } from '../Slots'
import Cover from './Cover'
import FrameContent, { FrameCta, FrameOverlay } from './FrameContent'
import type { Frame } from './data'
import { iconFor, subjectInfo, type Subject } from '../taxonomy'

export type HeroMode = 'large' | 'compact'
const HEIGHT = { large: 360, compact: 208, subject: 120 }
const WHEEL_LOCKOUT_MS = 400
const WHEEL_THRESHOLD = 20

/* ── geometry ── */
const CARD = { large: { w: 480, h: 270 }, compact: { w: 256, h: 144 } }
const STAGE_W = { large: 998, compact: 380 }
const SIDE_GAP = 28 // side cards never touch the active card
function cardTarget(mode: HeroMode, offset: number, reduced: boolean) {
  const { w, h } = CARD[mode]
  const d = Math.abs(offset)
  if (mode === 'large') {
    // centred cover-flow: active big, sits high so the CTA row below stays clear
    const base = { width: w, height: h, x: offset * (w / 2 + SIDE_GAP + (w * 0.8) / 2) - w / 2, y: -h / 2 - 21 }
    if (reduced) return { ...base, x: -w / 2, opacity: d === 0 ? 1 : 0 }
    // no blur on waiting slides — depth is scale + brightness + a slight turn
    return { ...base, z: -d * 60, rotateY: -offset * 14, scale: d ? 0.8 : 1, opacity: 1, filter: `blur(0px) brightness(${d ? 0.45 : 1})` }
  }
  const base = { width: w, height: h, x: STAGE_W.compact / 2 - w - 12 - offset * 56, y: -h / 2 }
  if (reduced) return { ...base, x: STAGE_W.compact / 2 - w - 12, opacity: d === 0 ? 1 : 0 }
  return { ...base, z: -offset * 70, rotateY: offset * 10, scale: 1 - offset * 0.14, opacity: [1, 1, 0.9][d], filter: `blur(0px) brightness(${[1, 0.55, 0.42][d]})` }
}
function visibleOffsets(mode: HeroMode, n: number) {
  if (mode === 'compact') return Array.from({ length: Math.min(n, 3) }, (_, i) => i)
  const before = Math.min(1, Math.floor((n - 1) / 2))
  const after = Math.min(1, n - 1 - before)
  return Array.from({ length: before + after + 1 }, (_, i) => i - before)
}

function Showcase({ frames, mode, setMode, debateVoted, teaseRun }: { frames: Frame[]; mode: HeroMode; setMode: (m: HeroMode) => void; debateVoted: boolean; teaseRun: number }) {
  const { reduced } = useMotionSafe()
  const n = frames.length
  const [index, setIndex] = useState(0)
  const [settledId, setSettledId] = useState<string | null>(null)
  const [teasing, setTeasing] = useState<boolean | null>(null) // null = not yet in view
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.5 })
  const wheelLocked = useRef(false)
  const active = frames[index % n]

  // tease → reveal: first frame, first time in view, once per session (replayable from the panel)
  useEffect(() => { setTeasing(null); setIndex(0); setSettledId(null) }, [teaseRun])
  useEffect(() => {
    if (teasing !== null || !inView) return
    const play = !reduced && (teaseRun > 0 || sessionOnce('cc-hero-tease'))
    setTeasing(play)
    if (play) {
      const t = setTimeout(() => setTeasing(false), 900)
      return () => clearTimeout(t)
    }
  }, [inView, teasing, reduced, teaseRun])

  useEffect(() => { if (index >= n) setIndex(0) }, [n, index])
  const go = useCallback((dir: 1 | -1) => { if (n > 1) { setSettledId(null); setIndex((i) => (i + dir + n) % n) } }, [n])

  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < WHEEL_THRESHOLD || wheelLocked.current) return
    wheelLocked.current = true
    setTimeout(() => { wheelLocked.current = false }, WHEEL_LOCKOUT_MS)
    go(e.deltaX > 0 ? 1 : -1)
  }
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) * Math.abs(info.velocity.x) > 8000 || Math.abs(info.offset.x) > 80) go(info.offset.x < 0 ? 1 : -1)
  }

  const ready = teasing === false
  const textShown = ready && (reduced || settledId === active.id)

  return (
    <div
      ref={ref} tabIndex={0} role="region" aria-roledescription="showcase" aria-label="Best on Createconomy right now"
      onKeyDown={(e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1) }}
      onWheel={onWheel}
      className="absolute inset-0 flex items-stretch rounded-xl outline-none"
    >
      {/* stage */}
      <motion.div
        className="relative shrink-0 touch-pan-y"
        animate={{ width: STAGE_W[mode] }} transition={reduced ? { duration: 0 } : glide}
        style={{ perspective: mode === 'large' ? 1200 : 900, perspectiveOrigin: mode === 'large' ? '50% 50%' : '70% 50%', maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)' }}
        drag={n > 1 ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.1} dragSnapToOrigin onDragEnd={onDragEnd}
      >
        <div className="absolute left-1/2 top-1/2" style={{ transformStyle: 'preserve-3d' }}>
          <AnimatePresence initial={false}>
            {visibleOffsets(mode, n).map((o) => {
              const f = frames[(index + o + n) % n]
              const center = o === 0
              const t = cardTarget(mode, o, reduced)
              const tease = center && teasing !== false && !reduced
              return (
                <motion.div
                  key={f.id}
                  className="absolute left-0 top-0 overflow-hidden rounded-xl"
                  style={{ transformStyle: 'preserve-3d', zIndex: 10 - Math.abs(o) }}
                  initial={{ ...t, opacity: 0 }}
                  animate={tease ? { ...t, scale: 1.07, filter: 'blur(14px) brightness(0.6)' } : t}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                  transition={reduced ? { duration: 0.2 } : glide}
                  onAnimationComplete={() => { if (center && !tease) setSettledId(f.id) }}
                >
                  <div className={`relative h-full w-full rounded-xl ${center ? 'shadow-lg' : 'shadow-md'} ${f.source === 'featured' ? 'ring-1 ring-inset ring-line-active' : ''}`}>
                    <Cover kind={f.kind} />
                    <AnimatePresence>{mode === 'large' && center && textShown && <FrameOverlay key={f.id} frame={f} />}</AnimatePresence>
                    {f.source === 'featured' && (
                      <span className="absolute left-2.5 top-2.5 rounded-full bg-elevated/90 px-2 py-0.5 font-mono text-2xs font-medium uppercase tracking-wider text-fg">Featured</span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* text (compact only — large overlays it on the card) */}
      {mode === 'compact' && <div className={`relative flex min-w-0 flex-1 items-center pl-2 pr-14`}>
        <AnimatePresence mode="wait">
          {textShown && (
            <FrameContent key={`${active.id}-${mode}`} frame={active} size={mode} delay={reduced ? 0 : 0.08} debateVoted={debateVoted} height={CARD[mode].h} />
          )}
        </AnimatePresence>
      </div>}

      {/* controls */}
      <div className="absolute right-3 top-3">
        <IconButton size={30} label={mode === 'large' ? 'Make smaller' : 'Make larger'} onClick={() => setMode(mode === 'large' ? 'compact' : 'large')}>
          {mode === 'large' ? <Minimize2 size={14} strokeWidth={1.5} /> : <Maximize2 size={14} strokeWidth={1.5} />}
        </IconButton>
      </div>
      {mode === 'large' && (
        <div className="absolute bottom-3 right-3 flex items-center gap-3">
          {n > 1 && (
            <div className="flex items-center rounded-full border border-line-subtle bg-surface/60">
              <IconButton size={30} label="Previous" tooltipSide="top" onClick={() => go(-1)}><ChevronLeft size={15} strokeWidth={1.5} /></IconButton>
              <span className="min-w-9 text-center font-mono text-2xs tabular-nums text-fg-2" aria-live="polite">{index + 1} / {n}</span>
              <IconButton size={30} label="Next" tooltipSide="top" onClick={() => go(1)}><ChevronRight size={15} strokeWidth={1.5} /></IconButton>
            </div>
          )}
          <div className="flex h-9 items-center">
            <AnimatePresence mode="wait">
              {textShown && <motion.div key={active.id} variants={focusPull(reduced)} initial="hidden" animate="shown" exit="exit"><FrameCta frame={active} debateVoted={debateVoted} /></motion.div>}
            </AnimatePresence>
          </div>
        </div>
      )}
      {mode === 'compact' && n > 1 && (
        <div className="absolute bottom-3 right-3 flex items-center rounded-full border border-line-subtle bg-surface/60 backdrop-blur-md">
          <IconButton size={30} label="Previous" tooltipSide="top" onClick={() => go(-1)}><ChevronLeft size={15} strokeWidth={1.5} /></IconButton>
          <span className="min-w-9 text-center font-mono text-2xs tabular-nums text-fg-2" aria-live="polite">{index + 1} / {n}</span>
          <IconButton size={30} label="Next" tooltipSide="top" onClick={() => go(1)}><ChevronRight size={15} strokeWidth={1.5} /></IconButton>
        </div>
      )}
    </div>
  )
}

function SubjectBand({ subject }: { subject: Subject }) {
  const { reduced } = useMotionSafe()
  const s = subjectInfo(subject)
  const Icon = iconFor(subject)
  return (
    <div className="absolute inset-0 flex items-center gap-5 px-5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand-fg"><Icon size={22} strokeWidth={1.5} /></span>
      <div className="min-w-0 flex-1">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.h2 key={subject} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="text-xl font-semibold tracking-tight text-fg">{subject}</motion.h2>
        </AnimatePresence>
        <motion.p key={`s-${subject}`} variants={focusPull(reduced)} initial="hidden" animate="shown" className="mt-0.5 truncate text-sm text-fg-2">
          {s.stats.map(([n, l], i) => (
            <span key={l}>{i > 0 && <span className="mx-2 text-fg-disabled">·</span>}<span className="font-mono text-fg">{n}</span> {l}</span>
          ))}
        </motion.p>
      </div>
      <motion.a key={`t-${subject}`} href="#" variants={focusPull(reduced)} initial="hidden" animate="shown" className="flex w-[300px] shrink-0 items-center gap-3 rounded-lg border border-line-subtle bg-surface p-2 transition-shadow hover:shadow-md">
        <span className="h-[54px] w-24 shrink-0 overflow-hidden rounded-md"><Cover kind={s.top.kind} /></span>
        <span className="min-w-0">
          <span className="block font-mono text-2xs uppercase tracking-wider text-brand-fg">Top this week</span>
          <span className="line-clamp-2 text-sm font-medium leading-5 text-fg">{s.top.title}</span>
        </span>
      </motion.a>
    </div>
  )
}

export default function Hero({ frames, mode, setMode, subject, ready, debateVoted, teaseRun }: {
  frames: Frame[]; mode: HeroMode | 'absent'; setMode: (m: HeroMode) => void; subject: Subject; ready: boolean; debateVoted: boolean; teaseRun: number
}) {
  const { reduced } = useMotionSafe()
  if (mode === 'absent' || frames.length === 0) return null
  const band = subject !== 'All'
  const h = band ? HEIGHT.subject : HEIGHT[mode]
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {!ready ? (
        <motion.div key="skeleton" exit={{ opacity: 0, transition: { duration: 0.25 } }}><HeroSlot /></motion.div>
      ) : (
        <motion.section
          key="hero" aria-label="Highlights"
          variants={focusPull(reduced)} initial="hidden" animate="shown"
          className="glass-strong relative overflow-hidden rounded-xl"
        >
          <motion.div initial={false} animate={{ height: h }} transition={reduced ? { duration: 0.2 } : glide} className="relative">
            <AnimatePresence initial={false}>
              <motion.div key={band ? `band` : 'show'} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={settle}>
                {band ? <SubjectBand subject={subject} /> : <Showcase frames={frames} mode={mode} setMode={setMode} debateVoted={debateVoted} teaseRun={teaseRun} />}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}

/** Mobile: no hero — a one-row subject header under the top bar. */
export function MobileSubjectHeader({ subject, onClear }: { subject: Subject; onClear: () => void }) {
  const fp = focusPull(useMotionSafe().reduced)
  return (
    <AnimatePresence>
      {subject !== 'All' && (() => {
        const Icon = iconFor(subject)
        const s = subjectInfo(subject)
        return (
          <motion.div key={subject} variants={fp} initial="hidden" animate="shown" exit="exit" className="flex h-12 items-center gap-2.5 rounded-lg border border-line-subtle bg-elevated pl-3 pr-1">
            <Icon size={18} strokeWidth={1.5} className="text-brand-fg" />
            <span className="text-sm font-semibold text-fg">{subject}</span>
            <span className="flex-1 truncate text-xs text-fg-muted">
              <span className="font-mono text-fg-2">{s.stats[0][0]}</span> {s.stats[0][1]} · <span className="font-mono text-fg-2">{s.stats[2][0]}</span> {s.stats[2][1]}
            </span>
            <button aria-label={`Show all, clear ${subject}`} onClick={onClear} className="flex size-11 items-center justify-center rounded-full text-fg-2 hover:text-fg"><X size={16} strokeWidth={1.5} /></button>
          </motion.div>
        )
      })()}
    </AnimatePresence>
  )
}
