import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { rise } from '@/lib/motion'
import { cn } from '@/lib/utils'

type PanelProps = {
  icon: LucideIcon
  title: string
  description: string
  aside?: ReactNode
  className?: string
  children: ReactNode
}

export function Panel({ icon: Icon, title, description, aside, className, children }: PanelProps) {
  return (
    <motion.section
      variants={rise}
      className={cn(
        'flex flex-col rounded-xl border bg-card/80 p-5 shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-md sm:p-6',
        className,
      )}
    >
      <header className="mb-4 flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-[1.1rem]" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {aside}
      </header>
      {children}
    </motion.section>
  )
}
