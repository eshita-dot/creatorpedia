export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatFollowers } from '@/lib/mock-data'
import { BrandPicker } from './BrandPicker'
import { ExportButton } from './ExportButton'
import type { Brand, Creator } from '@/types'

interface ComparePageProps {
  searchParams: Promise<{ brands?: string }>
}

const BRAND_COLORS = [
  { chip: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-500', check: 'bg-violet-100 text-violet-600', label: 'text-violet-700' },
  { chip: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', check: 'bg-emerald-100 text-emerald-600', label: 'text-emerald-700' },
  { chip: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500', check: 'bg-amber-100 text-amber-600', label: 'text-amber-700' },
  { chip: 'bg-rose-100 text-rose-700 border-rose-200', dot: 'bg-rose-500', check: 'bg-rose-100 text-rose-600', label: 'text-rose-700' },
]

const TIER_COLORS: Record<string, string> = {
  nano:  'bg-gray-100 text-gray-600',
  micro: 'bg-blue-100 text-blue-700',
  mid:   'bg-green-100 text-green-700',
  macro: 'bg-brand-100 text-brand-700',
  mega:  'bg-brand-200 text-brand-800',
}

function brandSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

type CreatorRow = Creator & {
  brandIndices: number[]
  brandDates: (string | null)[]      // latest collab date per brand slot
  brandConfirmed: (boolean | null)[] // true = any collab has #ad tag or non-unknown deal type
  maxFollowers: number
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const p = await searchParams
  const rawSlugs = (p.brands ?? '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 4)

  const supabase = await createClient()

  // Resolve each slug to a brand row (case-insensitive prefix match)
  const resolved = await Promise.all(
    rawSlugs.map(async (slug) => {
      const term = slug.replace(/-/g, ' ')
      const { data } = await supabase
        .from('brands')
        .select('*')
        .ilike('name', `%${term}%`)
        .limit(5)
      if (!data?.length) return null
      return (data.find(b => b.name.toLowerCase() === term.toLowerCase()) ?? data[0]) as Brand
    })
  )

  const brands = resolved.filter((b): b is Brand => b !== null)
  const resolvedNames = rawSlugs.map((_, i) => resolved[i]?.name ?? '')

  // For each brand fetch collaborating creators + date + confirmation signal
  // All rows returned (not deduplicated) so we can check if ANY collab is confirmed
  const perBrandCreators: Map<string, { creator: Creator; latestDate: string; isConfirmed: boolean }>[] = await Promise.all(
    brands.map(async (brand) => {
      const { data } = await supabase
        .from('collaborations')
        .select('collab_date, deal_type, disclosure_tags, creators (*)')
        .eq('brand_id', brand.id)
        .order('collab_date', { ascending: false })

      const map = new Map<string, { creator: Creator; latestDate: string; isConfirmed: boolean }>()
      for (const row of data ?? []) {
        const c = row.creators as unknown as Creator | null
        if (!c?.id) continue
        const rowConfirmed =
          row.deal_type !== 'unknown' ||
          (Array.isArray(row.disclosure_tags) && row.disclosure_tags.length > 0)
        const existing = map.get(c.id)
        if (!existing) {
          map.set(c.id, { creator: c, latestDate: row.collab_date ?? '', isConfirmed: rowConfirmed })
        } else if (rowConfirmed && !existing.isConfirmed) {
          existing.isConfirmed = true
        }
      }
      return map
    })
  )

  // Build unified creator matrix
  const creatorMap = new Map<string, CreatorRow>()
  for (let i = 0; i < brands.length; i++) {
    for (const [id, { creator, latestDate, isConfirmed }] of perBrandCreators[i]) {
      const existing = creatorMap.get(id)
      if (existing) {
        existing.brandIndices.push(i)
        existing.brandDates[i] = latestDate
        existing.brandConfirmed[i] = isConfirmed
      } else {
        const brandDates: (string | null)[] = [null, null, null, null]
        const brandConfirmed: (boolean | null)[] = [null, null, null, null]
        brandDates[i] = latestDate
        brandConfirmed[i] = isConfirmed
        creatorMap.set(id, {
          ...creator,
          brandIndices: [i],
          brandDates,
          brandConfirmed,
          maxFollowers: Math.max(creator.followers_youtube ?? 0, creator.followers_instagram ?? 0),
        })
      }
    }
  }

  const allCreators = [...creatorMap.values()].sort((a, b) =>
    b.brandIndices.length !== a.brandIndices.length
      ? b.brandIndices.length - a.brandIndices.length
      : b.maxFollowers - a.maxFollowers
  )

  const sharedCreators = allCreators.filter(c => c.brandIndices.length > 1)
  const uniqueCounts = brands.map((_, i) =>
    allCreators.filter(c => c.brandIndices.length === 1 && c.brandIndices[0] === i).length
  )

  // Data for CSV export
  const exportRows = allCreators.map(c => ({
    name: c.name,
    handle: c.handle,
    platform: c.platform,
    tier: c.pricing_tier ?? '',
    maxFollowers: c.maxFollowers,
    brandPresence: brands.map((_, i) => c.brandIndices.includes(i)),
    brandDates: c.brandDates,
    brandConfirmed: c.brandConfirmed,
  }))

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/search"
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to search
        </Link>
        <h1 className="text-2xl font-bold">Competitive Intelligence</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Compare up to 4 brands — see which influencers they share and how their strategies differ.
        </p>
      </div>

      {/* Brand picker */}
      <BrandPicker currentSlugs={rawSlugs} resolvedNames={resolvedNames} />

      {brands.length === 0 && (
        <div className="mt-16 flex flex-col items-center py-12 text-center">
          <div className="mb-4 flex -space-x-2">
            {['VI', 'EM', 'AM'].map((s, i) => (
              <div key={i} className={`flex size-10 items-center justify-center rounded-full border-2 border-background text-xs font-bold ${
                i === 0 ? 'bg-violet-100 text-violet-700' :
                i === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>{s}</div>
            ))}
          </div>
          <p className="text-sm font-medium">Search for a brand to start</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try "Minimalist", "Pilgrim", or "mCaffeine"
          </p>
        </div>
      )}

      {brands.length > 0 && (
        <>
          {/* Stats bar */}
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-xl border border-border bg-card px-5 py-3 text-center">
              <p className="text-2xl font-bold">{allCreators.length}</p>
              <p className="text-xs text-muted-foreground">total creators</p>
            </div>
            {brands.length > 1 && (
              <div className="rounded-xl border border-brand-200 bg-brand-50/50 px-5 py-3 text-center dark:border-brand-800/30 dark:bg-brand-950/20">
                <p className="text-2xl font-bold text-brand-700 dark:text-brand-400">{sharedCreators.length}</p>
                <p className="text-xs text-muted-foreground">shared creators</p>
              </div>
            )}
            {brands.map((brand, i) => (
              <div key={brand.id} className={`rounded-xl border px-5 py-3 text-center ${BRAND_COLORS[i].chip}`}>
                <p className={`text-2xl font-bold ${BRAND_COLORS[i].label}`}>{uniqueCounts[i]}</p>
                <p className={`text-xs ${BRAND_COLORS[i].label} opacity-75`}>{brand.name} only</p>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            {brands.map((brand, i) => (
              <div key={brand.id} className="flex items-center gap-1.5 text-xs">
                <span className={`size-2.5 rounded-full ${BRAND_COLORS[i].dot}`} />
                <span className="font-medium">{brand.name}</span>
                <span className="text-muted-foreground">· {perBrandCreators[i].size} creator{perBrandCreators[i].size !== 1 ? 's' : ''}</span>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-violet-100 text-[10px] font-semibold text-violet-600">✓</span>
                Confirmed paid (#ad / #sponsored)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-flex size-5 items-center justify-center rounded-full border border-border bg-muted/50 text-[10px] text-muted-foreground">~</span>
                Brand mentioned (unconfirmed)
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                All creators
                {brands.length > 1 && sharedCreators.length > 0 && (
                  <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-normal text-brand-700 dark:bg-brand-950/50 dark:text-brand-400">
                    {sharedCreators.length} shared
                  </span>
                )}
              </h2>
              {allCreators.length > 0 && (
                <ExportButton rows={exportRows} brandNames={brands.map(b => b.name)} />
              )}
            </div>

            {allCreators.length === 0 ? (
              <div className="rounded-xl border border-border py-16 text-center">
                <p className="text-sm text-muted-foreground">No collaborations indexed for these brands yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">Search a creator to trigger ingest, or try different brands.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-64">Creator</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Reach</th>
                      {brands.map((brand, i) => (
                        <th key={brand.id} className="px-4 py-3 text-center text-xs font-medium min-w-[120px]">
                          <span className={`inline-flex items-center gap-1.5 ${BRAND_COLORS[i].label}`}>
                            <span className={`size-2 rounded-full ${BRAND_COLORS[i].dot}`} />
                            {brand.name}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {allCreators.map((creator) => {
                      const isShared = creator.brandIndices.length > 1
                      return (
                        <tr
                          key={creator.id}
                          className={`transition-colors hover:bg-muted/30 ${isShared ? 'bg-brand-50/40 dark:bg-brand-950/10' : ''}`}
                        >
                          {/* Creator */}
                          <td className="px-4 py-3">
                            <Link href={`/creator/${creator.handle}`} className="group flex items-center gap-2.5">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
                                {creator.name?.charAt(0) ?? '?'}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-medium group-hover:text-brand-600 transition-colors">
                                  {creator.name}
                                  {isShared && (
                                    <span className="ml-1.5 inline-flex items-center rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-medium text-brand-700 dark:bg-brand-950/50 dark:text-brand-400">
                                      {creator.brandIndices.length} brands
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground">@{creator.handle}</p>
                              </div>
                            </Link>
                          </td>

                          {/* Reach */}
                          <td className="px-4 py-3">
                            <p className="font-semibold">
                              {creator.maxFollowers > 0 ? formatFollowers(creator.maxFollowers) : '—'}
                            </p>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground">
                                {creator.platform === 'instagram' ? 'IG' : creator.platform === 'youtube' ? 'YT' : 'IG+YT'}
                              </span>
                              {creator.pricing_tier && (
                                <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium capitalize ${TIER_COLORS[creator.pricing_tier] ?? ''}`}>
                                  {creator.pricing_tier}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Brand presence columns */}
                          {brands.map((brand, i) => (
                            <td key={brand.id} className="px-4 py-3 text-center">
                              {creator.brandIndices.includes(i) ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  {creator.brandConfirmed[i] ? (
                                    <span className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold ${BRAND_COLORS[i].check}`}>
                                      ✓
                                    </span>
                                  ) : (
                                    <span className="inline-flex size-6 items-center justify-center rounded-full border border-border bg-muted/50 text-xs text-muted-foreground">
                                      ~
                                    </span>
                                  )}
                                  {creator.brandDates[i] && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {fmtDate(creator.brandDates[i]!)}
                                    </span>
                                  )}
                                  <span className={`text-[9px] font-medium px-1 py-0.5 rounded ${
                                    creator.brandConfirmed[i]
                                      ? 'bg-green-50 text-green-600'
                                      : 'bg-muted text-muted-foreground'
                                  }`}>
                                    {creator.brandConfirmed[i] ? 'paid' : 'mention'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground/25 text-lg">·</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Data sourced from ASCI-mandated disclosures (#ad, #sponsored) and YouTube API. Shared creators are highlighted.
          </p>
        </>
      )}
    </div>
  )
}
