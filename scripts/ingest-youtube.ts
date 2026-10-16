/**
 * YouTube Data API v3 — ASCI Disclosure Ingestion Script
 *
 * Fetches Indian creator channels by category, parses video descriptions for
 * ASCI-mandated brand disclosures (#ad, #sponsored, #collab, etc.), and upserts
 * creator + collaboration records into Supabase.
 *
 * Usage:
 *   npx ts-node --esm scripts/ingest-youtube.ts --category beauty --max 50
 *
 * NOTE: YouTube ToS requires stats (subscribers, views) to be refreshed within
 * 30 days. This script should run on a cron — e.g. every 25 days via Vercel Cron.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ── ASCI-compliant disclosure tags to detect ──────────────────────────────────
const DISCLOSURE_PATTERNS = [
  /\#ad\b/i,
  /\#advertisement\b/i,
  /\#sponsored\b/i,
  /\#collab\b/i,
  /\#collaboration\b/i,
  /\#partnership\b/i,
  /\#partner\b/i,
  /\#gifted\b/i,
  /paid\s+partnership/i,
  /in\s+collaboration\s+with/i,
  /sponsored\s+by/i,
  /brought\s+to\s+you\s+by/i,
]

// ── Known Indian D2C brand names for matching ─────────────────────────────────
const INDIAN_BRANDS: Record<string, { category: string; is_d2c: boolean }> = {
  Nykaa: { category: 'Beauty Retail', is_d2c: false },
  Minimalist: { category: 'D2C Skincare', is_d2c: true },
  mCaffeine: { category: 'D2C Skincare', is_d2c: true },
  'Sugar Cosmetics': { category: 'D2C Makeup', is_d2c: true },
  Mamaearth: { category: 'D2C Personal Care', is_d2c: true },
  'Wow Skin Science': { category: 'D2C Skincare', is_d2c: true },
  'Plum Goodness': { category: 'D2C Skincare', is_d2c: true },
  Zerodha: { category: 'Fintech', is_d2c: false },
  Groww: { category: 'Fintech', is_d2c: false },
  CRED: { category: 'Fintech', is_d2c: false },
  Fi: { category: 'Fintech', is_d2c: false },
  Myntra: { category: 'Fashion Retail', is_d2c: false },
  Bewakoof: { category: 'D2C Fashion', is_d2c: true },
  Virgio: { category: 'D2C Fashion', is_d2c: true },
  boAt: { category: 'D2C Audio', is_d2c: true },
  Noise: { category: 'D2C Wearables', is_d2c: true },
  Swiggy: { category: 'Food Delivery', is_d2c: false },
  Zomato: { category: 'Food Delivery', is_d2c: false },
  OnePlus: { category: 'Consumer Electronics', is_d2c: false },
  Realme: { category: 'Consumer Electronics', is_d2c: false },
  Spotify: { category: 'Music Streaming', is_d2c: false },
}

interface YouTubeChannel {
  channelId: string
  title: string
  description: string
  subscriberCount: string
  viewCount: string
  handle?: string
}

interface YouTubeVideo {
  videoId: string
  title: string
  description: string
  publishedAt: string
  channelId: string
}

// ── YouTube API helpers ───────────────────────────────────────────────────────

async function searchIndianChannels(
  category: string,
  maxResults = 50
): Promise<YouTubeChannel[]> {
  const queries: Record<string, string> = {
    beauty: 'Indian beauty skincare influencer Hindi',
    finance: 'Indian personal finance investing YouTube Hindi',
    food: 'Indian food recipe blogger YouTube',
    fitness: 'Indian fitness workout YouTube Hindi',
    fashion: 'Indian fashion OOTD haul YouTube',
    tech: 'tech review Hindi Indian YouTube channel',
    travel: 'Indian travel vlog YouTube',
    entertainment: 'Indian entertainment YouTube creator',
  }

  const q = queries[category] ?? `Indian ${category} YouTuber`
  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('q', q)
  url.searchParams.set('type', 'channel')
  url.searchParams.set('regionCode', 'IN')
  url.searchParams.set('relevanceLanguage', 'hi')
  url.searchParams.set('maxResults', String(Math.min(maxResults, 50)))
  url.searchParams.set('key', YOUTUBE_API_KEY)

  const res = await fetch(url.toString())
  const data = await res.json()

  const channelIds: string[] = (data.items ?? []).map(
    (item: { id: { channelId: string } }) => item.id.channelId
  )

  if (channelIds.length === 0) return []

  return fetchChannelDetails(channelIds)
}

async function fetchChannelDetails(channelIds: string[]): Promise<YouTubeChannel[]> {
  const url = new URL('https://www.googleapis.com/youtube/v3/channels')
  url.searchParams.set('part', 'snippet,statistics')
  url.searchParams.set('id', channelIds.join(','))
  url.searchParams.set('key', YOUTUBE_API_KEY)

  const res = await fetch(url.toString())
  const data = await res.json()

  return (data.items ?? []).map(
    (item: {
      id: string
      snippet: { title: string; description: string; customUrl?: string }
      statistics: { subscriberCount: string; viewCount: string }
    }) => ({
      channelId: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      subscriberCount: item.statistics.subscriberCount,
      viewCount: item.statistics.viewCount,
      handle: item.snippet.customUrl,
    })
  )
}

async function fetchRecentVideos(
  channelId: string,
  maxResults = 30
): Promise<YouTubeVideo[]> {
  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('channelId', channelId)
  url.searchParams.set('type', 'video')
  url.searchParams.set('order', 'date')
  url.searchParams.set('maxResults', String(maxResults))
  url.searchParams.set('key', YOUTUBE_API_KEY)

  const res = await fetch(url.toString())
  const data = await res.json()

  return (data.items ?? []).map(
    (item: {
      id: { videoId: string }
      snippet: { title: string; description: string; publishedAt: string; channelId: string }
    }) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      channelId: item.snippet.channelId,
    })
  )
}

// ── Disclosure detection ──────────────────────────────────────────────────────

function hasDisclosure(text: string): boolean {
  return DISCLOSURE_PATTERNS.some((p) => p.test(text))
}

function extractDisclosureTags(text: string): string[] {
  const found: string[] = []
  const hashtagMatches = text.match(/#[a-zA-Z][a-zA-Z0-9]*/g) ?? []
  const disclosureTags = hashtagMatches.filter((tag) =>
    DISCLOSURE_PATTERNS.some((p) => p.test(tag))
  )
  found.push(...disclosureTags)
  if (/paid\s+partnership/i.test(text)) found.push('paid partnership')
  if (/sponsored\s+by/i.test(text)) found.push('sponsored by')
  return [...new Set(found)]
}

function extractBrandMentions(
  text: string
): Array<{ name: string; category: string; is_d2c: boolean }> {
  const found: Array<{ name: string; category: string; is_d2c: boolean }> = []
  for (const [brand, meta] of Object.entries(INDIAN_BRANDS)) {
    if (new RegExp(`\\b${brand}\\b`, 'i').test(text)) {
      found.push({ name: brand, ...meta })
    }
  }
  return found
}

function inferDealType(text: string): 'paid' | 'barter' | 'gifted' | 'unknown' {
  if (/\bgifted\b|\bpr\s+package\b|\bpr\s+gift\b/i.test(text)) return 'gifted'
  if (/\bbarter\b/i.test(text)) return 'barter'
  if (/\bsponsored\b|\bpaid\b|\bpaid\s+partnership\b/i.test(text)) return 'paid'
  return 'unknown'
}

// ── Supabase upsert helpers ───────────────────────────────────────────────────

async function upsertCreator(channel: YouTubeChannel, category: string) {
  const subscriberCount = parseInt(channel.subscriberCount || '0', 10)
  const tier =
    subscriberCount >= 1_000_000 ? 'mega' :
    subscriberCount >= 500_000  ? 'macro' :
    subscriberCount >= 100_000  ? 'mid' :
    subscriberCount >= 10_000   ? 'micro' : 'nano'

  const handle = (channel.handle ?? channel.channelId).replace('@', '')

  const { data, error } = await supabase
    .from('creators')
    .upsert(
      {
        handle,
        platform: 'youtube',
        name: channel.title,
        bio: channel.description.substring(0, 500),
        category,
        region: 'pan-india',
        languages: ['Hindi', 'English'],
        followers_youtube: subscriberCount,
        pricing_tier: tier,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'handle,platform' }
    )
    .select('id')
    .single()

  if (error) {
    console.error(`[creator upsert] ${channel.title}:`, error.message)
    return null
  }
  return data?.id as string | null
}

async function upsertBrand(brand: { name: string; category: string; is_d2c: boolean }) {
  const { data } = await supabase
    .from('brands')
    .upsert({ name: brand.name, category: brand.category, is_d2c: brand.is_d2c }, { onConflict: 'name' })
    .select('id')
    .single()
  return data?.id as string | null
}

async function insertCollab(
  creatorId: string,
  brandId: string,
  video: YouTubeVideo,
  disclosureTags: string[],
  dealType: ReturnType<typeof inferDealType>
) {
  await supabase.from('collaborations').insert({
    creator_id: creatorId,
    brand_id: brandId,
    collab_date: video.publishedAt.substring(0, 10),
    source: 'youtube_api',
    deal_type: dealType,
    evidence_url: `https://www.youtube.com/watch?v=${video.videoId}`,
    disclosure_tags: disclosureTags,
    notes: video.title.substring(0, 200),
  })
}

// ── Main ingestion loop ───────────────────────────────────────────────────────

async function ingest(category: string, maxChannels = 50) {
  console.log(`\n[ingest] Starting — category: ${category}, max channels: ${maxChannels}`)

  const channels = await searchIndianChannels(category, maxChannels)
  console.log(`[ingest] Found ${channels.length} channels`)

  let totalCollabs = 0

  for (const channel of channels) {
    console.log(`  → ${channel.title} (${channel.subscriberCount} subs)`)

    const creatorId = await upsertCreator(channel, category)
    if (!creatorId) continue

    const videos = await fetchRecentVideos(channel.channelId, 30)
    const disclosedVideos = videos.filter((v) =>
      hasDisclosure(v.title + ' ' + v.description)
    )

    console.log(`     ${videos.length} videos fetched, ${disclosedVideos.length} with disclosures`)

    for (const video of disclosedVideos) {
      const fullText = video.title + ' ' + video.description
      const tags = extractDisclosureTags(fullText)
      const brands = extractBrandMentions(fullText)
      const dealType = inferDealType(fullText)

      for (const brand of brands) {
        const brandId = await upsertBrand(brand)
        if (!brandId) continue
        await insertCollab(creatorId, brandId, video, tags, dealType)
        totalCollabs++
      }
    }

    // Respect YouTube quota — 100 units/search, 1 unit/channel details
    await new Promise((r) => setTimeout(r, 200))
  }

  console.log(`\n[ingest] Done. ${totalCollabs} collaborations indexed.`)
}

// ── CLI entrypoint ────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const categoryFlag = args.indexOf('--category')
const maxFlag = args.indexOf('--max')

const category = categoryFlag !== -1 ? args[categoryFlag + 1] : 'beauty'
const max = maxFlag !== -1 ? parseInt(args[maxFlag + 1], 10) : 50

ingest(category, max).catch((e) => {
  console.error(e)
  process.exit(1)
})
