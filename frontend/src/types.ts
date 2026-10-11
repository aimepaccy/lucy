export type SlideFile = {
  id: string
  file: File
  kind: 'pdf' | 'pptx'
}

export type Recording = {
  durationSec: number
}

// Mirrors SessionReceipt in backend/app/schemas.py.
export type SessionReceipt = {
  notes_words: number
  slides: { name: string; kind: SlideFile['kind']; size_bytes: number }[]
}

export type SendState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'received'; receipt: SessionReceipt }
  | { status: 'error'; message: string }
