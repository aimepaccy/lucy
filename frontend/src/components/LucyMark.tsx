import { useId } from 'react'
import { motion } from 'motion/react'

const bars = [
  { x: 7, h: 6 },
  { x: 11.5, h: 12 },
  { x: 16, h: 17 },
  { x: 20.5, h: 11 },
  { x: 25, h: 6 },
]

export function LucyMark({ className }: { className?: string }) {
  const gradientId = useId()

  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(0.74 0.12 190)" />
          <stop offset="1" stopColor="oklch(0.5 0.11 228)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      {bars.map((bar, i) => (
        <motion.rect
          key={bar.x}
          x={bar.x - 1.25}
          y={16 - bar.h / 2}
          width="2.5"
          height={bar.h}
          rx="1.25"
          fill="white"
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          initial={{ scaleY: 0.2, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.25 + i * 0.07 }}
        />
      ))}
    </svg>
  )
}
