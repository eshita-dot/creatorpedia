'use client'

import { useState } from 'react'
import { Mail, CheckCircle2 } from 'lucide-react'

export function ClaimEmailForm({ handle, creatorName }: { handle: string; creatorName: string }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch(`/api/claim/${handle}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (res.ok) {
      setSent(true)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong. Try again.')
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-brand-200/60 bg-brand-50/50 p-6 text-center dark:border-brand-800/30 dark:bg-brand-950/20">
        <CheckCircle2 className="mx-auto mb-3 size-8 text-brand-600" />
        <p className="text-sm font-semibold">Magic link sent!</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Check <strong>{email}</strong> for a sign-in link. Click it to continue claiming{' '}
          <strong>@{handle}</strong>.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Didn&apos;t get it?{' '}
          <button
            onClick={() => setSent(false)}
            className="underline hover:text-foreground"
          >
            Try a different email
          </button>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium">Your email address</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-500/40"
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          We&apos;ll send a one-click sign-in link. No password needed.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !email}
        className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? 'Sending…' : `Send verification link`}
      </button>
    </form>
  )
}
