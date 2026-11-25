'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function BrandSearchInput() {
  const [value, setValue] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    router.push(`/brand/${slug}`)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Nykaa, boAt, Zerodha…"
        className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-500/30 placeholder:text-muted-foreground/60"
      />
      <button
        type="submit"
        className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition-colors"
      >
        Look up →
      </button>
    </form>
  )
}
