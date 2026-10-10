import { useState } from 'react'
import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import { LucyMark } from '@/components/LucyMark'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { Theme } from '@/hooks/use-theme'
import { rise } from '@/lib/motion'
import { cn } from '@/lib/utils'

type HeaderProps = {
  theme: Theme
  onThemeChange: (theme: Theme) => void
}

export function Header({ theme, onThemeChange }: HeaderProps) {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 12))

  return (
    <motion.header variants={rise} className="sticky top-3 z-30 -mx-2 sm:-mx-3">
      <div
        className={cn(
          'flex items-center justify-between rounded-2xl border px-2 py-2 transition-all duration-300 sm:px-3',
          scrolled ? 'border-border bg-card/70 shadow-lg backdrop-blur-xl' : 'border-transparent',
        )}
      >
        <div className="flex items-center gap-3">
          <LucyMark className="size-9 drop-shadow-sm" />
          <div>
            <p className="text-lg leading-none font-semibold tracking-tight">Lucy</p>
            <p className="mt-1 text-xs text-muted-foreground">Study packs from teaching rounds</p>
          </div>
        </div>
        <ThemeToggle theme={theme} onChange={onThemeChange} />
      </div>
    </motion.header>
  )
}
