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
  instagram: 'bg-pink-100 text-pink-700',
  youtube:   'bg-red-100 text-red-700',
  both:      'bg-purple-100 text-purple-700',
}

const TIER_COLORS: Record<string, string> = {
  nano:  'bg-gray-200',
  micro: 'bg-blue-300',
  mid:   'bg-green-300',
  macro: 'bg-brand-400',
  mega:  'bg-brand-600',
}

const TIER_LABEL_COLORS: Record<string, string> = {
  nano:  'bg-gray-100 text-gray-600',
  micro: 'bg-blue-100 text-blue-700',
  mid:   'bg-green-100 text-green-700',
  macro: 'bg-brand-100 text-brand-700',
  mega:  'bg-brand-200 text-brand-800',
}

const TIERS = ['mega', 'macro', 'mid', 'micro', 'nano']

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

type CreatorWithBrandCollabs = Creator & {
  collab_count_brand: number
  last_collab_date: string
  deal_types: string[]
  is_confirmed: boolean
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
    const rowConfirmed =
      row.deal_type !== 'unknown' ||
      (Array.isArray(row.disclosure_tags) && row.disclosure_tags.length > 0)
    const existing = creatorMap.get(creator.id)
    if (existing) {
      existing.collab_count_brand++
      if (!existing.deal_types.includes(row.deal_type)) existing.deal_types.push(row.deal_type)
      if (rowConfirmed) existing.is_confirmed = true
    } else {
      creatorMap.set(creator.id, {
        ...creator,
        collab_count_brand: 1,
        last_collab_date: row.collab_date,
        deal_types: [row.deal_type],
        is_confirmed: rowConfirmed,
      })
    }
  }

  const creators = [...creatorMap.values()].sort(
    (a, b) =>
      Math.max(b.followers_youtube ?? 0, b.followers_instagram ?? 0) -
      Math.max(a.followers_youtube ?? 0, a.followers_instagram ?? 0)
  )

  const totalCollabs = collabRows.length
  const dateRange =
    collabRows.length > 0
      ? { from: collabRows[collabRows.length - 1].collab_date, to: collabRows[0].collab_date }
      : null

  // ── Stats ────────────────────────────────────────────────────────────────────
  const confirmedCount = creators.filter(c => c.is_confirmed).length

  const erValues = creators
    .map(c => c.avg_engagement_rate)
    .filter((v): v is number => v != null && v > 0)
  const avgER = erValues.length
    ? parseFloat((erValues.reduce((s, v) => s + v, 0) / erValues.length).toFixed(2))
    : null

  const reachValues = creators.map(c =>
    Math.max(c.followers_youtube ?? 0, c.followers_instagram ?? 0)
  ).filter(v => v > 0)
  const avgReach = reachValues.length
    ? Math.round(reachValues.reduce((s, v) => s + v, 0) / reachValues.length)
    : null

  const platformCounts: Record<string, number> = { instagram: 0, youtube: 0, both: 0 }
  for (const c of creators) platformCounts[c.platform] = (platformCounts[c.platform] ?? 0) + 1

  // ── Tier breakdown ───────────────────────────────────────────────────────────
  const tierCounts: Record<string, number> = {}
  for (const c of creators) {
    const t = c.pricing_tier ?? 'nano'
    tierCounts[t] = (tierCounts[t] ?? 0) + 1
  }

  // ── Category breakdown ───────────────────────────────────────────────────────
  const categoryCounts: Record<string, number> = {}
  for (const c of creators) {
    const cat = c.category ?? 'lifestyle'
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1
  }
  const sortedCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])

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
      <div className="mb-6 flex items-start gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-xl font-bold text-slate-600 shadow-sm">
          {brand.name.substring(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold">{brand.name}</h1>
            {brand.is_d2c && (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
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
        </div>
      </div>

      {/* Stats strip */}
      {creators.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Avg Engagement Rate</p>
            <p className="mt-1 text-2xl font-bold">
              {avgER != null ? `${avgER}%` : '—'}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">across {erValues.length} creators</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Avg Creator Reach</p>
            <p className="mt-1 text-2xl font-bold">
              {avgReach != null ? formatFollowers(avgReach) : '—'}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">followers per creator</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Confirmed Paid Deals</p>
            <p className="mt-1 text-2xl font-bold">
              {creators.length > 0
                ? `${Math.round((confirmedCount / creators.length) * 100)}%`
                : '—'}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{confirmedCount} of {creators.length} creators</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Platform Mix</p>
            <p className="mt-1 text-2xl font-bold">{platformCounts.instagram + platformCounts.both} IG</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{platformCounts.youtube + platformCounts.both} YT · {platformCounts.both} both</p>
          </div>
        </div>
      )}

      {/* Tier breakdown */}
      {creators.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Creator Tier Mix</p>
          {/* Proportional bar */}
          <div className="flex h-3 w-full overflow-hidden rounded-full gap-px">
            {TIERS.filter(t => tierCounts[t]).map(tier => (
              <div
                key={tier}
                className={`${TIER_COLORS[tier]} transition-all`}
                style={{ width: `${((tierCounts[tier] ?? 0) / creators.length) * 100}%` }}
                title={`${tier}: ${tierCounts[tier]}`}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {TIERS.filter(t => tierCounts[t]).map(tier => (
              <span key={tier} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${TIER_LABEL_COLORS[tier]}`}>
                {tier}
                <span className="ml-0.5 opacity-70">×{tierCounts[tier]}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {sortedCategories.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Creator Categories</p>
          <div className="flex flex-wrap gap-2">
            {sortedCategories.map(([cat, count]) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs capitalize"
              >
                {cat}
                <span className="ml-0.5 font-semibold text-foreground">×{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

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
                      <span className="shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">@{creator.handle}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${PLATFORM_COLORS[creator.platform]}`}>
                    {creator.platform === 'both' ? 'IG + YT' : creator.platform === 'instagram' ? 'Instagram' : 'YouTube'}
                  </span>
                  {creator.is_confirmed && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                      ✓ paid
                    </span>
                  )}
                </div>
              </div>

              {/* Metrics */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {creator.followers_instagram != null && creator.followers_instagram > 0 && (
                  <span>
                    <span className="font-semibold text-foreground">{formatFollowers(creator.followers_instagram)}</span> IG
                  </span>
                )}
                {creator.followers_youtube != null && creator.followers_youtube > 0 && (
                  <span>
                    <span className="font-semibold text-foreground">{formatFollowers(creator.followers_youtube)}</span> YT
                  </span>
                )}
                {creator.avg_views != null && creator.avg_views > 0 && (
                  <span>
                    <span className="font-semibold text-foreground">{formatFollowers(creator.avg_views)}</span> avg views
                  </span>
                )}
                {creator.avg_engagement_rate != null && creator.avg_engagement_rate > 0 && (
                  <span>
                    <span className="font-semibold text-foreground">{creator.avg_engagement_rate}%</span> ER
                  </span>
                )}
                {creator.pricing_tier && (
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium capitalize ${TIER_LABEL_COLORS[creator.pricing_tier]}`}>
                    {creator.pricing_tier}
                  </span>
                )}
              </div>

              {/* Brand collab summary */}
              <div className="flex items-center justify-between rounded-lg bg-brand-50/50 px-3 py-2 text-xs">
                <span className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{creator.collab_count_brand}</span>{' '}
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
        #collab), YouTube Data API v3, and creator-verified opt-in. We do not scrape private data.
      </div>
    </div>
  )
}
