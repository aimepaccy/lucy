import { useEffect } from 'react'

// Asks "Leave site?" on reload or close while `active`. Browsers show their own wording, not ours.
export function useLeaveWarning(active: boolean) {
  useEffect(() => {
    if (!active) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      // Older browsers need returnValue set as well.
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [active])
}
