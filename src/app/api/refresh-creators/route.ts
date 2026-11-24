import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CRON_SECRET = process.env.CRON_SECRET
const STALE_DAYS = 7
const BATCH_SIZE = 20
const DELAY_MS = 2000

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function reingestCreator(handle: string): Promise<boolean> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://creatorpedia.in'
    const res = await fetch(`${base}/api/on-demand-ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: handle }),
      signal: AbortSignal.timeout(30000),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  // Guard: only allow calls from Netlify cron (via secret) or manual admin calls
  const secret = req.nextUrl.searchParams.get('secret')
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const staleThreshold = new Date()
  staleThreshold.setDate(staleThreshold.getDate() - STALE_DAYS)

  // Fetch stale creators — prioritise those with the most collabs (highest value to refresh)
  const { data: staleCreators, error } = await sb
    .from('creators')
    .select('id, handle, platform, name, updated_at')
    .lt('updated_at', staleThreshold.toISOString())
    .order('updated_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!staleCreators?.length) {
    return NextResponse.json({ message: 'No stale creators to refresh', refreshed: 0 })
  }

  const results: { handle: string; ok: boolean }[] = []

  for (const creator of staleCreators) {
    const ok = await reingestCreator(creator.handle)
    results.push({ handle: creator.handle, ok })
    if (creator !== staleCreators[staleCreators.length - 1]) {
      await sleep(DELAY_MS)
    }
  }

  const succeeded = results.filter(r => r.ok).length
  console.log(`[refresh-creators] ${succeeded}/${results.length} refreshed`)

  return NextResponse.json({
    refreshed: succeeded,
    failed: results.length - succeeded,
    results,
  })
}
