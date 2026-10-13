import { useId, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { AlertTriangle, ChevronRight, FileText, Mic, Presentation, ScanText, Undo2, X } from 'lucide-react'
import { Panel } from '@/components/Panel'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { countWords, plural } from '@/lib/format'
import { hasCorrections, hasReviewable } from '@/lib/materials'
import type { Materials } from '@/types'

type MaterialsPanelProps = {
  // What Lucy heard and read, unchanged, and the student's corrected copy of it.
  heard: Materials
  draft: Materials
  onChange: (draft: Materials) => void
  onClose: () => void
}

export function MaterialsPanel({ heard, draft, onChange, onClose }: MaterialsPanelProps) {
  const [confirmingClose, setConfirmingClose] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const confirmTextId = useId()
  const { transcript, slides, warnings } = draft

  function requestClose() {
    if (hasCorrections(heard, draft)) setConfirmingClose(true)
    else onClose()
  }

  function keepEditing() {
    setConfirmingClose(false)
    closeRef.current?.focus()
  }

  function setSlideText(index: number, text: string) {
    onChange({ ...draft, slides: slides.map((slide, i) => (i === index ? { ...slide, text } : slide)) })
  }

  return (
    <motion.div initial="hidden" animate="show">
      <Panel
        icon={ScanText}
        title="What Lucy heard and read"
        description={
          hasReviewable(heard)
            ? 'Correct anything Lucy got wrong. Your study pack is written from your corrected version. Transcripts are made by AI and can contain mistakes.'
            : 'Lucy could not read your slides, so your study pack will be written from your notes.'
        }
        aside={
          <Button ref={closeRef} variant="ghost" size="icon" onClick={requestClose} aria-label="Close what Lucy heard and read">
            <X />
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          {confirmingClose && (
            <div
              role="alertdialog"
              aria-labelledby={confirmTextId}
              onKeyDown={(event) => event.key === 'Escape' && keepEditing()}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm"
            >
              <span id={confirmTextId} className="flex-1">
                Closing loses your corrections.
              </span>
              <Button size="sm" variant="outline" onClick={keepEditing} autoFocus>
                Keep editing
              </Button>
              <Button size="sm" variant="destructive" onClick={onClose}>
                Close anyway
              </Button>
            </div>
          )}

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
                  {transcript !== heard.transcript && ', corrected by you'}
                </span>
              </h3>
              <EditableText
                value={transcript}
                original={heard.transcript ?? ''}
                label="Recording transcript"
                placeholder="No speech was heard."
                onChange={(text) => onChange({ ...draft, transcript: text })}
              />
            </section>
          )}

          {slides.map((slide, index) => {
            // Two files can share a name; the position tells them apart for screen readers.
            const sameName = slides.filter((other) => other.name === slide.name).length > 1
            const label = `Text of ${slide.name}${sameName ? ` (file ${index + 1})` : ''}`
            return (
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
                    {slide.text !== heard.slides[index]?.text && ', corrected by you'}
                  </span>
                </summary>
                <div className="px-3 pb-3">
                  <EditableText
                    value={slide.text}
                    original={heard.slides[index]?.text ?? ''}
                    label={label}
                    placeholder="No text found."
                    onChange={(text) => setSlideText(index, text)}
                  />
                </div>
              </details>
            )
          })}
        </div>
      </Panel>
    </motion.div>
  )
}

type EditableTextProps = {
  value: string
  original: string
  label: string
  placeholder?: string
  onChange: (text: string) => void
}

// Controlled: the box shows `value` and sends every change up.
function EditableText({ value, original, label, placeholder, onChange }: EditableTextProps) {
  const boxRef = useRef<HTMLTextAreaElement>(null)

  // The undo button disappears once used, so focus goes back to the text.
  function undo() {
    onChange(original)
    boxRef.current?.focus()
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Textarea
        ref={boxRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        placeholder={placeholder}
        className="max-h-80 min-h-32 resize-y overflow-y-auto bg-background/60 leading-relaxed"
      />
      {value !== original && (
        <button
          type="button"
          onClick={undo}
          aria-label={`Undo my corrections to ${label}`}
          className="inline-flex items-center gap-1.5 self-end text-xs font-medium text-primary hover:underline"
        >
          <Undo2 className="size-3.5" aria-hidden="true" />
          Undo my corrections
        </button>
      )}
    </div>
  )
}
