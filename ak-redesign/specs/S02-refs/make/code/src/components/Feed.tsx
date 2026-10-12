/**
 * Centre column feed. Entrances (focus pull, staggered) run ONLY on first
 * load and on pagination / new-post insertion — nothing animates on scroll.
 */
import { AnimatePresence, motion } from 'motion/react'
import { Fragment, useMemo, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { focusPull, staggerChildren, useMotionSafe, usePress } from '../motion'
import FeedCard, { type CardOpts } from './FeedCard'
import { NEW_POSTS, POSTS, type Post, type Relationship, type Stage } from './feedData'
import { FeedSlot } from './Slots'

export type FeedProps = {
  ready: boolean; compact?: boolean; coverVariant: 'A' | 'B'
  typeFilter: string; stage: Stage | 'auto'; rel: Relationship
  newPill: boolean; setNewPill: (v: boolean) => void
  caughtUp: boolean; thin: boolean; lens: string | null
  podiumCard?: React.ReactNode
}

function Batch({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { reduced } = useMotionSafe()
  return <motion.div variants={staggerChildren(reduced, 0.04)} initial="hidden" animate="shown" className={`flex flex-col gap-3 ${className}`}>{children}</motion.div>
}
function In({ children }: { children: React.ReactNode }) {
  const { reduced } = useMotionSafe()
  return <motion.div variants={focusPull(reduced)}>{children}</motion.div>
}
function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-1 text-xs text-fg-muted" role="separator">
      <span className="h-px flex-1 bg-line" />{children}<span className="h-px flex-1 bg-line" />
    </div>
  )
}

const matches = (p: Post, s: string) => p.type === s || p.topic === s

export default function Feed(f: FeedProps) {
  const press = usePress()
  const [fresh, setFresh] = useState<Post[]>([])
  const [pages, setPages] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  const opts = (p: Post, i: number): CardOpts => ({
    compact: f.compact, coverVariant: f.coverVariant,
    stage: f.stage === 'auto' ? p.stage : f.stage,
    // relationship lands on one representative card
    rel: f.rel === 'commented' && i === 1 ? 'commented'
      : f.rel === 'author' && i === 2 ? 'author'
      : f.rel === 'expert' && p.type === 'Help' && !(p.facet.t === 'help' && p.facet.resolvedBy) ? 'expert' : 'none',
  })

  const { main, rest, thinSubject } = useMemo(() => {
    let all = POSTS
    if (f.typeFilter !== 'All') all = all.filter((p) => p.type === f.typeFilter || p.pinned)
    const subject = f.lens ?? (f.thin ? 'Debate' : null)
    if (!subject) return { main: all, rest: [] as Post[], thinSubject: null }
    const own = all.filter((p) => matches(p, subject))
    const isThin = f.thin || own.length < 3
    return { main: own, rest: isThin ? all.filter((p) => !matches(p, subject)) : [], thinSubject: isThin ? subject : null }
  }, [f.typeFilter, f.lens, f.thin])

  if (!f.ready) return <FeedSlot compact={f.compact} />

  const showNew = () => {
    document.querySelector('[data-scroll]')?.scrollTo({ top: 0, behavior: 'smooth' })
    f.setNewPill(false)
    setTimeout(() => setFresh(NEW_POSTS.map((p) => ({ ...p, id: `${p.id}-${Date.now()}` }))), 350)
  }
  const more = () => {
    setLoadingMore(true)
    setTimeout(() => { setLoadingMore(false); setPages((n) => n + 1) }, 900)
  }

  let idx = 0
  const card = (p: Post, key = p.id) => {
    const i = idx++
    return (
      <Fragment key={key}>
        <In><FeedCard p={p} {...opts(p, i)} /></In>
        {f.podiumCard && i === 4 && <In>{f.podiumCard}</In>}
      </Fragment>
    )
  }

  return (
    <section aria-label="Posts" className="relative flex flex-col gap-3">
      {/* new posts pill: floats, never pushes content */}
      <div className={`sticky z-10 h-0 ${f.compact ? 'top-[164px]' : 'top-[84px]'}`}>
        <AnimatePresence>
          {f.newPill && (
            <motion.button {...press} onClick={showNew} variants={focusPull(false)} initial="hidden" animate="shown" exit="exit"
              className="glass-strong absolute left-1/2 top-1 -translate-x-1/2 inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs font-semibold text-fg shadow-md">
              <span className="font-mono">12</span> new posts <ArrowUp size={13} strokeWidth={2} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {fresh.length > 0 && <Batch key={fresh[0].id}>{fresh.map((p) => card(p))}</Batch>}

      <Batch>
        {main.map((p, i) => (
          <Fragment key={p.id}>
            {card(p)}
            {f.caughtUp && !thinSubject && i === 3 && <In><Divider>You're caught up since your last visit</Divider></In>}
          </Fragment>
        ))}
        {thinSubject && (
          <In><Divider>That's all in {thinSubject} · here's all of Createconomy</Divider></In>
        )}
        {rest.map((p) => card(p))}
      </Batch>

      {Array.from({ length: pages }, (_, n) => (
        <Batch key={`page-${n}`}>{POSTS.filter((p) => !p.pinned).slice(0, 4).map((p) => card({ ...p, stage: 'evergreen', time: `${n + 3}d` }, `${p.id}-pg${n}`))}</Batch>
      ))}
      {loadingMore ? <FeedSlot compact={f.compact} /> : (
        <button onClick={more} className="mx-auto h-9 rounded-full border border-line-subtle px-4 text-xs font-medium text-fg-2 hover:border-line hover:text-fg">Show older posts</button>
      )}
    </section>
  )
}
