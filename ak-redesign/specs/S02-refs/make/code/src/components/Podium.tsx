/**
 * Podium — recognition of people and contributions. The time window follows
 * the sorter. Rows say WHAT someone did, in plain words; never opaque points.
 */
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Check, ChevronDown, Crown, Pin, X } from 'lucide-react'
import { focusPull, settle, useMotionSafe, usePress } from '../motion'
import { AiAvatar, Avatar } from './Brand'
import { ToolTile } from './hero/Cover'
import { PEOPLE } from './feedData'
import type { Tab } from './Sorter'

export type Dim = 'overall' | 'commenters' | 'helpers' | 'reviewers' | 'solutions' | 'rising' | 'tools' | 'ai'
export const DIMS: [Dim, string][] = [
  ['overall', 'Overall'], ['commenters', 'Top commenters'], ['helpers', 'Top helpers'], ['reviewers', 'Top reviewers'],
  ['solutions', 'Top solutions'], ['rising', 'Rising'], ['tools', 'Top tools'], ['ai', 'Top AI personas'],
]
export const dimLabel = (d: Dim) => DIMS.find(([k]) => k === d)![1]
export const WINDOW: Record<Tab, string> = { top: 'this month', hot: 'this week', new: 'today', fav: 'this week' }

type Row = { name: string; seed: number; level: string; did: string; kind?: 'ai' | 'tool'; excerpt?: string }
const humans = [PEOPLE.maya, PEOPLE.rachel, PEOPLE.lina, PEOPLE.dev, PEOPLE.theo]
const nums = [38, 31, 24, 19, 15]
const DID: Partial<Record<Dim, (n: number) => string>> = {
  overall: (n) => `${n * 3} contributions valued`,
  commenters: (n) => `${n} comments valued`,
  helpers: (n) => `${n} answers valued`,
  reviewers: (n) => `${Math.round(n / 3)} reviews found helpful`,
  rising: (n) => `+${n * 4} valued, up from 3`,
}
function rowsFor(d: Dim): Row[] {
  if (d === 'tools') return [['Loomwright', 4.6], ['Cursor', 4.4], ['Descript', 4.3], ['Framer', 4.2], ['Riverside', 4.1]].map(([name, s], i) => ({ name: name as string, seed: i, level: `★ ${s}`, did: `${[212, 640, 388, 271, 190][i]} ratings`, kind: 'tool' }))
  if (d === 'ai') return ['Atlas', 'Quill', 'Ledger', 'Muse', 'Relay'].map((name, i) => ({ name, seed: i, level: 'AI persona', did: `valued by ${[412, 296, 210, 148, 97][i]} people`, kind: 'ai' }))
  if (d === 'solutions') return [
    'Dedupe on the charge id, not the customer id.', 'Price the bundle per seat band, not per seat.', 'Write the rules file before the first prompt.',
    'Chapters first, captions second — search does the rest.', 'Batch your invoices on Fridays with one Make scenario.',
  ].map((excerpt, i) => ({ ...humans[i], excerpt, did: `${nums[i]} found it solved theirs` }))
  return humans.map((h, i) => ({ ...h, did: DID[d]!(nums[i]) }))
}

/** Numbers in Geist Mono. */
const nums2 = (t: string) => t.split(/(\+?\d[\d,.]*)/).map((x, i) => (i % 2 ? <span key={i} className="font-mono">{x}</span> : x))

const CROWN = ['#e8b400', '#a8b0bd', '#c47a43']
function Rank({ i }: { i: number }) {
  return i < 3
    ? <Crown size={15} strokeWidth={1.75} style={{ color: CROWN[i], fill: `${CROWN[i]}33` }} aria-label={`Rank ${i + 1}`} />
    : <span className="w-[15px] text-center font-mono text-xs tabular-nums text-fg-muted">{i + 1}</span>
}
function RowFace({ r, size = 28 }: { r: Row; size?: number }) {
  if (r.kind === 'ai') return <AiAvatar size={size} />
  if (r.kind === 'tool') return <ToolTile size={size} />
  return <Avatar seed={r.seed} size={size} />
}

function Peek({ r, onClose }: { r: Row; onClose: () => void }) {
  const fp = focusPull(useMotionSafe().reduced)
  return (
    <motion.div role="dialog" aria-label={`${r.name} profile`} variants={fp} initial="hidden" animate="shown" exit="exit"
      className="glass-strong absolute right-full top-0 mr-3 w-64 origin-right rounded-lg p-4 shadow-lg" style={{ zIndex: 'var(--z-dropdown)' }}>
      <div className="flex items-start gap-3">
        <RowFace r={r} size={44} />
        <div className="min-w-0 flex-1"><p className="font-semibold text-fg">{r.name}</p><p className="text-xs text-fg-muted">Level {r.level}</p></div>
        <button aria-label="Close" onClick={onClose} className="-mr-1.5 -mt-1.5 flex size-7 items-center justify-center rounded-full text-fg-muted hover:text-fg"><X size={14} strokeWidth={1.5} /></button>
      </div>
      <p className="mt-3 font-mono text-2xs uppercase tracking-wider text-fg-muted">Top topics</p>
      <div className="mt-1.5 flex flex-wrap gap-1">{['Agents', 'Pricing', 'Automation'].map((t) => <span key={t} className="rounded-full bg-overlay px-2 py-0.5 text-2xs text-fg-2">{t}</span>)}</div>
      <p className="mt-3 font-mono text-2xs uppercase tracking-wider text-fg-muted">Recently valued</p>
      <ul className="mt-1.5 flex flex-col gap-1 text-xs text-fg-2">
        <li className="truncate">· The handoff checklist I use with agents</li>
        <li className="truncate">· Answer: pricing prompt bundles by seat band</li>
        <li className="truncate">· Review: Loomwright after a month</li>
      </ul>
      <button className="mt-3 h-8 w-full rounded-full border border-line text-xs font-medium text-fg hover:bg-surface">View profile</button>
    </motion.div>
  )
}

function Rows({ dim, count = 5, peekable }: { dim: Dim; count?: number; peekable?: boolean }) {
  const { reduced } = useMotionSafe()
  const [peek, setPeek] = useState<number | null>(null)
  useEffect(() => setPeek(null), [dim])
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.ol key={dim} initial="hidden" animate="shown" exit="exit"
        variants={{ hidden: {}, shown: { transition: { staggerChildren: reduced ? 0 : 0.04 } }, exit: { opacity: 0, transition: { duration: 0.15 } } }}
        className="flex flex-col">
        {rowsFor(dim).slice(0, count).map((r, i) => (
          <motion.li key={r.name} variants={focusPull(reduced)} className="relative">
            <button onClick={() => peekable && r.kind !== 'tool' && setPeek(peek === i ? null : i)}
              className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left hover:bg-surface">
              <Rank i={i} />
              <RowFace r={r} />
              <span className="min-w-0 flex-1">
                {r.excerpt
                  ? <><span className="line-clamp-1 text-xs font-medium text-fg">“{r.excerpt}”</span><span className="block truncate text-2xs text-fg-muted">{r.name} · {nums2(r.did)}</span></>
                  : <><span className="block truncate text-sm font-medium text-fg">{r.name}</span><span className="block truncate text-2xs text-fg-muted">{nums2(r.did)}</span></>}
              </span>
              {!r.excerpt && <span className="shrink-0 text-2xs text-fg-muted">{r.level}</span>}
            </button>
            <AnimatePresence>{peek === i && <Peek r={r} onClose={() => setPeek(null)} />}</AnimatePresence>
          </motion.li>
        ))}
      </motion.ol>
    </AnimatePresence>
  )
}

function DimPicker({ dim, setDim, align = 'right' }: { dim: Dim; setDim: (d: Dim) => void; align?: 'right' | 'left' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const fp = focusPull(useMotionSafe().reduced)
  useEffect(() => {
    if (!open) return
    const c = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    addEventListener('pointerdown', c)
    return () => removeEventListener('pointerdown', c)
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="listbox" className="flex h-7 items-center gap-1 rounded-full border border-line-subtle px-2.5 text-xs font-medium text-fg-2 hover:border-line hover:text-fg">
        {dimLabel(dim)} <ChevronDown size={12} strokeWidth={1.75} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul role="listbox" variants={fp} initial="hidden" animate="shown" exit="exit"
            className={`glass-strong absolute top-full mt-1 w-48 rounded-lg p-1 shadow-lg ${align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'}`} style={{ zIndex: 'var(--z-dropdown)' }}>
            {DIMS.map(([k, l]) => (
              <li key={k}><button role="option" aria-selected={dim === k} onClick={() => { setDim(k); setOpen(false) }}
                className={`flex h-8 w-full items-center justify-between rounded-md px-2.5 text-sm hover:bg-surface ${dim === k ? 'text-brand-fg' : 'text-fg-2'}`}>
                {l}{dim === k && <Check size={13} strokeWidth={2} />}
              </button></li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

export type PodiumProps = {
  dim: Dim; setDim: (d: Dim) => void; pinned: Dim[]; window: string
  member: boolean; forming: boolean; standing: boolean; onExpand: () => void
}

export function PodiumWidget(p: PodiumProps) {
  return (
    <section aria-label="Podium" className="rail-frost rounded-lg p-2.5">
      <header className="flex items-center gap-2 px-1">
        <h2 className="flex-1 text-sm font-semibold text-fg">Podium <span className="font-normal text-fg-muted">· {p.window}</span></h2>
        <DimPicker dim={p.dim} setDim={p.setDim} />
      </header>
      {p.pinned.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1 px-1">
          {p.pinned.map((d) => (
            <button key={d} onClick={() => p.setDim(d)} className={`h-6 rounded-full px-2 text-2xs font-medium ${p.dim === d ? 'bg-overlay text-brand-fg' : 'text-fg-muted hover:text-fg'}`}>{dimLabel(d)}</button>
          ))}
        </div>
      )}
      <div className="mt-2">
        {p.forming ? (
          <div className="rounded-md border border-dashed border-line px-3 py-5 text-center">
            <p className="text-sm font-medium text-fg">Forming</p>
            <p className="mt-0.5 text-xs text-fg-muted">needs <span className="font-mono">25</span> contributors (<span className="font-mono">12</span> so far)</p>
          </div>
        ) : <Rows dim={p.dim} peekable />}
      </div>
      {p.member && p.standing && !p.forming && (
        <div className="mt-1 flex items-center gap-2.5 rounded-md border border-line-subtle bg-surface/60 px-1.5 py-1.5">
          <span className="w-[15px] text-center"><Pin size={12} strokeWidth={1.75} className="text-fg-muted" /></span>
          <Avatar seed={0} size={28} />
          <span className="min-w-0 flex-1 text-xs"><span className="font-semibold text-fg">You · <span className="font-mono">#14</span></span><span className="block truncate text-2xs text-fg-muted"><span className="font-mono">3</span> valued from the top 10</span></span>
        </div>
      )}
      <button onClick={p.onExpand} className="mt-2 flex h-8 w-full items-center justify-center gap-1 rounded-full text-xs font-medium text-fg-2 hover:bg-surface hover:text-fg">
        Full leaderboard <ArrowUpRight size={13} strokeWidth={1.75} />
      </button>
    </section>
  )
}

/** Mobile in-feed card: dimension chips scroll, top 3, See leaderboard. */
export function PodiumFeedCard(p: PodiumProps) {
  return (
    <section aria-label="Podium" className="card-frost rounded-lg p-3.5">
      <h2 className="text-sm font-semibold text-fg">Podium <span className="font-normal text-fg-muted">· {p.window}</span></h2>
      <div className="no-scrollbar -mx-3.5 mt-2 flex gap-1.5 overflow-x-auto px-3.5">
        {DIMS.map(([k, l]) => (
          <button key={k} onClick={() => p.setDim(k)} className={`h-7 shrink-0 rounded-full border px-2.5 text-xs font-medium ${p.dim === k ? 'border-transparent bg-brand text-white' : 'border-line-subtle text-fg-2'}`}>{l}</button>
        ))}
      </div>
      <div className="mt-2">{p.forming ? <p className="py-3 text-center text-xs text-fg-muted">Forming · needs <span className="font-mono">25</span> contributors (<span className="font-mono">12</span> so far)</p> : <Rows dim={p.dim} count={3} />}</div>
      <button onClick={p.onExpand} className="mt-1 flex h-9 w-full items-center justify-center gap-1 rounded-full border border-line-subtle text-xs font-medium text-fg hover:bg-surface">See leaderboard <ArrowUpRight size={13} strokeWidth={1.75} /></button>
    </section>
  )
}

/** Full Leaderboard page: explicit windows, top 50, Add to my Podium (max 3). */
export function LeaderboardPage({ dim, setDim, pinned, setPinned, onBack, compact }: {
  dim: Dim; setDim: (d: Dim) => void; pinned: Dim[]; setPinned: (d: Dim[]) => void; onBack: () => void; compact?: boolean
}) {
  const { reduced } = useMotionSafe()
  const press = usePress()
  const [win, setWin] = useState<'24H' | '7D' | '1M'>('7D')
  const isPinned = pinned.includes(dim)
  const full = !isPinned && pinned.length >= 3
  const base = rowsFor(dim)
  const scale = { '24H': 0.2, '7D': 1, '1M': 3.4 }[win]
  const rows = Array.from({ length: 50 }, (_, i) => {
    const r = base[i % base.length]
    const n = Math.max(1, Math.round((60 - i) * scale))
    return { ...r, name: i < 5 ? r.name : `${r.name.split(' ')[0]} ${String.fromCharCode(65 + (i % 26))}.`, n }
  })
  return (
    <motion.section variants={focusPull(reduced)} initial="hidden" animate="shown" aria-label="Leaderboard" className={`rail-frost rounded-xl ${compact ? 'p-3.5' : 'p-6'}`}>
      <button onClick={onBack} className="-ml-1 flex h-8 items-center gap-1.5 rounded-full px-2 text-sm text-fg-2 hover:bg-surface hover:text-fg"><ArrowLeft size={15} strokeWidth={1.5} />Back to feed</button>
      <div className={`mt-3 flex ${compact ? 'flex-col gap-3' : 'items-end justify-between'}`}>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Leaderboard</h1>
          <p className="text-sm text-fg-muted">{dimLabel(dim)} · top <span className="font-mono">50</span></p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-line-subtle p-0.5" role="tablist" aria-label="Time window">
            {(['24H', '7D', '1M'] as const).map((w) => (
              <button key={w} role="tab" aria-selected={win === w} onClick={() => setWin(w)} className="relative h-7 rounded-full px-3 font-mono text-xs">
                {win === w && <motion.span layoutId="lb-win" transition={settle} className="absolute inset-0 rounded-full bg-brand" />}
                <span className={`relative ${win === w ? 'text-white' : 'text-fg-2'}`}>{w}</span>
              </button>
            ))}
          </div>
          <motion.button {...press} disabled={full} onClick={() => setPinned(isPinned ? pinned.filter((d) => d !== dim) : [...pinned, dim])}
            title={full ? 'You can pin up to 3' : undefined}
            className={`flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors disabled:opacity-40 ${isPinned ? 'border-transparent bg-brand-tint text-brand-fg' : 'border-line text-fg hover:bg-surface'}`}>
            {isPinned ? <Check size={13} strokeWidth={2} /> : <Pin size={13} strokeWidth={1.5} />}
            {isPinned ? 'On my Podium' : 'Add to my Podium'}
          </motion.button>
        </div>
      </div>
      <div className="no-scrollbar -mx-1 mt-4 flex gap-1 overflow-x-auto px-1">
        {DIMS.map(([k, l]) => (
          <button key={k} onClick={() => setDim(k)} className={`flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-xs font-medium ${dim === k ? 'bg-overlay text-brand-fg' : 'text-fg-2 hover:bg-surface hover:text-fg'}`}>
            {l}{pinned.includes(k) && <Pin size={11} strokeWidth={1.75} />}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.ol key={`${dim}-${win}`} initial="hidden" animate="shown" exit={{ opacity: 0, transition: { duration: 0.15 } }}
          variants={{ hidden: {}, shown: { transition: { staggerChildren: reduced ? 0 : 0.015 } } }}
          className={`mt-3 grid gap-x-6 ${compact ? '' : 'grid-cols-2'}`}>
          {rows.map((r, i) => (
            <motion.li key={i} variants={focusPull(reduced)} className="flex items-center gap-3 border-b border-line-subtle py-2">
              <Rank i={i} /><RowFace r={r} size={28} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">{r.excerpt ? `“${r.excerpt}”` : r.name}</span>
                <span className="block truncate text-2xs text-fg-muted">{r.excerpt ? `${r.name} · ` : ''}{nums2(r.did.replace(/\d[\d,.]*/, String(r.n)))}</span>
              </span>
              <span className="shrink-0 text-2xs text-fg-muted">{r.level}</span>
            </motion.li>
          ))}
        </motion.ol>
      </AnimatePresence>
    </motion.section>
  )
}
