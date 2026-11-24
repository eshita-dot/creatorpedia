'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BarChart2, Search, Users, FileDown, CheckCircle2, Lock } from 'lucide-react'

const FEATURES = [
  {
    icon: Search,
    title: 'Full collaboration history',
    desc: 'Look up any creator and see every brand they\'ve worked with — deal type, date, and whether it was paid or organic.',
  },
  {
    icon: BarChart2,
    title: 'Competitive intelligence',
    desc: 'Compare up to 4 brands side by side. See which creators overlap, and how strategies differ.',
  },
  {
    icon: Users,
    title: 'Brand creator rosters',
    desc: 'See every creator who has ever worked with a brand. Tier mix, category breakdown, avg engagement — all in one view.',
  },
  {
    icon: FileDown,
    title: 'CSV export',
    desc: 'Download any analysis as a CSV. Ready for client decks, reports, or your own tools.',
  },
]

export default function EarlyAccessPage() {
  const [form, setForm] = useState({ name: '', agency_name: '', email: '', use_case: '' })
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setErrorMsg(data.error ?? 'Something went wrong'); setState('error'); return }
      setState('done')
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setState('error')
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">

      {/* Hero */}
      <div className="mb-16 text-center">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          <Lock className="size-3" />
          Early Access — 10 spots only
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl leading-tight">
          Every Indian creator.{' '}
          <span className="text-brand-600">Every brand deal.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base text-muted-foreground leading-relaxed">
          Search any creator and instantly see who they&apos;ve worked with,
          what was paid, and what wasn&apos;t. Full access, unlimited lookups.
        </p>
      </div>

      {/* Features */}
      <div className="mb-16 grid gap-4 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-brand-50">
              <Icon className="size-4 text-brand-600" />
            </div>
            <h3 className="mb-1.5 text-sm font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Pricing + form */}
      <div className="grid gap-8 sm:grid-cols-2">

        {/* Pricing */}
        <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Early Access</p>
          <div className="mt-4 flex items-end gap-1.5">
            <span className="text-5xl font-bold tracking-tight">₹1,499</span>
            <span className="mb-2 text-sm text-muted-foreground">/month</span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">Full price will be ₹2,999/month at launch</p>

          <ul className="mt-6 space-y-3">
            {[
              'Unlimited creator lookups',
              'Full brand collaboration history',
              'Compare up to 4 brands',
              'CSV export',
              'Weekly data refresh',
              'Early access to new features',
            ].map(item => (
              <li key={item} className="flex items-center gap-2.5 text-xs">
                <CheckCircle2 className="size-3.5 shrink-0 text-brand-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
            <p className="text-[11px] text-amber-700 leading-relaxed">
              First cohort is capped at 10 spots. We review each application personally.
            </p>
          </div>
        </div>

        {/* Form */}
        <div>
          {state === 'done' ? (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
              <CheckCircle2 className="mb-4 size-10 text-green-500" />
              <h3 className="text-base font-semibold text-green-800">You&apos;re on the list!</h3>
              <p className="mt-2 text-sm text-green-700 leading-relaxed">
                We&apos;ll review your application and reach out within 48 hours if you&apos;re selected.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-6 text-sm font-semibold">Request early access</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Your name</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Priya Sharma"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Company / agency name</label>
                  <input
                    required
                    value={form.agency_name}
                    onChange={e => setForm(f => ({ ...f, agency_name: e.target.value }))}
                    placeholder="Your company"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Work email</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@company.com"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    How would you use this?{' '}
                    <span className="font-normal text-muted-foreground/60">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={form.use_case}
                    onChange={e => setForm(f => ({ ...f, use_case: e.target.value }))}
                    placeholder="e.g. Competitive research, vetting creators before pitching…"
                    className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-400 transition-colors"
                  />
                </div>
              </div>

              {state === 'error' && (
                <p className="mt-3 text-xs text-red-600">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={state === 'loading'}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
              >
                {state === 'loading' ? 'Submitting…' : (
                  <>Request Early Access <ArrowRight className="size-3.5" /></>
                )}
              </button>

              <p className="mt-4 text-center text-[11px] text-muted-foreground">
                Already approved?{' '}
                <Link href="/subscribe" className="text-brand-600 hover:underline">
                  Subscribe here →
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
