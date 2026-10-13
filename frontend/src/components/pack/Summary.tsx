import { motion } from 'motion/react'
import { CircleCheck, Eye, Search } from 'lucide-react'
import { Source } from '@/components/pack/Source'
import { plural } from '@/lib/format'
import type { StudyPack } from '@/types'

export function Summary({ pack }: { pack: StudyPack }) {
  const used = pack.passage_count - pack.uncovered.length

  return (
    <div className="flex flex-col gap-6">
      {pack.overview.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Overview</h3>
          {/* Prose has no quotes, so it cannot be checked word for word; the label says so. */}
          <p className="text-xs text-muted-foreground">
            AI summary, not checked word for word. The teaching points below are.
          </p>
          <div className="flex flex-col gap-3 text-sm leading-relaxed">
            {pack.overview.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </section>
      )}

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
              <span className="flex flex-col gap-1">
                {point.text}
                <Source quote={point.quote} grounded={point.grounded} />
              </span>
            </motion.li>
          ))}
        </ul>
      </section>

      {/* Coverage: the parts of the session no item in the pack draws on, for the student to read themselves. */}
      {pack.passage_count > 0 && (
        <section className="flex flex-col gap-2">
          {pack.uncovered.length === 0 ? (
            <p className="flex items-start gap-2 rounded-lg border bg-background/50 p-3 text-sm">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              The pack draws on every part of your material ({plural(pack.passage_count, 'passage')}).
            </p>
          ) : (
            <details className="group rounded-lg border border-warning/30 bg-warning/10" open>
              <summary className="flex cursor-pointer list-none items-start gap-2 rounded-lg p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40 [&::-webkit-details-marker]:hidden">
                <Eye className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
                <span>
                  <span className="font-medium">
                    Parts of your session the pack does not use ({pack.uncovered.length} of {pack.passage_count})
                  </span>
                  <span className="block text-muted-foreground">
                    The pack draws on {used} of {plural(pack.passage_count, 'passage')}. Read these yourself: they may
                    matter.
                  </span>
                </span>
              </summary>
              <ul className="flex flex-col gap-2 px-3 pb-3">
                {pack.uncovered.map((passage, index) => (
                  <li key={index} className="rounded-md border bg-background/70 p-3 text-sm leading-relaxed">
                    {passage}
                  </li>
                ))}
              </ul>
            </details>
          )}
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
    </div>
  )
}
