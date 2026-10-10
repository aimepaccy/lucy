import type { MouseEvent } from 'react'

// The cursor position is written to CSS variables, so the glow moves without re-rendering React.
export function trackPointer(event: MouseEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect()
  event.currentTarget.style.setProperty('--x', `${event.clientX - rect.left}px`)
  event.currentTarget.style.setProperty('--y', `${event.clientY - rect.top}px`)
}

// Place inside an element with `group/spot`, `relative` and `onMouseMove={trackPointer}`.
export function SpotlightGlow({ size = 420 }: { size?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
      style={{ background: `radial-gradient(${size}px circle at var(--x) var(--y), var(--glow), transparent 45%)` }}
    />
  )
}
