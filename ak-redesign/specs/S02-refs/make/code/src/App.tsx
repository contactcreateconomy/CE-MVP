import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { glide, SimulatedReducedMotion, useFocusPull } from './motion'
import { LogoMark } from './components/Brand'
import {
  AnnouncementStrip, DesktopTopBar, MobileTabBar, MobileTopBar, OfflineBanner, ProgressBar,
  type ChromeProps, type Theme,
} from './components/Chrome'
import Hero, { MobileSubjectHeader, type HeroMode } from './components/hero/Hero'
import { buildFrames, KIND_LABEL, KIND_ORDER, type FrameKind, type Subject } from './components/hero/data'
import {
  DiscoverSlot, FeedSlot, PodiumSlot, SorterSlot, StartDiscussionSlot, VibingSlot,
} from './components/Slots'
import PrototypePanel, { type Ctl } from './components/PrototypePanel'
import { ComposerSheet, StartDiscussionButton } from './components/Composer'
import Sorter, { resetSorterTips } from './components/Sorter'
import { VibingCard, VibingTicker, type VibingState } from './components/Vibing'
import Feed, { type FeedProps } from './components/Feed'
import { DiscoverChips, DiscoverRail } from './components/Discover'
import { DIMS, LeaderboardPage, PodiumFeedCard, PodiumWidget, WINDOW, type Dim, type PodiumProps } from './components/Podium'
import type { Tab } from './components/Sorter'
import type { Relationship, Stage } from './components/feedData'
import { TYPES } from './components/taxonomy'

type Phase = 'logo' | 'shell'

function Splash() {
  return (
    <motion.div className="fixed inset-0 flex items-center justify-center bg-canvas" style={{ zIndex: 'var(--z-overlay)' }} exit={{ opacity: 0, transition: { duration: 0.3 } }}>
      <LogoMark size={56} reveal />
    </motion.div>
  )
}

/** Layout shell. Slots are the swap points for later rounds. */
type HeroProps = React.ComponentProps<typeof Hero>
type R3 = {
  ready: boolean; favNew: boolean; onFavSeen: () => void; vibing: VibingState
  composer: boolean; setComposer: (v: boolean) => void
  subject: Subject; setSubject: (s: Subject) => void; setTab: (t: Tab) => void
  feed: Omit<FeedProps, 'ready' | 'compact' | 'lens' | 'podiumCard'>
  podium: PodiumProps; board: boolean; setBoard: (v: boolean) => void; pinned: Dim[]; setPinned: (d: Dim[]) => void
}

function DesktopShell(p: ChromeProps & R3 & { offline: boolean; hero: HeroProps }) {
  const fp = useFocusPull()
  return (
    <>
      <DesktopTopBar {...p} />
      <motion.main {...fp} className="mx-auto max-w-[1000px] pb-24 pt-6">
        <AnimatePresence>{p.offline && <div className="mb-3"><OfflineBanner /></div>}</AnimatePresence>
        {p.board ? (
          <LeaderboardPage dim={p.podium.dim} setDim={p.podium.setDim} pinned={p.pinned} setPinned={p.setPinned} onBack={() => p.setBoard(false)} />
        ) : <>
        <Hero key={String(p.hero.debateVoted)} {...p.hero} />
        <div className={`${p.hero.mode === 'absent' ? '' : 'mt-6'} grid grid-cols-[170px_minmax(0,1fr)_226px] items-start gap-[22px]`}>
          <aside className="sticky top-[84px] flex flex-col gap-3">
            {p.ready ? <StartDiscussionButton open={p.composer} onOpen={() => p.setComposer(true)} /> : <StartDiscussionSlot />}
            {p.ready ? <DiscoverRail subject={p.subject} setSubject={p.setSubject} /> : <DiscoverSlot />}
          </aside>
          <div className="flex flex-col gap-3">
            {p.ready ? <Sorter viewer={p.viewer} favNew={p.favNew} onFavSeen={p.onFavSeen} onLogin={() => p.setViewer('member')} onChange={p.setTab} /> : <SorterSlot />}
            <Feed ready={p.ready} lens={p.lens} {...p.feed} />
          </div>
          <aside className="sticky top-[84px] flex flex-col gap-3">
            {p.ready ? <VibingCard state={p.vibing} lens={p.lens} /> : <VibingSlot />}
            {p.ready ? <PodiumWidget {...p.podium} /> : <PodiumSlot />}
          </aside>
        </div>
        </>}
      </motion.main>
      <ComposerSheet open={p.composer} onClose={() => p.setComposer(false)} viewer={p.viewer} onLogin={() => { p.setViewer('member') }} />
    </>
  )
}

function MobileShell(p: ChromeProps & R3 & { offline: boolean }) {
  const fp = useFocusPull()
  return (
    <>
      <MobileTopBar {...p} />
      <motion.main {...fp} className="flex flex-col gap-3 px-3 pb-28 pt-2">
        <AnimatePresence>{p.offline && <OfflineBanner />}</AnimatePresence>
        {p.board ? (
          <LeaderboardPage compact dim={p.podium.dim} setDim={p.podium.setDim} pinned={p.pinned} setPinned={p.setPinned} onBack={() => p.setBoard(false)} />
        ) : <>
          {p.ready && <DiscoverChips subject={p.subject} setSubject={p.setSubject} />}
          <MobileSubjectHeader subject={p.subject} onClear={p.clearLens} />
          {p.ready ? (<>
            <Sorter mobile viewer={p.viewer} favNew={p.favNew} onFavSeen={p.onFavSeen} onLogin={() => p.setViewer('member')} onChange={p.setTab} />
            <VibingTicker state={p.vibing} lens={p.lens} />
          </>) : <SorterSlot />}
          <Feed ready={p.ready} compact lens={p.lens} {...p.feed} podiumCard={<PodiumFeedCard {...p.podium} />} />
        </>}
      </motion.main>
    </>
  )
}

export default function App() {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop')
  const [theme, setTheme] = useState<Theme>('dark')
  const [variant, setVariant] = useState<'iris' | 'horizon'>('iris')
  const [viewer, setViewer] = useState<'visitor' | 'member'>('visitor')
  const [unread, setUnread] = useState(true)
  const [subject, setSubject] = useState<Subject>('All')
  const [heroMode, setHeroMode] = useState<HeroMode | 'absent'>('large')
  const [isNew, setIsNew] = useState(true)
  const [frameCount, setFrameCount] = useState(5)
  const [firstKind, setFirstKind] = useState<FrameKind>('post')
  const [debateVoted, setDebateVoted] = useState(false)
  const [featured, setFeatured] = useState(true)
  const [teaseRun, setTeaseRun] = useState(0)
  const [contentReady, setContentReady] = useState(false)
  const [announce, setAnnounce] = useState(true)
  const [offline, setOffline] = useState(false)
  const [dots, setDots] = useState(true)
  const [reducedSim, setReducedSim] = useState(false)
  const [phase, setPhase] = useState<Phase>('logo')
  const [run, setRun] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)
  const [band, setBand] = useState(0)
  const busy = useRef(false)
  const [favNew, setFavNew] = useState(true)
  const [composer, setComposer] = useState(false)
  const [vibing, setVibing] = useState<VibingState>('playing')
  const [tab, setTab] = useState<Tab>('hot')
  const [typeFilter, setTypeFilter] = useState('All')
  const [stage, setStage] = useState<Stage | 'auto'>('auto')
  const [rel, setRel] = useState<Relationship>('none')
  const [coverVariant, setCoverVariant] = useState<'A' | 'B'>('A')
  const [newPill, setNewPill] = useState(true)
  const [caughtUp, setCaughtUp] = useState(true)
  const [thin, setThin] = useState(false)
  const [dim, setDim] = useState<Dim>('overall')
  const [forming, setForming] = useState(false)
  const [standing, setStanding] = useState(true)
  const [board, setBoard] = useState(false)
  const [pinned, setPinned] = useState<Dim[]>([])
  // the subject chosen in Discover picks the default Podium dimension
  useEffect(() => { setDim(subject === 'Review' ? 'reviewers' : subject === 'Help' ? 'helpers' : 'overall') }, [subject])

  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  useEffect(() => {
    if (phase !== 'logo') return
    const t = setTimeout(() => setPhase('shell'), 950)
    return () => clearTimeout(t)
  }, [phase, run])

  useEffect(() => {
    if (phase !== 'shell') return
    setContentReady(false)
    const t = setTimeout(() => setContentReady(true), 1400)
    return () => clearTimeout(t)
  }, [phase, run])

  const replay = (withLogo: boolean) => { setScrolled(false); setRun((r) => r + 1); setPhase(withLogo ? 'logo' : 'shell') }
  const navigate = useCallback(() => {
    setProgress((k) => k + 1)
    setTimeout(() => setProgress(0), 900)
  }, [])

  const toggleTheme = useCallback((origin?: HTMLElement) => {
    if (busy.current) return
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    const reduced = reducedSim || matchMedia('(prefers-reduced-motion: reduce)').matches
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } }

    if (variant === 'iris' && doc.startViewTransition) {
      const r = origin?.getBoundingClientRect()
      const x = r ? r.left + r.width / 2 : innerWidth - 120
      const y = r ? r.top + r.height / 2 : 32
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
      const vt = doc.startViewTransition(() => flushSync(() => setTheme(next)))
      vt.ready.then(() => {
        document.documentElement.animate(
          reduced
            ? { opacity: [0, 1] }
            : { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: reduced ? 200 : 560, easing: 'cubic-bezier(.22,.8,.24,1)', pseudoElement: '::view-transition-new(root)' },
        )
      })
      return
    }
    if (variant === 'horizon' && !reduced) {
      busy.current = true
      setBand((b) => b + 1)
      setTimeout(() => setTheme(next), 260)
      setTimeout(() => { busy.current = false }, 700)
      return
    }
    // fallback crossfade
    document.documentElement.animate({ opacity: [0.6, 1] }, { duration: 220 })
    setTheme(next)
  }, [theme, variant, reducedSim])

  const chrome: ChromeProps = {
    theme, onToggleTheme: toggleTheme, viewer, setViewer, unread,
    lens: subject === 'All' ? null : subject, clearLens: () => setSubject('All'),
    scrolled, reveal: true,
  }
  const onScroll = (e: React.UIEvent<HTMLElement>) => setScrolled(e.currentTarget.scrollTop > 8)

  const heroState = heroMode === 'absent' ? 'absent' : subject !== 'All' ? 'lens' : heroMode
  const controls: Ctl[] = [
    { kind: 'heading', label: 'Shell' },
    { kind: 'seg', label: 'Viewport', value: viewport, options: [['desktop', '1440'], ['mobile', '390']], set: (v) => { setViewport(v as typeof viewport); setScrolled(false) } },
    { kind: 'seg', label: 'Theme', value: theme, options: [['dark', 'dark'], ['light', 'light']], set: (v) => v !== theme && toggleTheme() },
    { kind: 'seg', label: 'Theme switch', value: variant, options: [['iris', 'A·Iris'], ['horizon', 'B·Horizon']], set: (v) => setVariant(v as typeof variant) },
    { kind: 'seg', label: 'Viewer', value: viewer, options: [['visitor', 'visitor'], ['member', 'member']], set: (v) => setViewer(v as typeof viewer) },
    { kind: 'bool', label: 'Bell unread', value: unread, set: setUnread },
    { kind: 'select', label: 'Lens', value: subject, options: [['All', 'All'], ...TYPES.map((t) => [t, t] as [string, string]), ['Agents', 'Agents']], set: (v) => setSubject(v as Subject) },
    { kind: 'bool', label: 'Announcement', value: announce, set: setAnnounce },
    { kind: 'heading', label: 'Hero' },
    { kind: 'seg', label: 'State', value: heroState, options: [['large', 'lg'], ['compact', 'cmp'], ['lens', 'lens'], ['absent', 'off']], set: (v) => {
      if (v === 'lens') { if (heroMode === 'absent') setHeroMode('large'); if (subject === 'All') setSubject('Review'); return }
      setSubject('All'); setHeroMode(v as HeroMode | 'absent')
    } },
    { kind: 'bool', label: 'New since visit', value: isNew, set: (v) => { setIsNew(v); setHeroMode(v ? 'large' : 'compact'); replay(false) } },
    { kind: 'seg', label: 'Frames', value: String(frameCount), options: [1, 2, 3, 4, 5].map((n) => [String(n), String(n)] as [string, string]), set: (v) => setFrameCount(Number(v)) },
    { kind: 'select', label: 'First kind', value: firstKind, options: KIND_ORDER.map((k) => [k, KIND_LABEL[k]] as [string, string]), set: (v) => { setFirstKind(v as FrameKind); setTeaseRun((r) => r + 1) } },
    { kind: 'bool', label: 'Debate voted', value: debateVoted, set: setDebateVoted },
    { kind: 'bool', label: 'Featured frame', value: featured, set: setFeatured },
    { kind: 'actions', label: 'Tease', actions: [['replay', () => setTeaseRun((r) => r + 1)]] },
    { kind: 'heading', label: 'Round 3' },
    { kind: 'bool', label: 'Fav new activity', value: favNew, set: setFavNew },
    { kind: 'actions', label: 'First-tap tips', actions: [['reset', resetSorterTips]] },
    { kind: 'seg', label: 'Vibing', value: vibing, options: [['playing', 'play'], ['paused', 'pause'], ['quiet', 'quiet'], ['featured', 'feat']], set: (v) => setVibing(v as VibingState) },
    { kind: 'bool', label: 'Composer open', value: composer, set: setComposer },
    { kind: 'heading', label: 'Round 4 · Feed' },
    { kind: 'select', label: 'Card type', value: typeFilter, options: [['All', 'All'], ...TYPES.map((t) => [t, t] as [string, string])], set: setTypeFilter },
    { kind: 'select', label: 'Life stage', value: stage, options: [['auto', 'per card'], ['new', 'New'], ['rising', 'Rising'], ['established', 'Established'], ['evergreen', 'Evergreen'], ['resurfacing', 'Resurfacing']], set: (v) => setStage(v as Stage | 'auto') },
    { kind: 'select', label: 'Relationship', value: rel, options: [['none', 'none'], ['commented', 'commented'], ['author', 'author'], ['expert', 'expert']], set: (v) => setRel(v as Relationship) },
    { kind: 'seg', label: 'Mobile cover', value: coverVariant, options: [['A', 'A·thumb'], ['B', 'B·full']], set: (v) => setCoverVariant(v as 'A' | 'B') },
    { kind: 'bool', label: 'New posts pill', value: newPill, set: setNewPill },
    { kind: 'bool', label: 'Caught-up', value: caughtUp, set: setCaughtUp },
    { kind: 'bool', label: 'Thin subject', value: thin, set: setThin },
    { kind: 'heading', label: 'Round 4 · Podium' },
    { kind: 'select', label: 'Dimension', value: dim, options: DIMS, set: (v) => setDim(v as Dim) },
    { kind: 'bool', label: 'Forming', value: forming, set: setForming },
    { kind: 'bool', label: 'Member standing', value: standing, set: setStanding },
    { kind: 'bool', label: 'Leaderboard page', value: board, set: setBoard },
    { kind: 'heading', label: 'Global' },
    { kind: 'actions', label: 'Loading', actions: [['first load', () => replay(true)], ['skeletons', () => replay(false)]] },
    { kind: 'actions', label: 'Route', actions: [['fake nav', navigate]] },
    { kind: 'bool', label: 'Offline', value: offline, set: setOffline },
    { kind: 'bool', label: 'Dot grid', value: dots, set: setDots },
    { kind: 'bool', label: 'Reduced motion', value: reducedSim, set: setReducedSim },
  ]

  const shell = phase === 'shell'
  const heroProps: HeroProps = {
    frames: buildFrames(frameCount, firstKind, featured), mode: heroMode, setMode: setHeroMode,
    subject, ready: contentReady, debateVoted, teaseRun,
  }
  const r3: R3 = {
    ready: contentReady, favNew, onFavSeen: () => setFavNew(false), vibing, composer, setComposer,
    subject, setSubject, setTab, board, setBoard, pinned, setPinned,
    feed: { coverVariant, typeFilter, stage, rel, newPill, setNewPill, caughtUp, thin },
    podium: { dim, setDim, pinned, window: WINDOW[tab], member: viewer === 'member', forming, standing, onExpand: () => setBoard(true) },
  }
  const ground = `bg-canvas ${dots ? 'dot-grid' : ''}`

  return (
    <SimulatedReducedMotion.Provider value={reducedSim}>
      <MotionConfig reducedMotion={reducedSim ? 'always' : 'user'}>
        <div data-reduced={reducedSim} className="h-full">
          <AnimatePresence>{phase === 'logo' && <Splash key={`s${run}`} />}</AnimatePresence>

          {viewport === 'desktop' ? (
            <div data-scroll className={`relative h-full overflow-y-auto ${ground}`} onScroll={onScroll}>
              <ProgressBar k={progress} />
              <AnimatePresence initial={false}>{announce && <AnnouncementStrip key="a" onDismiss={() => setAnnounce(false)} />}</AnimatePresence>
              {shell && <DesktopShell key={run} {...chrome} {...r3} offline={offline} hero={heroProps} />}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center bg-neutral-800 [background-image:radial-gradient(rgb(255_255_255/0.05)_1px,transparent_1px)] [background-size:20px_20px]">
              <div className="relative h-[844px] w-[390px] overflow-hidden rounded-[52px] border-[10px] border-neutral-950 shadow-2xl ring-1 ring-white/10" style={{ ['--sat' as string]: '44px', ['--sab' as string]: '28px' }}>
                <div className="absolute left-1/2 top-2.5 h-7 w-28 -translate-x-1/2 rounded-full bg-black" style={{ zIndex: 'var(--z-overlay)' }} />
                <div data-scroll className={`no-scrollbar relative h-full overflow-y-auto ${ground}`} onScroll={onScroll}>
                  <ProgressBar k={progress} />
                  <AnimatePresence initial={false}>{announce && <AnnouncementStrip key="a" onDismiss={() => setAnnounce(false)} />}</AnimatePresence>
                  {shell && <MobileShell key={run} {...chrome} {...r3} offline={offline} />}
                </div>
                {shell && <MobileTabBar onNavigate={navigate} unread={unread} onCreate={() => setComposer(true)} createOpen={composer} />}
                {shell && <ComposerSheet mobile open={composer} onClose={() => setComposer(false)} viewer={viewer} onLogin={() => setViewer('member')} />}
              </div>
            </div>
          )}

          <AnimatePresence>
            {band > 0 && (
              <motion.div
                key={band} aria-hidden className="pointer-events-none fixed inset-x-0 h-[45vh]"
                style={{ zIndex: 'var(--z-toast)', background: 'linear-gradient(to bottom, transparent, color-mix(in oklab, var(--bg-canvas) 78%, var(--text-primary) 22%) 45%, var(--bg-canvas) 55%, transparent)', filter: 'blur(12px)' }}
                initial={{ top: '-50vh' }} animate={{ top: '110vh' }} transition={{ ...glide, stiffness: 90, damping: 20 }}
                onAnimationComplete={() => setBand(0)}
              />
            )}
          </AnimatePresence>

          <PrototypePanel controls={controls} />
        </div>
      </MotionConfig>
    </SimulatedReducedMotion.Provider>
  )
}
