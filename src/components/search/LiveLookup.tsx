'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle } from 'lucide-react'
import { formatFollowers } from '@/lib/mock-data'

interface LookupResult {
  handle: string
  name: string
  platform: 'youtube' | 'instagram' | 'both'
  followers_youtube?: number
  followers_instagram?: number
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

function IgIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5 fill-pink-500 shrink-0" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
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
        <IgIcon />
        Live lookup — YouTube &amp; Instagram
      </div>

      {state === 'loading' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin shrink-0" />
          Searching YouTube &amp; Instagram for &ldquo;{query}&rdquo;&hellip;
        </div>
      )}

      {state === 'not-found' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="size-4 shrink-0" />
          No creator found for &ldquo;{query}&rdquo; on YouTube or Instagram.
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
            Found on {result.platform === 'both' ? 'YouTube & Instagram' : result.platform === 'instagram' ? 'Instagram' : 'YouTube'} — indexed and ready:
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
                {result.followers_instagram ? (
                  <span>
                    <span className="font-semibold text-foreground">{formatFollowers(result.followers_instagram)}</span> IG
                  </span>
                ) : null}
                {result.followers_youtube ? (
                  <span>
                    <span className="font-semibold text-foreground">{formatFollowers(result.followers_youtube)}</span> YT
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
