import type { SessionReceipt, SlideFile } from '@/types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
// Long enough for a full set of slides on slow Wi-Fi.
const TIMEOUT_MS = 5 * 60_000

export class ApiError extends Error {}

export async function sendSession(notes: string, slides: SlideFile[]): Promise<SessionReceipt> {
  // FormData becomes a multipart request. The browser sets the Content-Type header,
  // including the boundary that separates the parts, so we must not set it ourselves.
  const body = new FormData()
  body.append('notes', notes)
  for (const slide of slides) body.append('slides', slide.file)

  let response: Response
  try {
    response = await fetch(`${API_URL}/api/sessions`, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new ApiError('Sending took too long. Check your connection, or send fewer or smaller files.')
    }
    throw new ApiError('Lucy could not reach its server. Check that it is running, then try again.')
  }

  if (!response.ok) throw new ApiError(await readError(response))
  return response.json()
}

// FastAPI sends errors as { detail: "message" }, or { detail: [...] } for validation errors.
async function readError(response: Response) {
  const fallback = `Something went wrong (error ${response.status}). Please try again.`
  try {
    const { detail } = await response.json()
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && typeof detail[0]?.msg === 'string') return detail[0].msg
  } catch {
    // Not JSON, for example an error page from a proxy.
  }
  return fallback
}
