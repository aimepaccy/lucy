import { useCallback, useEffect, useRef, useState } from 'react'
import { RECORDING_BITRATE, pickRecordingType } from '@/lib/audio'

export type RecorderStatus = 'idle' | 'starting' | 'recording' | 'paused' | 'stopping'

export type FinishedRecording = {
  blob: Blob
  mimeType: string
  durationSec: number
}

type Options = {
  maxSeconds: number
  maxBytes: number
  onFinish: (recording: FinishedRecording) => void
}

type Clock = { totalMs: number; since: number | null }

// Time actually recorded, measured from timestamps so pauses and slow background tabs do not skew it.
function recordedMs({ totalMs, since }: Clock) {
  return totalMs + (since === null ? 0 : performance.now() - since)
}

function describeMicrophoneError(error: unknown) {
  const name = error instanceof DOMException ? error.name : ''
  if (name === 'NotAllowedError') return 'Lucy needs permission to use the microphone. Allow it in the address bar, then try again.'
  if (name === 'NotFoundError') return 'No microphone was found on this device. You can upload an audio file instead.'
  if (name === 'NotReadableError') return 'The microphone is busy in another app. Close that app, then try again.'
  return 'The microphone could not start. You can upload an audio file instead.'
}

export function useAudioRecorder({ maxSeconds, maxBytes, onFinish }: Options) {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Refs hold the live browser objects. Changing them does not redraw the screen.
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const bytesRef = useRef(0)
  const clockRef = useRef<Clock>({ totalMs: 0, since: null })
  const contextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const unmountedRef = useRef(false)
  const onFinishRef = useRef(onFinish)

  useEffect(() => {
    onFinishRef.current = onFinish
  })

  // Stopping every track is what switches the microphone (and its indicator light) off.
  const release = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    void contextRef.current?.close()
    streamRef.current = null
    recorderRef.current = null
    contextRef.current = null
    analyserRef.current = null
  }, [])

  // Throws the recording away: used by Cancel and when the Recorder leaves the screen.
  const discard = useCallback(() => {
    const recorder = recorderRef.current
    if (recorder) {
      recorder.onstop = null
      recorder.onerror = null
      if (recorder.state !== 'inactive') recorder.stop()
    }
    chunksRef.current = []
    release()
  }, [release])

  useEffect(() => {
    unmountedRef.current = false
    return () => {
      unmountedRef.current = true
      discard()
    }
  }, [discard])

  const finish = useCallback(() => {
    const recorder = recorderRef.current
    // Guards against a double click on Stop, or Stop arriving after the limit already stopped it.
    if (!recorder || recorder.state === 'inactive') return
    const clock = clockRef.current
    clockRef.current = { totalMs: recordedMs(clock), since: null }
    setStatus('stopping')
    recorder.stop()
  }, [])

  useEffect(() => {
    if (status !== 'recording') return
    const id = window.setInterval(() => {
      const ms = recordedMs(clockRef.current)
      setElapsed(Math.floor(ms / 1000))
      // Stop a little before the size limit, since the last chunk is still to come.
      if (ms >= maxSeconds * 1000 || bytesRef.current >= maxBytes * 0.96) finish()
    }, 250)
    return () => window.clearInterval(id)
  }, [status, maxSeconds, maxBytes, finish])

  async function start() {
    setError(null)
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Recording needs a secure (https) page in a recent browser. You can upload an audio file instead.')
      return
    }

    setStatus('starting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      // The Recorder may have left the screen while the browser was asking for permission.
      if (unmountedRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      streamRef.current = stream

      const recorder = new MediaRecorder(stream, { mimeType: pickRecordingType(), audioBitsPerSecond: RECORDING_BITRATE })
      chunksRef.current = []
      bytesRef.current = 0
      recorder.ondataavailable = (event) => {
        if (event.data.size === 0) return
        chunksRef.current.push(event.data)
        bytesRef.current += event.data.size
      }
      // Fires after Stop, and also when the browser ends the recording itself (microphone unplugged
      // or permission withdrawn), so whatever was captured is kept either way.
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        const durationSec = Math.round(recordedMs(clockRef.current) / 1000)
        chunksRef.current = []
        release()
        setStatus('idle')
        if (blob.size > 0) onFinishRef.current({ blob, mimeType: recorder.mimeType, durationSec })
      }
      recorder.onerror = () => setError('The recording stopped unexpectedly. What was captured so far has been kept.')
      recorder.start(1000)
      recorderRef.current = recorder

      const context = new AudioContext()
      const analyser = context.createAnalyser()
      analyser.fftSize = 512
      context.createMediaStreamSource(stream).connect(analyser)
      contextRef.current = context
      analyserRef.current = analyser

      clockRef.current = { totalMs: 0, since: performance.now() }
      setElapsed(0)
      setStatus('recording')
    } catch (err) {
      discard()
      setStatus('idle')
      setError(describeMicrophoneError(err))
    }
  }

  function pause() {
    const clock = clockRef.current
    clockRef.current = { totalMs: recordedMs(clock), since: null }
    recorderRef.current?.pause()
    setStatus('paused')
  }

  function resume() {
    clockRef.current = { ...clockRef.current, since: performance.now() }
    recorderRef.current?.resume()
    setStatus('recording')
  }

  function cancel() {
    discard()
    setStatus('idle')
    setElapsed(0)
  }

  // Loudness from 0 to 1, measured from the live sound wave (root mean square).
  const readLevel = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return 0
    const samples = new Uint8Array(analyser.fftSize)
    analyser.getByteTimeDomainData(samples)
    let sum = 0
    for (const sample of samples) {
      const centred = (sample - 128) / 128
      sum += centred * centred
    }
    return Math.min(1, Math.sqrt(sum / samples.length) * 4)
  }, [])

  return { status, elapsed, error, setError, start, pause, resume, stop: finish, cancel, readLevel }
}
