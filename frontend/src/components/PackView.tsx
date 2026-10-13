import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { BookOpenCheck, Layers, ListChecks, NotebookText, Search } from 'lucide-react'
import { Tabs } from 'radix-ui'
import { Panel } from '@/components/Panel'
import { Flashcards } from '@/components/pack/Flashcards'
import { Quiz } from '@/components/pack/Quiz'
import type { StudyPack } from '@/types'

export function PackView({ pack }: { pack: StudyPack }) {
  const startRef = useRef<HTMLDivElement>(null)

  // Bring the new pack into view and tell screen reader users it has arrived, unless the student is typing.
  useEffect(() => {
    const active = document.activeElement
    if (!(active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement)) startRef.current?.focus()
  }, [pack])

  const tabs = [
    { value: 'summary', label: 'Summary', icon: NotebookText, count: null },
    { value: 'cards', label: 'Flashcards', icon: Layers, count: pack.flashcards.length },
    { value: 'quiz', label: 'Quiz', icon: ListChecks, count: pack.questions.length },
  ]

  return (
    <motion.div initial="hidden" animate="show">
      <Panel
        icon={BookOpenCheck}
        title={pack.title}
        description="Your study pack, written by AI from your session. Check it against trusted sources."
      >
        <div ref={startRef} tabIndex={-1} aria-label={`Study pack: ${pack.title}`} className="outline-none">
          {/* Radix gives the tabs their roles and arrow-key movement; we only style them. */}
          <Tabs.Root defaultValue="summary" className="flex flex-col gap-5">
            <Tabs.List aria-label="Parts of the study pack" className="flex gap-1 rounded-lg bg-muted p-1">
              {tabs.map(({ value, label, icon: Icon, count }) => (
                <Tabs.Trigger
                  key={value}
                  value={value}
                  disabled={count === 0}
                  className="flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm sm:gap-2 sm:px-3 font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  {/* No icons on phones: three labels already fill the row. */}
                  <Icon className="hidden size-4 sm:block" aria-hidden="true" />
                  {label}
                  {count !== null && <span className="text-xs text-muted-foreground tabular-nums">{count}</span>}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <Tabs.Content value="summary" className="flex flex-col gap-6 outline-none">
              {pack.summary.length > 0 && (
                <section className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold">Key teaching points</h3>
                  <ul className="flex flex-col gap-2">
                    {pack.summary.map((point, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="flex gap-3 rounded-lg border bg-background/50 p-3 text-sm leading-relaxed"
                      >
                        <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-[0.7rem] font-semibold text-accent-foreground">
                          {index + 1}
                        </span>
                        {point}
                      </motion.li>
                    ))}
                  </ul>
                </section>
              )}

              {pack.search_terms.length > 0 && (
                <section className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold">Search terms for further reading</h3>
                  <div className="flex flex-wrap gap-2">
                    {pack.search_terms.map((term, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                      >
                        <Search className="size-3.5" aria-hidden="true" />
                        {term}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </Tabs.Content>

            {/* Kept mounted while hidden, so switching tabs does not lose the place in the cards or the quiz. */}
            <Tabs.Content value="cards" forceMount className="outline-none data-[state=inactive]:hidden">
              <Flashcards cards={pack.flashcards} />
            </Tabs.Content>

            <Tabs.Content value="quiz" forceMount className="outline-none data-[state=inactive]:hidden">
              <Quiz questions={pack.questions} />
            </Tabs.Content>
          </Tabs.Root>

          <p className="mt-5 text-xs text-muted-foreground">AI-generated by {pack.model}. It can contain mistakes.</p>
        </div>
      </Panel>
    </motion.div>
  )
}
