'use client'

import { Download } from 'lucide-react'

interface ExportRow {
  name: string
  handle: string
  platform: string
  tier: string
  maxFollowers: number
  brandPresence: boolean[]
  brandDates: (string | null)[]
  brandConfirmed: (boolean | null)[]
}

interface ExportButtonProps {
  rows: ExportRow[]
  brandNames: string[]
}

export function ExportButton({ rows, brandNames }: ExportButtonProps) {
  function handleExport() {
    const dateHeaders = brandNames.map(n => `${n} (last collab)`)
    const confirmedHeaders = brandNames.map(n => `${n} (confirmed paid)`)
    const headers = ['Creator', 'Handle', 'Platform', 'Tier', 'Max Followers', ...brandNames, ...dateHeaders, ...confirmedHeaders, 'Overlap Count']
    const lines = rows.map(r => [
      `"${r.name}"`,
      r.handle,
      r.platform,
      r.tier,
      r.maxFollowers,
      ...r.brandPresence.map(p => p ? 'Yes' : 'No'),
      ...r.brandDates.slice(0, brandNames.length).map(d => d ?? ''),
      ...r.brandConfirmed.slice(0, brandNames.length).map(c => c === null ? '' : c ? 'Yes' : 'No'),
      r.brandPresence.filter(Boolean).length,
    ].join(','))

    const csv = [headers.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `creatorpedia-compare-${brandNames.map(n => n.toLowerCase().replace(/\s+/g, '-')).join('-vs-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted/50 transition-colors"
    >
      <Download className="size-3.5" />
      Export CSV
    </button>
  )
}
