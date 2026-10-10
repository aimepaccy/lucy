import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { CheckCircle2, Mic, Pause, Play, Square, Trash2 } from 'lucide-react'
import { Panel } from '@/components/Panel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDuration } from '@/lib/format'
import { spring } from '@/lib/motion'
import type { Recording } from '@/types'

type Status = 'idle' | 'recording' | 'paused' | 'done'

type RecorderProps = {
  onComplete: (recording: Recording) => void
  onDiscard: () => void
}

const announcements: Record<Status, string> = {
  idle: '',
  recording: 'Recording',
  paused: 'Recording paused',
  done: 'Recording ready',
}

const swap = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.98 },
  transition: spring,
}

export function Recorder({ onComplete, onDiscard }: RecorderProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [elapsed, setElapsed] = useState(0)
  const reduceMotion = useReducedMotion()

  // Each state swaps in new buttons, so focus is moved to the new main control for keyboard users.
  const hasInteracted = useRef(false)
  const focusOnMount = useCallback((button: HTMLButtonElement | null) => {
    if (button && hasInteracted.current) button.focus()
  }, [])

  useEffect(() => {
    if (status !== 'recording') return
    const id = window.setInterval(() => setElapsed((sec) => sec + 1), 1000)
    return () => window.clearInterval(id)
  }, [status])

  function changeStatus(next: Status) {
    hasInteracted.current = true
    setStatus(next)
  }

  function stop() {
    if (elapsed === 0) return discard()
    changeStatus('done')
    onComplete({ durationSec: elapsed })
  }

  function discard() {
    changeStatus('idle')
    setElapsed(0)
    onDiscard()
  }

  return (
    <Panel
      icon={Mic}
      step={2}
      active={status === 'recording'}
      title="Recording"
      description="Record the role-played round as it happens."
      aside={
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" tabIndex={0}>
              Preview
            </Badge>
          </TooltipTrigger>
          <TooltipContent>The microphone is coming in a later version.</TooltipContent>
        </Tooltip>
      }
    >
      <p role="status" className="sr-only">
        {announcements[status]}
      </p>
      <div className="relative grid min-h-52 place-items-center">
        <AnimatePresence mode="wait" initial={false}>
          {status === 'idle' && (
            <motion.div
              key="idle"
              {...swap}
              className="flex flex-col items-center gap-4 text-center"
            >
              <motion.button
                ref={focusOnMount}
                type="button"
                onClick={() => changeStatus('recording')}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                transition={spring}
                aria-label="Start recording"
                className="relative grid size-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_40px_-8px_var(--glow)] outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
              >
                {!reduceMotion && (
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-primary"
                    animate={{ scale: [1, 1.35], opacity: [0.35, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}
                <Mic className="relative size-7" />
              </motion.button>
              <div>
                <p className="text-sm font-medium">Start recording</p>
                <p className="text-xs text-muted-foreground">Keep the device near the people speaking.</p>
              </div>
            </motion.div>
          )}

          {(status === 'recording' || status === 'paused') && (
            <motion.div
              key="live"
              {...swap}
              className="flex w-full flex-col items-center gap-4"
            >
              <StatusLabel paused={status === 'paused'} pulse={!reduceMotion} />
              <p className="text-4xl font-semibold tracking-tight tabular-nums">{formatDuration(elapsed)}</p>
              <Waveform active={status === 'recording' && !reduceMotion} />
              <div className="flex gap-2">
                <Button
                  ref={focusOnMount}
                  variant="outline"
                  onClick={() => changeStatus(status === 'recording' ? 'paused' : 'recording')}
                >
                  {status === 'recording' ? (
                    <>
                      <Pause /> Pause
                    </>
                  ) : (
                    <>
                      <Play /> Resume
                    </>
                  )}
                </Button>
                <Button onClick={stop}>
                  <Square className="fill-current" /> Stop
                </Button>
              </div>
            </motion.div>
          )}

          {status === 'done' && (
            <motion.div
              key="done"
              {...swap}
              className="flex flex-col items-center gap-3 text-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
              >
                <CheckCircle2 className="size-12 text-primary" aria-hidden="true" />
              </motion.div>
              <div>
                <p className="text-sm font-medium">Recording ready</p>
                <p className="text-xs text-muted-foreground tabular-nums">{formatDuration(elapsed)} long</p>
              </div>
              <Button ref={focusOnMount} variant="ghost" size="sm" onClick={discard}>
                <Trash2 /> Discard and record again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Panel>
  )
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

// Simulated levels until the microphone is connected; real input levels replace them later.
function Waveform({ active }: { active: boolean }) {
  const [levels, setLevels] = useState(flat)

  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => {
      setLevels(
        flat.map((_, i) => {
          const centre = 1 - Math.abs(i - BAR_COUNT / 2) / (BAR_COUNT / 2)
          return 0.12 + Math.random() * (0.3 + 0.55 * centre)
        }),
      )
    }, 140)
    return () => window.clearInterval(id)
  }, [active])

  const shown = active ? levels : flat

  return (
    <div className="flex h-14 w-full max-w-xs items-center gap-0.75" aria-hidden="true">
      {shown.map((level, i) => (
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
