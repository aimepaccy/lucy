import { AnimatePresence, motion } from 'motion/react'
import { NotebookPen } from 'lucide-react'
import { Panel } from '@/components/Panel'
import { Textarea } from '@/components/ui/textarea'
import { countWords } from '@/lib/format'

type NotesEditorProps = {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function NotesEditor({ value, onChange, className }: NotesEditorProps) {
  const words = countWords(value)

  return (
    <Panel
      icon={NotebookPen}
      title="Notes"
      description="Teaching points, mnemonics, anything the teacher stressed."
      className={className}
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
        </span>
      }
    >
      <label htmlFor="notes" className="sr-only">
        Notes
      </label>
      <Textarea
        id="notes"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={20000}
        placeholder={'For example:\nCURB-65 for pneumonia severity\nAlways check inhaler technique before stepping up asthma treatment'}
        className="min-h-64 flex-1 resize-none bg-background/60 text-[0.95rem] leading-relaxed lg:min-h-96"
      />
    </Panel>
  )
}
