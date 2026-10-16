import { NextRequest, NextResponse } from 'next/server'
import { MOCK_CREATORS } from '@/lib/mock-data'
import type { SearchResult } from '@/types'

// Swap mock data for Supabase query once DB is set up:
//
// import { createClient } from '@/lib/supabase/server'
//
// const supabase = await createClient()
// const { data } = await supabase
//   .from('creators')
//   .select('*, collaborations(brand:brands(name))')
//   .textSearch('search_vector', q)
//   .eq('category', category)
//   .limit(20)

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = (searchParams.get('q') ?? '').toLowerCase().trim()
  const category = searchParams.get('category') ?? ''
  const platform = searchParams.get('platform') ?? ''
  const region = searchParams.get('region') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const limit = 20

  let results: SearchResult[] = MOCK_CREATORS

  if (q) {
    results = results.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q) ||
        c.category.includes(q) ||
        c.recent_brands.some((b) => b.toLowerCase().includes(q)) ||
        c.region.includes(q)
    )
  }

  if (category) results = results.filter((c) => c.category === category)
  if (platform && platform !== 'both') {
    results = results.filter((c) => c.platform === platform || c.platform === 'both')
  }
  if (region) results = results.filter((c) => c.region === region)

  const start = (page - 1) * limit
  const paginated = results.slice(start, start + limit)

  return NextResponse.json({
    results: paginated,
    total: results.length,
    page,
    totalPages: Math.ceil(results.length / limit),
  })
}
