/**
 * Feed card — one skeleton for every type:
 * identity · kind chip · title · FACET · why-care-now · footer.
 * Frost LOOK (no live blur). No glow at rest.
 */
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import {
  Bookmark, Check, EyeOff, Flag, Gem, HelpCircle, Link2, MessageCircle, MoreHorizontal, Orbit, Pin, Share2, ThumbsDown, VolumeX, X,
} from 'lucide-react'
import { feedback, focusPull, glide, settle, useMotionSafe, usePress } from '../motion'
import { AiAvatar, Avatar, LogoMark } from './Brand'
import { photo, ToolTile } from './hero/Cover'
import { BinaryChoice } from './hero/FrameContent'
import type { Author, Facet, Post, Relationship, Stage } from './feedData'

const Mono = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => <span className={`font-mono tabular-nums ${className}`}>{children}</span>

/* ── identity ── */
function Face({ a, size = 32 }: { a: Author; size?: number }) {
  if (a.kind === 'ai') return <AiAvatar size={size} />
  if (a.kind === 'editorial') return <span className="flex shrink-0 items-center justify-center rounded-full bg-[var(--text-primary)] text-[var(--bg-canvas)]" style={{ width: size, height: size }}><LogoMark size={size * 0.5} /></span>
  return <Avatar seed={a.seed} size={size} />
}
const Label = ({ children }: { children: string }) => <span className="rounded-full border border-line px-1.5 py-px text-2xs font-medium text-fg-2">{children}</span>

/* ── facets ── */
function Stars({ v, className = '' }: { v: number; className?: string }) {
  return <span className={`inline-flex items-center gap-1 ${className}`}><span className="text-[var(--feedback-warning)]">★</span><Mono>{Number.isInteger(v) ? v : v.toFixed(1)}</Mono></span>
}
function ToolChip({ name, extra }: { name: string; extra?: React.ReactNode }) {
  return (
    <button className="inline-flex h-7 items-center gap-1.5 rounded-full border border-line-subtle bg-surface pl-1 pr-2.5 text-xs text-fg transition-colors hover:border-line">
      <ToolTile size={20} /><span className="font-medium">{name}</span>{extra}
    </button>
  )
}

function DebateFacet({ f }: { f: Extract<Facet, { t: 'debate' }> }) {
  const { reduced } = useMotionSafe()
  const [picked, setPicked] = useState<number | null>(null)
  const parts = [{ label: 'Agree', pct: f.agree }, { label: 'Disagree', pct: 100 - f.agree }]
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-fg-muted"><Mono className="text-fg-2">{f.votes + (picked !== null ? 1 : 0)}</Mono> voted</p>
      {picked === null ? (
        <BinaryChoice options={['Agree', 'Disagree']} picked={picked} onPick={setPicked} />
      ) : (
        <motion.div variants={focusPull(reduced)} initial="hidden" animate="shown" className="flex max-w-[360px] flex-col gap-1.5" aria-live="polite">
          <div className="flex h-2 gap-1 overflow-hidden rounded-full">
            {parts.map((p, i) => (
              <motion.div key={p.label} style={{ width: `${p.pct}%`, originX: i ? 1 : 0 }} initial={reduced ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={glide}
                className={`h-full rounded-full ${picked === i ? 'bg-brand' : 'bg-fg-disabled'}`} />
            ))}
          </div>
          <div className="flex justify-between text-xs">
            {parts.map((p, i) => (
              <span key={p.label} className={`flex items-center gap-1 ${picked === i ? 'font-semibold text-fg' : 'text-fg-muted'}`}>
                {picked === i && <Check size={13} strokeWidth={2} className="text-brand-fg" />}{p.label} <Mono>{p.pct}%</Mono>
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

function FacetView({ f }: { f: Facet }) {
  switch (f.t) {
    case 'review':
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            <ToolChip name={f.tool.name} extra={<Mono className="text-fg-muted">{f.tool.price}</Mono>} />
            <span className="text-fg-muted">Verdict <Stars v={f.verdict} className="font-semibold text-fg" /></span>
            <span className="text-fg-muted">Community <Stars v={f.community} className="text-fg-2" /></span>
          </div>
          <ul className="grid gap-0.5 text-xs text-fg-2">
            <li className="flex gap-1.5"><span className="w-3 font-mono text-[var(--feedback-success)]">+</span>{f.pro}</li>
            <li className="flex gap-1.5"><span className="w-3 font-mono text-error">−</span>{f.con}</li>
          </ul>
        </div>
      )
    case 'compare':
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">{f.tools.map((t) => <ToolChip key={t.name} name={t.name} extra={<Stars v={t.score} className="text-fg-2" />} />)}</div>
          <p className="flex items-center gap-2 text-xs text-fg-muted">
            {f.row.label}:
            {f.row.values.map((v, i) => <span key={i} className="text-fg-2">{i > 0 && <span className="mr-2 text-fg-disabled">/</span>}{v}</span>)}
          </p>
        </div>
      )
    case 'debate': return <DebateFacet f={f} />
    case 'help':
      return (
        <div className="flex items-center gap-2.5 text-xs">
          <p className="min-w-0 flex-1 truncate text-fg-2">{f.problem}</p>
          {f.resolvedBy
            ? <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--feedback-success)_14%,transparent)] px-2 py-0.5 font-medium text-[var(--feedback-success)]">Resolved ✓ by @{f.resolvedBy}</span>
            : <span className="shrink-0 rounded-full border border-line px-2 py-0.5 font-medium text-fg-2">Open</span>}
        </div>
      )
    case 'list':
      return (
        <ol className="flex flex-col gap-1 text-xs">
          {f.items.map(([t, v], i) => (
            <li key={t} className="flex items-center gap-2"><Mono className="w-3 text-fg-muted">{i + 1}</Mono><span className="flex-1 text-fg-2">{t}</span><Mono className="text-fg-muted">▲ {v}</Mono></li>
          ))}
          <li className="pl-5 text-fg-muted">+<Mono>{f.more}</Mono> more</li>
        </ol>
      )
    case 'showcase':
      return (
        <div className="flex items-center gap-2.5 text-xs">
          <p className="min-w-0 flex-1 truncate text-fg-2">{f.thing}</p>
          {f.link && <span className="inline-flex shrink-0 items-center gap-1 text-fg-2"><Link2 size={13} strokeWidth={1.5} />Project link <Check size={12} strokeWidth={2} className="text-[var(--feedback-success)]" /></span>}
        </div>
      )
    case 'news':
      return <p className="flex items-center gap-2 text-xs"><span className="min-w-0 flex-1 truncate text-fg-2">{f.claim}</span><span className="shrink-0 font-mono text-fg-muted">{f.domain}</span></p>
    case 'spark': return null
  }
}

/* ── why-care-now: one fixed-height line; relationship beats life stage ── */
function whyLine(p: Post, stage: Stage, rel: Relationship): { text: React.ReactNode; detail?: string; expandable?: boolean } {
  if (rel === 'author') return { text: <><Mono>412</Mono> saw this · <Mono>18</Mono> valued · <Mono>3</Mono> saved</>, detail: ' · only you see this' }
  if (rel === 'commented') return { text: <><Mono>3</Mono> replies since you left</>, detail: ' · one mentions you' }
  if (rel === 'expert') return { text: 'Unanswered · in your topic', detail: " · you've helped 12 people here" }
  switch (stage) {
    case 'new': return { text: 'First look · be one of the first to weigh in', detail: ' · posted minutes ago' }
    case 'rising': return { text: <><span className="text-brand-fg">↗ Rising</span> · <Mono>14</Mono> valued in the last 3h</>, detail: ` · faster than most ${p.type} posts` }
    case 'evergreen': return { text: 'Still valued 3 months later', detail: ' · 6 valued this week' }
    case 'resurfacing': return { text: <>Back in discussion · <Mono>9</Mono> new replies</>, detail: ' · last reply 8m ago' }
    case 'established': return p.best ? { text: p.best, expandable: true } : { text: 'Still valued 3 months later' }
  }
}
function WhyLine(props: { p: Post; stage: Stage; rel: Relationship }) {
  const w = whyLine(props.p, props.stage, props.rel)
  const [open, setOpen] = useState(false)
  if (w.expandable) {
    const [who, ...rest] = String(w.text).split(':')
    return (
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="block w-full text-left">
        <motion.p layout="size" transition={settle} className={`text-xs leading-5 text-fg-2 ${open ? 'line-clamp-3' : 'line-clamp-1'}`}>
          <span className="font-medium text-fg">{who}:</span>{rest.join(':')}
        </motion.p>
      </button>
    )
  }
  return (
    <p className="h-5 truncate text-xs leading-5 text-fg-2">
      {w.text}
      {w.detail && <span className="text-fg-muted opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">{w.detail}</span>}
    </p>
  )
}

/* ── footer actions ── */
function Valuable({ count }: { count: number }) {
  const [on, setOn] = useState(false)
  const [burst, setBurst] = useState(0)
  const burned = useRef(false)
  const { reduced } = useMotionSafe()
  const press = usePress()
  const n = count + (on ? 1 : 0)
  return (
    <motion.button {...press} aria-pressed={on} aria-label={`Valuable${n ? `, ${n}` : ''}`}
      onClick={() => { setOn((v) => !v); if (!on && !burned.current) { burned.current = true; setBurst((b) => b + 1) } }}
      className={`relative inline-flex h-8 items-center gap-1.5 rounded-full px-2 text-xs transition-colors ${on ? 'text-brand-fg' : 'text-fg-muted hover:bg-surface hover:text-fg'}`}>
      {burst > 0 && !reduced && (
        <motion.span key={burst} aria-hidden className="glow-celebrate pointer-events-none absolute inset-0 rounded-full"
          initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.6, times: [0, 0.3, 1] }} />
      )}
      <motion.span animate={on && !reduced ? { scale: [1, 1.25, 1] } : { scale: 1 }} transition={feedback} className="flex">
        <Gem size={15} strokeWidth={1.5} className={on ? 'fill-[var(--brand-tint)]' : ''} />
      </motion.span>
      {n > 0 && (
        <span className="relative h-4 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={n} className="block font-mono tabular-nums" initial={{ y: reduced ? 0 : 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: reduced ? 0 : -10, opacity: 0 }} transition={feedback}>{n}</motion.span>
          </AnimatePresence>
        </span>
      )}
    </motion.button>
  )
}
function SaveBtn() {
  const [on, setOn] = useState(false)
  const press = usePress()
  return (
    <motion.button {...press} aria-pressed={on} aria-label={on ? 'Saved' : 'Save'} onClick={() => setOn((v) => !v)}
      className={`inline-flex size-8 items-center justify-center rounded-full transition-colors ${on ? 'text-brand-fg' : 'text-fg-muted hover:bg-surface hover:text-fg'}`}>
      <motion.span key={String(on)} initial={{ scale: on ? 0.6 : 1 }} animate={{ scale: 1 }} transition={feedback} className="flex">
        <Bookmark size={15} strokeWidth={1.5} className={on ? 'fill-current' : ''} />
      </motion.span>
    </motion.button>
  )
}

/* ── ⋯ menu + why sheet ── */
function CardMenu({ p, onHide }: { p: Post; onHide: () => void }) {
  const [open, setOpen] = useState<null | 'menu' | 'why'>(null)
  const ref = useRef<HTMLDivElement>(null)
  const fp = focusPull(useMotionSafe().reduced)
  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(null)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
    addEventListener('pointerdown', close); addEventListener('keydown', esc)
    return () => { removeEventListener('pointerdown', close); removeEventListener('keydown', esc) }
  }, [open])
  const items = [
    { icon: HelpCircle, label: 'Why am I seeing this?', fn: () => setOpen('why') },
    { icon: ThumbsDown, label: 'See fewer like this', fn: onHide },
    { icon: EyeOff, label: 'Hide', fn: onHide },
    { icon: VolumeX, label: `Mute @${p.author.handle}`, fn: () => setOpen(null) },
    { icon: Flag, label: 'Report', fn: () => setOpen(null) },
  ]
  return (
    <div ref={ref} className="relative">
      <button aria-label="More options" aria-expanded={!!open} onClick={() => setOpen(open ? null : 'menu')} className="flex size-8 items-center justify-center rounded-full text-fg-muted hover:bg-surface hover:text-fg">
        <MoreHorizontal size={16} strokeWidth={1.5} />
      </button>
      <AnimatePresence mode="wait">
        {open === 'menu' && (
          <motion.div key="m" role="menu" variants={fp} initial="hidden" animate="shown" exit="exit" className="glass-strong absolute right-0 top-full mt-1 w-56 origin-top-right rounded-lg p-1 shadow-lg" style={{ zIndex: 'var(--z-dropdown)' }}>
            {items.map(({ icon: I, label, fn }) => (
              <button key={label} role="menuitem" onClick={fn} className={`flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm hover:bg-surface ${label === 'Report' ? 'text-error' : 'text-fg-2 hover:text-fg'}`}>
                <I size={15} strokeWidth={1.5} />{label}
              </button>
            ))}
          </motion.div>
        )}
        {open === 'why' && (
          <motion.div key="w" role="dialog" aria-label="Why you're seeing this" variants={fp} initial="hidden" animate="shown" exit="exit" className="glass-strong absolute right-0 top-full mt-1 w-72 origin-top-right rounded-lg p-4 shadow-lg" style={{ zIndex: 'var(--z-dropdown)' }}>
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold text-fg">Why you're seeing this</p>
              <button aria-label="Close" onClick={() => setOpen(null)} className="-mr-1.5 -mt-1.5 flex size-7 items-center justify-center rounded-full text-fg-muted hover:text-fg"><X size={14} strokeWidth={1.5} /></button>
            </div>
            <ul className="mt-2 flex flex-col gap-1.5 text-sm text-fg-2">
              <li>· Rising in {p.type} this week</li>
              <li>· You follow {p.topic} on your StellarMap</li>
              <li>· New posts get a fair first look</li>
            </ul>
            <button onClick={onHide} className="mt-3 h-8 rounded-full border border-line px-3 text-xs font-medium text-fg hover:bg-surface">See less of {p.topic}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── card ── */
export type CardOpts = { compact?: boolean; coverVariant: 'A' | 'B'; stage: Stage; rel: Relationship }

export default function FeedCard({ p, compact, coverVariant, stage, rel }: { p: Post } & CardOpts) {
  const { reduced } = useMotionSafe()
  const [hidden, setHidden] = useState(false)
  const you = rel === 'author'
  const author = you ? { ...p.author, name: 'You', kind: 'human' as const, seed: 0 } : p.author
  const spark = p.type === 'Spark'
  const coverRight = p.cover && (!compact || coverVariant === 'A')
  const coverFull = p.cover && compact && coverVariant === 'B'

  return (
    <motion.div layout transition={settle}>
      <AnimatePresence mode="popLayout" initial={false}>
        {hidden ? (
          <motion.div key="h" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={settle}
            className="card-frost flex h-11 items-center justify-between rounded-lg px-4 text-sm text-fg-muted">
            Hidden
            <button onClick={() => setHidden(false)} className="font-medium text-fg hover:text-brand-fg">Undo</button>
          </motion.div>
        ) : (
          <motion.article key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }}
            whileHover={reduced || compact ? undefined : { y: -1 }} transition={settle}
            className={`group/card card-frost rounded-lg shadow-sm transition-shadow hover:shadow-md ${compact ? 'p-3.5' : 'p-4'}`}>
            {p.pinned && <p className="mb-2 flex items-center gap-1.5 text-2xs font-medium text-fg-muted"><Pin size={12} strokeWidth={1.5} />Pinned by Createconomy</p>}

            {/* 1 identity */}
            <header className="flex items-center gap-2.5">
              <Face a={author} />
              <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
                <span className="truncate font-semibold text-fg">{author.name}</span>
                {author.kind !== 'editorial' && <span title={`Level ${author.level}`} aria-label={`Level ${author.level}`} className="text-brand-fg"><Orbit size={13} strokeWidth={1.75} /></span>}
                {author.kind === 'ai' && <Label>AI persona</Label>}
                {author.kind === 'editorial' && <Label>Createconomy</Label>}
                <span className="shrink-0 text-xs text-fg-muted">· <Mono>{p.time}</Mono>{p.updated && <span> · Updated</span>}</span>
              </div>
              <CardMenu p={p} onHide={() => setHidden(true)} />
            </header>

            <div className={`mt-3 flex gap-4`}>
              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                {/* 2 kind chip */}
                <p className="flex items-center gap-1 text-xs">
                  <button className="font-medium text-brand-fg hover:underline">{p.type}</button>
                  <span className="text-fg-disabled">·</span>
                  <button className="text-fg-2 hover:text-fg hover:underline">{p.topic}</button>
                </p>
                {/* 3 title */}
                <h3 className={`font-semibold tracking-tight text-fg ${spark ? 'text-xl leading-7' : 'text-base leading-6'}`}>{p.title}</h3>
                {coverFull && <img src={photo(p.cover!, 700)} alt="" className="aspect-[16/9] w-full rounded-md bg-overlay object-cover" />}
                {/* 4 facet */}
                <FacetView f={p.facet} />
              </div>
              {coverRight && (
                <img src={photo(p.cover!, 400)} alt="" className={`shrink-0 rounded-md bg-overlay object-cover ${compact ? 'size-[84px]' : 'h-[100px] w-[148px]'}`} />
              )}
            </div>

            {/* 5 why-care-now */}
            <div className="mt-3 border-t border-line-subtle pt-2.5"><WhyLine p={p} stage={stage} rel={rel} /></div>

            {/* 6 footer */}
            <footer className="-mx-1 mt-1.5 flex items-center justify-between">
              <div className="flex items-center">
                <Valuable count={p.valuable} />
                <button className="inline-flex h-8 items-center gap-1.5 rounded-full px-2 text-xs text-fg-muted hover:bg-surface hover:text-fg" aria-label={`${p.comments} comments`}>
                  <MessageCircle size={15} strokeWidth={1.5} /><Mono>{p.comments}</Mono>
                </button>
                <SaveBtn />
                <button aria-label="Share" className="inline-flex size-8 items-center justify-center rounded-full text-fg-muted hover:bg-surface hover:text-fg"><Share2 size={15} strokeWidth={1.5} /></button>
              </div>
              <div className="flex items-center gap-2 text-xs text-fg-muted">
                <span className="flex -space-x-1.5">{p.faces.map((s) => <span key={s} className="rounded-full ring-2 ring-[var(--bg-surface)]"><Avatar seed={s} size={20} /></span>)}</span>
                {!compact && <span><Mono className="text-fg-2">{p.discussing}</Mono> discussing</span>}
                {compact && <Mono className="text-fg-2">{p.discussing}</Mono>}
              </div>
            </footer>
          </motion.article>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
