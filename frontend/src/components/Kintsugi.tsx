import { useId } from 'react'
import { cn } from '@/lib/utils'

// Kintsugi mends broken pottery with gold, so the repair becomes part of the beauty.
// One gold seam above the footer: quiet decoration that carries no meaning for the reader.
const crack = 'M0 6 L58 5 L66 2 L79 8 L131 6 L140 9 L152 4 L214 6 L223 3 L231 7 L300 6'

export function KintsugiSeam({ className }: { className?: string }) {
  const gradientId = useId()

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 300 12"
      preserveAspectRatio="none"
      className={cn('pointer-events-none overflow-visible', className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--gold)" />
          <stop offset="0.45" stopColor="var(--gold-bright)" />
          <stop offset="1" stopColor="var(--gold)" />
        </linearGradient>
      </defs>
      <path
        d={crack}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
