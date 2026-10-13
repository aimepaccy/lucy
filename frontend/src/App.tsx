import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { MotionConfig, motion } from 'motion/react'
import { Background } from '@/components/Background'
import { GenerateBar } from '@/components/GenerateBar'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { MaterialsPanel } from '@/components/MaterialsPanel'
import { NotesEditor } from '@/components/NotesEditor'
import { PackView } from '@/components/PackView'
import { PrivacyNotice } from '@/components/PrivacyNotice'
import { Recorder } from '@/components/Recorder'
import { SlideDropZone } from '@/components/SlideDropZone'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useLimits } from '@/hooks/use-limits'
import { useTheme } from '@/hooks/use-theme'
import { ApiError, sendSession, waitForJob, writePack } from '@/lib/api'
import { countWords } from '@/lib/format'
import { hasCorrections, needsCheck } from '@/lib/materials'
import { stagger } from '@/lib/motion'
import type { Materials, Recording, SendState, SlideFile, WriteState } from '@/types'

export default function App() {
  const { theme, chooseTheme } = useTheme()
  const limits = useLimits()
  const [notes, setNotes] = useState('')
  const [recording, setRecording] = useState<Recording | null>(null)
  const [recordingLive, setRecordingLive] = useState(false)
  const [slides, setSlides] = useState<SlideFile[]>([])
  const [sendState, setSendState] = useState<SendState>({ status: 'idle' })
  // The student's corrected copy of what Lucy heard and read; the AI will write from this.
  const [draft, setDraft] = useState<Materials | null>(null)
  const [writeState, setWriteState] = useState<WriteState>({ status: 'idle' })
  const generateRef = useRef<HTMLButtonElement>(null)
  // Each write gets a number. A write that finishes after the student moved on (closed the panel or
  // read again) is no longer the latest, and its result is ignored.
  const latestWrite = useRef(0)

  function forgetWrite() {
    latestWrite.current += 1
    setWriteState({ status: 'idle' })
  }

  // An error about the old text no longer applies once the student changes it.
  function clearWriteError() {
    if (writeState.status === 'error') setWriteState({ status: 'idle' })
  }

  // The panel's close button disappears with it, so keyboard focus moves to a sensible place.
  // flushSync redraws first: until then the Generate button is still switched off and cannot take focus.
  function closeMaterials() {
    flushSync(() => {
      setSendState({ status: 'idle' })
      setDraft(null)
      forgetWrite()
    })
    const generate = generateRef.current
    if (generate && !generate.disabled) generate.focus()
    else document.getElementById('notes')?.focus()
  }

  async function handleGenerate() {
    setSendState({ status: 'sending' })
    setDraft(null)
    forgetWrite()
    let materials: Materials
    try {
      const { job_id, receipt } = await sendSession(notes, slides, recording)
      setSendState({ status: 'working', step: 'Waiting to start', receipt })
      const job = await waitForJob(job_id, (step) => setSendState({ status: 'working', step, receipt }))
      if (!job.materials) throw new ApiError('Lucy could not read your material.')
      materials = job.materials
      setSendState({ status: 'ready', materials, recording, slides })
      setDraft(materials)
    } catch (error) {
      setSendState({ status: 'error', message: messageOf(error) })
      return
    }
    // Nothing to check (notes only), so Lucy goes straight on to writing, unless the notes are already
    // too long: then the bar explains instead of sending a request that would be refused.
    const tooLong = limits !== null && notes.length > limits.max_pack_chars
    if (!needsCheck(materials) && !tooLong) await handleWrite(materials)
  }

  // Writes from the corrected copy. The review state stays as it is, so a failure loses no corrections.
  async function handleWrite(materials: Materials) {
    const run = ++latestWrite.current
    const update = (state: WriteState) => run === latestWrite.current && setWriteState(state)
    update({ status: 'writing', step: 'Sending to Lucy' })
    try {
      const { job_id } = await writePack(notes, materials)
      const job = await waitForJob(job_id, (step) => update({ status: 'writing', step }))
      if (!job.pack) throw new ApiError('Lucy could not write your study pack.')
      update({ status: 'done', pack: job.pack, run })
    } catch (error) {
      update({ status: 'error', message: messageOf(error) })
    }
  }

  // Adding or removing a slide makes a new list, and a new recording is a new object, so comparing
  // them with what Lucy read tells us whether the panel still matches the inputs.
  const inputsChanged = sendState.status === 'ready' && (sendState.recording !== recording || sendState.slides !== slides)
  const corrected = sendState.status === 'ready' && draft !== null && hasCorrections(sendState.materials, draft)
  const packText = draft ? [notes, draft.transcript ?? '', ...draft.slides.map((slide) => slide.text)].join('\n') : ''
  const packSize = draft ? { chars: packText.length } : null
  const showPanel = sendState.status === 'ready' && needsCheck(sendState.materials)

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={300}>
        <Background />
        <motion.main
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-10"
        >
          <Header theme={theme} onThemeChange={chooseTheme} />
          <Hero />
          <PrivacyNotice />

          <div className="grid gap-6 lg:grid-cols-5">
            <NotesEditor
              value={notes}
              onChange={(value) => {
                setNotes(value)
                clearWriteError()
              }}
              className="lg:col-span-3"
            />
            <motion.div variants={stagger} className="flex flex-col gap-6 lg:col-span-2">
              <Recorder recording={recording} onChange={setRecording} onLiveChange={setRecordingLive} />
              <SlideDropZone
                files={slides}
                onAdd={(added) => setSlides((current) => [...current, ...added])}
                onRemove={(id) => setSlides((current) => current.filter((slide) => slide.id !== id))}
              />
            </motion.div>
          </div>

          {showPanel && sendState.status === 'ready' && draft && (
            <MaterialsPanel
              heard={sendState.materials}
              draft={draft}
              locked={writeState.status === 'writing'}
              onChange={(next) => {
                setDraft(next)
                clearWriteError()
              }}
              onClose={closeMaterials}
            />
          )}

          {writeState.status === 'done' && <PackView key={writeState.run} pack={writeState.pack} />}

          <GenerateBar
            generateRef={generateRef}
            notesWords={countWords(notes)}
            recording={recording}
            recordingLive={recordingLive}
            slideCount={slides.length}
            sendState={sendState}
            inputsChanged={inputsChanged}
            corrected={corrected}
            writeState={writeState}
            packSize={packSize}
            limits={limits}
            onGenerate={handleGenerate}
            onWrite={() => draft && handleWrite(draft)}
            onDismiss={() => setSendState({ status: 'idle' })}
          />

          <p className="pb-2 text-center text-xs text-muted-foreground">
            Study packs are AI-generated and can contain mistakes. Check them against trusted sources.
          </p>
        </motion.main>
      </TooltipProvider>
    </MotionConfig>
  )
}

function messageOf(error: unknown) {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'
}
