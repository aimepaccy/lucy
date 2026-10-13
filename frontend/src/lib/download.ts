export function downloadFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// "Acute asthma: severity" on 13 October becomes lucy-acute-asthma-severity-2026-10-13.json.
export function exportName(title: string | null) {
  // The local date: toISOString would give yesterday's date just after midnight in Rwanda.
  const now = new Date()
  const day = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((part) => String(part).padStart(2, '0')).join('-')
  const slug = (title ?? 'packs')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
  return `lucy-${slug || 'pack'}-${day}.json`
}
