import { useEffect, useState } from 'react'
import { getLimits } from '@/lib/api'
import type { Limits } from '@/types'

// The server's limits, asked for once. Null until they arrive, or if the server cannot be reached:
// the server still checks everything, so the page simply shows less guidance.
export function useLimits() {
  const [limits, setLimits] = useState<Limits | null>(null)

  useEffect(() => {
    let current = true
    getLimits()
      .then((answer) => current && setLimits(answer))
      .catch(() => {})
    return () => {
      current = false
    }
  }, [])

  return limits
}
