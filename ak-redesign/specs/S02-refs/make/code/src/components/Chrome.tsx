import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { Bell, Clock, Home, Info, LogOut, Moon, Plus, Search, Sun, User, X, WifiOff } from 'lucide-react'
import { feedback, focusPull, glide, GLOW, settle, useGlowMoment, useMotionSafe, usePress } from '../motion'
import { Avatar, Wordmark } from './Brand'
import IconButton, { ICON } from './IconButton'

export type Theme = 'dark' | 'light'
export interface ChromeProps {
  theme: Theme
  onToggleTheme: (origin: HTMLElement) => void
  viewer: 'visitor' | 'member'
  setViewer: (v: 'visitor' | 'member') => void
  unread: boolean
  lens: string | null
  clearLens: () => void
  scrolled: boolean
  reveal: boolean
}

/* Theme toggle: sun ↔ moon morph (rotate + crossfade, settle). */
export function ThemeToggle({ theme, onToggle, size }: { theme: Theme; onToggle: (el: HTMLElement) => void; size?: number }) {
  const { reduced } = useMotionSafe()
  const Icon = theme === 'dark' ? Sun : Moon
  return (
    <IconButton label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={(e) => onToggle(e.currentTarget)} size={size}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={theme}
          initial={reduced ? { opacity: 0 } : { opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, rotate: 90, scale: 0.6 }}
          transition={settle}
          className="flex"
        >
          <Icon {...ICON} />
        </motion.span>
      </AnimatePresence>
    </IconButton>
  )
}

function BellButton({ unread, size }: { unread: boolean; size?: number }) {
  return (
    <IconButton label={unread ? 'Notifications, unread' : 'Notifications'} size={size}>
      <Bell {...ICON} />
      {unread && <span className="absolute right-[27%] top-[25%] size-2 rounded-full bg-error ring-2 ring-[var(--bg-canvas)]" />}
    </IconButton>
  )
}

function Account({ viewer, setViewer, onToggleTheme, theme, size = 36 }: Pick<ChromeProps, 'viewer' | 'setViewer' | 'onToggleTheme' | 'theme'> & { size?: number }) {
  const [open, setOpen] = useState(false)
  const press = usePress()
  const fp = focusPull(useMotionSafe().reduced)
  if (viewer === 'visitor')
    return (
      <motion.button {...press} onClick={() => setViewer('member')} style={{ height: size }} className="rounded-full border border-line-subtle bg-surface px-4 text-sm font-semibold text-fg transition-colors hover:bg-overlay">
        Login
      </motion.button>
    )
  return (
    <div className="relative">
      <motion.button {...press} aria-label="Account menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} style={{ width: size, height: size }} className="flex items-center justify-center rounded-full">
        <Avatar seed={0} size={32} />
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu" variants={fp} initial="hidden" animate="shown" exit="exit"
            className="absolute right-0 top-full mt-2 w-44 origin-top-right rounded-md border border-line bg-elevated p-1 shadow-lg"
            style={{ zIndex: 'var(--z-dropdown)' }}
          >
            {[
              { icon: User, label: 'Profile', fn: () => {} },
              { icon: theme === 'dark' ? Sun : Moon, label: 'Theme', fn: (el: HTMLElement) => onToggleTheme(el) },
              { icon: LogOut, label: 'Sign out', fn: () => setViewer('visitor') },
            ].map(({ icon: I, label, fn }) => (
              <button key={label} role="menuitem" onClick={(e) => { fn(e.currentTarget); setOpen(false) }} className="flex h-9 w-full items-center gap-2.5 rounded-sm px-2.5 text-sm text-fg-2 hover:bg-surface hover:text-fg">
                <I size={16} strokeWidth={1.5} /> {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function LensChip({ lens, onClear }: { lens: string; onClear: () => void }) {
  const fp = focusPull(useMotionSafe().reduced)
  return (
    <motion.span layout variants={fp} initial="hidden" animate="shown" exit="exit" className="inline-flex h-7 items-center gap-1 rounded-full border border-line-active/40 bg-brand-tint pl-3 pr-1 text-xs font-medium text-brand-fg">
      {lens}
      <button aria-label={`Clear ${lens} filter, show all`} onClick={onClear} className="flex size-5 items-center justify-center rounded-full hover:bg-brand-tint">
        <X size={12} strokeWidth={1.5} />
      </button>
    </motion.span>
  )
}

const RECENT = ['pricing AI productized services', 'creator ops automation', 'launch checklist template']

function SearchField() {
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { reduced } = useMotionSafe()
  const glow = useGlowMoment('search-focus', focused, GLOW.focus)
  return (
    <div
      ref={ref} className="relative"
      onFocus={() => setFocused(true)}
      onBlur={(e) => !ref.current?.contains(e.relatedTarget as Node) && setFocused(false)}
    >
      <motion.label
        animate={{ width: focused ? 420 : 340 }} transition={reduced ? { duration: 0 } : settle}
        className={`flex h-9 items-center gap-2 rounded-full border bg-surface px-3.5 transition-[border-color,box-shadow] ${focused ? `border-line-active ${glow ? 'glow-focus' : ''} [[data-theme=light]_&]:ring-focus` : 'border-line-subtle'}`}
      >
        <Search size={15} strokeWidth={1.5} className="text-fg-muted" />
        <input aria-label="Search" placeholder="Search" className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-muted focus-visible:shadow-none" />
      </motion.label>
      <AnimatePresence>
        {focused && (
          <motion.div variants={focusPull(reduced)} initial="hidden" animate="shown" exit="exit" className="absolute inset-x-0 top-full mt-2 rounded-lg border border-line bg-elevated p-1.5 shadow-lg" style={{ zIndex: 'var(--z-dropdown)' }}>
            <p className="px-2.5 pb-1 pt-1.5 font-mono text-2xs uppercase tracking-wider text-fg-muted">Recent searches</p>
            {RECENT.map((r) => (
              <button key={r} className="flex h-9 w-full items-center gap-2.5 rounded-sm px-2.5 text-left text-sm text-fg-2 hover:bg-surface hover:text-fg">
                <Clock size={14} strokeWidth={1.5} className="text-fg-muted" /> {r}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Floating island: always frosted; scroll only deepens the shadow (settle). */
function Island({ scrolled, className = '', children }: { scrolled: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={`glass-strong relative rounded-xl shadow-md ${className}`}>
      <motion.div aria-hidden initial={false} animate={{ opacity: scrolled ? 1 : 0 }} transition={settle} className="pointer-events-none absolute inset-0 rounded-xl shadow-lg" />
      <div className="relative">{children}</div>
    </div>
  )
}

export function DesktopTopBar(p: ChromeProps) {
  return (
    <header className="sticky top-3 mx-auto max-w-[1000px]" style={{ zIndex: 'var(--z-sticky)' }}>
      <Island scrolled={p.scrolled}>
        <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center pl-4 pr-2">
          <Wordmark reveal={p.reveal} />
          <SearchField />
          <div className="flex items-center justify-end gap-1">
            <AnimatePresence>{p.lens && <LensChip key={p.lens} lens={p.lens} onClear={p.clearLens} />}</AnimatePresence>
            <span className="ml-2" />
            <IconButton label="Create post"><Plus {...ICON} /></IconButton>
            <ThemeToggle theme={p.theme} onToggle={p.onToggleTheme} />
            <BellButton unread={p.unread} />
            <span className="ml-2"><Account {...p} /></span>
          </div>
        </div>
      </Island>
    </header>
  )
}

export function MobileTopBar(p: ChromeProps) {
  return (
    <header className="sticky top-0 px-2" style={{ zIndex: 'var(--z-sticky)', paddingTop: 'calc(var(--sat, env(safe-area-inset-top)) + 8px)' }}>
      <Island scrolled={p.scrolled}>
        <div className="flex h-12 items-center justify-between pl-3 pr-0.5">
          <Wordmark reveal={p.reveal} size={24} />
          <div className="flex items-center">
            <IconButton label="Create post" size={44}><Plus {...ICON} /></IconButton>
            <ThemeToggle theme={p.theme} onToggle={p.onToggleTheme} size={44} />
            <BellButton unread={p.unread} size={44} />
            <Account {...p} size={44} />
          </div>
        </div>
      </Island>
    </header>
  )
}

const TABS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'create', label: 'Create', icon: Plus },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
]
export function MobileTabBar({ onNavigate, unread, onCreate, createOpen }: { onNavigate: () => void; unread: boolean; onCreate: () => void; createOpen: boolean }) {
  const [active, setActive] = useState('home')
  const { reduced } = useMotionSafe()
  return (
    <nav aria-label="Primary" className="glass absolute inset-x-0 bottom-0 border-t border-line-subtle" style={{ zIndex: 'var(--z-sticky)', paddingBottom: 'var(--sab, env(safe-area-inset-bottom))' }}>
      <ul className="grid h-14 grid-cols-5">
        {TABS.map(({ id, label, icon: I }) => {
          const on = active === id
          if (id === 'create')
            return (
              <li key={id} className="flex items-center justify-center">
                {createOpen ? <span className="size-11" /> : (
                  <motion.button
                    layoutId="composer-m" aria-label="Start a discussion" aria-haspopup="dialog" onClick={onCreate}
                    whileTap={reduced ? undefined : { scale: 0.9 }} transition={reduced ? { duration: 0 } : glide}
                    style={{ borderRadius: 999 }}
                    className="hover-glow flex size-11 items-center justify-center bg-brand text-white"
                  >
                    <Plus size={20} strokeWidth={1.5} />
                  </motion.button>
                )}
              </li>
            )
          return (
            <li key={id}>
              <motion.button
                aria-current={on ? 'page' : undefined}
                onClick={() => { if (!on) { setActive(id); onNavigate() } }}
                whileTap={reduced ? undefined : { scale: 0.9 }} transition={feedback}
                className={`relative flex h-full w-full flex-col items-center justify-center gap-0.5 text-2xs ${on ? 'font-semibold text-brand-fg' : 'text-fg-muted'}`}
              >
                <I size={20} strokeWidth={1.5} />
                {id === 'alerts' && unread && <span className="absolute left-1/2 top-2.5 ml-1.5 size-2 rounded-full bg-error" />}
                <span>{label}</span>
              </motion.button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function AnnouncementStrip({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div initial={false} exit={{ height: 0, opacity: 0 }} transition={settle} className="overflow-hidden border-b border-info-line bg-info-bg">
      <div className="mx-auto flex min-h-9 max-w-[1000px] items-center gap-2.5 px-4 text-xs text-fg">
        <Info size={15} strokeWidth={1.5} className="shrink-0 text-info" />
        <p className="flex-1"><span className="font-semibold">Creator Week starts Monday.</span> <span className="text-fg-2">Five days of live teardowns and launch reviews.</span></p>
        <button aria-label="Dismiss announcement" onClick={onDismiss} className="flex size-8 items-center justify-center rounded-full text-fg-2 hover:text-fg"><X size={14} strokeWidth={1.5} /></button>
      </div>
    </motion.div>
  )
}

export function OfflineBanner() {
  const fp = focusPull(useMotionSafe().reduced)
  return (
    <motion.div variants={fp} initial="hidden" animate="shown" exit="exit" role="status" className="mx-auto flex w-fit items-center gap-2 rounded-full border border-info-line bg-info-bg px-3.5 py-1.5 text-xs text-fg">
      <WifiOff size={14} strokeWidth={1.5} className="text-info" />
      You're offline · showing what was loaded
    </motion.div>
  )
}

export function ProgressBar({ k }: { k: number }) {
  const { reduced } = useMotionSafe()
  return (
    <AnimatePresence>
      {k > 0 && (
        <motion.div key={k} className="pointer-events-none absolute inset-x-0 top-0 h-0.5" style={{ zIndex: 'var(--z-progress)' }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <motion.div
            className="glow-track h-full origin-left bg-[var(--brand-400)]"
            initial={{ scaleX: reduced ? 1 : 0, opacity: reduced ? 0 : 1 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={reduced ? { duration: 0.2 } : { type: 'spring', stiffness: 60, damping: 20 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
