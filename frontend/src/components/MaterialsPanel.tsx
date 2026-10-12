import { motion } from 'motion/react'
import { AlertTriangle, ChevronRight, FileText, Mic, Presentation, ScanText, X } from 'lucide-react'
import { Panel } from '@/components/Panel'
import { Button } from '@/components/ui/button'
import { countWords, plural } from '@/lib/format'
import type { Materials } from '@/types'

type MaterialsPanelProps = {
  materials: Materials
  onClose: () => void
}

export function MaterialsPanel({ materials, onClose }: MaterialsPanelProps) {
  const { transcript, slides, warnings } = materials

  return (
    <motion.div initial="hidden" animate="show">
      <Panel
        icon={ScanText}
        title="What Lucy heard and read"
        description="Check this before Lucy writes your study pack. Transcripts are made by AI and can contain mistakes."
        aside={
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close what Lucy heard and read">
            <X />
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          {warnings.length > 0 && (
            <ul className="flex flex-col gap-1.5 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
              {warnings.map((warning, index) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
                  {warning}
                </li>
              ))}
            </ul>
          )}

          {transcript !== null && (
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Mic className="size-4 text-muted-foreground" aria-hidden="true" />
                Recording transcript
                <span className="font-normal text-muted-foreground">
                  · {plural(countWords(transcript), 'word')} · AI-generated
                </span>
              </h3>
              {transcript && <TextBox text={transcript} label="Recording transcript" />}
            </section>
          )}

          {slides.map((slide, index) => (
            <details key={index} className="group rounded-lg border bg-background/50">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg p-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/40 [&::-webkit-details-marker]:hidden">
                <ChevronRight
                  className="size-4 text-muted-foreground transition-transform group-open:rotate-90"
                  aria-hidden="true"
                />
                {slide.kind === 'pdf' ? (
                  <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <Presentation className="size-4 text-muted-foreground" aria-hidden="true" />
                )}
                <span className="min-w-0 truncate">{slide.name}</span>
                <span className="shrink-0 font-normal text-muted-foreground">
                  · {plural(slide.pages, slide.kind === 'pdf' ? 'page' : 'slide')} · {plural(countWords(slide.text), 'word')}
                </span>
              </summary>
              <div className="px-3 pb-3">
                <TextBox text={slide.text || 'No text found.'} label={`Text of ${slide.name}`} />
              </div>
            </details>
          ))}
        </div>
      </Panel>
    </motion.div>
  )
}

// Focusable so keyboard users can scroll it; named so screen readers can announce it.
function TextBox({ text, label }: { text: string; label: string }) {
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={label}
      className="max-h-72 overflow-y-auto rounded-lg border bg-background/60 p-3 text-sm leading-relaxed whitespace-pre-wrap outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      {text}
    </div>
  )
}
