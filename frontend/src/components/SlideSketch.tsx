import { Sketch, Strokes } from '@/components/Sketch'

// A pencil concept sketch: a slide on an easel, a page arriving, and a pencil left on the desk.
const graphite = [
  // Easel board, drawn twice slightly apart as a quick sketch would be.
  'M38 10 L122 9 L123 66 L37 67 Z',
  'M36 12 L121 10.5 M124 12 L122 64',
  // Clip and legs.
  'M74 9 L74 5 L86 5 L86 9',
  'M60 67 L50 94 M100 67 L110 94 M80 67 L80 90',
  // Slide title and bullet points.
  'M46 20 Q52 16 58 20 T70 20 T82 20',
  'M90 32 h2 M96 32 Q104 30 114 32 M90 40 h2 M96 40 Q102 38 110 40 M90 48 h2 M96 48 Q105 46 114 48',
  // Chart axis and bars.
  'M45 59 L84 59 M46 59 L46 28',
  'M50 58 L50 44 L57 44 L57 58 M61 58 L61 34 L68 34 L68 58 M72 58 L72 48 L79 48 L79 58',
  // The arriving page, with its folded corner.
  'M6 26 L22 23 L27 44 L11 47 Z M17 24 L19 30 L23 29',
  // Pencil.
  'M120 93 L146 81 L150 86 L124 98 Z M120 93 L116 98 L124 98 M146 81 L150 86',
]

const ink = [
  // Hatching in the bars.
  'M50 52 L55 46 M50 57 L57 49 M53 58 L57 54 M61 44 L68 36 M61 51 L68 42 M61 57 L68 49 M72 54 L77 48 M74 58 L79 52',
  // The page's path onto the board.
  'M27 34 Q34 26 40 30',
  'M35 26 L40 30 L34 33',
]

export function SlideSketch({ replay, className }: { replay: boolean; className?: string }) {
  return (
    <Sketch viewBox="0 0 156 100" replay={replay} className={className}>
      <Strokes paths={graphite} tone="graphite" />
      <Strokes paths={ink} tone="ink" start={graphite.length} />
    </Sketch>
  )
}
