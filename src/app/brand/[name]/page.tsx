export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatFollowers } from '@/lib/mock-data'
import type { Creator, Brand } from '@/types'

interface BrandPageProps {
  params: Promise<{ name: string }>
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

type CreatorWithBrandCollabs = Creator & {
  collab_count_brand: number
  last_collab_date: string
  deal_types: string[]
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { name: rawSlug } = await params
  const searchTerm = rawSlug.replace(/-/g, ' ')
  const supabase = await createClient()

  const { data: brandRows } = await supabase
    .from('brands')
    .select('*')
    .ilike('name', `%${searchTerm}%`)

  if (!brandRows?.length) notFound()

  // Prefer exact match (case-insensitive), otherwise take first
  const brand = (brandRows.find(
    (b) => b.name.toLowerCase() === searchTerm.toLowerCase()
  ) ?? brandRows[0]) as Brand

  const { data: collabRows } = await supabase
    .from('collaborations')
    .select('*, creators (*)')
    .eq('brand_id', brand.id)
    .order('collab_date', { ascending: false })

  if (!collabRows) notFound()

  // Group collabs by creator
  const creatorMap = new Map<string, CreatorWithBrandCollabs>()
  for (const row of collabRows) {
    if (!row.creators) continue
    const creator = row.creators as Creator
    const existing = creatorMap.get(creator.id)
    if (existing) {
      existing.collab_count_brand++
      if (!existing.deal_types.includes(row.deal_type)) {
        existing.deal_types.push(row.deal_type)
      }
    } else {
      creatorMap.set(creator.id, {
        ...creator,
        collab_count_brand: 1,
        last_collab_date: row.collab_date,
        deal_types: [row.deal_type],
      })
    }
  }

  const creators = [...creatorMap.values()].sort(
    (a, b) =>
      Math.max(b.followers_youtube ?? 0, b.followers_instagram ?? 0) -
      Math.max(a.followers_youtube ?? 0, a.followers_instagram ?? 0)
  )

  const totalCollabs = collabRows.length

  const dealTypeCounts: Record<string, number> = {}
  for (const row of collabRows) {
    dealTypeCounts[row.deal_type] = (dealTypeCounts[row.deal_type] ?? 0) + 1
  }

  const dateRange =
    collabRows.length > 0
      ? {
          from: collabRows[collabRows.length - 1].collab_date,
          to: collabRows[0].collab_date,
        }
      : null

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href="/search"
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Back to search
      </Link>

      {/* Brand header */}
      <div className="mb-8 flex items-start gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-xl font-bold text-slate-600 shadow-sm dark:from-slate-800 dark:to-slate-700 dark:text-slate-300">
          {brand.name.substring(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold">{brand.name}</h1>
            {brand.is_d2c && (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-950/50 dark:text-brand-400">
                D2C
              </span>
            )}
            {brand.category && (
              <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs capitalize">
                {brand.category}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {creators.length} creator{creators.length !== 1 ? 's' : ''}
            {' · '}
            {totalCollabs} collab{totalCollabs !== 1 ? 's' : ''} indexed
            {dateRange && ` · ${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}`}
          </p>
          {Object.keys(dealTypeCounts).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(dealTypeCounts).map(([type, count]) => (
                <span
                  key={type}
                  className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] capitalize"
                >
                  {type} ×{count}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Creators section */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          Creators who worked with {brand.name}
          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
            {creators.length}
          </span>
        </h2>
        <span className="text-xs text-muted-foreground">
          Sourced from ASCI disclosures + YouTube API
        </span>
      </div>

      {creators.length === 0 ? (
        <div className="rounded-xl border border-border py-16 text-center">
          <p className="text-sm font-medium">No collaborations indexed yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Data is updated daily from public disclosures.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {creators.map((creator) => (
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
                  </div>
                  <p className="text-xs text-muted-foreground">@{creator.handle}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${PLATFORM_COLORS[creator.platform]}`}
                >
                  {creator.platform === 'both'
                    ? 'IG + YT'
                    : creator.platform === 'instagram'
                    ? 'Instagram'
                    : 'YouTube'}
                </span>
              </div>

              {/* Metrics */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                {creator.followers_instagram && (
                  <span>
                    <span className="font-semibold text-foreground">
                      {formatFollowers(creator.followers_instagram)}
                    </span>{' '}
                    IG
                  </span>
                )}
                {creator.followers_youtube && (
                  <span>
                    <span className="font-semibold text-foreground">
                      {formatFollowers(creator.followers_youtube)}
                    </span>{' '}
                    YT
                  </span>
                )}
                {creator.avg_views && (
                  <span>
                    <span className="font-semibold text-foreground">
                      {formatFollowers(creator.avg_views)}
                    </span>{' '}
                    avg views
                  </span>
                )}
                {creator.avg_engagement_rate && (
                  <span>
                    <span className="font-semibold text-foreground">
                      {creator.avg_engagement_rate}%
                    </span>{' '}
                    ER
                  </span>
                )}
                {creator.pricing_tier && (
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-medium capitalize ${TIER_COLORS[creator.pricing_tier]}`}
                  >
                    {creator.pricing_tier}
                  </span>
                )}
              </div>

              {/* Brand collab summary */}
              <div className="flex items-center justify-between rounded-lg bg-brand-50/50 px-3 py-2 text-xs dark:bg-brand-950/20">
                <span className="text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {creator.collab_count_brand}
                  </span>{' '}
                  collab{creator.collab_count_brand !== 1 ? 's' : ''} with {brand.name}
                  {creator.deal_types.filter((d) => d !== 'unknown').length > 0 && (
                    <span className="ml-1 capitalize">
                      · {creator.deal_types.filter((d) => d !== 'unknown').join(', ')}
                    </span>
                  )}
                </span>
                <span className="text-muted-foreground/70">
                  Last: {formatDate(creator.last_collab_date)}
                </span>
              </div>

              <div className="flex justify-end">
                <span className="text-[10px] text-brand-600 group-hover:underline">
                  View Full Profile →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <strong>Data sources:</strong> ASCI-mandated public disclosures (#ad, #sponsored,
        #collab), YouTube Data API v3, and creator-verified opt-in. We do not scrape private
        data.
      </div>
    </div>
  )
}
