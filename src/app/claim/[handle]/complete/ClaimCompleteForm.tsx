'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, IndianRupee } from 'lucide-react'
import type { Creator } from '@/types'

const DEAL_TYPES = ['Paid', 'Barter', 'Gifted']

export function ClaimCompleteForm({ creator, userEmail }: { creator: Creator; userEmail: string }) {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: creator.name ?? '',
    bio: creator.bio ?? '',
    contact_email: userEmail,
    instagram_handle: creator.instagram_handle ?? '',
    rate_reel_min: creator.rate_reel_min?.toString() ?? '',
    rate_reel_max: creator.rate_reel_max?.toString() ?? '',
    rate_youtube_min: creator.rate_youtube_min?.toString() ?? '',
    rate_youtube_max: creator.rate_youtube_max?.toString() ?? '',
    rate_story_min: creator.rate_story_min?.toString() ?? '',
    rate_story_max: creator.rate_story_max?.toString() ?? '',
    available_for_collabs: creator.available_for_collabs ?? true,
    preferred_deal_types: creator.preferred_deal_types ?? [],
  })

  function set(field: string, value: string | boolean | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleDealType(type: string) {
    const lower = type.toLowerCase()
    set(
      'preferred_deal_types',
      form.preferred_deal_types.includes(lower)
        ? form.preferred_deal_types.filter((t) => t !== lower)
        : [...form.preferred_deal_types, lower]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      handle: creator.handle,
      name: form.name,
      bio: form.bio,
      contact_email: form.contact_email,
      instagram_handle: form.instagram_handle || null,
      rate_reel_min: form.rate_reel_min ? parseInt(form.rate_reel_min) : null,
      rate_reel_max: form.rate_reel_max ? parseInt(form.rate_reel_max) : null,
      rate_youtube_min: form.rate_youtube_min ? parseInt(form.rate_youtube_min) : null,
      rate_youtube_max: form.rate_youtube_max ? parseInt(form.rate_youtube_max) : null,
      rate_story_min: form.rate_story_min ? parseInt(form.rate_story_min) : null,
      rate_story_max: form.rate_story_max ? parseInt(form.rate_story_max) : null,
      available_for_collabs: form.available_for_collabs,
      preferred_deal_types: form.preferred_deal_types,
    }

    const res = await fetch('/api/claim/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setSaved(true)
      setTimeout(() => router.push(`/creator/${creator.handle}`), 2000)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong.')
    }
    setLoading(false)
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <CheckCircle2 className="mb-4 size-12 text-brand-600" />
        <h2 className="mb-1 text-xl font-bold">Profile verified!</h2>
        <p className="text-sm text-muted-foreground">Redirecting to your profile…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Identity */}
      <section>
        <h3 className="mb-4 text-sm font-semibold">Identity</h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium">Display name</label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/40"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
              rows={3}
              placeholder="Short description brands will see on your profile"
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-500/40"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium">Contact email (public)</label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => set('contact_email', e.target.value)}
                placeholder="collabs@you.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-500/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Instagram handle</label>
              <div className="flex items-center rounded-lg border border-border bg-background focus-within:ring-1 focus-within:ring-brand-500/40">
                <span className="pl-3 text-sm text-muted-foreground">@</span>
                <input
                  value={form.instagram_handle}
                  onChange={(e) => set('instagram_handle', e.target.value)}
                  placeholder="yourhandle"
                  className="flex-1 bg-transparent py-2 pl-1 pr-3 text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rate card */}
      <section>
        <h3 className="mb-1 text-sm font-semibold">Rate card</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Shown as a range on your profile. Brands see this before reaching out — it filters out lowball enquiries.
        </p>
        <div className="space-y-3">
          {[
            { label: 'Instagram Reel', min: 'rate_reel_min', max: 'rate_reel_max' },
            { label: 'YouTube Integration', min: 'rate_youtube_min', max: 'rate_youtube_max' },
            { label: 'Instagram Story', min: 'rate_story_min', max: 'rate_story_max' },
          ].map((row) => (
            <div key={row.label}>
              <label className="mb-1 block text-xs font-medium">{row.label}</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <IndianRupee className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                  <input
                    type="number"
                    min="0"
                    value={form[row.min as keyof typeof form] as string}
                    onChange={(e) => set(row.min, e.target.value)}
                    placeholder="Min"
                    className="w-full rounded-lg border border-border bg-background py-2 pl-7 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-500/40"
                  />
                </div>
                <span className="text-xs text-muted-foreground">to</span>
                <div className="relative flex-1">
                  <IndianRupee className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                  <input
                    type="number"
                    min="0"
                    value={form[row.max as keyof typeof form] as string}
                    onChange={(e) => set(row.max, e.target.value)}
                    placeholder="Max"
                    className="w-full rounded-lg border border-border bg-background py-2 pl-7 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-500/40"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Preferences */}
      <section>
        <h3 className="mb-4 text-sm font-semibold">Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium">Preferred deal types</label>
            <div className="flex gap-2">
              {DEAL_TYPES.map((type) => {
                const active = form.preferred_deal_types.includes(type.toLowerCase())
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleDealType(type)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500/60 dark:bg-brand-950/40 dark:text-brand-400'
                        : 'border-border text-muted-foreground hover:border-brand-300'
                    }`}
                  >
                    {type}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-xs font-medium">Available for collaborations</p>
              <p className="text-xs text-muted-foreground">Brands see an &quot;Open to collabs&quot; badge</p>
            </div>
            <button
              type="button"
              onClick={() => set('available_for_collabs', !form.available_for_collabs)}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                form.available_for_collabs ? 'bg-brand-600' : 'bg-muted-foreground/30'
              }`}
            >
              <span
                className={`absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform ${
                  form.available_for_collabs ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Save & verify profile'}
      </button>
    </form>
  )
}
