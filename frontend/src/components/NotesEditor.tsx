import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { NotebookPen } from 'lucide-react'
import { Panel } from '@/components/Panel'
import { Textarea } from '@/components/ui/textarea'
import { countWords } from '@/lib/format'

const MAX_CHARS = 20000

type NotesEditorProps = {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function NotesEditor({ value, onChange, className }: NotesEditorProps) {
  const words = countWords(value)
  const [cleared, setCleared] = useState<string | null>(null)

  useEffect(() => {
    if (cleared === null) return
    const id = window.setTimeout(() => setCleared(null), 8000)
    return () => window.clearTimeout(id)
  }, [cleared])

  function clear() {
    setCleared(value)
    onChange('')
  }

  function undo() {
    if (cleared !== null) onChange(cleared)
    setCleared(null)
  }

  return (
    <Panel
      icon={NotebookPen}
      title="Notes"
      description="Teaching points, mnemonics, anything the teacher stressed."
      className={className}
      mended
      aside={
        <span className="overflow-hidden text-xs text-muted-foreground tabular-nums">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={words}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              className="inline-block"
            >
              {words}
            </motion.span>
          </AnimatePresence>{' '}
          {words === 1 ? 'word' : 'words'}
          {value.length > MAX_CHARS * 0.9 && ` (${value.length.toLocaleString()} of ${MAX_CHARS.toLocaleString()} characters)`}
          {value && (
            <button type="button" onClick={clear} aria-label="Clear notes" className="ml-3 font-medium text-primary hover:underline">
              Clear
            </button>
          )}
          {!value && cleared && (
            <button type="button" onClick={undo} aria-label="Undo clearing notes" className="ml-3 font-medium text-primary hover:underline">
              Undo clear
            </button>
          )}
        </span>
      }
    >
      <label htmlFor="notes" className="sr-only">
        Notes
      </label>
      <Textarea
        id="notes"
        value={value}
        onChange={(event) => {
          setCleared(null)
          onChange(event.target.value)
        }}
        maxLength={MAX_CHARS}
        placeholder={'For example:\nCURB-65 for pneumonia severity\nAlways check inhaler technique before stepping up asthma treatment'}
        className="min-h-64 flex-1 resize-none bg-background/60 text-[0.95rem] leading-relaxed lg:min-h-96"
      />
    </Panel>
  )
}
