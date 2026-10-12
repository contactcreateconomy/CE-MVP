/**
 * Start Discussion — one job. The pill (desktop rail) or the tab-bar Create
 * button (mobile) GROWS into the composer via a shared-element transition
 * on the glide spring; close reverses it back into the trigger.
 */
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { LifeBuoy, ListOrdered, Newspaper, Plus, Presentation, Scale, Sparkles, Star, Swords, X } from 'lucide-react'
import { glide, useMotionSafe, usePress } from '../motion'

const TYPES = [
  { icon: Sparkles, name: 'Spark', desc: 'A quick idea or hot take' },
  { icon: Newspaper, name: 'News', desc: 'Something just shipped or changed' },
  { icon: Star, name: 'Review', desc: 'Your honest verdict on a tool' },
  { icon: Scale, name: 'Compare', desc: 'Two or more options, side by side' },
  { icon: Swords, name: 'Debate', desc: 'A claim people can vote on' },
  { icon: LifeBuoy, name: 'Help', desc: 'Ask the community for a hand' },
  { icon: ListOrdered, name: 'List', desc: 'A ranked or curated roundup' },
  { icon: Presentation, name: 'Showcase', desc: 'Show what you built' },
]

/** Desktop rail trigger. Solid brand, no glow at rest; hover glow (dark) + 1px lift. */
export function StartDiscussionButton({ open, onOpen }: { open: boolean; onOpen: () => void }) {
  const { reduced } = useMotionSafe()
  const press = usePress()
  if (open) return <div className="h-10" aria-hidden />
  return (
    <motion.button
      layoutId="composer" onClick={onOpen} aria-haspopup="dialog"
      {...press} whileHover={reduced ? undefined : { y: -1 }}
      transition={reduced ? { duration: 0 } : glide}
      style={{ borderRadius: 999 }}
      className="hover-glow flex h-10 w-full items-center justify-center gap-1.5 bg-brand text-sm font-semibold text-white transition-shadow"
    >
      <motion.span layout="position" className="flex items-center gap-1.5"><Plus size={16} strokeWidth={2} /> Start Discussion</motion.span>
    </motion.button>
  )
}

export function ComposerSheet({ open, onClose, viewer, onLogin, mobile }: {
  open: boolean; onClose: () => void; viewer: 'visitor' | 'member'; onLogin: () => void; mobile?: boolean
}) {
  const { reduced } = useMotionSafe()
  const press = usePress()
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    closeRef.current?.focus({ preventScroll: true })
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [open, onClose])

  const t = reduced ? { duration: 0.2 } : glide
  const inner = { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.25, delay: reduced ? 0 : 0.18 } }, exit: { opacity: 0, transition: { duration: 0.1 } } }

  return (
    <AnimatePresence>
      {open && (
        <div className={`${mobile ? 'absolute' : 'fixed'} inset-0 flex ${mobile ? 'items-end' : 'items-center justify-center'}`} style={{ zIndex: 'var(--z-overlay)' }}>
          <motion.div aria-hidden onClick={onClose} className="absolute inset-0 bg-black/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} />
          <motion.div
            layoutId={mobile ? 'composer-m' : 'composer'} role="dialog" aria-modal="true" aria-labelledby="composer-title"
            transition={t}
            style={{ borderRadius: mobile ? 28 : 20 }}
            className={`glass-strong relative overflow-hidden shadow-lg ${mobile ? 'mx-2 mb-2 w-full' : 'w-[720px]'}`}
          >
            <motion.div {...inner} className={mobile ? 'px-4 pb-[calc(var(--sab,0px)+12px)] pt-3' : 'p-6'}>
              {mobile && <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-line-strong" aria-hidden />}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="composer-title" className="text-xl font-semibold tracking-tight text-fg">
                    {viewer === 'member' ? 'What do you want to start?' : 'Sign in to start a discussion'}
                  </h2>
                  <p className="mt-0.5 text-sm text-fg-muted">
                    {viewer === 'member' ? 'Pick a format — you can change it before you post.' : 'Join to post, vote, and keep what you save.'}
                  </p>
                </div>
                <button ref={closeRef} onClick={onClose} aria-label="Close" className="-mr-1 -mt-1 flex size-9 shrink-0 items-center justify-center rounded-full text-fg-2 hover:bg-surface hover:text-fg">
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>

              {viewer === 'member' ? (
                <ul className={`mt-5 grid gap-2 ${mobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
                  {TYPES.map(({ icon: Icon, name, desc }, i) => (
                    <motion.li key={name} initial={{ opacity: 0, y: reduced ? 0 : 6 }} animate={{ opacity: 1, y: 0, transition: { ...glide, delay: reduced ? 0 : 0.22 + i * 0.03 } }}>
                      <motion.button {...press} className="group flex h-full w-full flex-col items-start gap-2 rounded-lg border border-line-subtle bg-[color-mix(in_srgb,var(--bg-surface)_55%,transparent)] p-3 text-left transition-colors hover:border-line-strong hover:bg-surface">
                        <span className="flex size-8 items-center justify-center rounded-md bg-brand-tint text-brand-fg"><Icon size={16} strokeWidth={1.5} /></span>
                        <span className="text-sm font-semibold text-fg">{name}</span>
                        <span className="text-xs leading-4 text-fg-muted">{desc}</span>
                      </motion.button>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <div className="mt-6 flex gap-2">
                  <motion.button {...press} onClick={onLogin} className="hover-glow h-10 rounded-full bg-brand px-5 text-sm font-semibold text-white transition-shadow">Login</motion.button>
                  <button onClick={onClose} className="h-10 rounded-full px-4 text-sm font-medium text-fg-2 hover:text-fg">Not now</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
