import { animate, AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { ArrowUpRight, Check, Star } from 'lucide-react'
import { feedback, focusPull, glide, playOnce, staggerChildren, useMotionSafe, usePress } from '../../motion'
import { ToolTile } from './Cover'
import { SOURCE_LABEL, type Frame } from './data'

type Size = 'large' | 'compact'

function I({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { reduced } = useMotionSafe()
  return <motion.div variants={focusPull(reduced)} className={className}>{children}</motion.div>
}

const Overline = ({ frame }: { frame: Frame }) => (
  <p className={`font-mono text-2xs font-medium uppercase tracking-[0.14em] ${frame.source === 'featured' ? 'text-fg-2' : 'text-brand-fg'}`}>
    {SOURCE_LABEL[frame.source]}
  </p>
)

/** Solid brand, no glow at rest. Hover/press: glow (dark) + 1px lift.
 *  The ↗ pulses softly 3× after reveal, then rests; hover wakes it. */
export function PrimaryButton({ children }: { children: string }) {
  const { reduced } = useMotionSafe()
  const press = usePress()
  const [pulsed, setPulsed] = useState(reduced)
  return (
    <motion.button
      {...press} whileHover={reduced ? undefined : { y: -1 }} initial="rest" animate={pulsed ? 'rest' : 'pulse'}
      className="hover-glow inline-flex h-9 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-white transition-shadow"
    >
      {children}
      <motion.span
        className="flex"
        variants={{
          rest: { x: 0, y: 0, transition: feedback },
          pulse: { x: [0, 2, 0], y: [0, -2, 0], transition: { duration: 0.7, ease: 'easeInOut', repeat: 2, repeatDelay: 0.25, delay: 0.6 } },
        }}
        whileHover={reduced ? undefined : { x: 2, y: -2, transition: feedback }}
        onAnimationComplete={(def) => def === 'pulse' && setPulsed(true)}
      >
        <ArrowUpRight size={15} strokeWidth={1.75} />
      </motion.span>
    </motion.button>
  )
}

function CountUp({ id, to }: { id: string; to: number }) {
  const { reduced } = useMotionSafe()
  const [run] = useState(() => !reduced && playOnce(`count-${id}`))
  const [v, setV] = useState(run ? 0 : to)
  useEffect(() => {
    if (!run) return
    const c = animate(0, to, { duration: 1.1, ease: [0.22, 0.8, 0.24, 1], delay: 0.25, onUpdate: setV })
    return () => c.stop()
  }, [run, to])
  return <span className="font-mono tabular-nums">{v.toFixed(1)}</span>
}

function Sparkline({ id, data }: { id: string; data: number[] }) {
  const { reduced } = useMotionSafe()
  const [draw] = useState(() => !reduced && playOnce(`spark-${id}`))
  const max = Math.max(...data)
  const d = data.map((y, i) => `${i ? 'L' : 'M'}${(i / (data.length - 1)) * 64} ${16 - (y / max) * 14}`).join(' ')
  return (
    <svg width="64" height="18" viewBox="-1 -1 66 19" aria-hidden className="overflow-visible">
      <motion.path d={d} fill="none" stroke="var(--brand-fg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: draw ? 0 : 1 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: [0.22, 0.8, 0.24, 1], delay: 0.3 }} />
    </svg>
  )
}

/** Two-option choice: identical at rest; colour only on the picked one, after the tap. */
export function BinaryChoice({ options, picked, onPick }: { options: [string, string]; picked: number | null; onPick: (i: number) => void }) {
  const press = usePress()
  return (
    <div className="flex gap-2" role="group">
      {options.map((label, i) => {
        const on = picked === i
        return (
          <motion.button
            key={label} {...press} onClick={() => picked === null && onPick(i)} aria-pressed={on}
            className={`h-9 min-w-[104px] rounded-full border px-5 text-sm font-semibold transition-colors duration-200 ${on
              ? 'border-transparent bg-brand text-white'
              : 'border-line bg-[color-mix(in_srgb,var(--bg-surface)_60%,transparent)] text-fg backdrop-blur-md hover:border-line-strong'}`}
          >
            {label}
          </motion.button>
        )
      })}
    </div>
  )
}

function DebateAction({ frame, votedInit }: { frame: Extract<Frame, { kind: 'debate' }>; votedInit: boolean }) {
  const { reduced } = useMotionSafe()
  const [picked, setPicked] = useState<number | null>(votedInit ? 0 : null)
  const [showResult, setShowResult] = useState(votedInit)
  const pick = (i: number) => { setPicked(i); setTimeout(() => setShowResult(true), reduced ? 0 : 420) }
  const parts = [{ label: 'Agree', pct: frame.agree }, { label: 'Disagree', pct: 100 - frame.agree }]
  return (
    <AnimatePresence mode="wait" initial={false}>
      {!showResult ? (
        <motion.div key="choice" exit={{ opacity: 0, transition: { duration: 0.15 } }}>
          <BinaryChoice options={['Agree', 'Disagree']} picked={picked} onPick={pick} />
        </motion.div>
      ) : (
        <motion.div key="result" variants={focusPull(reduced)} initial="hidden" animate="shown" className="flex w-[300px] flex-col gap-1.5" aria-live="polite">
          <div className="flex h-2 gap-1 overflow-hidden rounded-full">
            {parts.map((p, i) => (
              <motion.div key={p.label} style={{ width: `${p.pct}%`, originX: i === 0 ? 0 : 1 }}
                initial={votedInit || reduced ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={glide}
                className={`h-full rounded-full ${picked === i ? 'bg-brand' : 'bg-fg-disabled'}`} />
            ))}
          </div>
          <div className="flex justify-between text-xs">
            {parts.map((p, i) => (
              <span key={p.label} className={`flex items-center gap-1 ${picked === i ? 'font-semibold text-fg' : 'text-fg-muted'}`}>
                {picked === i && <Check size={13} strokeWidth={2} className="text-brand-fg" />}
                {p.label} <span className="font-mono">{p.pct}%</span>
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Text side of a frame. Max 3 text lines: label · title · one support line.
 * The block spans the picture's height: label+title on its top edge, action on its bottom edge.
 */
export function frameParts(frame: Frame, large: boolean, debateVoted: boolean) {
  let title: React.ReactNode, line: React.ReactNode, action: React.ReactNode
  switch (frame.kind) {
    case 'post':
      title = frame.title
      line = <>{frame.type} · {frame.summary}</>
      action = <PrimaryButton>Open discussion</PrimaryButton>
      break
    case 'debate':
      title = frame.proposition
      line = <><span className="font-mono text-fg">{frame.votes}</span> creators voted · results after you vote</>
      action = <DebateAction frame={frame} votedInit={debateVoted} />
      break
    case 'tool':
      title = <span className="flex items-center gap-2.5"><ToolTile size={large ? 30 : 24} />{frame.name}</span>
      line = (
        <span className="flex items-center gap-1.5">
          <Star size={14} strokeWidth={1.5} className="fill-[var(--feedback-warning)] text-[var(--feedback-warning)]" />
          <span className="font-semibold text-fg"><CountUp id={frame.id} to={frame.score} /></span>
          <span className="text-fg-disabled">·</span><span className="font-mono">{frame.pricing}</span>
        </span>
      )
      action = <PrimaryButton>See the tool</PrimaryButton>
      break
    case 'topic':
      title = frame.topic
      line = <span className="flex items-center gap-2.5"><span className="font-mono text-[var(--feedback-success)]">{frame.growth}</span><Sparkline id={frame.id} data={frame.spark} /></span>
      action = <PrimaryButton>Explore topic</PrimaryButton>
      break
    case 'milestone':
      title = `${frame.person} reached ${frame.level}`
      line = <><span className="font-mono text-fg">{frame.did.split(' ')[0]}</span> {frame.did.split(' ').slice(1).join(' ')}</>
      action = <PrimaryButton>View profile</PrimaryButton>
      break
    case 'answer':
      title = frame.question
      line = <><span className="font-mono text-fg">{frame.comments}</span> creators weighed in · see where they agree</>
      action = <PrimaryButton>See where they agree</PrimaryButton>
      break
  }

  return { title, line, action }
}

export default function FrameContent({ frame, size, delay = 0, debateVoted, height }: { frame: Frame; size: Size; delay?: number; debateVoted: boolean; height: number }) {
  const { reduced } = useMotionSafe()
  const large = size === 'large'
  const titleCls = `line-clamp-2 font-semibold tracking-tight text-fg ${large ? 'text-[1.625rem] leading-8' : 'text-lg leading-6'}`
  const { title, line, action } = frameParts(frame, large, debateVoted)
  return (
    <motion.div
      variants={staggerChildren(reduced, delay)} initial="hidden" animate="shown" exit={{ opacity: 0, transition: { duration: 0.15 } }}
      className="flex flex-col items-start justify-between" style={{ height }}
    >
      <div className="flex flex-col gap-1.5">
        <I><Overline frame={frame} /></I>
        <I><h2 className={titleCls}>{title}</h2></I>
      </div>
      <I className="w-full"><p className="truncate text-sm text-fg-2">{line}</p></I>
      <I>{action}</I>
    </motion.div>
  )
}

/** Large state: label + title (≤2 lines, word-wrapped) + one line, overlaid on the active card. */
export function FrameOverlay({ frame }: { frame: Frame }) {
  const { reduced } = useMotionSafe()
  const { title, line } = frameParts(frame, false, false)
  return (
    <motion.div
      variants={staggerChildren(reduced, 0.05)} initial="hidden" animate="shown" exit={{ opacity: 0, transition: { duration: 0.15 } }}
      className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-5 pb-4 pt-16 text-white"
    >
      <I><p className={`font-mono text-2xs font-medium uppercase tracking-[0.14em] ${frame.source === 'featured' ? 'text-white/75' : 'text-[var(--brand-300)]'}`}>{SOURCE_LABEL[frame.source]}</p></I>
      <I><h2 className="line-clamp-2 break-normal text-[1.375rem] font-semibold leading-7 tracking-tight [&_*]:text-white">{title}</h2></I>
      <I><p className="truncate text-sm text-white/75 [&_.text-fg]:text-white [&_.text-fg-disabled]:text-white/40">{line}</p></I>
    </motion.div>
  )
}

export function FrameCta({ frame, debateVoted }: { frame: Frame; debateVoted: boolean }) {
  return <>{frameParts(frame, true, debateVoted).action}</>
}
