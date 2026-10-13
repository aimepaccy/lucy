import { useState, type Ref } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, Mic, NotebookPen, Presentation, RefreshCw, Sparkles } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { formatDuration, formatFileSize, plural } from '@/lib/format'
import { hasReviewable } from '@/lib/materials'
import { rise, spring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { Recording, SendState, SessionReceipt } from '@/types'

type GenerateBarProps = {
  generateRef: Ref<HTMLButtonElement>
  notesWords: number
  recording: Recording | null
  recordingLive: boolean
  slideCount: number
  sendState: SendState
  // True when the recording or slides changed after Lucy read them.
  inputsChanged: boolean
  // True when the student has corrected what Lucy heard and read.
  corrected: boolean
  onGenerate: () => void
  onDismiss: () => void
}

function describeReceipt({ notes_words, slides, audio }: SessionReceipt) {
  const parts = []
  if (notes_words > 0) parts.push(`${plural(notes_words, 'word')} of notes`)
  if (audio) parts.push(`a recording (${formatFileSize(audio.size_bytes)})`)
  if (slides.length > 0) {
    const bytes = slides.reduce((total, slide) => total + slide.size_bytes, 0)
    parts.push(`${plural(slides.length, 'slide file')} (${formatFileSize(bytes)})`)
  }
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0]
  return `Lucy received ${list}.`
}

export function GenerateBar({
  generateRef,
  notesWords,
  recording,
  recordingLive,
  slideCount,
  sendState,
  inputsChanged,
  corrected,
  onGenerate,
  onDismiss,
}: GenerateBarProps) {
  // Remembers which reading the student agreed to replace; a new reading starts unconfirmed.
  const [replaceConfirmedFor, setReplaceConfirmedFor] = useState<SendState | null>(null)
  const busy = sendState.status === 'sending' || sendState.status === 'working'
  const reviewing = sendState.status === 'ready'

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

  // While the student reviews, the button writes the study pack (phase 4b), or reads again if the inputs changed.
  const enabled = chips.length > 0 && !busy && !recordingLive && (!reviewing || inputsChanged)
  const askingToReplace = reviewing && inputsChanged && corrected && replaceConfirmedFor === sendState
  const label = reviewing
    ? inputsChanged
      ? askingToReplace
        ? 'Yes, read again'
        : 'Read again'
      : 'Write my study pack'
    : 'Generate study pack'

  // Reading again throws away the student's corrections, so the first press only asks.
  function handleClick() {
    if (reviewing && inputsChanged && corrected && !askingToReplace) setReplaceConfirmedFor(sendState)
    else onGenerate()
  }

  const progress =
    sendState.status === 'sending' ? 'Uploading to Lucy' : sendState.status === 'working' ? sendState.step : null

  function describeState(): string | null {
    if (sendState.status === 'working') return describeReceipt(sendState.receipt)
    if (sendState.status === 'error') return sendState.message
    if (!reviewing || chips.length === 0) return null
    if (askingToReplace) return 'Reading again replaces your corrections. Press "Yes, read again" to continue, or keep editing above.'
    if (inputsChanged) {
      const loss = corrected ? '; this replaces your corrections' : ''
      return `Your recording or slides changed after Lucy read them. Read again to include the changes${loss}.`
    }
    if (!hasReviewable(sendState.materials)) return 'Lucy has your notes. Writing the study pack comes next.'
    return 'Lucy has read your material. Correct anything it got wrong above; writing the study pack comes next.'
  }

  const message = describeState()
  const caution = reviewing && inputsChanged

  const announcement = progress ?? message ?? ''

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
            ref={generateRef}
            type="button"
            disabled={!enabled}
            onClick={handleClick}
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
            {busy ? <Loader2 className="motion-safe:animate-spin" /> : reviewing && inputsChanged ? <RefreshCw /> : <Sparkles />}
            {progress ?? label}
          </motion.button>
        </div>

        <AnimatePresence>
          {message && (
            <motion.div
              key={`${sendState.status}-${inputsChanged}-${askingToReplace}`}
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
                ) : caution ? (
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                )}
                <span>
                  {message}{' '}
                  {/* While reviewing, the panel's own close button guards the student's corrections. */}
                  {!busy && !reviewing && (
                    <button type="button" onClick={onDismiss} className="font-medium text-primary hover:underline">
                      Dismiss
                    </button>
                  )}
                </span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
