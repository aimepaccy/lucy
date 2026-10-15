import { motion, useReducedMotion } from 'motion/react'

// Kept to two quiet things: the paper's grain, and one ensō drawn once.
export function Background() {
  const still = useReducedMotion()

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <Enso still={still ?? false} />
      <div className="paper-grain absolute inset-0" />
    </div>
  )
}

// An ensō: the Zen circle drawn in one brushstroke and deliberately left open.
function Enso({ still }: { still: boolean }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className="absolute -top-10 -right-24 size-112 text-foreground opacity-[0.06] sm:top-4 sm:-right-16 sm:size-136 dark:opacity-[0.08]"
    >
      <defs>
        {/* Roughens the stroke's edges, like a dry brush. */}
        <filter id="enso-brush">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" />
          <feDisplacementMap in="SourceGraphic" scale="5" />
        </filter>
      </defs>
      <motion.path
        d="M 132 34 C 170 52, 182 104, 160 140 C 136 178, 78 184, 46 152 C 16 122, 22 70, 58 44 C 80 28, 104 26, 120 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="13"
        strokeLinecap="round"
        filter="url(#enso-brush)"
        initial={{ pathLength: still ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2.4, delay: 0.3, ease: [0.65, 0, 0.35, 1] }}
      />
      {/* Where the brush first lands it carries more ink, so the stroke starts heavy and thins out. */}
      <motion.path
        d="M 132 34 C 170 52, 182 104, 160 140 C 150 156, 136 166, 120 172"
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
        filter="url(#enso-brush)"
        transform="translate(3 -2)"
        initial={{ pathLength: still ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.3, delay: 0.3, ease: [0.65, 0, 0.35, 1] }}
      />
    </svg>
  )
}
