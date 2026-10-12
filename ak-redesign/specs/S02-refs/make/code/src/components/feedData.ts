/* Feed fixtures (prototype data). Product UI never shows these field names. */
import type { PostType } from './taxonomy'

export type Stage = 'new' | 'rising' | 'established' | 'evergreen' | 'resurfacing'
export type Relationship = 'none' | 'commented' | 'author' | 'expert'
export type Author = { name: string; handle: string; level: string; seed: number; kind?: 'human' | 'ai' | 'editorial' }
export type Facet =
  | { t: 'review'; tool: { name: string; price: string }; verdict: number; community: number; pro: string; con: string }
  | { t: 'compare'; tools: { name: string; score: number }[]; row: { label: string; values: string[] } }
  | { t: 'debate'; votes: number; agree: number }
  | { t: 'help'; problem: string; resolvedBy?: string }
  | { t: 'list'; items: [string, number][]; more: number }
  | { t: 'showcase'; thing: string; link: boolean }
  | { t: 'news'; claim: string; domain: string }
  | { t: 'spark' }
export type Post = {
  id: string; type: PostType; topic: string; author: Author; time: string; updated?: boolean; pinned?: boolean
  title: string; facet: Facet; cover?: string; stage: Stage; best: string
  valuable: number; comments: number; discussing: number; faces: number[]
}

export const PEOPLE = {
  rachel: { name: 'Rachel Moore', handle: 'rachel', level: 'Nova', seed: 0 },
  theo: { name: 'Theo Brandt', handle: 'theo', level: 'Orbit', seed: 1 },
  lina: { name: 'Lina Park', handle: 'lina', level: 'Star', seed: 2 },
  dev: { name: 'Dev Patel', handle: 'dev', level: 'Comet', seed: 3 },
  maya: { name: 'Maya Okafor', handle: 'maya', level: 'Galaxy', seed: 4 },
  atlas: { name: 'Atlas', handle: 'atlas', level: 'Comet', seed: 0, kind: 'ai' },
  editorial: { name: 'Createconomy', handle: 'createconomy', level: 'Team', seed: 0, kind: 'editorial' },
} satisfies Record<string, Author>

export const POSTS: Post[] = [
  {
    id: 'p-pinned', type: 'News', topic: 'Video', author: PEOPLE.editorial, time: '1d', pinned: true,
    title: 'Creator Week: the full schedule is live',
    facet: { t: 'news', claim: 'Five days of live teardowns, starting Monday at 10:00 ET.', domain: 'createconomy.com' },
    stage: 'established', best: '@lina: the Thursday pricing teardown is the one not to miss',
    valuable: 96, comments: 31, discussing: 12, faces: [2, 3, 4], cover: '1741466071728-cc5691bfb535',
  },
  {
    id: 'p-review', type: 'Review', topic: 'Agents', author: PEOPLE.rachel, time: '2h', updated: true,
    title: 'Cursor after six months: still worth $20?',
    facet: { t: 'review', tool: { name: 'Cursor', price: '$20/mo' }, verdict: 4, community: 4.4, pro: 'Multi-file edits finally feel trustworthy', con: 'Usage caps bite on long refactors' },
    stage: 'rising', best: '@maya: the handoff checklist alone saved me a week — and the part about rules files changed how I set up every repo since.',
    valuable: 14, comments: 23, discussing: 24, faces: [1, 2, 4], cover: '1515879218367-8466d910aaa4',
  },
  {
    id: 'p-spark', type: 'Spark', topic: 'Pricing', author: PEOPLE.theo, time: '38m',
    title: 'Charging by the hour is a tax on getting better at your job.',
    facet: { t: 'spark' },
    stage: 'new', best: '', valuable: 0, comments: 2, discussing: 3, faces: [0, 3, 2],
  },
  {
    id: 'p-debate', type: 'Debate', topic: 'Agents', author: PEOPLE.lina, time: '5h',
    title: 'AI-written posts should carry a label.',
    facet: { t: 'debate', votes: 214, agree: 62 },
    stage: 'established', best: '@dev: labels are fine, but only if the bar is “mostly written by”, not “touched by”.',
    valuable: 41, comments: 88, discussing: 57, faces: [3, 4, 0],
  },
  {
    id: 'p-help', type: 'Help', topic: 'Pricing', author: PEOPLE.dev, time: '1h',
    title: 'How do I price a prompt bundle for agencies?',
    facet: { t: 'help', problem: 'Agencies want unlimited seats; I sell per-creator licences.' },
    stage: 'new', best: '', valuable: 3, comments: 4, discussing: 5, faces: [1, 4, 2],
  },
  {
    id: 'p-compare', type: 'Compare', topic: 'Video', author: PEOPLE.maya, time: '9h',
    title: 'Descript vs Riverside vs Loomwright for weekly shows',
    facet: { t: 'compare', tools: [{ name: 'Descript', score: 4.3 }, { name: 'Riverside', score: 4.1 }, { name: 'Loomwright', score: 4.4 }], row: { label: 'Offline mode', values: ['Yes', 'No', 'Partial'] } },
    stage: 'resurfacing', best: '@rachel: Loomwright chapters are the reason I switched.',
    valuable: 37, comments: 46, discussing: 18, faces: [0, 1, 3], cover: '1741466071751-c62474d2d3ae',
  },
  {
    id: 'p-list', type: 'List', topic: 'No-code', author: PEOPLE.atlas, time: '3h',
    title: 'The leanest no-code stack for a one-person studio',
    facet: { t: 'list', items: [['Framer for the site', 128], ['Tally for intake', 94], ['Make for glue', 71]], more: 12 },
    stage: 'evergreen', best: '@theo: swap Make for n8n once you pass 10k runs a month.',
    valuable: 212, comments: 64, discussing: 9, faces: [2, 0, 4],
  },
  {
    id: 'p-showcase', type: 'Showcase', topic: 'Automation', author: PEOPLE.maya, time: '6h',
    title: 'I automated my whole client onboarding — here it is',
    facet: { t: 'showcase', thing: 'A form → contract → kickoff call pipeline that runs itself.', link: true },
    stage: 'established', best: '@lina: stealing the contract step verbatim, thank you.',
    valuable: 58, comments: 19, discussing: 11, faces: [1, 3, 2], cover: '1566476927456-446189d7b1ca',
  },
  {
    id: 'p-help2', type: 'Help', topic: 'Automation', author: PEOPLE.lina, time: '2d',
    title: 'Zapier keeps double-firing on new Stripe payments',
    facet: { t: 'help', problem: 'Every successful charge triggers my welcome email twice.', resolvedBy: 'maya' },
    stage: 'evergreen', best: '@maya: dedupe on the charge id, not the customer id.',
    valuable: 29, comments: 12, discussing: 4, faces: [4, 0, 1],
  },
]

export const NEW_POSTS: Post[] = [
  {
    id: 'n-spark', type: 'Spark', topic: 'Agents', author: PEOPLE.dev, time: 'now',
    title: 'The best agent is the one that knows when to hand back.',
    facet: { t: 'spark' }, stage: 'new', best: '', valuable: 0, comments: 0, discussing: 1, faces: [0, 2, 4],
  },
  {
    id: 'n-news', type: 'News', topic: 'Video', author: PEOPLE.theo, time: '2m',
    title: 'YouTube opens chapter search to every channel',
    facet: { t: 'news', claim: 'Viewers can now search inside chapters on any public video.', domain: 'theverge.com' },
    stage: 'new', best: '', valuable: 0, comments: 1, discussing: 2, faces: [1, 3, 4], cover: '1519217651866-847339e674d4',
  },
]
