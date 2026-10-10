import { motion } from 'motion/react'

const drift = { repeat: Infinity, repeatType: 'mirror' as const, ease: 'easeInOut' as const }

export function Background() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -top-56 -left-48 size-168 rounded-full bg-primary/20 blur-[120px]"
        animate={{ x: [0, 140, 40], y: [0, 70, 160] }}
        transition={{ ...drift, duration: 28 }}
      />
      <motion.div
        className="absolute top-1/4 -right-56 size-152 rounded-full bg-[oklch(0.75_0.1_175/0.16)] blur-[120px]"
        animate={{ x: [0, -120, -30], y: [0, -90, 50] }}
        transition={{ ...drift, duration: 34 }}
      />
      <motion.div
        className="absolute -bottom-64 left-1/3 size-144 rounded-full bg-[oklch(0.6_0.12_250/0.12)] blur-[120px]"
        animate={{ x: [0, 90, -60], y: [0, -60, 0] }}
        transition={{ ...drift, duration: 40 }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] mask-[radial-gradient(ellipse_at_top,black_25%,transparent_70%)] bg-size-[22px_22px]" />
      <div className="grain absolute inset-0 opacity-[0.035] mix-blend-overlay dark:opacity-[0.06]" />
    </div>
  )
}
