import { useState } from 'react'
import { MotionConfig, motion } from 'motion/react'
import { Background } from '@/components/Background'
import { GenerateBar } from '@/components/GenerateBar'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { NotesEditor } from '@/components/NotesEditor'
import { PrivacyNotice } from '@/components/PrivacyNotice'
import { Recorder } from '@/components/Recorder'
import { SlideDropZone } from '@/components/SlideDropZone'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useTheme } from '@/hooks/use-theme'
import { countWords } from '@/lib/format'
import { stagger } from '@/lib/motion'
import type { Recording, SlideFile } from '@/types'

export default function App() {
  const { theme, chooseTheme } = useTheme()
  const [notes, setNotes] = useState('')
  const [recording, setRecording] = useState<Recording | null>(null)
  const [slides, setSlides] = useState<SlideFile[]>([])

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
              <Recorder onComplete={setRecording} onDiscard={() => setRecording(null)} />
              <SlideDropZone
                files={slides}
                onAdd={(added) => setSlides((current) => [...current, ...added])}
                onRemove={(id) => setSlides((current) => current.filter((slide) => slide.id !== id))}
              />
            </motion.div>
          </div>

          <GenerateBar notesWords={countWords(notes)} recording={recording} slideCount={slides.length} />

          <p className="pb-2 text-center text-xs text-muted-foreground">
            Study packs are AI-generated and can contain mistakes. Check them against trusted sources.
          </p>
        </motion.main>
      </TooltipProvider>
    </MotionConfig>
  )
}
