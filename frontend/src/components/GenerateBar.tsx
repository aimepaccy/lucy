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
  recordingLive: boolean
  slideCount: number
  sendState: SendState
  onGenerate: () => void
  onDismiss: () => void
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

function describeReceipt({ notes_words, slides, audio }: SessionReceipt) {
  const parts = []
  if (notes_words > 0) parts.push(`${plural(notes_words, 'word')} of notes`)
  if (audio) parts.push(`a recording (${formatFileSize(audio.size_bytes)})`)
  if (slides.length > 0) {
    const bytes = slides.reduce((total, slide) => total + slide.size_bytes, 0)
    parts.push(`${plural(slides.length, 'slide file')} (${formatFileSize(bytes)})`)
  }
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0]
  return `Lucy's server received ${list}. Study pack generation is coming soon.`
}

export function GenerateBar({
  notesWords,
  recording,
  recordingLive,
  slideCount,
  sendState,
  onGenerate,
  onDismiss,
}: GenerateBarProps) {
  const sending = sendState.status === 'sending'

  const chips = [
    notesWords > 0 && { key: 'notes', icon: NotebookPen, label: `${plural(notesWords, 'word')} of notes` },
    recording && {
      key: 'audio',
      icon: Mic,
      label: recording.durationSec !== null ? `${formatDuration(recording.durationSec)} recording` : 'Audio file',
    },
    recordingLive && { key: 'live', icon: Mic, label: 'Recording in progress: stop it to send' },
    slideCount > 0 && { key: 'slides', icon: Presentation, label: plural(slideCount, 'slide file') },
  ].filter((chip) => chip !== false && chip !== null)

  const enabled = chips.length > 0 && !sending && !recordingLive

  const message =
    sendState.status === 'received'
      ? describeReceipt(sendState.receipt)
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
