/* Discover taxonomy + subject fixtures (prototype data). */
import {
  Bot, Clapperboard, DollarSign, Hash, LayoutGrid, LifeBuoy, ListOrdered, Newspaper, Presentation,
  Scale, Sparkles, Star, Swords, Workflow, Blocks, type LucideIcon,
} from 'lucide-react'
import type { FrameKind } from './hero/data'

export type Subject = string
export const TYPES = ['Spark', 'News', 'Review', 'Compare', 'Debate', 'Help', 'List', 'Showcase'] as const
export type PostType = (typeof TYPES)[number]
export const TOPICS = ['Agents', 'Pricing', 'Automation', 'Video', 'No-code'] as const

export const ICON: Record<string, LucideIcon> = {
  All: LayoutGrid, Spark: Sparkles, News: Newspaper, Review: Star, Compare: Scale, Debate: Swords,
  Help: LifeBuoy, List: ListOrdered, Showcase: Presentation,
  Agents: Bot, Pricing: DollarSign, Automation: Workflow, Video: Clapperboard, 'No-code': Blocks,
}
export const iconFor = (s: string) => ICON[s] ?? Hash

/** New posts since the viewer's last visit (none shown when 0). */
export const NEW_COUNT: Record<string, number> = { All: 0, Spark: 4, News: 2, Review: 12, Compare: 0, Debate: 3, Help: 7, List: 0, Showcase: 1, Agents: 9, Pricing: 0, Automation: 2, Video: 0, 'No-code': 5 }

/** One level deeper: types → what's inside this week; topics → related topics. */
export const SUBMAP: Record<string, { label: string; items: [string, number][] }> = {
  Spark: { label: 'Hot takes this week', items: [['Agents', 14], ['Pricing', 9], ['Craft', 6], ['Tools', 4]] },
  News: { label: 'Stories this week', items: [['Model releases', 8], ['Platform policy', 5], ['Funding', 3]] },
  Review: { label: 'Tools reviewed this week', items: [['Cursor', 18], ['Windsurf', 11], ['Loomwright', 7], ['Descript', 5], ['Framer', 4]] },
  Compare: { label: 'Face-offs this week', items: [['Code editors', 6], ['Video tools', 4], ['Site builders', 3]] },
  Debate: { label: 'Open debates', items: [['AI labels', 214], ['Pricing in public', 96], ['Ghostwriting', 58]] },
  Help: { label: 'Asked this week', items: [['Unanswered', 7], ['Pricing', 12], ['Automation', 9], ['Video', 4]] },
  List: { label: 'Lists this week', items: [['Starter stacks', 5], ['Prompt packs', 3], ['Courses', 2]] },
  Showcase: { label: 'Shipped this week', items: [['Apps', 9], ['Templates', 6], ['Videos', 4]] },
  Agents: { label: 'Related topics', items: [['Automation', 31], ['Prompting', 22], ['Ops', 14]] },
  Pricing: { label: 'Related topics', items: [['Productized services', 19], ['Retainers', 11], ['Bundles', 8]] },
  Automation: { label: 'Related topics', items: [['Agents', 31], ['Zapier', 15], ['Ops', 12]] },
  Video: { label: 'Related topics', items: [['Editing', 24], ['Shorts', 17], ['Lighting', 6]] },
  'No-code': { label: 'Related topics', items: [['Framer', 18], ['Webflow', 13], ['Automation', 10]] },
}

const STATS: Record<string, [string, string][]> = {
  Review: [['128', 'reviews this month'], ['14', 'tools rated this week'], ['3', 'new today']],
  Debate: [['46', 'debates this month'], ['2,310', 'votes this week'], ['5', 'new today']],
  Help: [['312', 'questions this month'], ['89%', 'answered this week'], ['11', 'new today']],
}
const TOP: Record<string, { title: string; meta: string; kind: FrameKind }> = {
  Review: { title: 'Cursor vs Windsurf after 90 days of solo shipping', meta: '1.2K upvotes', kind: 'tool' },
  Debate: { title: 'AI-written posts should carry a label.', meta: '214 voted', kind: 'debate' },
  Help: { title: 'How do I price a prompt bundle for agencies?', meta: '27 answers', kind: 'answer' },
}
export function subjectInfo(s: string) {
  const n = NEW_COUNT[s] ?? 4
  return {
    stats: STATS[s] ?? ([[String(40 + s.length * 7), 'posts this month'], [String(n * 3 + 6), 'this week'], [String(n), 'new today']] as [string, string][]),
    top: TOP[s] ?? { title: 'Six weeks running my studio on three agents', meta: '840 valued', kind: 'post' as FrameKind },
  }
}
