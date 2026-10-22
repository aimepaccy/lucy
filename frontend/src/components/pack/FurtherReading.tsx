import { motion } from 'motion/react'
import {
  BookMarked,
  CircleAlert,
  ExternalLink,
  FileText,
  Globe,
  LoaderCircle,
  MonitorPlay,
  RotateCcw,
  Search,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Lookup } from '@/hooks/use-reading'
import { cn } from '@/lib/utils'
import type { Reading, ReadingLink, ReadingSource } from '@/types'

const ICONS: Record<string, LucideIcon> = {
  statpearls: BookMarked,
  pubmed: FileText,
  wikipedia: Globe,
  youtube: MonitorPlay,
}

type Props = {
  terms: string[]
  chosen: string | null
  lookup: Lookup | undefined
  onChoose: (term: string) => void
}

// Shows what PackView's useReading holds; choosing a term goes back up as an event.
export function FurtherReading({ terms, chosen, lookup, onChoose }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        WardWise's AI suggested these search terms. The links come from each service's own search, never from the AI.
      </p>

      <div role="group" aria-label="Search terms" className="flex flex-wrap gap-2">
        {terms.map((term) => (
          <button
            key={term}
            type="button"
            aria-pressed={term === chosen}
            onClick={() => onChoose(term)}
            className={cn(
              'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
              term === chosen
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:border-primary/50',
            )}
          >
            <Search className="size-3.5" aria-hidden="true" />
            {term}
          </button>
        ))}
      </div>

      {/* Screen readers hear this one line when an answer arrives, not every card below it. */}
      <p role="status" className="sr-only">
        {chosen && lookup ? announce(chosen, lookup) : ''}
      </p>

      <div>
        {lookup?.status === 'loading' && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            Looking up "{chosen}"…
          </p>
        )}

        {lookup?.status === 'error' && chosen && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
            <CircleAlert className="size-4 shrink-0 text-destructive" aria-hidden="true" />
            <span className="flex-1">{lookup.message}</span>
            <Button variant="outline" size="sm" onClick={() => onChoose(chosen)}>
              <RotateCcw aria-hidden="true" />
              Try again
            </Button>
          </div>
        )}

        {lookup?.status === 'done' && (
          <Results key={lookup.reading.term} reading={lookup.reading} onRetry={() => onChoose(lookup.reading.term)} />
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Check the date and source of anything you read. Links open in a new tab.
      </p>
    </div>
  )
}

function announce(term: string, lookup: Lookup) {
  if (lookup.status === 'loading') return `Looking up "${term}".`
  if (lookup.status === 'error') return lookup.message
  const count = lookup.reading.sources
    .filter((source) => source.kind === 'results')
    .reduce((total, source) => total + source.links.length, 0)
  const missing = lookup.reading.sources.some((source) => source.status === 'failed')
  return `Found ${count} ${count === 1 ? 'link' : 'links'} for "${term}".${missing ? ' Some sources could not be reached.' : ''}`
}

function Results({ reading, onRetry }: { reading: Reading; onRetry: () => void }) {
  // A source switched off on this server (no YouTube key) is left out rather than shown as a gap.
  const found = reading.sources.filter((source) => source.kind === 'results' && source.status !== 'off')
  const searches = reading.sources.filter((source) => source.kind === 'search')

  return (
    <div className="flex flex-col gap-4">
      <h3 className="sr-only">Reading for "{reading.term}"</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {found.map((source, index) => (
          <motion.section
            key={source.key}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex flex-col gap-2 rounded-lg border bg-background/50 p-3"
          >
            <SourceHeading source={source} />
            <SourceBody source={source} onRetry={onRetry} />
          </motion.section>
        ))}
      </div>

      {searches.length > 0 && (
        <section className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold">Search these sites yourself</h4>
          <ul className="flex flex-wrap gap-2">
            {searches.flatMap((source) =>
              source.links.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border bg-background/50 px-3 py-1.5 text-sm transition-colors outline-none hover:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {source.name}
                    <span className="text-xs text-muted-foreground">{source.about}</span>
                    <ExternalLink className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              )),
            )}
          </ul>
        </section>
      )}
    </div>
  )
}

function SourceHeading({ source }: { source: ReadingSource }) {
  const Icon = ICONS[source.key] ?? Search
  return (
    <div className="flex flex-col gap-0.5">
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-primary" aria-hidden="true" />
        {source.name}
      </h4>
      <p className="text-xs text-muted-foreground">{source.about}</p>
    </div>
  )
}

function SourceBody({ source, onRetry }: { source: ReadingSource; onRetry: () => void }) {
  if (source.status !== 'ok') {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="flex-1">{source.note}</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw aria-hidden="true" />
          Try again
        </Button>
      </div>
    )
  }
  if (source.links.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing matched this term.</p>
  }
  return (
    <ul className="flex flex-col gap-2">
      {source.links.map((link) => (
        <li key={link.url}>
          <ExternalItem link={link} />
        </li>
      ))}
    </ul>
  )
}

// A new tab keeps the study pack open. noopener stops the other site from controlling this tab,
// and noreferrer stops it learning which page sent the student.
function ExternalItem({ link }: { link: ReadingLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-md text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <span className="font-medium text-foreground group-hover:text-primary group-hover:underline">
        {link.title}
        <ExternalLink className="ml-1 inline size-3 align-baseline text-muted-foreground" aria-hidden="true" />
        <span className="sr-only"> (opens in a new tab)</span>
      </span>
      {link.detail && <span className="text-xs text-muted-foreground">{link.detail}</span>}
    </a>
  )
}
