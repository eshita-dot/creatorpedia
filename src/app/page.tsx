export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { Search, Zap, Shield, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

const CATEGORIES = ['Beauty', 'Fashion', 'Finance', 'Food', 'Fitness', 'Tech', 'Travel', 'Gaming']
const PLATFORMS = ['Instagram', 'YouTube', 'Both']
const REGIONS = ['Pan-India', 'North India', 'South India', 'West India', 'East India']

async function handleSearch(formData: FormData) {
  'use server'
  const q = formData.get('q') as string
  if (!q?.trim()) return
  const params = new URLSearchParams({ q: q.trim() })
  const category = formData.get('category') as string
  const platform = formData.get('platform') as string
  const region = formData.get('region') as string
  if (category) params.set('category', category.toLowerCase())
  if (platform) params.set('platform', platform.toLowerCase())
  if (region) params.set('region', region.toLowerCase().replace(' ', '-'))
  redirect(`/search?${params.toString()}`)
}

export default async function HomePage() {
  const supabase = await createClient()
  const [{ count: creatorCount }, { count: collabCount }, { count: brandCount }] =
    await Promise.all([
      supabase.from('creators').select('*', { count: 'exact', head: true }),
      supabase.from('collaborations').select('*', { count: 'exact', head: true }),
      supabase.from('brands').select('*', { count: 'exact', head: true }),
    ])
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-amber-50/60 to-background dark:from-amber-950/20" />

        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/50 dark:text-amber-400">
          <Zap className="size-3" />
          India&apos;s first influencer intelligence database
        </div>

        <h1 className="mb-3 text-center text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          Find any creator.{' '}
          <span className="text-amber-500">Every brand deal.</span>
        </h1>
        <p className="mb-8 max-w-xl text-center text-base text-muted-foreground sm:text-lg">
          Search Indian influencers and creators. See their full brand collaboration history,
          deal types, and estimated pricing — in seconds.
        </p>

        {/* Search form */}
        <form action={handleSearch} className="w-full max-w-2xl">
          <div className="flex gap-2 rounded-xl border border-border bg-background p-1.5 shadow-sm ring-1 ring-amber-500/10 focus-within:ring-amber-500/30 transition-all">
            <Search className="ml-2 mt-2.5 size-4 shrink-0 text-muted-foreground" />
            <input
              name="q"
              type="text"
              placeholder="Search by creator name, handle, brand, or niche…"
              className="flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              Search
            </button>
          </div>

          {/* Filter pills */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Filter:</span>
            <select
              name="category"
              className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c.toLowerCase()}>{c}</option>
              ))}
            </select>
            <select
              name="platform"
              className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none"
            >
              <option value="">All Platforms</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p.toLowerCase()}>{p}</option>
              ))}
            </select>
            <select
              name="region"
              className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none"
            >
              <option value="">All Regions</option>
              {REGIONS.map((r) => (
                <option key={r} value={r.toLowerCase().replace(' ', '-')}>{r}</option>
              ))}
            </select>
          </div>
        </form>

        {/* Trending searches */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-muted-foreground">Trending:</span>
          {['skincare reels south india', 'finance youtubers', 'mumbai food bloggers', 'hindi tech reviews'].map((q) => (
            <a
              key={q}
              href={`/search?q=${encodeURIComponent(q)}`}
              className="rounded-full border border-border px-3 py-1 text-muted-foreground hover:border-amber-300 hover:text-amber-600 transition-colors"
            >
              {q}
            </a>
          ))}
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto grid max-w-4xl grid-cols-3 divide-x divide-border">
          {[
            { label: 'Creators Indexed', value: (creatorCount ?? 0).toLocaleString('en-IN') },
            { label: 'Brand Collabs Tracked', value: (collabCount ?? 0).toLocaleString('en-IN') },
            { label: 'Indian Brands in DB', value: (brandCount ?? 0).toLocaleString('en-IN') },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center py-5 px-4">
              <span className="text-2xl font-bold text-amber-500">{s.value}</span>
              <span className="mt-0.5 text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="mb-10 text-center text-xl font-bold">Built for serious MarTech teams</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: Search,
              title: 'Deep-scan any creator',
              body: "See every brand they've worked with, the deal type (paid/barter/gifted), approximate date, and the original disclosure post.",
            },
            {
              icon: TrendingUp,
              title: 'Pricing intelligence',
              body: 'Know their tier (nano → mega), estimated reel rate, and how their rate has shifted — before you send that first DM.',
            },
            {
              icon: Shield,
              title: 'Legally sourced data',
              body: 'All data comes from ASCI-mandated public disclosures, official YouTube/Meta APIs, and creator-verified opt-in — no scraping.',
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border p-5">
              <f.icon className="mb-3 size-5 text-amber-500" />
              <h3 className="mb-1.5 text-sm font-semibold">{f.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
