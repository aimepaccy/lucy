import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, CheckCircle2, Loader2, Mic, NotebookPen, Presentation, Sparkles } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { formatDuration, formatFileSize } from '@/lib/format'
import { rise, spring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { Recording, SendState, SessionReceipt } from '@/types'

type GenerateBarProps = {
  notesWords: number
  recording: Recording | null
  slideCount: number
  sendState: SendState
  onGenerate: () => void
  onDismiss: () => void
}

function describeReceipt({ notes_words, slides }: SessionReceipt, hasRecording: boolean) {
  const parts = []
  if (notes_words > 0) parts.push(`${notes_words} ${notes_words === 1 ? 'word' : 'words'} of notes`)
  if (slides.length > 0) {
    const bytes = slides.reduce((total, slide) => total + slide.size_bytes, 0)
    parts.push(`${slides.length} slide ${slides.length === 1 ? 'file' : 'files'} (${formatFileSize(bytes)})`)
  }
  const recordingNote = hasRecording ? ' Recordings are not sent yet.' : ''
  return `Lucy's server received ${parts.join(' and ')}.${recordingNote} Study pack generation is coming soon.`
}

export function GenerateBar({ notesWords, recording, slideCount, sendState, onGenerate, onDismiss }: GenerateBarProps) {
  const sending = sendState.status === 'sending'

  const chips = [
    notesWords > 0 && { key: 'notes', icon: NotebookPen, label: `${notesWords} words of notes` },
    recording && { key: 'audio', icon: Mic, label: `${formatDuration(recording.durationSec)} recording` },
    slideCount > 0 && { key: 'slides', icon: Presentation, label: `${slideCount} slide ${slideCount === 1 ? 'file' : 'files'}` },
  ].filter((chip) => chip !== false && chip !== null)

  const enabled = chips.length > 0 && !sending

  const message =
    sendState.status === 'received'
      ? describeReceipt(sendState.receipt, recording !== null)
      : sendState.status === 'error'
        ? sendState.message
        : null

  const announcement = sending ? 'Sending to Lucy' : (message ?? '')

  return (
    <motion.div variants={rise} className="sticky bottom-4 z-20">
      <div className="rounded-2xl border bg-card/95 p-3 shadow-lg backdrop-blur-xl sm:p-4">
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

          <motion.button
            type="button"
            disabled={!enabled}
            onClick={onGenerate}
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
            {sending ? <Loader2 className="motion-safe:animate-spin" /> : <Sparkles />}
            {sending ? 'Sending to Lucy' : 'Generate study pack'}
          </motion.button>
        </div>

        <AnimatePresence>
          {message && (
            <motion.div
              key={sendState.status}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden text-sm"
            >
              <p
                className={cn(
                  'flex items-start gap-2 pt-3',
                  sendState.status === 'error' ? 'text-destructive' : 'text-muted-foreground',
                )}
              >
                {sendState.status === 'error' ? (
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                )}
                <span>
                  {message}{' '}
                  <button type="button" onClick={onDismiss} className="font-medium text-primary hover:underline">
                    Dismiss
                  </button>
                </span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
