import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'lucy-theme'
const darkQuery = '(prefers-color-scheme: dark)'

function readSaved(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function systemTheme(): Theme {
  return window.matchMedia(darkQuery).matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

// Follows the device setting until the user picks a theme, then remembers the choice.
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => readSaved() ?? systemTheme())

  useEffect(() => applyTheme(theme), [theme])

  useEffect(() => {
    const query = window.matchMedia(darkQuery)
    const onChange = () => {
      if (!readSaved()) setTheme(systemTheme())
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  function chooseTheme(next: Theme) {
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage can be blocked (private windows); the theme still applies for this visit.
    }
    applyTheme(next)
    setTheme(next)
  }

  return { theme, chooseTheme }
}
