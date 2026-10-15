import { motion, useReducedMotion } from 'motion/react'

const drift = { duration: 26, repeat: Infinity, repeatType: 'mirror' as const, ease: 'easeInOut' as const }

// Uneven corners make the washes look like ink spreading on paper rather than perfect circles.
const washShape = '58% 42% 63% 37% / 45% 55% 45% 55%'

export function Background() {
  const still = useReducedMotion()

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -top-48 -left-40 size-152 bg-primary/12 blur-3xl"
        style={{ borderRadius: washShape }}
        animate={{ x: [0, 120, 40], y: [0, 60, 140], rotate: [0, 25, -10] }}
        transition={drift}
      />
      <motion.div
        className="absolute top-1/3 -right-48 size-136 bg-gold/10 blur-3xl"
        style={{ borderRadius: washShape }}
        animate={{ x: [0, -100, -30], y: [0, -80, 40], rotate: [0, -20, 15] }}
        transition={{ ...drift, duration: 32 }}
      />
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
