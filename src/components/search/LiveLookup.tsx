'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle } from 'lucide-react'
import { formatFollowers } from '@/lib/mock-data'

interface LookupResult {
  handle: string
  name: string
  followers_youtube?: number
  avg_views?: number
  avg_engagement_rate?: number
  collab_count: number
}

function YtIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5 fill-red-500 shrink-0" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

export function LiveLookup({ query }: { query: string }) {
  const [state, setState] = useState<'loading' | 'found' | 'not-found' | 'error'>('loading')
  const [result, setResult] = useState<LookupResult | null>(null)

  useEffect(() => {
    let cancelled = false
    async function lookup() {
      try {
        const res = await fetch('/api/on-demand-ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        })
        if (cancelled) return
        if (res.status === 404) { setState('not-found'); return }
        if (!res.ok) { setState('error'); return }
        const data = await res.json()
        setResult(data)
        setState('found')
      } catch {
        if (!cancelled) setState('error')
      }
    }
    lookup()
    return () => { cancelled = true }
  }, [query])

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <YtIcon />
        Live YouTube lookup
      </div>

      {state === 'loading' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin shrink-0" />
          Searching YouTube for &ldquo;{query}&rdquo;&hellip;
        </div>
      )}

      {state === 'not-found' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="size-4 shrink-0" />
          No creator found for &ldquo;{query}&rdquo; on YouTube.
        </div>
      )}

      {state === 'error' && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle className="size-4 shrink-0" />
          Something went wrong. Please try again.
        </div>
      )}

      {state === 'found' && result && (
        <>
          <p className="mb-3 text-xs text-muted-foreground">
            Found on YouTube — indexed and ready:
          </p>
          <Link
            href={`/creator/${result.handle}`}
            className="group flex items-center gap-3 rounded-lg border border-border bg-background p-3 hover:border-brand-300 hover:shadow-sm transition-all"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
              {result.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{result.name}</p>
              <p className="text-xs text-muted-foreground">@{result.handle}</p>
              <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {result.followers_youtube ? (
                  <span>
                    <span className="font-semibold text-foreground">{formatFollowers(result.followers_youtube)}</span> YT subs
                  </span>
                ) : null}
                {result.avg_views ? (
                  <span>
                    <span className="font-semibold text-foreground">{formatFollowers(result.avg_views)}</span> avg views
                  </span>
                ) : null}
                {result.avg_engagement_rate ? (
                  <span>
                    <span className="font-semibold text-foreground">{result.avg_engagement_rate}%</span> ER
                  </span>
                ) : null}
                {result.collab_count > 0 ? (
                  <span>
                    <span className="font-semibold text-foreground">{result.collab_count}</span> collab{result.collab_count !== 1 ? 's' : ''} indexed
                  </span>
                ) : null}
              </div>
            </div>
            <span className="shrink-0 text-[10px] text-brand-600 group-hover:underline">
              View Profile →
            </span>
          </Link>
        </>
      )}
    </div>
  )
}
