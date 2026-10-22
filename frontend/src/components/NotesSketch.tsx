import { Sketch, Strokes } from '@/components/Sketch'

// A pencil sketch: a page of handwritten notes in a camera's frame, and the phone that took it.
const graphite = [
  // Notebook page, drawn twice slightly apart, with its spiral rings.
  'M22 14 L92 11 L96 92 L26 95 Z',
  'M20 16 L91 13.5 M98 14 L95.5 89',
  'M32 17 C29 9 37 7 36 15 M44 16.5 C41 8.5 49 6.5 48 14.5 M56 16 C53 8 61 6 60 14 M68 15.5 C65 7.5 73 5.5 72 13.5 M80 15 C77 7 85 5 84 13',
  // Handwriting.
  'M36 30 Q41 26 46 30 T56 30 T66 29 T76 29',
  'M36 42 Q42 38 48 42 T60 41 T72 41 T84 40',
  'M36 54 Q40 50 44 54 T52 54 M58 53 Q64 49 70 53 T82 52',
  'M36 66 Q42 62 48 66 T62 65 T74 64',
  'M36 78 Q41 74 46 78 T58 77',
  // The phone, its speaker and button.
  'M110 34 Q110 30 114 30 L140 29 Q144 29 144 33 L145 92 Q145 96 141 96 L115 97 Q111 97 111 93 Z',
  'M122 33.5 L132 33.3 M127.5 93 a1.6 1.6 0 1 0 0.1 0',
  // The page again, small, on the phone's screen.
  'M116 40 L139 39.5 L139.5 87 L116.5 87.5 Z',
  'M120 50 Q124 47 128 50 T136 50 M120 58 Q125 55 130 58 T136 58 M120 66 Q124 63 128 66 T134 66 M120 74 Q123 71 126 74',
]

const ink = [
  // The margin, and the camera's frame around the page.
  'M31 22 L33.5 90',
  'M14 16 L14 6 L24 6',
  'M92 4 L103 3.5 L103 13',
  'M17 92 L17.5 102 L28 102',
  'M94 101.5 L105 101 L104.5 91',
  // The flash.
  'M150 22 L156 17 M151 28 L158 28 M146 18 L146 11',
]

export function NotesSketch({ replay, className }: { replay: boolean; className?: string }) {
  return (
    <Sketch viewBox="0 0 160 104" replay={replay} className={className}>
      <Strokes paths={graphite} tone="graphite" />
      <Strokes paths={ink} tone="ink" start={graphite.length} />
    </Sketch>
  )
}
