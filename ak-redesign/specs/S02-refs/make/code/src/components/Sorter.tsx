/**
 * Sorter — Top · Hot · New | Fav. Time windows live in hover notes (desktop)
 * or a once-ever first-tap note (mobile), never on the tabs themselves.
 */
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { focusPull, settle, useMotionSafe, usePress } from '../motion'

export type Tab = 'top' | 'hot' | 'new' | 'fav'
const TABS: { id: Tab; label: string; note: string }[] = [
  { id: 'top', label: 'Top', note: 'Top · best of the last month' },
  { id: 'hot', label: 'Hot', note: 'Hot · accelerating this week' },
  { id: 'new', label: 'New', note: 'New · last 24 hours' },
  { id: 'fav', label: 'Fav', note: 'Fav · new activity on what you saved or joined' },
]
const TIP_KEY = (t: Tab) => `cc-sort-tip-${t}`
export function resetSorterTips() {
  try { TABS.forEach((t) => localStorage.removeItem(TIP_KEY(t.id))) } catch {}
}
function firstTap(t: Tab) {
  try {
    if (localStorage.getItem(TIP_KEY(t))) return false
    localStorage.setItem(TIP_KEY(t), '1')
  } catch {}
  return true
}

export default function Sorter({ viewer, favNew, onFavSeen, onLogin, mobile = false, onChange }: {
  onChange?: (t: Tab) => void
  viewer: 'visitor' | 'member'; favNew: boolean; onFavSeen: () => void; onLogin: () => void; mobile?: boolean
}) {
  const { reduced } = useMotionSafe()
  const press = usePress()
  const [active, setActive] = useState<Tab>(viewer === 'visitor' ? 'hot' : 'top')
  const [hover, setHover] = useState<Tab | null>(null)
  const [tip, setTip] = useState<Tab | null>(null)
  const [pop, setPop] = useState(false)
  const [docked, setDocked] = useState(false)
  const hoverT = useRef(0)
  const tipT = useRef(0)
  const sentinel = useRef<HTMLDivElement>(null)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => { setActive(viewer === 'visitor' ? 'hot' : 'top'); setPop(false) }, [viewer])
  useEffect(() => { onChange?.(active) }, [active]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { clearTimeout(hoverT.current); clearTimeout(tipT.current) }, [])

  // mobile: dock under the top island while scrolling
  useEffect(() => {
    if (!mobile || !sentinel.current) return
    const io = new IntersectionObserver(([e]) => setDocked(!e.isIntersecting), { rootMargin: '-109px 0px 0px 0px' })
    io.observe(sentinel.current)
    return () => io.disconnect()
  }, [mobile])

  useEffect(() => {
    if (!pop) return
    const close = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setPop(false)
    addEventListener('pointerdown', close)
    return () => removeEventListener('pointerdown', close)
  }, [pop])

  const pick = (t: Tab) => {
    clearTimeout(hoverT.current); setHover(null)
    if (mobile && firstTap(t)) {
      setTip(t); clearTimeout(tipT.current)
      tipT.current = window.setTimeout(() => setTip(null), 2800)
    }
    if (t === 'fav' && viewer === 'visitor') { setPop((p) => !p); return }
    setPop(false)
    setActive(t)
    if (t === 'fav') onFavSeen()
  }
  const enter = (t: Tab) => {
    if (mobile) return
    clearTimeout(hoverT.current)
    hoverT.current = window.setTimeout(() => setHover(t), 400)
  }
  const leave = () => { clearTimeout(hoverT.current); setHover(null) }
  const note = mobile ? tip : hover
  const fp = focusPull(reduced)

  const tab = (t: (typeof TABS)[number]) => {
    const on = active === t.id
    const glow = t.id === 'fav' && favNew && !on
    return (
      <motion.button
        key={t.id} role="tab" aria-selected={on}
        aria-label={glow ? 'Fav, new activity' : t.label}
        {...press} onClick={() => pick(t.id)}
        onPointerEnter={() => enter(t.id)} onPointerLeave={leave} onFocus={() => enter(t.id)} onBlur={leave}
        className={`relative h-9 flex-1 rounded-full text-sm font-semibold transition-colors ${on ? 'text-white' : glow ? 'fav-glow' : 'text-fg-muted hover:text-fg'}`}
      >
        {on && (
          <motion.span layoutId={`sort-pill-${mobile ? 'm' : 'd'}`} transition={reduced ? { duration: 0 } : settle}
            className="absolute inset-0 rounded-full bg-brand" />
        )}
        <span className="relative">{t.label}</span>
      </motion.button>
    )
  }

  const bar = (
    <div ref={root} className="relative">
      <div role="tablist" aria-label="Sort posts" className="flex items-center gap-1 p-1">
        {TABS.map(tab)}
      </div>

      <AnimatePresence>
        {note && !pop && (
          <motion.p key={note} role="status" variants={fp} initial="hidden" animate="shown" exit="exit"
            className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-elevated px-2.5 py-1.5 text-xs text-fg-2 shadow-md"
            style={{ zIndex: 'var(--z-dropdown)' }}>
            {TABS.find((t) => t.id === note)!.note}
          </motion.p>
        )}
        {pop && (
          <motion.div key="pop" role="dialog" aria-label="Sign in" variants={fp} initial="hidden" animate="shown" exit="exit"
            className="glass-strong absolute right-1 top-full mt-2 w-60 origin-top-right rounded-lg p-3 shadow-lg"
            style={{ zIndex: 'var(--z-dropdown)' }}>
            <p className="text-sm font-medium text-fg">Sign in to keep your favourites</p>
            <p className="mt-0.5 text-xs text-fg-muted">Saved and joined posts show up here.</p>
            <motion.button {...press} onClick={() => { setPop(false); onLogin() }} className="hover-glow mt-3 h-8 rounded-full bg-brand px-4 text-xs font-semibold text-white transition-shadow">Login</motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  if (!mobile) return <div className="card-frost rounded-lg">{bar}</div>

  return (
    <>
      <div ref={sentinel} aria-hidden className="-mb-3 h-0" />
      <div className="sticky top-[108px] -mx-1" style={{ zIndex: 'calc(var(--z-sticky) - 1)' }}>
        <div className="relative rounded-xl">
          <div className="card-frost absolute inset-0 rounded-xl" />
          <motion.div aria-hidden initial={false} animate={{ opacity: docked ? 1 : 0 }} transition={settle} className="glass-strong absolute inset-0 rounded-xl shadow-lg" />
          <div className="relative px-1">{bar}</div>
        </div>
      </div>
    </>
  )
}
