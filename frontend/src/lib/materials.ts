import type { Materials } from '@/types'

// Derived from the two versions, never stored.
export function hasCorrections(heard: Materials, draft: Materials) {
  return draft.transcript !== heard.transcript || draft.slides.some((slide, index) => slide.text !== heard.slides[index]?.text)
}

// Notes alone give the student nothing to check here: they are already editable in their own box.
export function hasReviewable(materials: Materials) {
  return materials.transcript !== null || materials.slides.length > 0
}

// Whether the student stops to check what Lucy heard and read: text to correct, or warnings to see.
// One rule for the panel, the steps and the automatic writing, so they always agree.
export function needsCheck(materials: Materials) {
  return hasReviewable(materials) || materials.warnings.length > 0
}
