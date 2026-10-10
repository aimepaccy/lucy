import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { SpotlightGlow, trackPointer } from '@/components/Spotlight'
import { rise } from '@/lib/motion'
import { cn } from '@/lib/utils'

type PanelProps = {
  icon: LucideIcon
  step?: number
  title: string
  description: string
  aside?: ReactNode
  active?: boolean
  className?: string
  children: ReactNode
}

export function Panel({ icon: Icon, step, title, description, aside, active, className, children }: PanelProps) {
  return (
    <motion.section
      variants={rise}
      onMouseMove={trackPointer}
      className={cn(
        'group/spot relative flex flex-col rounded-xl border bg-card/75 p-5 shadow-sm backdrop-blur-md transition-[box-shadow,border-color] duration-300 hover:shadow-lg sm:p-6',
        active && 'border-primary/30 shadow-[0_12px_40px_-12px_var(--glow)]',
        className,
      )}
    >
      <SpotlightGlow />
      <AnimatePresence>
        {active && (
          <motion.span
            aria-hidden="true"
            className="border-beam"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <header className="relative mb-4 flex items-start gap-3">
        <div className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-accent to-secondary text-accent-foreground ring-1 ring-primary/15">
          <Icon className="size-[1.15rem]" aria-hidden="true" />
          {step !== undefined && (
            <span className="absolute -top-1.5 -right-1.5 grid size-4.5 place-items-center rounded-full bg-primary text-[0.6rem] font-semibold text-primary-foreground tabular-nums">
              {step}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {aside}
      </header>
      <div className="relative flex flex-1 flex-col">{children}</div>
    </motion.section>
  )
}
