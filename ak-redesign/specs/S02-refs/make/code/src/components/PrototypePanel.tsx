import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { ChevronDown, Wrench } from 'lucide-react'
import { settle } from '../motion'

/* Dev tool — intentionally styled apart from product UI (mono, fixed dark, amber accent). */
export type Ctl =
  | { kind: 'seg'; label: string; value: string; options: [string, string][]; set: (v: string) => void }
  | { kind: 'bool'; label: string; value: boolean; set: (v: boolean) => void }
  | { kind: 'actions'; label: string; actions: [string, () => void][] }
  | { kind: 'select'; label: string; value: string; options: [string, string][]; set: (v: string) => void }
  | { kind: 'heading'; label: string }

export default function PrototypePanel({ controls }: { controls: Ctl[] }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="fixed bottom-4 left-4 w-72 overflow-hidden rounded-md border border-dashed border-amber-400/50 bg-neutral-950/95 font-mono text-[11px] text-neutral-300 shadow-2xl" style={{ zIndex: 'var(--z-devtool)', colorScheme: 'dark' }}>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-3 py-2 text-amber-300" aria-expanded={open}>
        <Wrench size={13} strokeWidth={1.5} />
        <span className="flex-1 text-left tracking-wider">PROTOTYPE · R4</span>
        <ChevronDown size={14} strokeWidth={1.5} className={`transition-transform ${open ? '' : '-rotate-180'}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={settle} className="overflow-hidden">
            <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto border-t border-white/10 px-3 py-2.5">
              {controls.map((c) => c.kind === 'heading' ? (
                <p key={c.label} className="mt-1 border-t border-white/10 pt-2 text-[10px] tracking-[0.2em] text-amber-300/80 first:mt-0 first:border-0 first:pt-0">{c.label.toUpperCase()}</p>
              ) : (
                <div key={c.label} className="flex items-center justify-between gap-2">
                  <span className="text-neutral-500">{c.label}</span>
                  {c.kind === 'bool' && (
                    <button role="switch" aria-checked={c.value} onClick={() => c.set(!c.value)} className={`h-4 w-7 rounded-full p-0.5 transition-colors ${c.value ? 'bg-amber-400' : 'bg-white/15'}`}>
                      <span className={`block size-3 rounded-full bg-neutral-950 transition-transform ${c.value ? 'translate-x-3' : ''}`} />
                    </button>
                  )}
                  {c.kind === 'seg' && (
                    <div className="flex rounded border border-white/10">
                      {c.options.map(([v, l]) => (
                        <button key={v} onClick={() => c.set(v)} className={`px-1.5 py-0.5 ${c.value === v ? 'bg-amber-400 text-neutral-950' : 'hover:text-white'}`}>{l}</button>
                      ))}
                    </div>
                  )}
                  {c.kind === 'select' && (
                    <select value={c.value} onChange={(e) => c.set(e.target.value)} className="rounded border border-white/15 bg-neutral-900 px-1 py-0.5 text-neutral-200">
                      {c.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  )}
                  {c.kind === 'actions' && (
                    <div className="flex gap-1">
                      {c.actions.map(([l, fn]) => (
                        <button key={l} onClick={fn} className="rounded border border-white/15 px-1.5 py-0.5 hover:border-amber-400 hover:text-amber-300">{l}</button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
