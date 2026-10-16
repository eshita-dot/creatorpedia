export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Search, SlidersHorizontal } from 'lucide-react'
import { MOCK_CREATORS, formatFollowers, regionLabel } from '@/lib/mock-data'
import type { SearchResult, Category, Platform, Region } from '@/types'

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    platform?: string
    region?: string
  }>
}

function filterCreators(
  creators: SearchResult[],
  q: string,
  category?: string,
  platform?: string,
  region?: string
): SearchResult[] {
  const query = q.toLowerCase()
  return creators.filter((c) => {
    const matchesQuery =
      !query ||
      c.name.toLowerCase().includes(query) ||
      c.handle.toLowerCase().includes(query) ||
      c.category.includes(query) ||
      c.recent_brands.some((b) => b.toLowerCase().includes(query)) ||
      c.languages.some((l) => l.toLowerCase().includes(query)) ||
      c.region.includes(query) ||
      (c.bio?.toLowerCase().includes(query) ?? false)

    const matchesCategory = !category || c.category === category
    const matchesPlatform =
      !platform ||
      platform === 'both' ||
      c.platform === platform ||
      c.platform === 'both'
    const matchesRegion = !region || c.region === region

    return matchesQuery && matchesCategory && matchesPlatform && matchesRegion
  })
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-400',
  youtube: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
  both: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
}

const TIER_COLORS: Record<string, string> = {
  nano: 'bg-gray-100 text-gray-600',
  micro: 'bg-blue-100 text-blue-700',
  mid: 'bg-green-100 text-green-700',
  macro: 'bg-amber-100 text-amber-700',
  mega: 'bg-orange-100 text-orange-700',
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const q = params.q ?? ''
  const { category, platform, region } = params

  const results = filterCreators(MOCK_CREATORS, q, category, platform, region)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Search bar (inline) */}
      <form method="GET" action="/search" className="mb-6">
        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-amber-500/40">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search creators, brands, niches…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {category && <input type="hidden" name="category" value={category} />}
            {platform && <input type="hidden" name="platform" value={platform} />}
            {region && <input type="hidden" name="region" value={region} />}
          </div>
          <button
            type="submit"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Active filters */}
      {(category || platform || region) && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <SlidersHorizontal className="size-3.5 text-muted-foreground" />
          {category && (
            <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 capitalize">
              {category}
            </span>
          )}
          {platform && (
            <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 capitalize">
              {platform}
            </span>
          )}
          {region && (
            <span className="rounded-full border border-border bg-muted px-2.5 py-0.5">
              {regionLabel(region)}
            </span>
          )}
          <Link href={`/search?q=${encodeURIComponent(q)}`} className="text-muted-foreground hover:text-foreground">
            Clear filters
          </Link>
        </div>
      )}

      {/* Results header */}
      <p className="mb-4 text-sm text-muted-foreground">
        {results.length > 0
          ? `${results.length} creator${results.length !== 1 ? 's' : ''} found${q ? ` for "${q}"` : ''}`
          : `No creators found${q ? ` for "${q}"` : ''}`}
      </p>

      {/* Results grid */}
      {results.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {results.map((creator) => (
            <Link
              key={creator.id}
              href={`/creator/${creator.handle}`}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 hover:border-amber-300 hover:shadow-sm transition-all"
            >
              {/* Header row */}
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-bold text-white">
                  {creator.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate text-sm font-semibold">{creator.name}</h3>
                    {creator.verified && (
                      <span className="shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">@{creator.handle}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${PLATFORM_COLORS[creator.platform]}`}
                >
                  {creator.platform === 'both' ? 'IG + YT' : creator.platform === 'instagram' ? 'Instagram' : 'YouTube'}
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] capitalize">
                  {creator.category}
                </span>
                <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px]">
                  {regionLabel(creator.region)}
                </span>
                {creator.languages.slice(0, 2).map((l) => (
                  <span key={l} className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px]">
                    {l}
                  </span>
                ))}
                {creator.pricing_tier && (
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium capitalize ${TIER_COLORS[creator.pricing_tier]}`}>
                    {creator.pricing_tier}
                  </span>
                )}
              </div>

              {/* Metrics */}
              <div className="flex gap-4 text-xs text-muted-foreground">
                {creator.followers_instagram && (
                  <span>
                    <span className="font-semibold text-foreground">{formatFollowers(creator.followers_instagram)}</span> IG
                  </span>
                )}
                {creator.followers_youtube && (
                  <span>
                    <span className="font-semibold text-foreground">{formatFollowers(creator.followers_youtube)}</span> YT
                  </span>
                )}
                {creator.avg_engagement_rate && (
                  <span>
                    <span className="font-semibold text-foreground">{creator.avg_engagement_rate}%</span> ER
                  </span>
                )}
              </div>

              {/* Recent brands */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Worked with:</span>
                  {creator.recent_brands.slice(0, 3).map((b) => (
                    <span key={b} className="font-medium text-foreground">{b}</span>
                  ))}
                  {creator.recent_brands.length > 3 && (
                    <span>+{creator.recent_brands.length - 3} more</span>
                  )}
                </div>
                <span className="text-[10px] text-amber-600 group-hover:underline">
                  Deep Scan →
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-20 text-center">
          <Search className="mb-3 size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">No creators found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try a different search term or remove filters
          </p>
          <Link href="/" className="mt-4 text-xs text-amber-600 hover:underline">
            Back to home
          </Link>
        </div>
      )}
    </div>
  )
}
