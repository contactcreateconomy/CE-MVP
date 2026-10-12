/* Hero fixtures (prototype data). Product UI never shows these field names. */
export type FrameKind = 'post' | 'debate' | 'tool' | 'topic' | 'milestone' | 'answer'
export type Source = 'community' | 'editorial' | 'featured'
export const SOURCE_LABEL: Record<Source, string> = {
  community: 'Community top',
  editorial: 'Picked by Createconomy',
  featured: 'Featured',
}

export type Frame =
  | { id: string; kind: 'post'; source: Source; type: string; topic: string; title: string; summary: string; author: { name: string; level: string; seed: number } }
  | { id: string; kind: 'debate'; source: Source; proposition: string; votes: number; agree: number }
  | { id: string; kind: 'tool'; source: Source; name: string; tagline: string; pricing: string; score: number; ratings: number; reviewers: number[] }
  | { id: string; kind: 'topic'; source: Source; topic: string; growth: string; spark: number[]; posts: string[] }
  | { id: string; kind: 'milestone'; source: Source; person: string; level: string; seed: number; did: string }
  | { id: string; kind: 'answer'; source: Source; question: string; comments: number; common: { line: string; support: number }; differ: { line: string; support: number }[] }

export const FRAMES: Record<FrameKind, Frame> = {
  post: {
    id: 'f-post', kind: 'post', source: 'community', type: 'Review', topic: 'Agents',
    title: 'Six weeks running my studio on three agents',
    summary: 'What held up, what quietly broke, and the one handoff I still do by hand.',
    author: { name: 'Rachel Moore', level: 'Nova', seed: 0 },
  },
  debate: {
    id: 'f-debate', kind: 'debate', source: 'community',
    proposition: 'AI-written posts should carry a label.', votes: 214, agree: 62,
  },
  tool: {
    id: 'f-tool', kind: 'tool', source: 'editorial', name: 'Loomwright',
    tagline: 'Turns long recordings into chaptered, searchable lessons.',
    pricing: 'Free · $20/mo', score: 4.4, ratings: 212, reviewers: [1, 2, 3],
  },
  topic: {
    id: 'f-topic', kind: 'topic', source: 'community', topic: 'Agents', growth: '+340% this week',
    spark: [4, 5, 4, 7, 6, 9, 12, 11, 17, 22, 28, 34],
    posts: ['Six weeks running my studio on three agents', 'The cheapest reliable agent stack in October', 'When an agent should hand back to a human'],
  },
  milestone: {
    id: 'f-milestone', kind: 'milestone', source: 'community', person: 'Maya', level: 'Galaxy', seed: 3,
    did: '38 answers valued this month',
  },
  answer: {
    id: 'f-answer', kind: 'answer', source: 'editorial', question: 'Cursor or Windsurf for solo builders?', comments: 214,
    common: { line: 'Either is fine once you write a strong project rules file.', support: 63 },
    differ: [
      { line: 'Cursor wins on large refactors and multi-file edits.', support: 48 },
      { line: 'Windsurf feels calmer for long, single-thread sessions.', support: 41 },
    ],
  },
}
export const KIND_ORDER: FrameKind[] = ['post', 'answer', 'debate', 'tool', 'topic', 'milestone']
export const KIND_LABEL: Record<FrameKind, string> = { post: 'Post', debate: 'Debate', tool: 'Tool', topic: 'Surge', milestone: 'Milestone', answer: 'Answer' }

export function buildFrames(count: number, first: FrameKind, featured: boolean): Frame[] {
  const kinds = [first, ...KIND_ORDER.filter((k) => k !== first)].slice(0, Math.max(0, Math.min(5, count)))
  const frames = kinds.map((k) => ({ ...FRAMES[k] }))
  if (featured) {
    // max one promoted frame; milestones are earned only and never promoted
    const i = frames.findIndex((f, idx) => f.kind !== 'milestone' && (idx > 0 || frames.length === 1))
    const j = i === -1 ? frames.findIndex((f) => f.kind !== 'milestone') : i
    if (j !== -1) frames[j] = { ...frames[j], source: 'featured' }
  }
  return frames
}

export type { Subject } from '../taxonomy'
