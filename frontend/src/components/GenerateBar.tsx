import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Loader2, Mic, NotebookPen, Presentation, Sparkles } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { formatDuration } from '@/lib/format'
import { rise, spring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { Recording } from '@/types'

type GenerateBarProps = {
  notesWords: number
  recording: Recording | null
  slideCount: number
}

export function GenerateBar({ notesWords, recording, slideCount }: GenerateBarProps) {
  const [state, setState] = useState<'ready' | 'working' | 'notice'>('ready')

  const chips = [
    notesWords > 0 && { key: 'notes', icon: NotebookPen, label: `${notesWords} words of notes` },
    recording && { key: 'audio', icon: Mic, label: `${formatDuration(recording.durationSec)} recording` },
    slideCount > 0 && { key: 'slides', icon: Presentation, label: `${slideCount} slide ${slideCount === 1 ? 'file' : 'files'}` },
  ].filter((chip) => chip !== false && chip !== null)

  const enabled = chips.length > 0 && state !== 'working'

  function generate() {
    setState('working')
    window.setTimeout(() => setState('notice'), 1600)
  }

  return (
    <motion.div variants={rise} className="sticky bottom-4 z-20">
      <div className="rounded-2xl border bg-card/95 p-3 shadow-lg backdrop-blur-xl sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-h-8 flex-1 flex-wrap items-center gap-2" aria-live="polite">
            <AnimatePresence mode="popLayout" initial={false}>
              {chips.length === 0 ? (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-muted-foreground"
                >
                  Add notes, a recording or slides to begin.
                </motion.p>
              ) : (
                chips.map(({ key, icon: Icon, label }) => (
                  <motion.span
                    key={key}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={spring}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {label}
                  </motion.span>
                ))
              )}
            </AnimatePresence>
          </div>

          <motion.button
            type="button"
            disabled={!enabled}
            onClick={generate}
            whileHover={enabled ? { scale: 1.03 } : undefined}
            whileTap={enabled ? { scale: 0.97 } : undefined}
            transition={spring}
            className={cn(
              buttonVariants({ size: 'lg' }),
              'relative h-11 overflow-hidden rounded-xl px-6 text-[0.95rem] disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100',
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
            {state === 'working' ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {state === 'working' ? 'Preparing study pack' : 'Generate study pack'}
          </motion.button>
        </div>

        <AnimatePresence>
          {state === 'notice' && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden text-sm text-muted-foreground"
            >
              <span className="block pt-3">
                This is the interface preview. Study pack generation is connected in a later build stage.{' '}
                <button type="button" onClick={() => setState('ready')} className="font-medium text-primary hover:underline">
                  Dismiss
                </button>
              </span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
