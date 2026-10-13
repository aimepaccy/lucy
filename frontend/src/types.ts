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

export type JobState = {
  status: 'queued' | 'working' | 'done' | 'failed'
  step: string
  materials: Materials | null
  error: string | null
}

export type SendState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'working'; step: string; receipt: SessionReceipt }
  // `materials` is what Lucy produced, kept unchanged; the student's corrections live in App.
  // `recording` and `slides` are the inputs Lucy read, to notice if they change afterwards.
  | { status: 'ready'; materials: Materials; recording: Recording | null; slides: SlideFile[] }
  | { status: 'error'; message: string }
