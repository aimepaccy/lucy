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

export type SendState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'received'; receipt: SessionReceipt }
  | { status: 'error'; message: string }
