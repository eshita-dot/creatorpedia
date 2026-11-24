'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, Search, Loader2 } from 'lucide-react'

interface BrandResult {
  id: string
  name: string
  category: string
  is_d2c: boolean
}

const BRAND_COLORS = [
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-rose-100 text-rose-700 border-rose-200',
]

function brandSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

interface BrandPickerProps {
  currentSlugs: string[]
  resolvedNames: string[] // display name per slug (empty string if unresolved)
}

export function BrandPicker({ currentSlugs, resolvedNames }: BrandPickerProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BrandResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    const t = setTimeout(async () => {
      const res = await fetch(`/api/brands/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data)
      setOpen(true)
      setLoading(false)
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function addBrand(name: string) {
    const slug = brandSlug(name)
    if (currentSlugs.includes(slug) || currentSlugs.length >= 4) return
    const next = [...currentSlugs, slug]
    router.push(`/compare?brands=${next.join(',')}`)
    setQuery('')
    setOpen(false)
  }

  function removeBrand(slug: string) {
    const next = currentSlugs.filter(s => s !== slug)
    if (next.length === 0) router.push('/compare')
    else router.push(`/compare?brands=${next.join(',')}`)
  }

  const selectedSlugs = new Set(currentSlugs)
  const canAdd = currentSlugs.length < 4

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Selected brand chips */}
        {currentSlugs.map((slug, i) => {
          const name = resolvedNames[i] || slug
          return (
            <span
              key={slug}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${BRAND_COLORS[i]}`}
            >
              <span className={`size-1.5 rounded-full ${
                i === 0 ? 'bg-violet-500' :
                i === 1 ? 'bg-emerald-500' :
                i === 2 ? 'bg-amber-500' : 'bg-rose-500'
              }`} />
              {name}
              <button
                onClick={() => removeBrand(slug)}
                className="ml-0.5 rounded-full p-0.5 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="size-3" />
              </button>
            </span>
          )
        })}

        {/* Add brand input */}
        {canAdd && (
          <div className="relative">
            <div className="flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground focus-within:border-brand-400 focus-within:text-foreground transition-colors">
              {loading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : query.length > 0 ? (
                <Search className="size-3" />
              ) : (
                <Plus className="size-3" />
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => results.length > 0 && setOpen(true)}
                placeholder={currentSlugs.length === 0 ? 'Add a brand…' : 'Add another brand…'}
                className="w-36 bg-transparent outline-none placeholder:text-muted-foreground/60"
              />
            </div>

            {open && results.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute left-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
              >
                {results.map(brand => {
                  const slug = brandSlug(brand.name)
                  const alreadyAdded = selectedSlugs.has(slug)
                  return (
                    <button
                      key={brand.id}
                      onClick={() => !alreadyAdded && addBrand(brand.name)}
                      disabled={alreadyAdded}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="font-medium">{brand.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">{brand.category}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {open && query.length >= 2 && results.length === 0 && !loading && (
              <div
                ref={dropdownRef}
                className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-xl border border-border bg-card px-4 py-3 shadow-lg"
              >
                <p className="text-xs text-muted-foreground">No brands found for "{query}"</p>
                <p className="mt-0.5 text-xs text-muted-foreground/60">Only brands with indexed collabs appear here.</p>
              </div>
            )}
          </div>
        )}

        {!canAdd && (
          <span className="text-xs text-muted-foreground">Max 4 brands</span>
        )}
      </div>
    </div>
  )
}
