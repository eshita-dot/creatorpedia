export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Search, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { BrandSearchInput } from '@/components/search/BrandSearchInput'

const CATEGORIES = ['Beauty', 'Fashion', 'Finance', 'Food', 'Fitness', 'Tech', 'Travel', 'Gaming', 'Automobile']

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
      <section className="relative flex flex-col items-center justify-center px-4 pt-24 pb-20 sm:pt-32 sm:pb-24 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(124,58,237,0.08),transparent)]" />

        <h1 className="mb-5 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]">
          Every Indian creator.{' '}
          <span className="text-brand-600">Every brand deal.</span>
        </h1>

        <p className="mb-10 max-w-lg text-base text-muted-foreground sm:text-lg leading-relaxed">
          Search any creator and instantly see who they&apos;ve worked with,
          what was paid, and what wasn&apos;t.
        </p>

        {/* Search */}
        <form method="GET" action="/search" className="w-full max-w-2xl">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 shadow-md ring-1 ring-brand-500/10 focus-within:ring-2 focus-within:ring-brand-500/30 transition-all">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              name="q"
              type="text"
              placeholder="Search by creator, brand, or niche…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
            >
              Search
            </button>
          </div>

          <div className="mt-3 hidden items-center gap-3 sm:flex">
            <span className="text-xs text-muted-foreground">Browse by:</span>
            {CATEGORIES.map((c) => (
              <a
                key={c}
                href={`/search?category=${c.toLowerCase()}`}
                className="text-xs text-muted-foreground hover:text-brand-600 transition-colors"
              >
                {c}
              </a>
            ))}
          </div>
        </form>

      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/20">
        <div className="mx-auto grid max-w-3xl grid-cols-3 divide-x divide-border">
          {[
            { label: 'Creators indexed', value: (creatorCount ?? 0).toLocaleString('en-IN') },
            { label: 'Brand collabs tracked', value: (collabCount ?? 0).toLocaleString('en-IN') },
            { label: 'Indian brands', value: (brandCount ?? 0).toLocaleString('en-IN') },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center py-6 px-4">
              <span className="text-2xl font-bold text-brand-600">{s.value}</span>
              <span className="mt-1 text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* What you get */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Stop guessing. Start knowing.</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Everything you need to research creators and brands — in one place.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
            {/* Full collab history */}
          <div className="group flex flex-col rounded-2xl border border-border bg-card p-6 hover:border-brand-200 hover:shadow-sm transition-all">
            <h3 className="mb-2 text-sm font-semibold">Full collab history</h3>
            <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
              See every brand a creator has worked with — deal type, date, and whether it was paid or organic. No more manual scrolling.
            </p>
            <Link
              href="/search"
              className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
            >
              Search creators
              <ArrowRight className="size-3" />
            </Link>
          </div>

          {/* Brand intelligence — live search */}
          <div className="flex flex-col rounded-2xl border border-border bg-card p-6 hover:border-brand-200 hover:shadow-sm transition-all">
            <h3 className="mb-2 text-sm font-semibold">Brand intelligence</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Look up any brand and see their full creator roster — tier mix, category breakdown, and avg engagement rate.
            </p>
            <BrandSearchInput />
          </div>

          {/* Competitive comparison */}
          <div className="group flex flex-col rounded-2xl border border-border bg-card p-6 hover:border-brand-200 hover:shadow-sm transition-all">
            <h3 className="mb-2 text-sm font-semibold">Competitive comparison</h3>
            <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
              Compare up to 4 brands side by side. See which creators they share and how their strategies differ.
            </p>
            <Link
              href="/compare"
              className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
            >
              Compare brands
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="border-t border-border bg-muted/20">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-14 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-base font-semibold">Want full access?</p>
            <p className="mt-1 text-sm text-muted-foreground">Early access open to 10 agencies. ₹1,499/month.</p>
          </div>
          <Link
            href="/early-access"
            className="shrink-0 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Apply for early access
          </Link>
        </div>
      </section>

    </div>
  )
}
