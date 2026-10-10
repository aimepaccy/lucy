import { useCallback, useEffect, useState, type MouseEvent } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { Loader2, Sparkles } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'

type GenerateButtonProps = {
  enabled: boolean
  working: boolean
  onClick: () => void
}

const PARTICLES = 12

export function GenerateButton({ enabled, working, onClick }: GenerateButtonProps) {
  const reduceMotion = useReducedMotion()
  const [bursts, setBursts] = useState<number[]>([])
  const removeBurst = useCallback((id: number) => setBursts((current) => current.filter((b) => b !== id)), [])

  // Magnetic pull: the button leans a little towards the cursor.
  const x = useSpring(useMotionValue(0), { stiffness: 250, damping: 18 })
  const y = useSpring(useMotionValue(0), { stiffness: 250, damping: 18 })

  function handleMove(event: MouseEvent<HTMLButtonElement>) {
    if (!enabled || reduceMotion) return
    const rect = event.currentTarget.getBoundingClientRect()
    x.set((event.clientX - rect.left - rect.width / 2) * 0.2)
    y.set((event.clientY - rect.top - rect.height / 2) * 0.3)
  }

  function handleLeave() {
    x.set(0)
    y.set(0)
  }

  function handleClick() {
    if (!reduceMotion) setBursts((current) => [...current, Date.now()])
    onClick()
  }

  return (
    <div className="relative">
      {bursts.map((id) => (
        <Burst key={id} id={id} onDone={removeBurst} />
      ))}
      <motion.button
        type="button"
        disabled={!enabled}
        onClick={handleClick}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ x, y }}
        whileHover={enabled ? { scale: 1.03 } : undefined}
        whileTap={enabled ? { scale: 0.96 } : undefined}
        transition={spring}
        className={cn(
          buttonVariants({ size: 'lg' }),
          'relative h-11 w-full overflow-hidden rounded-xl bg-linear-to-r from-primary to-[oklch(0.6_0.11_225)] px-6 text-[0.95rem] sm:w-auto dark:to-[oklch(0.7_0.11_215)]',
          'disabled:bg-none disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100',
          enabled && 'shadow-[0_10px_34px_-8px_var(--glow)]',
        )}
      >
        {enabled && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-transparent via-white/35 to-transparent"
            initial={{ x: '-120%' }}
            animate={{ x: '420%' }}
            transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 2.4, ease: 'easeInOut' }}
          />
        )}
        {working ? <Loader2 className="motion-safe:animate-spin" /> : <Sparkles />}
        {working ? 'Preparing study pack' : 'Generate study pack'}
      </motion.button>
    </div>
  )
}

function Burst({ id, onDone }: { id: number; onDone: (id: number) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDone(id), 800)
    return () => window.clearTimeout(timer)
  }, [id, onDone])

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
      {Array.from({ length: PARTICLES }, (_, i) => {
        const angle = (i / PARTICLES) * Math.PI * 2
        const distance = 60 + (i % 3) * 18
        return (
          <motion.span
            key={i}
            className={cn('absolute rounded-full', i % 2 ? 'size-1.5 bg-primary' : 'size-1 bg-[oklch(0.82_0.1_185)]')}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance * 0.6, opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
        )
      })}
    </div>
  )
}
