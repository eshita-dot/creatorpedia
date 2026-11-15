/**
 * Instagram profile ingest via Apify.
 *
 * Phase 1 — discovery: extracts Instagram handles from creator YouTube bios,
 * scrapes profile data via Apify, updates DB.
 *
 * Usage:
 *   npx tsx scripts/ingest-instagram.ts            # auto-extract handles from bios
 *   npx tsx scripts/ingest-instagram.ts @handle1 @handle2   # specific handles
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const APIFY_TOKEN = process.env.APIFY_TOKEN!

if (!APIFY_TOKEN) {
  console.error('Missing APIFY_TOKEN in .env.local')
  process.exit(1)
}

// ── Extract Instagram handles from creator bios ───────────────────────────────

async function extractHandlesFromBios(): Promise<Map<string, string>> {
  // Returns Map<instagramHandle, creatorId>
  const result = new Map<string, string>()

  let all: Array<{ id: string; bio: string | null }> = []
  let from = 0
  while (true) {
    const { data } = await sb.from('creators').select('id, bio').range(from, from + 999)
    if (!data || data.length === 0) break
    all = all.concat(data)
    if (data.length < 1000) break
    from += 1000
  }

  // Only match instagram.com/handle — avoids email/domain false positives
  const igUrlRegex = /instagram\.com\/([A-Za-z0-9_.]{3,30})\b/gi

  for (const c of all) {
    if (!c.bio) continue
    const matches = [...c.bio.matchAll(igUrlRegex)]
    for (const m of matches) {
      const handle = m[1].toLowerCase()
      // Skip obvious non-handles
      if (['p', 'reel', 'reels', 'stories', 'explore', 'tv'].includes(handle)) continue
      result.set(handle, c.id)
    }
  }

  return result
}

// ── Apify Instagram profile scraper ──────────────────────────────────────────

interface ApifyProfile {
  username: string
  fullName: string
  biography: string
  followersCount: number
  followingCount: number
  postsCount: number
  profilePicUrl: string
  isVerified: boolean
  externalUrl: string | null
}

async function scrapeProfiles(handles: string[]): Promise<ApifyProfile[]> {
  console.log(`\nStarting Apify run for ${handles.length} profiles...`)

  // Start the actor run
  const runRes = await fetch(
    'https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${APIFY_TOKEN}`,
      },
      body: JSON.stringify({
        usernames: handles,
        resultsLimit: handles.length,
      }),
    }
  )

  if (!runRes.ok) {
    const err = await runRes.text()
    throw new Error(`Apify run failed: ${runRes.status} ${err}`)
  }

  const { data: run } = await runRes.json() as { data: { id: string; defaultDatasetId: string } }
  console.log(`Run started: ${run.id}`)

  // Poll until finished
  while (true) {
    await new Promise(r => setTimeout(r, 5000))
    const statusRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${run.id}`,
      { headers: { Authorization: `Bearer ${APIFY_TOKEN}` } }
    )
    const { data: status } = await statusRes.json() as { data: { status: string } }
    console.log(`  Status: ${status.status}`)
    if (['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(status.status)) break
  }

  // Fetch results
  const dataRes = await fetch(
    `https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items?clean=true`,
    { headers: { Authorization: `Bearer ${APIFY_TOKEN}` } }
  )
  return await dataRes.json() as ApifyProfile[]
}

// ── Update DB with Instagram data ─────────────────────────────────────────────

async function updateCreatorWithInstagram(
  creatorId: string,
  profile: ApifyProfile
) {
  const { error } = await sb
    .from('creators')
    .update({
      instagram_handle: profile.username,
      followers_instagram: profile.followersCount,
      avatar_url: profile.profilePicUrl || undefined,
      platform: 'both',
      // Only update bio if current bio is empty
    })
    .eq('id', creatorId)
    // Don't overwrite if already has instagram data
    .is('followers_instagram', null)

  return error
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  let handleToCreatorId: Map<string, string>

  const cliHandles = process.argv.slice(2).map(h => h.replace('@', '').toLowerCase())

  if (cliHandles.length > 0) {
    // Manual mode — look up creator IDs for given handles
    handleToCreatorId = new Map()
    const { data } = await sb.from('creators').select('id, instagram_handle, name').in('instagram_handle', cliHandles)
    for (const c of data ?? []) {
      if (c.instagram_handle) handleToCreatorId.set(c.instagram_handle, c.id)
    }
    // For unmatched handles, we'll still scrape but won't be able to update DB
    for (const h of cliHandles) {
      if (!handleToCreatorId.has(h)) handleToCreatorId.set(h, '')
    }
    console.log(`Manual mode: ${cliHandles.length} handles`)
  } else {
    // Auto mode — extract from bios
    console.log('Extracting Instagram handles from creator bios...')
    handleToCreatorId = await extractHandlesFromBios()
    console.log(`Found ${handleToCreatorId.size} Instagram handles in bios`)
  }

  if (handleToCreatorId.size === 0) {
    console.log('No handles to process.')
    return
  }

  const handles = Array.from(handleToCreatorId.keys())

  // Apify has a ~1000 profile limit per run; batch if needed
  const BATCH = 500
  let updated = 0

  for (let i = 0; i < handles.length; i += BATCH) {
    const batch = handles.slice(i, i + BATCH)
    console.log(`\nBatch ${Math.floor(i / BATCH) + 1}: scraping ${batch.length} profiles`)

    const profiles = await scrapeProfiles(batch)
    console.log(`Got ${profiles.length} profiles back`)

    for (const profile of profiles) {
      const creatorId = handleToCreatorId.get(profile.username.toLowerCase())
      if (!creatorId) {
        console.log(`  ? ${profile.username} — no matching creator in DB`)
        continue
      }

      const error = await updateCreatorWithInstagram(creatorId, profile)
      if (error) {
        console.log(`  ✗ ${profile.username}: ${error.message}`)
      } else {
        console.log(`  ✓ @${profile.username} — ${(profile.followersCount ?? 0).toLocaleString()} followers`)
        updated++
      }
    }
  }

  console.log(`\nDone. Updated ${updated} creators with Instagram data.`)
}

run().catch(e => { console.error(e); process.exit(1) })
