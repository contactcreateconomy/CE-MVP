/**
 * Named slots. Each renders its loading skeleton until a later round
 * replaces it with real content. Swap a slot's body; keep its frame.
 */
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { focusPull, staggerChildren, useMotionSafe } from '../motion'

const Bone = ({ className = '' }: { className?: string }) => <div className={`skeleton ${className}`} aria-hidden />

/** Card frame shared by slots; hover adds depth only.
 *  Feed cards get the frost LOOK (no live blur); rail widgets get real frost. */
export function Panel({ children, className = '', rail = false }: { children: ReactNode; className?: string; rail?: boolean }) {
  return <div className={`rounded-lg transition-shadow hover:shadow-md ${rail ? 'rail-frost' : 'card-frost'} ${className}`}>{children}</div>
}

/** Stagger container — children use <Item>. Skeleton→content uses the same pair. */
export function Stagger({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const { reduced } = useMotionSafe()
  return (
    <motion.div className={className} variants={staggerChildren(reduced, delay)} initial="hidden" animate="shown">
      {children}
    </motion.div>
  )
}
export function Item({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { reduced } = useMotionSafe()
  return <motion.div className={className} variants={focusPull(reduced)}>{children}</motion.div>
}

const Loading = ({ label, children, className }: { label: string; children: ReactNode; className?: string }) => (
  <section aria-busy="true" aria-label={label} className={className}>{children}</section>
)

export function HeroSlot() {
  return (
    <Loading label="Featured story loading">
      <Panel className="flex h-[184px] items-center gap-6 overflow-hidden rounded-xl p-5">
        <Bone className="h-full w-[262px] shrink-0 rounded-lg" />
        <div className="flex flex-1 flex-col gap-3">
          <Bone className="h-2.5 w-20 rounded-full" />
          <Bone className="h-4 w-2/3 rounded-sm" />
          <Bone className="h-3 w-5/6 rounded-sm" />
          <div className="mt-6 flex gap-2"><Bone className="h-8 w-20 rounded-full" /><Bone className="h-8 w-24 rounded-full" /></div>
        </div>
      </Panel>
    </Loading>
  )
}

export function StartDiscussionSlot() {
  return <Loading label="Loading"><Panel rail className="p-2.5"><Bone className="h-9 w-full rounded-full" /></Panel></Loading>
}

export function DiscoverSlot() {
  return (
    <Loading label="Discover loading">
      <Panel rail className="px-2.5 py-3">
        <Bone className="mx-1.5 mb-3 h-2.5 w-16 rounded-full" />
        <Stagger className="flex flex-col">
          {Array.from({ length: 10 }, (_, i) => (
            <Item key={i} className="flex h-8 items-center gap-2.5 px-1.5">
              <Bone className="size-4 rounded-sm" />
              <Bone className={`h-3 rounded-sm ${["w-12","w-10","w-14","w-16","w-20","w-14","w-9","w-8","w-16","w-10"][i]}`} />
            </Item>
          ))}
        </Stagger>
      </Panel>
    </Loading>
  )
}

export function SorterSlot() {
  return (
    <Loading label="Sort options loading">
      <Panel className="grid grid-cols-4 gap-2 p-2.5">
        {Array.from({ length: 4 }, (_, i) => <Bone key={i} className="h-9 rounded-full" />)}
      </Panel>
    </Loading>
  )
}

function FeedCardSkeleton({ compact }: { compact?: boolean }) {
  return (
    <Panel className="p-3.5">
      <div className="flex items-center gap-2.5">
        <Bone className="size-8 rounded-full" />
        <div className="flex flex-col gap-1.5"><Bone className="h-3 w-24 rounded-sm" /><Bone className="h-2.5 w-16 rounded-sm" /></div>
      </div>
      <div className={`mt-4 flex gap-4 ${compact ? 'flex-col' : ''}`}>
        <div className="flex flex-1 flex-col gap-2.5">
          <Bone className="h-4 w-4/5 rounded-sm" />
          <Bone className="h-3 w-full rounded-sm" />
          <Bone className="h-3 w-3/5 rounded-sm" />
          <Bone className="mt-2 h-9 w-full rounded-md" />
        </div>
        <Bone className={compact ? 'h-[132px] w-full rounded-lg' : 'h-[100px] w-[148px] shrink-0 rounded-lg'} />
      </div>
      <div className="mt-4 flex items-center justify-between rounded-md px-1 py-1">
        <div className="flex gap-4"><Bone className="h-3 w-10 rounded-sm" /><Bone className="h-3 w-10 rounded-sm" /><Bone className="h-3 w-8 rounded-sm" /></div>
        <div className="flex -space-x-1.5"><Bone className="size-6 rounded-full" /><Bone className="size-6 rounded-full" /><Bone className="size-6 rounded-full" /></div>
      </div>
    </Panel>
  )
}

export function FeedSlot({ compact }: { compact?: boolean }) {
  return (
    <Loading label="Feed loading">
      <Stagger className="flex flex-col gap-3" delay={0.1}>
        {[0, 1, 2].map((i) => <Item key={i}><FeedCardSkeleton compact={compact} /></Item>)}
      </Stagger>
    </Loading>
  )
}

export function VibingSlot() {
  return (
    <Loading label="Trending loading">
      <Panel rail className="p-3">
        <Bone className="h-3 w-24 rounded-sm" />
        <div className="mt-3 flex flex-col gap-2 rounded-md p-1">
          <Bone className="h-3 w-full rounded-sm" />
          <Bone className="h-3 w-3/4 rounded-sm" />
        </div>
      </Panel>
    </Loading>
  )
}

export function PodiumSlot() {
  return (
    <Loading label="Leaderboard loading">
      <Panel rail className="p-2.5">
        <div className="mb-2.5 flex items-center justify-between px-1"><Bone className="h-2.5 w-14 rounded-full" /><Bone className="h-6 w-24 rounded-full" /></div>
        <Stagger className="flex flex-col gap-1.5">
          {Array.from({ length: 5 }, (_, i) => (
            <Item key={i} className="flex h-10 items-center gap-2.5 rounded-md px-2">
              <Bone className="size-7 rounded-full" />
              <Bone className="h-3 flex-1 rounded-sm" />
              <Bone className="h-3 w-12 rounded-sm" />
            </Item>
          ))}
        </Stagger>
      </Panel>
    </Loading>
  )
}
