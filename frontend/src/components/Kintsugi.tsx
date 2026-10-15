import { useId } from 'react'
import { cn } from '@/lib/utils'

// Kintsugi mends broken pottery with gold, so the repair becomes part of the beauty.
// Lucy uses the gold seams as quiet decoration; they carry no meaning for the reader.

const paths = {
  // A crack running across a divider.
  line: 'M0 6 L58 5 L66 2 L79 8 L131 6 L140 9 L152 4 L214 6 L223 3 L231 7 L300 6',
  // A crack crossing a corner, with one small branch.
  corner: 'M0 34 L14 30 L19 22 L33 19 L38 9 L52 6 L56 0 M33 19 L41 24',
}

type SeamProps = {
  variant?: keyof typeof paths
  className?: string
}

export function KintsugiSeam({ variant = 'line', className }: SeamProps) {
  const gradientId = useId()
  const isLine = variant === 'line'

  return (
    <svg
      aria-hidden="true"
      viewBox={isLine ? '0 0 300 12' : '0 0 56 34'}
      preserveAspectRatio={isLine ? 'none' : 'xMidYMid meet'}
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
        d={paths[variant]}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={isLine ? 1.4 : 1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
