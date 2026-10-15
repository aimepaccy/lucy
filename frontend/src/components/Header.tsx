import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { LucyMark } from '@/components/LucyMark'
import { PixelWordmark } from '@/components/PixelWordmark'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { Theme } from '@/hooks/use-theme'
import { rise } from '@/lib/motion'

type HeaderProps = {
  theme: Theme
  onThemeChange: (theme: Theme) => void
  // Buttons shown before the theme toggle, such as My packs.
  actions?: ReactNode
}

export function Header({ theme, onThemeChange, actions }: HeaderProps) {
  return (
    <motion.header variants={rise} className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <LucyMark className="size-9 drop-shadow-sm" />
        <div>
          <p className="text-foreground">
            <PixelWordmark />
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Study packs from teaching rounds</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {actions}
        <ThemeToggle theme={theme} onChange={onThemeChange} />
      </div>
    </motion.header>
  )
}
