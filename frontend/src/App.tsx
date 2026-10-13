import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { MotionConfig, motion } from 'motion/react'
import { Background } from '@/components/Background'
import { GenerateBar } from '@/components/GenerateBar'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { MaterialsPanel } from '@/components/MaterialsPanel'
import { NotesEditor } from '@/components/NotesEditor'
import { PrivacyNotice } from '@/components/PrivacyNotice'
import { Recorder } from '@/components/Recorder'
import { SlideDropZone } from '@/components/SlideDropZone'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useTheme } from '@/hooks/use-theme'
import { ApiError, sendSession, waitForJob } from '@/lib/api'
import { countWords } from '@/lib/format'
import { hasCorrections, hasReviewable } from '@/lib/materials'
import { stagger } from '@/lib/motion'
import type { Materials, Recording, SendState, SlideFile } from '@/types'

export default function App() {
  const { theme, chooseTheme } = useTheme()
  const [notes, setNotes] = useState('')
  const [recording, setRecording] = useState<Recording | null>(null)
  const [recordingLive, setRecordingLive] = useState(false)
  const [slides, setSlides] = useState<SlideFile[]>([])
  const [sendState, setSendState] = useState<SendState>({ status: 'idle' })
  // The student's corrected copy of what Lucy heard and read; the AI will write from this.
  const [draft, setDraft] = useState<Materials | null>(null)
  const generateRef = useRef<HTMLButtonElement>(null)

  // The panel's close button disappears with it, so keyboard focus moves to a sensible place.
  // flushSync redraws first: until then the Generate button is still switched off and cannot take focus.
  function closeMaterials() {
    flushSync(() => {
      setSendState({ status: 'idle' })
      setDraft(null)
    })
    const generate = generateRef.current
    if (generate && !generate.disabled) generate.focus()
    else document.getElementById('notes')?.focus()
  }

  async function handleGenerate() {
    setSendState({ status: 'sending' })
    setDraft(null)
    try {
      const { job_id, receipt } = await sendSession(notes, slides, recording)
      setSendState({ status: 'working', step: 'Waiting to start', receipt })
      const materials = await waitForJob(job_id, (step) => setSendState({ status: 'working', step, receipt }))
      setSendState({ status: 'ready', materials, recording, slides })
      setDraft(materials)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'
      setSendState({ status: 'error', message })
    }
  }

  // Adding or removing a slide makes a new list, and a new recording is a new object, so comparing
  // them with what Lucy read tells us whether the panel still matches the inputs.
  const inputsChanged = sendState.status === 'ready' && (sendState.recording !== recording || sendState.slides !== slides)
  const corrected = sendState.status === 'ready' && draft !== null && hasCorrections(sendState.materials, draft)
  const showPanel =
    sendState.status === 'ready' && (hasReviewable(sendState.materials) || sendState.materials.warnings.length > 0)

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
            <NotesEditor value={notes} onChange={setNotes} className="lg:col-span-3" />
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
            <MaterialsPanel heard={sendState.materials} draft={draft} onChange={setDraft} onClose={closeMaterials} />
          )}

          <GenerateBar
            generateRef={generateRef}
            notesWords={countWords(notes)}
            recording={recording}
            recordingLive={recordingLive}
            slideCount={slides.length}
            sendState={sendState}
            inputsChanged={inputsChanged}
            corrected={corrected}
            onGenerate={handleGenerate}
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
