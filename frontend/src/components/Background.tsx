import { motion } from 'motion/react'

const drift = { duration: 26, repeat: Infinity, repeatType: 'mirror' as const, ease: 'easeInOut' as const }

export function Background() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] mask-[radial-gradient(ellipse_at_top,black_30%,transparent_75%)] bg-size-[22px_22px]" />
      <motion.div
        className="absolute -top-48 -left-40 size-[38rem] rounded-full bg-primary/15 blur-3xl"
        animate={{ x: [0, 120, 40], y: [0, 60, 140] }}
        transition={drift}
      />
      <motion.div
        className="absolute top-1/3 -right-48 size-[34rem] rounded-full bg-accent-foreground/10 blur-3xl"
        animate={{ x: [0, -100, -30], y: [0, -80, 40] }}
        transition={{ ...drift, duration: 32 }}
      />
    </div>
  )
}
