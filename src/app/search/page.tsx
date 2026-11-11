export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatFollowers, regionLabel } from '@/lib/mock-data'
import { SearchFiltersPanel } from './SearchFiltersPanel'
import type { SearchResult } from '@/types'

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    platform?: string
    region?: string
    tier?: string
    language?: string
    min_followers?: string
    max_followers?: string
    min_er?: string
    available?: string
    verified?: string
    sort?: string
    brand?: string
  }>
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-400',
  youtube:   'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
  both:      'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
}
const TIER_COLORS: Record<string, string> = {
  nano:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  micro: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  mid:   'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400',
  macro: 'bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-400',
  mega:  'bg-brand-200 text-brand-800 dark:bg-brand-900/60 dark:text-brand-300',
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const p = await searchParams
  const q            = p.q            ?? ''
  const category     = p.category     ?? ''
  const platform     = p.platform     ?? ''
  const region       = p.region       ?? ''
  const tier         = p.tier         ?? ''
  const language     = p.language     ?? ''
  const minFollowers = p.min_followers ?? ''
  const maxFollowers = p.max_followers ?? ''
  const minEr        = p.min_er        ?? ''
  const available    = p.available === '1'
  const verifiedOnly = p.verified  === '1'
  const sort         = p.sort         ?? ''
  const brand        = p.brand        ?? ''

  const supabase = await createClient()

  // Brand filter: resolve creator IDs before main query
  let brandCreatorIds: string[] | null = null
  if (brand) {
    const { data: matchingBrands } = await supabase
      .from('brands')
      .select('id')
      .ilike('name', `%${brand}%`)

    if (matchingBrands?.length) {
      const { data: matchingCollabs } = await supabase
        .from('collaborations')
        .select('creator_id')
        .in('brand_id', matchingBrands.map(b => b.id))

      brandCreatorIds = matchingCollabs
        ? [...new Set(matchingCollabs.map((c: { creator_id: string }) => c.creator_id))]
        : []
    } else {
      brandCreatorIds = [] // brand name matched nothing — force empty results
    }
  }

  // Build main query
  let query = supabase
    .from('creators')
    .select(`
      *,
      collaborations ( id, brands ( name ) )
    `)
    .limit(100)

  // Text search
  if (q.trim()) {
    query = query.or(
      `name.ilike.%${q}%,handle.ilike.%${q}%,bio.ilike.%${q}%,category.ilike.%${q}%`
    )
  }

  // Filters
  if (category)     query = query.eq('category', category)
  if (tier)         query = query.eq('pricing_tier', tier)
  if (region)       query = query.eq('region', region)
  if (language)     query = query.contains('languages', [language])
  if (available)    query = query.eq('available_for_collabs', true)
  if (verifiedOnly) query = query.eq('verified', true)
  if (minFollowers) query = query.or(`followers_instagram.gte.${minFollowers},followers_youtube.gte.${minFollowers}`)
  if (maxFollowers) query = query.or(`followers_instagram.lte.${maxFollowers},followers_youtube.lte.${maxFollowers}`)
  if (minEr)        query = query.gte('avg_engagement_rate', Number(minEr))

  if (platform && platform !== 'both') {
    query = query.or(`platform.eq.${platform},platform.eq.both`)
  } else if (platform === 'both') {
    query = query.eq('platform', 'both')
  }

  // Brand filter
  if (brandCreatorIds !== null) {
    if (brandCreatorIds.length === 0) {
      // No creators match — skip DB call and return empty
      return renderPage([], q, { category, platform, region, tier, language, minFollowers, maxFollowers, minEr, available, verified: verifiedOnly, sort, brand })
    }
    query = query.in('id', brandCreatorIds)
  }

  // Sort
  if (sort === 'engagement') {
    query = query.order('avg_engagement_rate', { ascending: false, nullsFirst: false })
  } else if (sort === 'recent') {
    query = query.order('created_at', { ascending: false })
  } else {
    // default + followers sort: verified first, then followers
    query = query
      .order('verified',              { ascending: false })
      .order('followers_instagram',   { ascending: false, nullsFirst: false })
  }

  const { data: rows, error } = await query
  if (error) console.error('[search] Supabase error:', error)

  let results: SearchResult[] = (rows ?? []).map((c) => {
    const collabs = c.collaborations ?? []
    const recentBrands = collabs
      .map((col: { brands: { name: string } | null }) => col.brands?.name)
      .filter(Boolean)
      .slice(0, 5) as string[]
    return { ...c, recent_brands: recentBrands, collab_count: collabs.length }
  })

  // Client-side sort for collab count (can't do in DB without RPC)
  if (sort === 'collabs') {
    results = results.sort((a, b) => b.collab_count - a.collab_count)
  } else if (sort === 'followers') {
    results = results.sort((a, b) =>
      (b.followers_instagram ?? 0) - (a.followers_instagram ?? 0)
    )
  }

  return renderPage(results, q, { category, platform, region, tier, language, minFollowers, maxFollowers, minEr, available, verified: verifiedOnly, sort, brand })
}

function renderPage(
  results: SearchResult[],
  q: string,
  filters: {
    category: string; platform: string; region: string; tier: string
    language: string; minFollowers: string; maxFollowers: string; minEr: string
    available: boolean; verified: boolean; sort: string; brand: string
  }
) {
  const hasFilters = Object.entries(filters).some(([k, v]) =>
    k !== 'sort' ? Boolean(v) : Boolean(v)
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <SearchFiltersPanel q={q} {...filters} />

      {/* Results summary */}
      <p className="mb-4 text-sm text-muted-foreground">
        {results.length > 0
          ? `${results.length} creator${results.length !== 1 ? 's' : ''} found${q ? ` for "${q}"` : ''}${results.length === 100 ? ' (showing top 100)' : ''}`
          : `No creators found${q ? ` for "${q}"` : ''}${hasFilters ? ' — try removing some filters' : ''}`}
      </p>

      {results.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {results.map((creator) => (
            <Link
              key={creator.id}
              href={`/creator/${creator.handle}`}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 hover:border-brand-300 hover:shadow-sm transition-all"
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
                  {creator.name?.charAt(0) ?? '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate text-sm font-semibold">{creator.name}</h3>
                    {creator.verified && (
                      <span className="shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                        Verified
                      </span>
                    )}
                    {creator.available_for_collabs && creator.claim_status === 'claimed' && (
                      <span className="shrink-0 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-950/50 dark:text-green-400">
                        Open
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">@{creator.handle}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${PLATFORM_COLORS[creator.platform]}`}>
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
                {creator.languages?.slice(0, 2).map((l: string) => (
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

              {/* Metrics row */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
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
                {creator.collab_count > 0 && (
                  <span>
                    <span className="font-semibold text-foreground">{creator.collab_count}</span> collabs
                  </span>
                )}
              </div>

              {/* Rate range (if claimed creator has rates) */}
              {(creator.rate_reel_min || creator.rate_youtube_min) && (
                <div className="flex flex-wrap gap-3 rounded-lg bg-muted/50 px-3 py-2 text-xs">
                  {creator.rate_reel_min && (
                    <span className="text-muted-foreground">
                      Reel: <span className="font-semibold text-foreground">
                        ₹{(creator.rate_reel_min / 1000).toFixed(0)}K
                        {creator.rate_reel_max ? `–₹${(creator.rate_reel_max / 1000).toFixed(0)}K` : '+'}
                      </span>
                    </span>
                  )}
                  {creator.rate_youtube_min && (
                    <span className="text-muted-foreground">
                      YT: <span className="font-semibold text-foreground">
                        ₹{(creator.rate_youtube_min / 1000).toFixed(0)}K
                        {creator.rate_youtube_max ? `–₹${(creator.rate_youtube_max / 1000).toFixed(0)}K` : '+'}
                      </span>
                    </span>
                  )}
                </div>
              )}

              {/* Recent brands */}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                  {creator.recent_brands.length > 0 ? (
                    <>
                      <span>Worked with:</span>
                      {creator.recent_brands.slice(0, 3).map((b, i) => (
                        <span key={`${b}-${i}`} className="inline-flex items-center gap-1">
                          {i > 0 && <span className="text-border">·</span>}
                          <span className="font-medium text-foreground">{b}</span>
                        </span>
                      ))}
                      {creator.recent_brands.length > 3 && (
                        <span>+{creator.recent_brands.length - 3} more</span>
                      )}
                    </>
                  ) : (
                    <span>No collabs indexed yet</span>
                  )}
                </div>
                <span className="shrink-0 text-[10px] text-brand-600 group-hover:underline">
                  Deep Scan →
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-20 text-center">
          <p className="text-sm font-medium">No creators found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try a different search term or remove some filters
          </p>
          <Link href="/search" className="mt-4 text-xs text-brand-600 hover:underline">
            Clear all and start over
          </Link>
        </div>
      )}
    </div>
  )
}
