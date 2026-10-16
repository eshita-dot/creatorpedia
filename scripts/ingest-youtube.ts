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
  // Beauty & Skincare
  Nykaa: { category: 'Beauty Retail', is_d2c: false },
  Minimalist: { category: 'D2C Skincare', is_d2c: true },
  mCaffeine: { category: 'D2C Skincare', is_d2c: true },
  'Sugar Cosmetics': { category: 'D2C Makeup', is_d2c: true },
  SUGAR: { category: 'D2C Makeup', is_d2c: true },
  Mamaearth: { category: 'D2C Personal Care', is_d2c: true },
  'Wow Skin Science': { category: 'D2C Skincare', is_d2c: true },
  'WOW Skin Science': { category: 'D2C Skincare', is_d2c: true },
  'Plum Goodness': { category: 'D2C Skincare', is_d2c: true },
  Plum: { category: 'D2C Skincare', is_d2c: true },
  'Dot & Key': { category: 'D2C Skincare', is_d2c: true },
  "Dot and Key": { category: 'D2C Skincare', is_d2c: true },
  "Re'equil": { category: 'D2C Skincare', is_d2c: true },
  Reequil: { category: 'D2C Skincare', is_d2c: true },
  Pilgrim: { category: 'D2C Skincare', is_d2c: true },
  Foxtale: { category: 'D2C Skincare', is_d2c: true },
  'The Derma Co': { category: 'D2C Skincare', is_d2c: true },
  'Derma Co': { category: 'D2C Skincare', is_d2c: true },
  Fixderma: { category: 'D2C Skincare', is_d2c: true },
  Aqualogica: { category: 'D2C Skincare', is_d2c: true },
  'Just Herbs': { category: 'D2C Skincare', is_d2c: true },
  'Forest Essentials': { category: 'Luxury Skincare', is_d2c: false },
  'Kama Ayurveda': { category: 'Luxury Skincare', is_d2c: false },
  Biotique: { category: 'Ayurvedic Beauty', is_d2c: false },
  Himalaya: { category: 'Personal Care', is_d2c: false },
  'Lotus Herbals': { category: 'D2C Skincare', is_d2c: true },
  Lakme: { category: 'Beauty Retail', is_d2c: false },
  Colorbar: { category: 'Makeup', is_d2c: false },
  'NY Bae': { category: 'D2C Makeup', is_d2c: true },
  'Swiss Beauty': { category: 'D2C Makeup', is_d2c: true },
  'Insight Cosmetics': { category: 'D2C Makeup', is_d2c: true },
  'Faces Canada': { category: 'Makeup', is_d2c: false },
  Lakmé: { category: 'Beauty Retail', is_d2c: false },
  'Pilgrim India': { category: 'D2C Skincare', is_d2c: true },
  Slay: { category: 'D2C Makeup', is_d2c: true },
  'Nykaa Fashion': { category: 'Fashion Retail', is_d2c: false },
  'Good Vibes': { category: 'D2C Skincare', is_d2c: true },
  StBotanica: { category: 'D2C Skincare', is_d2c: true },
  'Bella Vita': { category: 'D2C Personal Care', is_d2c: true },
  'Bella Vita Organic': { category: 'D2C Personal Care', is_d2c: true },
  'Tru Hair': { category: 'D2C Hair Care', is_d2c: true },
  Vegamour: { category: 'Hair Care', is_d2c: false },
  Marico: { category: 'Personal Care', is_d2c: false },
  Parachute: { category: 'Hair Care', is_d2c: false },
  Indulekha: { category: 'Hair Care', is_d2c: false },
  // Fashion
  Myntra: { category: 'Fashion Retail', is_d2c: false },
  Bewakoof: { category: 'D2C Fashion', is_d2c: true },
  Virgio: { category: 'D2C Fashion', is_d2c: true },
  AJIO: { category: 'Fashion Retail', is_d2c: false },
  Meesho: { category: 'Social Commerce', is_d2c: false },
  FabIndia: { category: 'Fashion Retail', is_d2c: false },
  Libas: { category: 'D2C Fashion', is_d2c: true },
  Anouk: { category: 'D2C Fashion', is_d2c: true },
  Clovia: { category: 'D2C Lingerie', is_d2c: true },
  Zivame: { category: 'D2C Lingerie', is_d2c: true },
  Campus: { category: 'Footwear', is_d2c: false },
  Bata: { category: 'Footwear', is_d2c: false },
  Mochi: { category: 'Footwear', is_d2c: false },
  // Finance & Fintech
  Zerodha: { category: 'Fintech', is_d2c: false },
  Groww: { category: 'Fintech', is_d2c: false },
  CRED: { category: 'Fintech', is_d2c: false },
  Upstox: { category: 'Fintech', is_d2c: false },
  Smallcase: { category: 'Fintech', is_d2c: false },
  'Angel One': { category: 'Fintech', is_d2c: false },
  'Angel Broking': { category: 'Fintech', is_d2c: false },
  Jupiter: { category: 'Neobank', is_d2c: false },
  'Fi Money': { category: 'Neobank', is_d2c: false },
  Fi: { category: 'Neobank', is_d2c: false },
  INDmoney: { category: 'Fintech', is_d2c: false },
  Niyo: { category: 'Neobank', is_d2c: false },
  Paytm: { category: 'Fintech', is_d2c: false },
  PhonePe: { category: 'Fintech', is_d2c: false },
  Razorpay: { category: 'Fintech', is_d2c: false },
  // Food & Beverage
  Swiggy: { category: 'Food Delivery', is_d2c: false },
  Zomato: { category: 'Food Delivery', is_d2c: false },
  'Paper Boat': { category: 'D2C Beverages', is_d2c: true },
  Epigamia: { category: 'D2C Food', is_d2c: true },
  'Slurrp Farm': { category: 'D2C Food', is_d2c: true },
  'The Whole Truth': { category: 'D2C Food', is_d2c: true },
  'Yoga Bar': { category: 'D2C Health Food', is_d2c: true },
  'True Elements': { category: 'D2C Health Food', is_d2c: true },
  Bira: { category: 'Beverages', is_d2c: false },
  'Wow Momo': { category: 'QSR', is_d2c: false },
  Licious: { category: 'D2C Meat', is_d2c: true },
  'Country Delight': { category: 'D2C Dairy', is_d2c: true },
  Wingreens: { category: 'D2C Snacks', is_d2c: true },
  'Too Yumm': { category: 'D2C Snacks', is_d2c: true },
  Millet: { category: 'D2C Health Food', is_d2c: true },
  Saffola: { category: 'Health Food', is_d2c: false },
  // Tech & Electronics
  boAt: { category: 'D2C Audio', is_d2c: true },
  Noise: { category: 'D2C Wearables', is_d2c: true },
  OnePlus: { category: 'Consumer Electronics', is_d2c: false },
  Realme: { category: 'Consumer Electronics', is_d2c: false },
  Redmi: { category: 'Consumer Electronics', is_d2c: false },
  Xiaomi: { category: 'Consumer Electronics', is_d2c: false },
  IQOO: { category: 'Consumer Electronics', is_d2c: false },
  Nothing: { category: 'Consumer Electronics', is_d2c: false },
  Samsung: { category: 'Consumer Electronics', is_d2c: false },
  Portronics: { category: 'D2C Electronics', is_d2c: true },
  Zebronics: { category: 'D2C Electronics', is_d2c: true },
  Ambrane: { category: 'D2C Electronics', is_d2c: true },
  // Health & Fitness
  HealthifyMe: { category: 'Health Tech', is_d2c: false },
  'Cult.fit': { category: 'Fitness', is_d2c: false },
  Fittr: { category: 'Fitness', is_d2c: false },
  MuscleBlaze: { category: 'D2C Nutrition', is_d2c: true },
  Oziva: { category: 'D2C Nutrition', is_d2c: true },
  'Health Kart': { category: 'Nutrition Retail', is_d2c: false },
  HealthKart: { category: 'Nutrition Retail', is_d2c: false },
  Wellbeing: { category: 'D2C Nutrition', is_d2c: true },
  'Tata 1mg': { category: 'Health Tech', is_d2c: false },
  '1mg': { category: 'Health Tech', is_d2c: false },
  Pharmeasy: { category: 'Health Tech', is_d2c: false },
  // General / E-commerce
  Amazon: { category: 'E-commerce', is_d2c: false },
  Flipkart: { category: 'E-commerce', is_d2c: false },
  Spotify: { category: 'Music Streaming', is_d2c: false },
  Audible: { category: 'Audio Books', is_d2c: false },
  Skillshare: { category: 'EdTech', is_d2c: false },
  Coursera: { category: 'EdTech', is_d2c: false },
  Unacademy: { category: 'EdTech', is_d2c: false },
  Vedantu: { category: 'EdTech', is_d2c: false },
  'Byju\'s': { category: 'EdTech', is_d2c: false },
  Byjus: { category: 'EdTech', is_d2c: false },
  Lenskart: { category: 'D2C Eyewear', is_d2c: true },
  Wakefit: { category: 'D2C Furniture', is_d2c: true },
  Pepperfry: { category: 'Furniture', is_d2c: false },
  'Urban Company': { category: 'Home Services', is_d2c: false },
  Dunzo: { category: 'Quick Commerce', is_d2c: false },
  Blinkit: { category: 'Quick Commerce', is_d2c: false },
  Zepto: { category: 'Quick Commerce', is_d2c: false },
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
  // Step 1: get video IDs (search.list returns truncated descriptions)
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
  searchUrl.searchParams.set('part', 'id')
  searchUrl.searchParams.set('channelId', channelId)
  searchUrl.searchParams.set('type', 'video')
  searchUrl.searchParams.set('order', 'date')
  searchUrl.searchParams.set('maxResults', String(maxResults))
  searchUrl.searchParams.set('key', YOUTUBE_API_KEY)

  const searchRes = await fetch(searchUrl.toString())
  const searchData = await searchRes.json()
  const videoIds: string[] = (searchData.items ?? []).map(
    (item: { id: { videoId: string } }) => item.id.videoId
  )
  if (videoIds.length === 0) return []

  // Step 2: fetch full descriptions via videos.list
  const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
  videosUrl.searchParams.set('part', 'snippet')
  videosUrl.searchParams.set('id', videoIds.join(','))
  videosUrl.searchParams.set('key', YOUTUBE_API_KEY)

  const videosRes = await fetch(videosUrl.toString())
  const videosData = await videosRes.json()

  return (videosData.items ?? []).map(
    (item: {
      id: string
      snippet: { title: string; description: string; publishedAt: string; channelId: string }
    }) => ({
      videoId: item.id,
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
