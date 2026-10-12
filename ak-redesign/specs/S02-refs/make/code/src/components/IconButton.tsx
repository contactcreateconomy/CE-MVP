import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { usePress } from '../motion'

export const ICON = { size: 18, strokeWidth: 1.5 } as const

/** Icon-only button: always aria-label + tooltip. */
export default function IconButton({
  label, children, onClick, size = 36, tooltipSide = 'bottom', className = '',
}: { label: string; children: ReactNode; onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void; size?: number; tooltipSide?: 'bottom' | 'top'; className?: string }) {
  const press = usePress()
  return (
    <span className="group relative inline-flex">
      <motion.button
        type="button" aria-label={label} onClick={onClick} {...press}
        style={{ width: size, height: size }}
        className={`relative inline-flex items-center justify-center rounded-full text-fg-2 transition-colors hover:bg-surface hover:text-fg ${className}`}
      >
        {children}
      </motion.button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm border border-line bg-elevated px-2 py-1 text-2xs text-fg opacity-0 shadow-md transition-opacity delay-300 group-hover:opacity-100 group-has-[:focus-visible]:opacity-100 ${tooltipSide === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'}`}
        style={{ zIndex: 'var(--z-dropdown)' }}
      >
        {label}
      </span>
    </span>
  )
}
