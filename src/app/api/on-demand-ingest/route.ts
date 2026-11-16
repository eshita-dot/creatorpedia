import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const YT_KEY = process.env.YOUTUBE_API_KEY!

// ── Disclosure detection ──────────────────────────────────────────────────────

const DISCLOSURE_PATTERNS = [
  /\#ad\b/i, /\#advertisement\b/i, /\#sponsored\b/i,
  /\#collab\b/i, /\#collaboration\b/i, /\#partnership\b/i,
  /\#partner\b/i, /\#gifted\b/i,
  /paid\s+partnership/i, /in\s+collaboration\s+with/i,
  /sponsored\s+by/i, /brought\s+to\s+you\s+by/i,
]

const INDIAN_BRANDS: Record<string, { category: string; is_d2c: boolean }> = {
  Nykaa: { category: 'Beauty Retail', is_d2c: false },
  Minimalist: { category: 'D2C Skincare', is_d2c: true },
  mCaffeine: { category: 'D2C Skincare', is_d2c: true },
  'Sugar Cosmetics': { category: 'D2C Makeup', is_d2c: true },
  SUGAR: { category: 'D2C Makeup', is_d2c: true },
  Mamaearth: { category: 'D2C Personal Care', is_d2c: true },
  'Wow Skin Science': { category: 'D2C Skincare', is_d2c: true },
  'WOW Skin Science': { category: 'D2C Skincare', is_d2c: true },
  Plum: { category: 'D2C Skincare', is_d2c: true },
  'Dot & Key': { category: 'D2C Skincare', is_d2c: true },
  Pilgrim: { category: 'D2C Skincare', is_d2c: true },
  Foxtale: { category: 'D2C Skincare', is_d2c: true },
  'The Derma Co': { category: 'D2C Skincare', is_d2c: true },
  Aqualogica: { category: 'D2C Skincare', is_d2c: true },
  Biotique: { category: 'Ayurvedic Beauty', is_d2c: false },
  Himalaya: { category: 'Personal Care', is_d2c: false },
  Lakme: { category: 'Beauty Retail', is_d2c: false },
  'Swiss Beauty': { category: 'D2C Makeup', is_d2c: true },
  Myntra: { category: 'Fashion Retail', is_d2c: false },
  Urbanic: { category: 'D2C Fashion', is_d2c: true },
  Snitch: { category: 'D2C Fashion', is_d2c: true },
  'Rare Rabbit': { category: 'D2C Fashion', is_d2c: true },
  'The Souled Store': { category: 'D2C Fashion', is_d2c: true },
  Bewakoof: { category: 'D2C Fashion', is_d2c: true },
  Virgio: { category: 'D2C Fashion', is_d2c: true },
  AJIO: { category: 'Fashion Retail', is_d2c: false },
  Meesho: { category: 'Social Commerce', is_d2c: false },
  Clovia: { category: 'D2C Lingerie', is_d2c: true },
  Zerodha: { category: 'Fintech', is_d2c: false },
  Groww: { category: 'Fintech', is_d2c: false },
  CRED: { category: 'Fintech', is_d2c: false },
  Upstox: { category: 'Fintech', is_d2c: false },
  Smallcase: { category: 'Fintech', is_d2c: false },
  'Angel One': { category: 'Fintech', is_d2c: false },
  Jupiter: { category: 'Neobank', is_d2c: false },
  'Fi Money': { category: 'Neobank', is_d2c: false },
  INDmoney: { category: 'Fintech', is_d2c: false },
  Paytm: { category: 'Fintech', is_d2c: false },
  PhonePe: { category: 'Fintech', is_d2c: false },
  Swiggy: { category: 'Food Delivery', is_d2c: false },
  Zomato: { category: 'Food Delivery', is_d2c: false },
  'Paper Boat': { category: 'D2C Beverages', is_d2c: true },
  Epigamia: { category: 'D2C Food', is_d2c: true },
  'The Whole Truth': { category: 'D2C Food', is_d2c: true },
  'Yoga Bar': { category: 'D2C Health Food', is_d2c: true },
  Licious: { category: 'D2C Meat', is_d2c: true },
  boAt: { category: 'D2C Audio', is_d2c: true },
  Noise: { category: 'D2C Wearables', is_d2c: true },
  OnePlus: { category: 'Consumer Electronics', is_d2c: false },
  Realme: { category: 'Consumer Electronics', is_d2c: false },
  Redmi: { category: 'Consumer Electronics', is_d2c: false },
  Xiaomi: { category: 'Consumer Electronics', is_d2c: false },
  Nothing: { category: 'Consumer Electronics', is_d2c: false },
  Samsung: { category: 'Consumer Electronics', is_d2c: false },
  Portronics: { category: 'D2C Electronics', is_d2c: true },
  Zebronics: { category: 'D2C Electronics', is_d2c: true },
  HealthifyMe: { category: 'Health Tech', is_d2c: false },
  MuscleBlaze: { category: 'D2C Nutrition', is_d2c: true },
  Oziva: { category: 'D2C Nutrition', is_d2c: true },
  HealthKart: { category: 'Nutrition Retail', is_d2c: false },
  'Tata 1mg': { category: 'Health Tech', is_d2c: false },
  MPL: { category: 'Gaming', is_d2c: false },
  WinZO: { category: 'Gaming', is_d2c: false },
  Dream11: { category: 'Fantasy Sports', is_d2c: false },
  Amazon: { category: 'E-commerce', is_d2c: false },
  Flipkart: { category: 'E-commerce', is_d2c: false },
  Spotify: { category: 'Music Streaming', is_d2c: false },
  Unacademy: { category: 'EdTech', is_d2c: false },
  Lenskart: { category: 'D2C Eyewear', is_d2c: true },
  Wakefit: { category: 'D2C Furniture', is_d2c: true },
  Blinkit: { category: 'Quick Commerce', is_d2c: false },
  Zepto: { category: 'Quick Commerce', is_d2c: false },
}

// ── Category inference ────────────────────────────────────────────────────────

function inferCategory(title: string, description: string): string {
  const text = (title + ' ' + description).toLowerCase()
  if (/beauty|skincare|makeup|cosmetic|lipstick|foundation|serum/.test(text)) return 'beauty'
  if (/finance|invest|stock|mutual fund|trading|money|wealth|zerodha|groww/.test(text)) return 'finance'
  if (/food|recipe|cook|chef|kitchen|eating|restaurant|samayal|ranna/.test(text)) return 'food'
  if (/fitness|gym|workout|yoga|exercise|muscle|bodybuilding|weight/.test(text)) return 'fitness'
  if (/fashion|style|ootd|outfit|clothes|haul|myntra|ajio/.test(text)) return 'fashion'
  if (/tech|gadget|review|smartphone|unboxing|laptop|earphone/.test(text)) return 'tech'
  if (/travel|vlog|trip|explore|wander|destination|backpack/.test(text)) return 'travel'
  if (/gaming|game|stream|esport|bgmi|pubg|free fire|streamer/.test(text)) return 'gaming'
  if (/entertainment|comedy|funny|meme|prank|sketch/.test(text)) return 'entertainment'
  if (/parent|mom|dad|baby|kid|family|pregnancy/.test(text)) return 'parenting'
  return 'lifestyle'
}

// ── Disclosure helpers ────────────────────────────────────────────────────────

function extractDisclosureTags(text: string): string[] {
  const found: string[] = []
  const tags = (text.match(/#[a-zA-Z][a-zA-Z0-9]*/g) ?? [])
    .filter(t => DISCLOSURE_PATTERNS.some(p => p.test(t)))
  found.push(...tags)
  if (/paid\s+partnership/i.test(text)) found.push('paid partnership')
  if (/sponsored\s+by/i.test(text)) found.push('sponsored by')
  return [...new Set(found)]
}

function extractBrandMentions(text: string) {
  return Object.entries(INDIAN_BRANDS)
    .filter(([brand]) => new RegExp(`\\b${brand}\\b`, 'i').test(text))
    .map(([name, meta]) => ({ name, ...meta }))
}

function inferDealType(text: string): 'paid' | 'barter' | 'gifted' | 'unknown' {
  if (/\bgifted\b|\bpr\s+package\b/i.test(text)) return 'gifted'
  if (/\bbarter\b/i.test(text)) return 'barter'
  if (/\bsponsored\b|\bpaid\b|\bpaid\s+partnership\b/i.test(text)) return 'paid'
  return 'unknown'
}

// ── YouTube API helpers ───────────────────────────────────────────────────────

interface YTChannel {
  channelId: string
  title: string
  description: string
  subscriberCount: string
  handle: string
}

interface YTVideo {
  videoId: string
  title: string
  description: string
  publishedAt: string
  viewCount?: number
  likeCount?: number
  commentCount?: number
}

async function lookupByHandle(handle: string): Promise<YTChannel | null> {
  const url = new URL('https://www.googleapis.com/youtube/v3/channels')
  url.searchParams.set('part', 'snippet,statistics')
  url.searchParams.set('forHandle', handle)
  url.searchParams.set('key', YT_KEY)
  const res = await fetch(url.toString())
  const data = await res.json()
  const item = data.items?.[0]
  if (!item) return null
  return {
    channelId: item.id,
    title: item.snippet.title,
    description: item.snippet.description ?? '',
    subscriberCount: item.statistics.subscriberCount ?? '0',
    handle: (item.snippet.customUrl ?? item.id).replace('@', ''),
  }
}

async function searchChannel(query: string): Promise<YTChannel | null> {
  // search.list costs 100 quota units — only used as fallback
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
  searchUrl.searchParams.set('part', 'snippet')
  searchUrl.searchParams.set('q', query)
  searchUrl.searchParams.set('type', 'channel')
  searchUrl.searchParams.set('regionCode', 'IN')
  searchUrl.searchParams.set('maxResults', '1')
  searchUrl.searchParams.set('key', YT_KEY)
  const searchRes = await fetch(searchUrl.toString())
  const searchData = await searchRes.json()
  const channelId = searchData.items?.[0]?.id?.channelId
  if (!channelId) return null

  // Fetch full channel details
  const detailUrl = new URL('https://www.googleapis.com/youtube/v3/channels')
  detailUrl.searchParams.set('part', 'snippet,statistics')
  detailUrl.searchParams.set('id', channelId)
  detailUrl.searchParams.set('key', YT_KEY)
  const detailRes = await fetch(detailUrl.toString())
  const detailData = await detailRes.json()
  const item = detailData.items?.[0]
  if (!item) return null
  return {
    channelId: item.id,
    title: item.snippet.title,
    description: item.snippet.description ?? '',
    subscriberCount: item.statistics.subscriberCount ?? '0',
    handle: (item.snippet.customUrl ?? item.id).replace('@', ''),
  }
}

async function fetchRecentVideos(channelId: string): Promise<YTVideo[]> {
  // Get uploads playlist ID
  const chUrl = new URL('https://www.googleapis.com/youtube/v3/channels')
  chUrl.searchParams.set('part', 'contentDetails')
  chUrl.searchParams.set('id', channelId)
  chUrl.searchParams.set('key', YT_KEY)
  const chRes = await fetch(chUrl.toString())
  const chData = await chRes.json()
  const playlistId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
  if (!playlistId) return []

  // Get video IDs
  const plUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems')
  plUrl.searchParams.set('part', 'contentDetails')
  plUrl.searchParams.set('playlistId', playlistId)
  plUrl.searchParams.set('maxResults', '30')
  plUrl.searchParams.set('key', YT_KEY)
  const plRes = await fetch(plUrl.toString())
  const plData = await plRes.json()
  const videoIds: string[] = (plData.items ?? []).map(
    (i: { contentDetails: { videoId: string } }) => i.contentDetails.videoId
  )
  if (!videoIds.length) return []

  // Get video details + stats
  const vUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
  vUrl.searchParams.set('part', 'snippet,statistics')
  vUrl.searchParams.set('id', videoIds.join(','))
  vUrl.searchParams.set('key', YT_KEY)
  const vRes = await fetch(vUrl.toString())
  const vData = await vRes.json()
  return (vData.items ?? []).map((item: {
    id: string
    snippet: { title: string; description: string; publishedAt: string }
    statistics: { viewCount?: string; likeCount?: string; commentCount?: string }
  }) => ({
    videoId: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    publishedAt: item.snippet.publishedAt,
    viewCount: item.statistics.viewCount ? parseInt(item.statistics.viewCount, 10) : undefined,
    likeCount: item.statistics.likeCount ? parseInt(item.statistics.likeCount, 10) : undefined,
    commentCount: item.statistics.commentCount ? parseInt(item.statistics.commentCount, 10) : undefined,
  }))
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function upsertCreator(channel: YTChannel, category: string, stats: { avg_views?: number; avg_engagement_rate?: number }) {
  const subs = parseInt(channel.subscriberCount || '0', 10)
  const tier =
    subs >= 1_000_000 ? 'mega' :
    subs >= 500_000  ? 'macro' :
    subs >= 100_000  ? 'mid' :
    subs >= 10_000   ? 'micro' : 'nano'

  const { data, error } = await sb
    .from('creators')
    .upsert({
      handle: channel.handle,
      platform: 'youtube',
      name: channel.title,
      bio: channel.description.substring(0, 500),
      category,
      region: 'pan-india',
      languages: ['Hindi', 'English'],
      followers_youtube: subs,
      pricing_tier: tier,
      avg_views: stats.avg_views ?? null,
      avg_engagement_rate: stats.avg_engagement_rate ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'handle,platform' })
    .select('id')
    .single()

  if (error) { console.error('[on-demand] creator upsert:', error.message); return null }
  return data?.id as string | null
}

async function upsertBrand(brand: { name: string; category: string; is_d2c: boolean }) {
  const { data } = await sb
    .from('brands')
    .upsert({ name: brand.name, category: brand.category, is_d2c: brand.is_d2c }, { onConflict: 'name' })
    .select('id')
    .single()
  return data?.id as string | null
}

async function insertCollab(creatorId: string, brandId: string, video: YTVideo, tags: string[], dealType: string) {
  await sb.from('collaborations').upsert({
    creator_id: creatorId,
    brand_id: brandId,
    collab_date: video.publishedAt.substring(0, 10),
    source: 'youtube_api',
    deal_type: dealType,
    evidence_url: `https://www.youtube.com/watch?v=${video.videoId}`,
    disclosure_tags: tags,
    notes: video.title.substring(0, 200),
  }, { onConflict: 'creator_id,brand_id,collab_date', ignoreDuplicates: true })
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()
    if (!query?.trim()) {
      return NextResponse.json({ error: 'query required' }, { status: 400 })
    }

    const q = query.trim().replace(/^@/, '')

    // 1. Try handle lookup first (1 quota unit)
    let channel = await lookupByHandle(q)

    // 2. Fall back to channel search (100 quota units)
    if (!channel) {
      channel = await searchChannel(q)
    }

    if (!channel) {
      return NextResponse.json({ error: 'Creator not found on YouTube' }, { status: 404 })
    }

    // 3. Fetch recent videos + compute stats
    const videos = await fetchRecentVideos(channel.channelId)
    const statsVideos = videos.filter(v => v.viewCount && v.viewCount > 0)
    const avg_views = statsVideos.length > 0
      ? Math.round(statsVideos.reduce((s, v) => s + (v.viewCount ?? 0), 0) / statsVideos.length)
      : undefined
    const avg_engagement_rate = statsVideos.length > 0
      ? parseFloat((statsVideos.reduce((s, v) =>
          s + ((v.likeCount ?? 0) + (v.commentCount ?? 0)) / (v.viewCount ?? 1)
        , 0) / statsVideos.length * 100).toFixed(2))
      : undefined

    // 4. Infer category from channel content
    const category = inferCategory(channel.title, channel.description)

    // 5. Upsert creator
    const creatorId = await upsertCreator(channel, category, { avg_views, avg_engagement_rate })
    if (!creatorId) {
      return NextResponse.json({ error: 'Failed to index creator' }, { status: 500 })
    }

    // 6. Extract brand mentions + upsert collabs
    let collabCount = 0
    for (const video of videos) {
      const fullText = video.title + ' ' + video.description
      const brands = extractBrandMentions(fullText)
      if (!brands.length) continue
      const tags = extractDisclosureTags(fullText)
      const dealType = inferDealType(fullText)
      for (const brand of brands) {
        const brandId = await upsertBrand(brand)
        if (!brandId) continue
        await insertCollab(creatorId, brandId, video, tags, dealType)
        collabCount++
      }
    }

    return NextResponse.json({
      handle: channel.handle,
      name: channel.title,
      followers_youtube: parseInt(channel.subscriberCount || '0', 10),
      avg_views,
      avg_engagement_rate,
      collab_count: collabCount,
    })
  } catch (e) {
    console.error('[on-demand-ingest] error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
