import { useState, type Ref } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, Mic, NotebookPen, Presentation, RefreshCw, Sparkles } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { formatDuration, formatFileSize, plural } from '@/lib/format'
import { hasReviewable, needsCheck } from '@/lib/materials'
import { rise, spring } from '@/lib/motion'
import { Steps, type StepKey } from '@/components/Steps'
import { cn } from '@/lib/utils'
import type { Limits, PackSize, Recording, SendState, SessionReceipt, WriteState } from '@/types'

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
  writeState: WriteState
  // The text a study pack would be written from, and the server's limits (null until known).
  packSize: PackSize | null
  limits: Limits | null
  onGenerate: () => void
  onWrite: () => void
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
  writeState,
  packSize,
  limits,
  onGenerate,
  onWrite,
  onDismiss,
}: GenerateBarProps) {
  // Remembers which reading the student agreed to replace; a new reading starts unconfirmed.
  const [replaceConfirmedFor, setReplaceConfirmedFor] = useState<SendState | null>(null)
  const reviewing = sendState.status === 'ready'
  // Busy whenever a write is running, even if the panel was closed meanwhile.
  const writing = writeState.status === 'writing'
  const busy = sendState.status === 'sending' || sendState.status === 'working' || writing

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

  // Over the limit, writing is switched off before a request is wasted. The server checks again anyway.
  const tooLong =
    reviewing && !inputsChanged && limits !== null && packSize !== null && packSize.chars > limits.max_pack_chars

  // While the student reviews, the button writes the study pack, or reads again if the inputs changed.
  const enabled = chips.length > 0 && !busy && !recordingLive && !tooLong

  // Check is skipped when there is nothing to check (notes only).
  const willCheck = reviewing ? needsCheck(sendState.materials) : recording !== null || slideCount > 0
  const steps: StepKey[] = willCheck ? ['upload', 'read', 'check', 'write'] : ['upload', 'read', 'write']

  function stepNow(): StepKey | 'done' | null {
    if (sendState.status === 'sending') return 'upload'
    if (sendState.status === 'working') return 'read'
    if (!reviewing) return null
    if (writeState.status === 'writing') return 'write'
    if (writeState.status === 'done') return 'done'
    return willCheck ? 'check' : 'write'
  }

  const currentStep = stepNow()
  const askingToReplace = reviewing && inputsChanged && corrected && replaceConfirmedFor === sendState
  const label = reviewing
    ? inputsChanged
      ? askingToReplace
        ? 'Yes, read again'
        : 'Read again'
      : writeState.status === 'done'
        ? 'Write again'
        : 'Write my study pack'
    : 'Generate study pack'

  // Reading again throws away the student's corrections, so the first press only asks.
  function handleClick() {
    if (reviewing && !inputsChanged) onWrite()
    else if (reviewing && corrected && !askingToReplace) setReplaceConfirmedFor(sendState)
    else onGenerate()
  }

  const progress =
    sendState.status === 'sending'
      ? 'Uploading to Lucy'
      : sendState.status === 'working'
        ? sendState.step
        : writeState.status === 'writing'
          ? writeState.step
          : null

  function describeState(): string | null {
    if (sendState.status === 'working') return describeReceipt(sendState.receipt)
    if (sendState.status === 'error') return sendState.message
    if (!reviewing || chips.length === 0) return null
    if (writeState.status === 'error' && !inputsChanged) return writeState.message
    if (writeState.status === 'writing') return 'Writing usually takes under a minute.'
    if (tooLong && limits) {
      return `This is more than Lucy can write from at once (about ${limits.max_pack_words.toLocaleString()} words). Shorten your notes, the transcript or the slide text.`
    }
    if (askingToReplace) return 'Reading again replaces your corrections. Press "Yes, read again" to continue, or keep editing above.'
    if (inputsChanged) {
      const loss = corrected ? '; this replaces your corrections' : ''
      return `Your recording or slides changed after Lucy read them. Read again to include the changes${loss}.`
    }
    if (writeState.status === 'done') return 'Your study pack is ready below. Correct the text above and write again if you need to.'
    if (!hasReviewable(sendState.materials)) return 'Lucy has your notes and can write your study pack from them.'
    return 'Lucy has read your material. Correct anything it got wrong above, then write your study pack.'
  }

  const message = describeState()
  const caution = reviewing && (inputsChanged || tooLong)
  const failed = sendState.status === 'error' || (reviewing && !inputsChanged && writeState.status === 'error')

  const announcement = progress ?? message ?? ''

  return (
    <motion.div variants={rise} className="sticky bottom-4 z-20">
      <div className="rounded-2xl border bg-card/95 p-3 shadow-lg backdrop-blur-xl sm:p-4">
        <p role="status" className="sr-only">
          {announcement}
        </p>
        {currentStep !== null && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b pb-3">
            <Steps steps={steps} current={currentStep} busy={busy} />
            {reviewing && !inputsChanged && limits && packSize && writeState.status !== 'writing' && (
              <WordMeter size={packSize} limits={limits} />
            )}
          </div>
        )}
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
                  failed ? 'text-destructive' : 'text-muted-foreground',
                )}
              >
                {failed ? (
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

// How much of one study pack's allowance the material uses. Characters decide, as on the server, and are
// shown as words at the server's own rate, so the number shown is the number the check applies.
function WordMeter({ size, limits }: { size: PackSize; limits: Limits }) {
  const share = Math.min(1, size.chars / limits.max_pack_chars)
  const over = size.chars > limits.max_pack_chars
  const words = Math.round(size.chars / (limits.max_pack_chars / limits.max_pack_words))
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="tabular-nums">
        About {words.toLocaleString()} of {limits.max_pack_words.toLocaleString()} words
      </span>
      <div
        role="meter"
        aria-label="Material for one study pack"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(share * 100)}
        aria-valuetext={`About ${words.toLocaleString()} of ${limits.max_pack_words.toLocaleString()} words`}
        className="h-1.5 w-20 overflow-hidden rounded-full bg-muted"
      >
        <motion.div
          className={cn('h-full rounded-full', over ? 'bg-warning' : share > 0.85 ? 'bg-warning/70' : 'bg-primary')}
          animate={{ width: `${share * 100}%` }}
          transition={spring}
        />
      </div>
    </div>
  )
}
