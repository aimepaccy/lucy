import { cn } from '@/lib/utils'

// The name in the heading serif: "Ward" in ink, "Wise" in the accent, set in italic.
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-ink font-semibold tracking-tight', className)}>
      Ward<span className="font-medium text-primary italic">Wise</span>
    </span>
  )
}
