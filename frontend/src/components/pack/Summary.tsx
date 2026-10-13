import { motion } from 'motion/react'
import { CircleCheck, Eye } from 'lucide-react'
import { Source } from '@/components/pack/Source'
import { plural } from '@/lib/format'
import type { StudyPack } from '@/types'

export function Summary({ pack }: { pack: StudyPack }) {
  return (
    <div className="flex flex-col gap-6">
      {pack.overview.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Overview</h3>
          {/* Prose has no quotes, so it cannot be checked word for word; the label says so. */}
          <p className="text-xs text-muted-foreground">
            Written by AI from your session. Lucy cannot check it against your material; the teaching points below
            are checked, and any Lucy cannot find in your material are marked.
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
                {/* The quote stays out of sight (it still drives the checks); only a failed check is shown. */}
                {!point.grounded && <Source quote={point.quote} grounded={false} />}
              </span>
            </motion.li>
          ))}
        </ul>
      </section>

      {/* Coverage: the parts of the session no item in the pack quotes, for the student to read themselves. */}
      {pack.passage_count > 0 && (
        <section className="flex flex-col gap-2">
          {pack.uncovered.length === 0 ? (
            <p className="flex items-start gap-2 rounded-lg border bg-background/50 p-3 text-sm">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              Every part of your material is quoted at least once in the pack ({plural(pack.passage_count, 'passage')}).
            </p>
          ) : (
            <div className="flex flex-col gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3">
              <h3 className="flex items-start gap-2 text-sm font-medium">
                <Eye className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
                Parts of your session the pack does not quote ({pack.uncovered.length} of {pack.passage_count})
              </h3>
              <p className="text-sm text-muted-foreground">Read these yourself: they may hold teaching the pack leaves out.</p>
              <ul className="flex flex-col gap-2">
                {pack.uncovered.map((passage, index) => (
                  <li key={index} className="rounded-md border bg-background/70 p-3 text-sm leading-relaxed whitespace-pre-line">
                    {passage}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            A rough check: a quoted passage can still hold points the pack leaves out.
          </p>
        </section>
      )}
    </div>
  )
}
