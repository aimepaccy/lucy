import { motion } from 'motion/react'
import { LucyMark } from '@/components/LucyMark'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { Theme } from '@/hooks/use-theme'
import { rise } from '@/lib/motion'

type HeaderProps = {
  theme: Theme
  onThemeChange: (theme: Theme) => void
}

export function Header({ theme, onThemeChange }: HeaderProps) {
  return (
    <motion.header variants={rise} className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <LucyMark className="size-9 drop-shadow-sm" />
        <div>
          <p className="text-lg leading-none font-semibold tracking-tight">Lucy</p>
          <p className="mt-1 text-xs text-muted-foreground">Study packs from teaching rounds</p>
        </div>
      </div>
      <ThemeToggle theme={theme} onChange={onThemeChange} />
    </motion.header>
  )
}
