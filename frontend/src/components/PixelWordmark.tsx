import { cn } from '@/lib/utils'

// "LUCY" drawn as 5 x 7 pixel letters, so the cyber look needs no font download.
const glyphs = [
  ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
]

// Each lit pixel becomes one square in a single path, 6 units apart per letter.
const pixels = glyphs
  .flatMap((rows, letter) =>
    rows.flatMap((row, y) => [...row].map((on, x) => (on === '1' ? `M${letter * 6 + x} ${y}h1v1h-1z` : ''))),
  )
  .join('')

function Letters({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 7" className={cn('h-full w-auto', className)} shapeRendering="crispEdges" aria-hidden="true">
      <path d={pixels} fill="currentColor" />
      {/* A text cursor after the name. */}
      <rect x="24" y="6" width="4" height="1" fill="currentColor" className="wordmark-cursor" />
    </svg>
  )
}

// On hover, red and cyan copies split off for a moment, like a glitching screen.
export function PixelWordmark() {
  return (
    <span className="wordmark relative block h-3.5">
      <span className="sr-only">Lucy</span>
      <Letters className="relative" />
      <Letters className="wordmark-ghost absolute inset-0 text-[oklch(0.65_0.22_25)] opacity-0 mix-blend-multiply dark:mix-blend-screen" />
      <Letters className="wordmark-ghost wordmark-ghost-2 absolute inset-0 text-[oklch(0.75_0.14_200)] opacity-0 mix-blend-multiply dark:mix-blend-screen" />
    </span>
  )
}
