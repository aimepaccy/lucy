export const MAX_AUDIO_MB = 25

// Formats the browser may record in, best first. Chrome, Edge and Firefox pick WebM/Opus; Safari picks MP4.
const RECORDING_TYPES = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4']

// Speech stays clear at 32 kbps, and an hour fits in about 14 MB.
export const RECORDING_BITRATE = 32_000

export const UPLOAD_ACCEPT = 'audio/*,.m4a,.mp3,.wav,.webm,.ogg,.oga,.opus,.flac,.mp4'
const UPLOAD_EXTENSIONS = ['.m4a', '.mp3', '.wav', '.webm', '.ogg', '.oga', '.opus', '.flac', '.mp4', '.mpeg', '.mpga']

export function pickRecordingType() {
  return RECORDING_TYPES.find((type) => MediaRecorder.isTypeSupported(type))
}

export function fileNameFor(mimeType: string) {
  if (mimeType.includes('ogg')) return 'recording.ogg'
  if (mimeType.includes('mp4')) return 'recording.mp4'
  return 'recording.webm'
}

export function looksLikeAudio(file: File) {
  const name = file.name.toLowerCase()
  return file.type.startsWith('audio/') || UPLOAD_EXTENSIONS.some((extension) => name.endsWith(extension))
}

export function isTooLarge(file: Blob) {
  return file.size > MAX_AUDIO_MB * 1024 * 1024
}

// Asks the browser to read only the file's header to learn its length. Resolves null if it cannot tell.
export function readDuration(file: Blob): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio()
    const timeout = window.setTimeout(() => finish(null), 5000)
    const finish = (seconds: number | null) => {
      window.clearTimeout(timeout)
      URL.revokeObjectURL(url)
      resolve(seconds)
    }
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => finish(Number.isFinite(audio.duration) ? Math.round(audio.duration) : null)
    audio.onerror = () => finish(null)
    audio.src = url
  })
}
