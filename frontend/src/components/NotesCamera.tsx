import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, Camera, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type NotesCameraProps = {
  // How many more photos fit.
  room: number
  onCapture: (file: File) => void
  onClose: () => void
}

let shots = 0

// The camera inside WardWise: a live view and a shutter. Like the microphone, the camera switches off
// as soon as this closes, and a photo exists only in this page until it is sent.
export function NotesCamera({ room, onCapture, onClose }: NotesCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'starting' | 'live' | 'failed'>('starting')
  const [flashes, setFlashes] = useState(0)

  useEffect(() => {
    // Browsers offer the camera only on https and on localhost.
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('failed')
      return
    }
    let stream: MediaStream | null = null
    let closed = false
    navigator.mediaDevices
      // The back camera on a phone, and enough detail to read handwriting.
      .getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false })
      .then((opened) => {
        // Closed while the browser was still asking: switch the camera straight off again.
        if (closed) return opened.getTracks().forEach((track) => track.stop())
        stream = opened
        // "Live" waits for the first frame (onPlaying below): a photo taken before it would be empty.
        if (videoRef.current) videoRef.current.srcObject = opened
      })
      .catch(() => !closed && setStatus('failed'))
    return () => {
      closed = true
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  function takePhoto() {
    const video = videoRef.current
    if (!video || !video.videoWidth || room <= 0) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => blob && onCapture(new File([blob], `Camera photo ${++shots}.jpg`, { type: 'image/jpeg' })),
      'image/jpeg',
      0.9,
    )
    setFlashes((count) => count + 1)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="hand-radius relative aspect-4/3 overflow-hidden border bg-foreground/90">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onPlaying={() => setStatus('live')}
          className="size-full object-cover"
        />

        {/* The same ink corners as the drawing: the page goes inside them. */}
        {status === 'live' && (
          <div className="pointer-events-none absolute inset-5" aria-hidden="true">
            <span className="absolute top-0 left-0 size-7 rounded-tl-sm border-t-2 border-l-2 border-primary" />
            <span className="absolute top-0 right-0 size-7 rounded-tr-sm border-t-2 border-r-2 border-primary" />
            <span className="absolute bottom-0 left-0 size-7 rounded-bl-sm border-b-2 border-l-2 border-primary" />
            <span className="absolute right-0 bottom-0 size-7 rounded-br-sm border-r-2 border-b-2 border-primary" />
          </div>
        )}

        {status === 'starting' && (
          <p className="absolute inset-0 grid place-items-center text-sm text-background">
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" />
              Waiting for the camera
            </span>
          </p>
        )}
        {status === 'failed' && (
          <p role="alert" className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-background">
            <span className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              WardWise could not open the camera. Allow camera access in your browser, or add photos instead.
            </span>
          </p>
        )}

        <AnimatePresence>
          {flashes > 0 && (
            <motion.span
              key={flashes}
              className="absolute inset-0 bg-background"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>
      </div>

      <p role="status" className="sr-only">
        {status === 'live' ? 'Camera on' : status === 'starting' ? 'Waiting for the camera' : ''}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={takePhoto} disabled={status !== 'live' || room <= 0}>
          <Camera /> Take photo
        </Button>
        <span className="flex-1 text-xs text-muted-foreground">
          {room > 0 ? 'No patient details on the page. Hold it flat, in good light, inside the corners.' : 'That is the most WardWise takes at once.'}
        </span>
        <Button variant="outline" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  )
}
