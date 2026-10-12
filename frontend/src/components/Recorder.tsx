import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { AlertCircle, CheckCircle2, FileAudio, Loader2, Mic, Pause, Play, Square, Trash2 } from 'lucide-react'
import { Panel } from '@/components/Panel'
import { Button } from '@/components/ui/button'
import { useAudioRecorder, type FinishedRecording } from '@/hooks/use-audio-recorder'
import { MAX_AUDIO_MB, UPLOAD_ACCEPT, fileNameFor, isTooLarge, looksLikeAudio, readDuration } from '@/lib/audio'
import { formatDuration, formatFileSize } from '@/lib/format'
import { spring } from '@/lib/motion'
import type { Recording } from '@/types'

// 32 kbps for 90 minutes is about 21 MB, safely under the 25 MB limit.
const MAX_SECONDS = 90 * 60

type RecorderProps = {
  recording: Recording | null
  onChange: (recording: Recording | null) => void
  onLiveChange: (live: boolean) => void
}

const swap = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.98 },
  transition: spring,
}

export function Recorder({ recording, onChange, onLiveChange }: RecorderProps) {
  const mic = useAudioRecorder({ maxSeconds: MAX_SECONDS, maxBytes: MAX_AUDIO_MB * 1024 * 1024, onFinish: keep })
  const reduceMotion = useReducedMotion()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const live = mic.status === 'recording' || mic.status === 'paused' || mic.status === 'stopping'
  const view = live ? 'live' : recording ? 'done' : 'idle'

  useEffect(() => onLiveChange(live), [live, onLiveChange])

  // Each view swaps in new buttons, so focus moves to the new main control for keyboard users.
  const hasInteracted = useRef(false)
  const focusOnMount = useCallback((button: HTMLButtonElement | null) => {
    if (button && hasInteracted.current) button.focus()
  }, [])

  async function startRecording() {
    hasInteracted.current = true
    await mic.start()
  }

  function finish() {
    hasInteracted.current = true
    mic.stop()
  }

  function keep(result: FinishedRecording) {
    if (isTooLarge(result.blob)) {
      mic.setError(`This recording is larger than ${MAX_AUDIO_MB} MB. Please record shorter sessions.`)
      return
    }
    onChange({ file: result.blob, name: fileNameFor(result.mimeType), durationSec: result.durationSec, source: 'recorded' })
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    hasInteracted.current = true
    // A convenience check only. The server checks the file's content again.
    if (!looksLikeAudio(file)) return mic.setError(`${file.name} is not an audio file.`)
    if (isTooLarge(file)) return mic.setError(`${file.name} is larger than ${MAX_AUDIO_MB} MB.`)
    mic.setError(null)
    onChange({ file, name: file.name, durationSec: await readDuration(file), source: 'uploaded' })
  }

  function discard() {
    hasInteracted.current = true
    mic.setError(null)
    onChange(null)
  }

  const announcements: Record<typeof mic.status, string> = {
    idle: view === 'done' ? 'Recording ready' : '',
    starting: 'Waiting for the microphone',
    recording: 'Recording',
    paused: 'Recording paused',
    stopping: 'Finishing the recording',
  }

  return (
    <Panel icon={Mic} title="Recording" description="Record the role-played round as it happens, or upload audio.">
      <p role="status" className="sr-only">
        {announcements[mic.status]}
      </p>
      <div className="relative grid min-h-52 place-items-center">
        <AnimatePresence mode="wait" initial={false}>
          {view === 'idle' && (
            <motion.div key="idle" {...swap} className="flex flex-col items-center gap-4 text-center">
              <motion.button
                ref={focusOnMount}
                type="button"
                onClick={startRecording}
                disabled={mic.status === 'starting'}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                transition={spring}
                aria-label={mic.status === 'starting' ? 'Waiting for the microphone' : 'Start recording'}
                className="relative grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_40px_-8px_var(--glow)] outline-none focus-visible:ring-4 focus-visible:ring-ring/40 disabled:opacity-70"
              >
                {!reduceMotion && mic.status === 'idle' && (
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-primary"
                    animate={{ scale: [1, 1.35], opacity: [0.35, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}
                {mic.status === 'starting' ? (
                  <Loader2 className="relative size-7 motion-safe:animate-spin" />
                ) : (
                  <Mic className="relative size-7" />
                )}
              </motion.button>
              <div>
                <p className="text-sm font-medium">{mic.status === 'starting' ? 'Waiting for the microphone' : 'Start recording'}</p>
                <p className="text-xs text-muted-foreground">
                  Ask everyone before you record. Keep the device near the people speaking.
                </p>
              </div>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0"
                disabled={mic.status !== 'idle'}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileAudio /> Or upload an audio file
              </Button>
              <input ref={fileInputRef} type="file" accept={UPLOAD_ACCEPT} className="hidden" onChange={handleUpload} />
            </motion.div>
          )}

          {view === 'live' && (
            <motion.div key="live" {...swap} className="flex w-full flex-col items-center gap-4">
              <StatusLabel paused={mic.status === 'paused'} pulse={!reduceMotion} />
              <p className="text-4xl font-semibold tracking-tight tabular-nums">{formatDuration(mic.elapsed)}</p>
              <Waveform active={mic.status === 'recording' && !reduceMotion} readLevel={mic.readLevel} />
              <div className="flex gap-2">
                <Button
                  ref={focusOnMount}
                  variant="outline"
                  disabled={mic.status === 'stopping'}
                  onClick={mic.status === 'recording' ? mic.pause : mic.resume}
                >
                  {mic.status === 'recording' ? (
                    <>
                      <Pause /> Pause
                    </>
                  ) : (
                    <>
                      <Play /> Resume
                    </>
                  )}
                </Button>
                <Button onClick={finish} disabled={mic.status === 'stopping'}>
                  <Square className="fill-current" /> Stop
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={mic.cancel} disabled={mic.status === 'stopping'}>
                <Trash2 /> Cancel
              </Button>
            </motion.div>
          )}

          {view === 'done' && recording && (
            <motion.div key="done" {...swap} className="flex w-full flex-col items-center gap-3 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
              >
                <CheckCircle2 className="size-10 text-primary" aria-hidden="true" />
              </motion.div>
              <div>
                <p className="text-sm font-medium">{recording.source === 'recorded' ? 'Recording ready' : recording.name}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {recording.durationSec !== null && `${formatDuration(recording.durationSec)} long · `}
                  {formatFileSize(recording.file.size)}
                </p>
              </div>
              <AudioPreview file={recording.file} />
              <Button ref={focusOnMount} variant="ghost" size="sm" onClick={discard}>
                <Trash2 /> {recording.source === 'recorded' ? 'Discard and record again' : 'Remove this file'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {mic.error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            role="alert"
            className="overflow-hidden text-sm text-destructive"
          >
            <span className="flex items-start gap-2 pt-3">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {mic.error}
            </span>
          </motion.p>
        )}
      </AnimatePresence>
    </Panel>
  )
}

// Lets the student listen back before sending. The temporary address is released when the file changes.
function AudioPreview({ file }: { file: Blob }) {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    if (audioRef.current) audioRef.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  return <audio ref={audioRef} controls aria-label="Listen back to the recording" className="h-10 w-full max-w-xs" />
}

function StatusLabel({ paused, pulse }: { paused: boolean; pulse: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
      <span className="relative flex size-2.5">
        {!paused && pulse && (
          <motion.span
            className="absolute inset-0 rounded-full bg-destructive"
            animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <span className={`relative size-2.5 rounded-full ${paused ? 'bg-muted-foreground' : 'bg-destructive'}`} />
      </span>
      <span className={paused ? 'text-muted-foreground' : 'text-destructive'}>{paused ? 'Paused' : 'Recording'}</span>
    </div>
  )
}

const BAR_COUNT = 32
const flat = Array.from({ length: BAR_COUNT }, () => 0.08)

// Real input levels: a new bar enters on the right every 100 ms and the oldest leaves on the left.
function Waveform({ active, readLevel }: { active: boolean; readLevel: () => number }) {
  const [levels, setLevels] = useState(flat)

  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => {
      setLevels((current) => [...current.slice(1), Math.max(0.08, readLevel())])
    }, 100)
    return () => window.clearInterval(id)
  }, [active, readLevel])

  return (
    <div className="flex h-14 w-full max-w-xs items-center gap-0.75" aria-hidden="true">
      {levels.map((level, i) => (
        <motion.span
          key={i}
          className="h-full flex-1 rounded-full bg-primary/80"
          animate={{ scaleY: level }}
          transition={{ type: 'spring', stiffness: 320, damping: 18 }}
        />
      ))}
    </div>
  )
}
