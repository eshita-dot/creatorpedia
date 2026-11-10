'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, X } from 'lucide-react'

const CATEGORIES = [
  'beauty', 'fashion', 'finance', 'food', 'fitness',
  'tech', 'travel', 'gaming', 'entertainment', 'lifestyle', 'parenting',
]
const REGIONS = [
  { value: 'pan-india', label: 'Pan India' },
  { value: 'north-india', label: 'North India' },
  { value: 'south-india', label: 'South India' },
  { value: 'west-india', label: 'West India' },
  { value: 'east-india', label: 'East India' },
]
const TIERS: { value: string; label: string; range: string }[] = [
  { value: 'nano',  label: 'Nano',  range: '<10K'      },
  { value: 'micro', label: 'Micro', range: '10K–100K'  },
  { value: 'mid',   label: 'Mid',   range: '100K–500K' },
  { value: 'macro', label: 'Macro', range: '500K–1M'   },
  { value: 'mega',  label: 'Mega',  range: '>1M'       },
]
const LANGUAGES = [
  'Hindi', 'English', 'Tamil', 'Telugu', 'Kannada',
  'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Malayalam',
]
const SORT_OPTIONS = [
  { value: '',           label: 'Default (Verified first)' },
  { value: 'followers',  label: 'Most Followers'           },
  { value: 'engagement', label: 'Highest Engagement Rate'  },
  { value: 'collabs',    label: 'Most Brand Collabs'       },
  { value: 'recent',     label: 'Recently Added'           },
]

export interface FilterProps {
  q: string
  category: string
  platform: string
  region: string
  tier: string
  language: string
  minFollowers: string
  maxFollowers: string
  minEr: string
  available: boolean
  verified: boolean
  sort: string
  brand: string
}

export function SearchFiltersPanel(props: FilterProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // Local state for text/number inputs — commit on blur or Enter
  const [q,            setQ]            = useState(props.q)
  const [minFollowers, setMinFollowers] = useState(props.minFollowers)
  const [maxFollowers, setMaxFollowers] = useState(props.maxFollowers)
  const [minEr,        setMinEr]        = useState(props.minEr)
  const [brand,        setBrand]        = useState(props.brand)

  // The single source of truth for "what's in the URL right now" (props),
  // merged with current local text values and any override.
  function push(override: Partial<Record<keyof FilterProps, string | boolean | null>>) {
    const merged: Record<string, string | boolean | null> = {
      q,
      category:    props.category,
      platform:    props.platform,
      region:      props.region,
      tier:        props.tier,
      language:    props.language,
      minFollowers,
      maxFollowers,
      minEr,
      available:   props.available,
      verified:    props.verified,
      sort:        props.sort,
      brand,
      ...override,
    }

    const sp = new URLSearchParams()
    const KEY_MAP: Record<string, string> = {
      minFollowers: 'min_followers',
      maxFollowers: 'max_followers',
      minEr:        'min_er',
    }
    for (const [k, v] of Object.entries(merged)) {
      const urlKey = KEY_MAP[k] ?? k
      if (v === null || v === false || v === '') continue
      sp.set(urlKey, v === true ? '1' : String(v))
    }
    router.push(`/search?${sp.toString()}`)
  }

  const activeCount = [
    props.category, props.platform, props.region, props.tier,
    props.language, props.minFollowers, props.maxFollowers, props.minEr,
    props.available ? '1' : '', props.verified ? '1' : '', props.sort, props.brand,
  ].filter(Boolean).length

  const CHIP_LABELS: { key: keyof FilterProps; label: (v: string | boolean) => string }[] = [
    { key: 'platform',    label: v => v === 'both' ? 'IG + YT' : String(v) },
    { key: 'category',    label: v => String(v) },
    { key: 'region',      label: v => REGIONS.find(r => r.value === v)?.label ?? String(v) },
    { key: 'tier',        label: v => `${String(v).charAt(0).toUpperCase() + String(v).slice(1)} tier` },
    { key: 'language',    label: v => String(v) },
    { key: 'minFollowers',label: v => `≥${Number(v).toLocaleString('en-IN')} followers` },
    { key: 'maxFollowers',label: v => `≤${Number(v).toLocaleString('en-IN')} followers` },
    { key: 'minEr',       label: v => `≥${v}% ER` },
    { key: 'available',   label: () => 'Open to collabs' },
    { key: 'verified',    label: () => 'Verified only' },
    { key: 'sort',        label: v => SORT_OPTIONS.find(s => s.value === v)?.label ?? String(v) },
    { key: 'brand',       label: v => `Brand: ${v}` },
  ]

  return (
    <div className="mb-6 space-y-3">
      {/* Search bar row */}
      <div className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-brand-500/40">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && push({})}
            placeholder="Search creators, brands, niches…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {q && (
            <button type="button" onClick={() => { setQ(''); push({ q: null }) }}>
              <X className="size-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => push({})}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            open
              ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400'
              : 'border-border hover:border-brand-300 text-foreground'
          }`}
        >
          <SlidersHorizontal className="size-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white leading-none">
              {activeCount}
            </span>
          )}
          {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
      </div>

      {/* Active filter chips (when panel is closed) */}
      {!open && activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {CHIP_LABELS.map(({ key, label }) => {
            const val = props[key]
            if (!val) return null
            return (
              <span
                key={key}
                className="flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs capitalize"
              >
                {label(val as string)}
                <button
                  type="button"
                  onClick={() => push({ [key]: null } as Partial<Record<keyof FilterProps, null>>)}
                  className="ml-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-2.5" />
                </button>
              </span>
            )
          })}
          <button
            type="button"
            onClick={() => router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search')}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Filter panel */}
      {open && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-5 shadow-sm">

          {/* Row 1: Platform + Category + Region */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="mb-1.5 text-xs font-medium">Platform</p>
              <div className="flex gap-1.5">
                {([['', 'All'], ['instagram', 'Instagram'], ['youtube', 'YouTube']] as [string, string][]).map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => push({ platform: v || null })}
                    className={`flex-1 rounded-md border py-1.5 text-xs font-medium transition-colors ${
                      props.platform === v || (!props.platform && v === '')
                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400'
                        : 'border-border hover:border-brand-300'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium">Category</label>
              <select
                value={props.category}
                onChange={e => push({ category: e.target.value || null })}
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/40"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium">Region</label>
              <select
                value={props.region}
                onChange={e => push({ region: e.target.value || null })}
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/40"
              >
                <option value="">All Regions</option>
                {REGIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Creator Tier pills */}
          <div>
            <p className="mb-1.5 text-xs font-medium">Creator Tier</p>
            <div className="flex flex-wrap gap-2">
              {TIERS.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => push({ tier: props.tier === t.value ? null : t.value })}
                  className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                    props.tier === t.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400'
                      : 'border-border hover:border-brand-300'
                  }`}
                >
                  {t.label} <span className="text-muted-foreground">({t.range})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Followers range + Min ER */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-xs font-medium">Followers (Instagram)</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={minFollowers}
                  onChange={e => setMinFollowers(e.target.value)}
                  onBlur={() => push({ minFollowers: minFollowers || null })}
                  onKeyDown={e => e.key === 'Enter' && push({ minFollowers: minFollowers || null })}
                  className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/40"
                />
                <span className="shrink-0 text-xs text-muted-foreground">–</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={maxFollowers}
                  onChange={e => setMaxFollowers(e.target.value)}
                  onBlur={() => push({ maxFollowers: maxFollowers || null })}
                  onKeyDown={e => e.key === 'Enter' && push({ maxFollowers: maxFollowers || null })}
                  className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/40"
                />
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium">Min. Engagement Rate</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 3.5"
                  value={minEr}
                  onChange={e => setMinEr(e.target.value)}
                  onBlur={() => push({ minEr: minEr || null })}
                  onKeyDown={e => e.key === 'Enter' && push({ minEr: minEr || null })}
                  className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/40"
                />
                <span className="shrink-0 text-xs text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          {/* Row 4: Language + Brand + Sort */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium">Language</label>
              <select
                value={props.language}
                onChange={e => push({ language: e.target.value || null })}
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/40"
              >
                <option value="">Any Language</option>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium">Worked with Brand</label>
              <input
                type="text"
                placeholder="e.g. Mamaearth, Nykaa"
                value={brand}
                onChange={e => setBrand(e.target.value)}
                onBlur={() => push({ brand: brand || null })}
                onKeyDown={e => e.key === 'Enter' && push({ brand: brand || null })}
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/40"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium">Sort By</label>
              <select
                value={props.sort}
                onChange={e => push({ sort: e.target.value || null })}
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/40"
              >
                {SORT_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 5: Toggles + Clear */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-1 border-t border-border">
            <div className="flex flex-wrap gap-5">
              <FilterToggle
                label="Open to collabs"
                active={props.available}
                onClick={() => push({ available: props.available ? null : true })}
              />
              <FilterToggle
                label="Verified only"
                active={props.verified}
                onClick={() => push({ verified: props.verified ? null : true })}
              />
            </div>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search')}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function FilterToggle({
  label, active, onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 text-xs font-medium transition-colors ${
        active ? 'text-brand-700 dark:text-brand-400' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <span
        className={`relative h-4 w-7 rounded-full transition-colors ${
          active ? 'bg-brand-600' : 'bg-muted-foreground/30'
        }`}
      >
        <span
          className={`absolute top-0.5 size-3 rounded-full bg-white shadow-sm transition-transform ${
            active ? 'translate-x-3.5' : 'translate-x-0.5'
          }`}
        />
      </span>
      {label}
    </button>
  )
}
