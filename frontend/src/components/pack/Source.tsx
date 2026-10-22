import { AlertTriangle } from 'lucide-react'

// Where an item comes from in the student's material, or a warning that WardWise could not find it there.
// Spans, so it can sit inside a button (the flashcard).
export function Source({ quote, grounded }: { quote: string; grounded: boolean }) {
  if (grounded) {
    return <span className="block text-xs text-muted-foreground italic">From your session: "{quote}"</span>
  }
  return (
    <span className="flex items-start gap-1.5 text-left text-xs font-medium">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
      WardWise could not find this in your material. Check it before you rely on it.
    </span>
  )
}
