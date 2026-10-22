import { useId, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

// Every pencil drawing in Lucy shares one hand: the same wobble, line weights and drawing-in order.
// Graphite draws the object; ink marks the few strokes that matter.

type SketchProps = {
  viewBox: string
  // A new value redraws the sketch from the first stroke.
  replay?: boolean
  // How many times larger than the small drawings this one is shown, so the wobble looks the same on screen.
  size?: number
  className?: string
  children: ReactNode
  // Drawn on top without the wobble, for text that must stay crisp.
  overlay?: ReactNode
}

export function Sketch({ viewBox, replay = false, size = 1, className, children, overlay }: SketchProps) {
  const filterId = useId()

  return (
    <svg viewBox={viewBox} className={cn('overflow-visible', className)} aria-hidden="true">
      <defs>
        {/* A slight wobble, as a hand-held pencil gives. */}
        <filter id={filterId}>
          <feTurbulence type="fractalNoise" baseFrequency={0.06 * size} numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale={1.6 / size} />
        </filter>
      </defs>
      <g key={replay ? 'again' : 'first'} filter={`url(#${filterId})`} fill="none" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
      {overlay}
    </svg>
  )
}

type StrokesProps = {
  paths: string[]
  tone: 'graphite' | 'ink'
  // Strokes are drawn one after another; `start` is this group's place in that order.
  start?: number
  // A drawing shown larger needs thinner lines to look the same.
  weight?: number
}

export function Strokes({ paths, tone, start = 0, weight = 1 }: StrokesProps) {
  const still = useReducedMotion() ?? false

  return (
    <>
      {paths.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          className={tone === 'ink' ? 'stroke-primary' : 'stroke-muted-foreground'}
          strokeWidth={(tone === 'ink' ? 1 : 1.2) * weight}
          initial={{ pathLength: still ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, delay: 0.4 + (start + i) * 0.07, ease: 'easeInOut' }}
        />
      ))}
    </>
  )
}
