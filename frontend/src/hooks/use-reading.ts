import { useCallback, useRef, useState } from 'react'
import { ApiError, findReading } from '@/lib/api'
import type { Reading } from '@/types'

export type Lookup = { status: 'loading' } | { status: 'done'; reading: Reading } | { status: 'error'; message: string }

// Further reading for one study pack: which term is chosen, and what WardWise found for each term asked about.
export function useReading() {
  const [chosen, setChosen] = useState<string | null>(null)
  // One answer per term, so going back to a term shows it at once, and a late answer lands in the right place.
  const [lookups, setLookups] = useState<Record<string, Lookup>>({})
  // Terms asked for or answered. A ref, not state: it guards against asking twice and is never shown.
  const asked = useRef(new Set<string>())

  const choose = useCallback((term: string) => {
    setChosen(term)
    if (asked.current.has(term)) return
    asked.current.add(term)
    setLookups((current) => ({ ...current, [term]: { status: 'loading' } }))
    findReading(term).then(
      (reading) => {
        // If a source failed, the server did not keep this answer, so choosing the term again asks again.
        if (reading.sources.some((source) => source.status === 'failed')) asked.current.delete(term)
        setLookups((current) => ({ ...current, [term]: { status: 'done', reading } }))
      },
      (error) => {
        // Forgotten, so choosing the term again tries again.
        asked.current.delete(term)
        const message = error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'
        setLookups((current) => ({ ...current, [term]: { status: 'error', message } }))
      },
    )
  }, [])

  return { chosen, lookup: chosen ? lookups[chosen] : undefined, choose }
}
