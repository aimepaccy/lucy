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

export type Materials = {
  transcript: string | null
  slides: { name: string; kind: SlideFile['kind']; pages: number; text: string }[]
  warnings: string[]
}

// Mirrors StudyPack in backend/app/schemas.py. `grounded` is Lucy's check that the quote is really in the material.
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
  summary: string[]
  flashcards: Flashcard[]
  questions: Question[]
  search_terms: string[]
  model: string
}

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
  | { status: 'done'; pack: StudyPack }
  | { status: 'error'; message: string }

export type SendState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'working'; step: string; receipt: SessionReceipt }
  // `materials` is what Lucy produced, kept unchanged; the student's corrections live in App.
  // `recording` and `slides` are the inputs Lucy read, to notice if they change afterwards.
  | { status: 'ready'; materials: Materials; recording: Recording | null; slides: SlideFile[] }
  | { status: 'error'; message: string }
