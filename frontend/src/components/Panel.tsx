import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { KintsugiSeam } from '@/components/Kintsugi'
import { rise } from '@/lib/motion'
import { cn } from '@/lib/utils'

type PanelProps = {
  icon: LucideIcon
  title: string
  description: string
  aside?: ReactNode
  className?: string
  // Adds a gold kintsugi seam across the lower corner.
  mended?: boolean
  children: ReactNode
}

export function Panel({ icon: Icon, title, description, aside, className, mended = false, children }: PanelProps) {
  return (
    <motion.section
      variants={rise}
      className={cn(
        'hand-radius relative flex flex-col border bg-card/80 p-5 shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-md sm:p-6',
        className,
      )}
    >
      <header className="mb-4 flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-[1.1rem]" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-ink text-[1.05rem] leading-snug font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {aside}
      </header>
      {children}
      {mended && <KintsugiSeam variant="corner" className="absolute -bottom-px -left-px h-5 w-12 -scale-y-100" />}
    </motion.section>
  )
}
