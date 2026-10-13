import { useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'lucy-notes-draft'
// Saved this long after typing stops, not on every keystroke.
const SAVE_AFTER_MS = 500

function readDraft() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function writeDraft(value: string) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage blocked or full: the notes still work, they just will not survive a reload.
  }
}

// The notes box, kept in localStorage so a reload or a closed tab does not lose them.
export function useNotesDraft() {
  const [notes, setNotes] = useState(readDraft)
  const latest = useRef(notes)

  useEffect(() => {
    latest.current = notes
    const timer = window.setTimeout(() => writeDraft(notes), SAVE_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [notes])

  // A reload within the half second would skip the timer, so the latest text is written as the page goes.
  // Notes typed in another tab arrive here too, so the two tabs do not overwrite each other.
  useEffect(() => {
    const flush = () => writeDraft(latest.current)
    const adopt = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setNotes(event.newValue ?? '')
    }
    window.addEventListener('pagehide', flush)
    window.addEventListener('storage', adopt)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('storage', adopt)
    }
  }, [])

  return [notes, setNotes] as const
}
