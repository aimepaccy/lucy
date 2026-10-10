import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Mic, NotebookPen, Presentation } from 'lucide-react'
import { GenerateButton } from '@/components/GenerateButton'
import { formatDuration } from '@/lib/format'
import { rise, spring } from '@/lib/motion'
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

  // Simulated wait until the back end exists.
  useEffect(() => {
    if (state !== 'working') return
    const id = window.setTimeout(() => setState('notice'), 1600)
    return () => window.clearTimeout(id)
  }, [state])

  const announcement =
    state === 'working' ? 'Preparing study pack' : state === 'notice' ? 'Study pack generation is coming in a later version.' : ''

  return (
    <motion.div variants={rise} className="sticky bottom-4 z-20">
      <div className="relative rounded-2xl border bg-card/95 p-3 shadow-lg backdrop-blur-xl sm:p-4">
        <AnimatePresence>
          {enabled && (
            <motion.span
              aria-hidden="true"
              className="border-beam"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
        <p role="status" className="sr-only">
          {announcement}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-h-8 flex-1 flex-wrap items-center gap-2">
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

          <GenerateButton enabled={enabled} working={state === 'working'} onClick={() => setState('working')} />
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
                This is a preview of the interface. Study pack generation is coming in a later version.{' '}
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
