export type SlideFile = {
  id: string
  file: File
  kind: 'pdf' | 'pptx'
}

export type Recording = {
  file: Blob
  name: string
  // Unknown when an uploaded file does not say how long it is.
  durationSec: number | null
  source: 'recorded' | 'uploaded'
}

// Mirrors SessionReceipt in backend/app/schemas.py.
export type SessionReceipt = {
  notes_words: number
  slides: { name: string; kind: SlideFile['kind']; size_bytes: number }[]
  audio: { name: string; kind: string; size_bytes: number } | null
}

// Mirrors JobCreated, Materials and JobState in backend/app/schemas.py.
export type JobCreated = {
  job_id: string
  receipt: SessionReceipt
}

// Mirrors Limits in backend/app/schemas.py.
export type Limits = {
  max_slide_files: number
  max_slide_mb: number
  max_audio_mb: number
  max_notes_chars: number
  max_pack_words: number
  max_pack_chars: number
}

// How much text a study pack would be written from, in characters (as the server measures it).
export type PackSize = { chars: number }

export type Materials = {
  transcript: string | null
  slides: { name: string; kind: SlideFile['kind']; pages: number; text: string }[]
  warnings: string[]
}

// Mirrors StudyPack in backend/app/schemas.py. `grounded` is Lucy's check that the quote is really in the material.
export type TeachingPoint = { text: string; quote: string; grounded: boolean }

export type Flashcard = { front: string; back: string; quote: string; grounded: boolean }

export type QuizOption = { text: string; explanation: string }

export type Question = {
  stem: string
  options: QuizOption[]
  answer: 'A' | 'B' | 'C' | 'D' | 'E'
  quote: string
  grounded: boolean
}

export type StudyPack = {
  title: string
  overview: string[]
  summary: TeachingPoint[]
  flashcards: Flashcard[]
  questions: Question[]
  search_terms: string[]
  // Passages of the material no item draws on, out of passage_count in all.
  uncovered: string[]
  passage_count: number
  model: string
}

// Further reading: links found by real services for one search term. The AI never writes them.
export type ReadingLink = { title: string; url: string; detail: string }

export type ReadingSource = {
  key: string
  name: string
  // One line on what the source is, such as which YouTube channels Lucy searches.
  about: string
  // 'search' is a single link to the service's own search page, for services without a free API.
  kind: 'results' | 'search'
  status: 'ok' | 'failed' | 'off'
  links: ReadingLink[]
  note: string | null
}

export type Reading = { term: string; sources: ReadingSource[] }

export type JobState = {
  status: 'queued' | 'working' | 'done' | 'failed'
  step: string
  materials: Materials | null
  pack: StudyPack | null
  error: string | null
}

export type WriteState =
  | { status: 'idle' }
  | { status: 'writing'; step: string }
  // `run` numbers each pack, so a new pack starts with fresh cards and quiz.
  | { status: 'done'; pack: StudyPack; run: number }
  | { status: 'error'; message: string }

export type SendState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'working'; step: string; receipt: SessionReceipt }
  // `materials` is what Lucy produced, kept unchanged; the student's corrections live in App.
  // `recording` and `slides` are the inputs Lucy read, to notice if they change afterwards.
  | { status: 'ready'; materials: Materials; recording: Recording | null; slides: SlideFile[] }
  | { status: 'error'; message: string }
