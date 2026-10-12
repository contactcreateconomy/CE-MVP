/**
 * Discover — left rail (desktop) / chip rows (mobile).
 * Choosing an item sets the subject (menu-bar chip + hero lens) and drills
 * the rail one level deeper; Back reverses.
 */
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft } from 'lucide-react'
import { focusPull, settle, staggerChildren, useMotionSafe, usePress } from '../motion'
import { iconFor, NEW_COUNT, SUBMAP, TOPICS, TYPES } from './taxonomy'

const Count = ({ n }: { n?: number }) => (n ? <span className="font-mono text-2xs tabular-nums text-fg-muted">{n}</span> : null)

function Row({ label, active, onClick, count }: { label: string; active?: boolean; onClick: () => void; count?: number }) {
  const I = iconFor(label)
  return (
    <button onClick={onClick} aria-current={active ? 'page' : undefined}
      className={`flex h-8 w-full items-center gap-2.5 rounded-full px-2.5 text-sm transition-colors ${active ? 'glow-active bg-overlay font-medium text-brand-fg' : 'text-fg-2 hover:bg-surface hover:text-fg'}`}>
      <I size={15} strokeWidth={1.5} className={active ? '' : 'text-fg-muted'} />
      <span className="flex-1 truncate text-left">{label}</span>
      <Count n={count} />
    </button>
  )
}

export function DiscoverRail({ subject, setSubject }: { subject: string; setSubject: (s: string) => void }) {
  const { reduced } = useMotionSafe()
  const deep = subject !== 'All'
  const dir = deep ? 1 : -1
  const slide = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, x: 24 * dir, filter: 'blur(6px)' },
    shown: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { ...settle, staggerChildren: reduced ? 0 : 0.03 } },
    exit: reduced ? { opacity: 0 } : { opacity: 0, x: -24 * dir, filter: 'blur(4px)', transition: { duration: 0.16 } },
  }
  const sub = SUBMAP[subject]
  return (
    <nav aria-label="Discover" className="rail-frost overflow-hidden rounded-lg px-2 py-3">
      <AnimatePresence mode="wait" initial={false}>
        {!deep ? (
          <motion.div key="root" variants={slide} initial="hidden" animate="shown" exit="exit">
            <p className="mb-1.5 px-2.5 font-mono text-2xs font-medium uppercase tracking-[0.14em] text-fg-muted">Discover</p>
            {['All', ...TYPES].map((t) => <Row key={t} label={t} active={subject === t} count={NEW_COUNT[t]} onClick={() => setSubject(t)} />)}
            <p className="mb-1.5 mt-3 px-2.5 font-mono text-2xs font-medium uppercase tracking-[0.14em] text-fg-muted">Your topics</p>
            {TOPICS.map((t) => <Row key={t} label={t} count={NEW_COUNT[t]} onClick={() => setSubject(t)} />)}
          </motion.div>
        ) : (
          <motion.div key={`deep-${subject}`} variants={slide} initial="hidden" animate="shown" exit="exit">
            <button onClick={() => setSubject('All')} className="flex h-8 w-full items-center gap-1 rounded-full px-2 text-sm text-fg-2 hover:bg-surface hover:text-fg">
              <ChevronLeft size={15} strokeWidth={1.5} /> All
            </button>
            <motion.div variants={focusPull(reduced)} className="mt-2 flex items-center gap-2 px-2.5">
              {(() => { const I = iconFor(subject); return <I size={17} strokeWidth={1.5} className="text-brand-fg" /> })()}
              <h2 className="text-base font-semibold tracking-tight text-fg">{subject}</h2>
            </motion.div>
            {sub && <>
              <motion.p variants={focusPull(reduced)} className="mb-1.5 mt-3 px-2.5 font-mono text-2xs font-medium uppercase tracking-[0.14em] text-fg-muted">{sub.label}</motion.p>
              <motion.div variants={staggerChildren(reduced)}>
                {sub.items.map(([l, n]) => (
                  <motion.button key={l} variants={focusPull(reduced)} onClick={() => SUBMAP[l] && setSubject(l)}
                    className="flex h-8 w-full items-center gap-2 rounded-full px-2.5 text-sm text-fg-2 hover:bg-surface hover:text-fg">
                    <span className="flex-1 truncate text-left">{l}</span><Count n={n} />
                  </motion.button>
                ))}
              </motion.div>
            </>}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

/** Mobile: horizontal chip row; the chosen chip expands a second row of sub-chips. */
export function DiscoverChips({ subject, setSubject }: { subject: string; setSubject: (s: string) => void }) {
  const press = usePress()
  const { reduced } = useMotionSafe()
  const sub = SUBMAP[subject]
  return (
    <div className="-mx-3 flex flex-col gap-2">
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-3">
        {['All', ...TYPES, ...TOPICS].map((t) => (
          <motion.button key={t} {...press} onClick={() => setSubject(t)} aria-pressed={subject === t}
            className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium ${subject === t ? 'border-transparent bg-overlay text-brand-fg' : 'border-line-subtle bg-[color-mix(in_srgb,var(--bg-surface)_70%,transparent)] text-fg-2'}`}>
            {t}{NEW_COUNT[t] ? <span className="font-mono text-2xs text-fg-muted">{NEW_COUNT[t]}</span> : null}
          </motion.button>
        ))}
      </div>
      <AnimatePresence initial={false}>
        {sub && (
          <motion.div key={subject} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={reduced ? { duration: 0.2 } : settle} className="overflow-hidden">
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-3">
              {sub.items.map(([l, n]) => (
                <button key={l} className="flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs text-fg-2 hover:text-fg">
                  {l}<span className="font-mono text-2xs text-fg-muted">{n}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
