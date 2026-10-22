import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { WardWiseMark } from '@/components/WardWiseMark'
import { Wordmark } from '@/components/Wordmark'
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
        <WardWiseMark className="size-9 drop-shadow-sm" />
        <div>
          <p className="text-xl leading-none text-foreground">
            <Wordmark />
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Every ward round, turned into a lesson</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {actions}
        <ThemeToggle theme={theme} onChange={onThemeChange} />
      </div>
    </motion.header>
  )
}
