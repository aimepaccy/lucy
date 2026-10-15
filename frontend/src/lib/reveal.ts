// Brings the study pack into view and moves keyboard focus to its start.
// The scroll is asked for explicitly: focus alone leaves it to the browser whether, and how far, to scroll.
export function revealPack() {
  const start = document.getElementById('pack-start')
  if (!start) return
  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById('pack')?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
  start.focus({ preventScroll: true })
}
