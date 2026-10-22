import { useId } from 'react'
import { motion } from 'motion/react'

// Five sound bars standing on one line; their tops trace a W (tall, short, middle, short, tall).
const bars = [
  { x: 7, h: 18 },
  { x: 11.5, h: 8 },
  { x: 16, h: 13 },
  { x: 20.5, h: 8 },
  { x: 25, h: 18 },
]
const baseline = 25

export function WardWiseMark({ className }: { className?: string }) {
  const gradientId = useId()

  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(0.64 0.085 190)" />
          <stop offset="1" stopColor="oklch(0.44 0.075 215)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      {bars.map((bar, i) => (
        <motion.rect
          key={bar.x}
          x={bar.x - 1.25}
          y={baseline - bar.h}
          width="2.5"
          height={bar.h}
          rx="1.25"
          fill="white"
          style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
          initial={{ scaleY: 0.2, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.25 + i * 0.07 }}
        />
      ))}
    </svg>
  )
}
