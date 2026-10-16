import { ExternalLink, Tag } from 'lucide-react'
import type { Collaboration } from '@/types'

interface CollabTimelineProps {
  collabs: Collaboration[]
}

const DEAL_COLORS: Record<string, string> = {
  paid: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400',
  barter: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  gifted: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
  unknown: 'bg-gray-100 text-gray-600',
}

const SOURCE_LABELS: Record<string, string> = {
  asci_disclosure: 'ASCI Disclosure',
  youtube_api: 'YouTube API',
  creator_verified: 'Creator Verified',
  brand_submission: 'Brand Submitted',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function CollabTimeline({ collabs }: CollabTimelineProps) {
  if (collabs.length === 0) {
    return (
      <div className="rounded-lg border border-border py-8 text-center text-sm text-muted-foreground">
        No collaborations found yet.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {collabs.map((c) => (
        <div
          key={c.id}
          className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 hover:border-amber-200 transition-colors"
        >
          {/* Brand initial */}
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-600 dark:from-slate-800 dark:to-slate-700 dark:text-slate-300">
            {c.brand.name.substring(0, 2).toUpperCase()}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">{c.brand.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${DEAL_COLORS[c.deal_type]}`}
              >
                {c.deal_type}
              </span>
              <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {c.brand.category}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>{formatDate(c.collab_date)}</span>
              <span className="flex items-center gap-1">
                <Tag className="size-3" />
                {SOURCE_LABELS[c.source]}
              </span>
              {c.disclosure_tags.length > 0 && (
                <span className="font-mono text-[10px] text-muted-foreground/70">
                  {c.disclosure_tags.slice(0, 3).join(' ')}
                </span>
              )}
            </div>

            {c.notes && (
              <p className="mt-1 text-xs text-muted-foreground">{c.notes}</p>
            )}
          </div>

          {/* Evidence link */}
          {c.evidence_url && c.evidence_url !== '#' && (
            <a
              href={c.evidence_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-muted-foreground hover:text-amber-500 transition-colors"
            >
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      ))}
    </div>
  )
}
