import { useRef, useState, type DragEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, FileText, Presentation, X } from 'lucide-react'
import { Panel } from '@/components/Panel'
import { SlideSketch } from '@/components/SlideSketch'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/lib/format'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { SlideFile } from '@/types'

const MAX_FILES = 5
const MAX_MB = 25
let nextId = 0

const ACCEPT = '.pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation'

type SlideDropZoneProps = {
  files: SlideFile[]
  onAdd: (files: SlideFile[]) => void
  onRemove: (id: string) => void
}

function kindOf(file: File): SlideFile['kind'] | null {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) return 'pdf'
  if (name.endsWith('.pptx')) return 'pptx'
  return null
}

export function SlideDropZone({ files, onAdd, onRemove }: SlideDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLButtonElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // A convenience check only. The server checks every file again, since anyone can bypass the browser.
  function addFiles(list: FileList | null) {
    if (!list) return
    const accepted: SlideFile[] = []
    const problems: string[] = []

    for (const file of Array.from(list)) {
      const kind = kindOf(file)
      const duplicate = [...files, ...accepted].some(
        (slide) => slide.file.name === file.name && slide.file.size === file.size,
      )
      if (!kind) problems.push(`${file.name} is not a PDF or .pptx file.`)
      else if (file.size > MAX_MB * 1024 * 1024) problems.push(`${file.name} is larger than ${MAX_MB} MB.`)
      else if (duplicate) problems.push(`${file.name} is already added.`)
      else if (files.length + accepted.length >= MAX_FILES) {
        problems.push(`You can add up to ${MAX_FILES} files.`)
        break
      } else accepted.push({ id: `slide-${++nextId}`, file, kind })
    }

    if (accepted.length) onAdd(accepted)
    setError(problems[0] ?? null)
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(event: DragEvent) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    addFiles(event.dataTransfer.files)
  }

  return (
    <Panel icon={Presentation} title="Slides" description="The teaching slides, if there were any.">
      <motion.button
        ref={dropRef}
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{ scale: dragging ? 1.02 : 1 }}
        whileTap={{ scale: 0.99 }}
        transition={spring}
        className={cn(
          'hand-radius flex w-full flex-col items-center gap-2 border-2 border-dashed px-4 py-5 text-center transition-colors outline-none focus-visible:ring-4 focus-visible:ring-ring/30',
          dragging ? 'border-primary bg-accent' : 'border-input hover:border-primary/50 hover:bg-accent/40',
        )}
      >
        <SlideSketch replay={dragging} className="h-24 w-auto" />
        <span className="text-sm font-medium">
          {dragging ? 'Drop to add' : (
            <>
              Drop slides here or <span className="text-primary underline-offset-4 hover:underline">browse</span>
            </>
          )}
        </span>
        <span className="text-xs text-muted-foreground">
          PDF or PowerPoint (.pptx), up to {MAX_MB} MB each
        </span>
      </motion.button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(event) => {
          addFiles(event.target.files)
          event.target.value = ''
        }}
      />

      <AnimatePresence>
        {error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 overflow-hidden pt-3 text-sm text-destructive"
          >
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError(null)} aria-label="Dismiss message" className="rounded p-0.5 hover:bg-accent">
              <X className="size-3.5" />
            </button>
          </motion.p>
        )}
      </AnimatePresence>

      <ul className="flex flex-col gap-2 empty:hidden not-empty:mt-3">
        <AnimatePresence initial={false}>
          {files.map((slide) => (
            <motion.li
              key={slide.id}
              layout
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.2 } }}
              transition={spring}
              className="flex items-center gap-3 rounded-lg border bg-background/60 px-3 py-2"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">
                {slide.kind === 'pdf' ? <FileText className="size-4" /> : <Presentation className="size-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{slide.file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {slide.kind.toUpperCase()} · {formatFileSize(slide.file.size)}
                </span>
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  onRemove(slide.id)
                  dropRef.current?.focus()
                }}
                aria-label={`Remove ${slide.file.name}`}
              >
                <X />
              </Button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </Panel>
  )
}
