import { cn } from '@/lib/utils'

// Capital letters drawn on a 5 x 7 pixel grid, so the cyber look needs no font download.
// A row is one string; '1' is a lit pixel. Narrow glyphs (space, full stop) have shorter rows.
const glyphs: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  '.': ['0', '0', '0', '0', '0', '0', '1'],
  ' ': ['00', '00', '00', '00', '00', '00', '00'],
}

// Turns the text into one path of 1 x 1 squares, with a one-pixel gap after each letter.
function layout(text: string) {
  let x = 0
  let d = ''
  for (const char of text.toUpperCase()) {
    const rows = glyphs[char] ?? glyphs[' ']
    rows.forEach((row, y) => [...row].forEach((on, dx) => on === '1' && (d += `M${x + dx} ${y}h1v1h-1z`)))
    x += rows[0].length + 1
  }
  return { d, width: x }
}

// Width of the drawing in pixels: the text, plus room for the cursor or minus the last letter's gap.
function widthOf(text: string, cursor: boolean) {
  const { width } = layout(text)
  return cursor ? width + 4 : width - 1
}

function Pixels({ text, cursor, className }: { text: string; cursor: boolean; className?: string }) {
  const { d, width } = layout(text)
  return (
    <svg
      viewBox={`0 0 ${widthOf(text, cursor)} 7`}
      className={cn('block size-full', className)}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <path d={d} fill="currentColor" />
      {cursor && <rect x={width} y="6" width="4" height="1" fill="currentColor" className="wordmark-cursor" />}
    </svg>
  )
}

// On hover, red and cyan copies split off for a moment, like a glitching screen.
// Set the height with a class: a multiple of 7px keeps every pixel the same size.
export function PixelText({ text, cursor = false, className }: { text: string; cursor?: boolean; className?: string }) {
  return (
    // The box takes the drawing's proportions; without them the browser guesses a width of 300px.
    <span className={cn('wordmark relative inline-block', className)} style={{ aspectRatio: `${widthOf(text, cursor)} / 7` }}>
      <span className="sr-only">{text}</span>
      <Pixels text={text} cursor={cursor} className="relative" />
      <Pixels
        text={text}
        cursor={cursor}
        className="wordmark-ghost absolute inset-0 text-[oklch(0.65_0.22_25)] opacity-0 mix-blend-multiply dark:mix-blend-screen"
      />
      <Pixels
        text={text}
        cursor={cursor}
        className="wordmark-ghost wordmark-ghost-2 absolute inset-0 text-[oklch(0.75_0.14_200)] opacity-0 mix-blend-multiply dark:mix-blend-screen"
      />
    </span>
  )
}

export function PixelWordmark() {
  return <PixelText text="Lucy" className="block h-3.5" />
}
