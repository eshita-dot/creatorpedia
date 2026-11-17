import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const YT_KEY = process.env.YOUTUBE_API_KEY!
const APIFY_TOKEN = process.env.APIFY_TOKEN!

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
  JioMart: { category: 'Grocery & Retail', is_d2c: false },
  BigBasket: { category: 'Grocery Delivery', is_d2c: false },
  // Beauty — global + additional D2C
  Garnier: { category: 'Beauty', is_d2c: false },
  'L\'Oreal Paris': { category: 'Beauty', is_d2c: false },
  Maybelline: { category: 'Makeup', is_d2c: false },
  Neutrogena: { category: 'Skincare', is_d2c: false },
  Dermafique: { category: 'Skincare', is_d2c: false },
  'Lotus Herbals': { category: 'Ayurvedic Beauty', is_d2c: false },
  'Forest Essentials': { category: 'Luxury Ayurvedic Beauty', is_d2c: false },
  'Kama Ayurveda': { category: 'Luxury Ayurvedic Beauty', is_d2c: true },
  'Earth Rhythm': { category: 'D2C Skincare', is_d2c: true },
  'Re\'equil': { category: 'D2C Skincare', is_d2c: true },
  'Juicy Chemistry': { category: 'D2C Skincare', is_d2c: true },
  'Bella Vita Organic': { category: 'D2C Beauty', is_d2c: true },
  'Just Herbs': { category: 'D2C Skincare', is_d2c: true },
  Colorbar: { category: 'Makeup', is_d2c: false },
  'Kay Beauty': { category: 'D2C Makeup', is_d2c: true },
  // Men's grooming D2C
  Beardo: { category: 'D2C Men\'s Grooming', is_d2c: true },
  'The Man Company': { category: 'D2C Men\'s Grooming', is_d2c: true },
  'Bombay Shaving Company': { category: 'D2C Men\'s Grooming', is_d2c: true },
  'Man Arden': { category: 'D2C Men\'s Grooming', is_d2c: true },
  // Fashion — ethnic, sports, affordable
  Fabindia: { category: 'Ethnic Fashion Retail', is_d2c: false },
  Biba: { category: 'Ethnic Fashion', is_d2c: false },
  'Global Desi': { category: 'Fashion', is_d2c: false },
  Zudio: { category: 'Affordable Fashion', is_d2c: false },
  Libas: { category: 'D2C Women\'s Fashion', is_d2c: true },
  DaMENSCH: { category: 'D2C Men\'s Fashion', is_d2c: true },
  Blissclub: { category: 'D2C Women\'s Activewear', is_d2c: true },
  HRX: { category: 'D2C Activewear', is_d2c: true },
  Puma: { category: 'Sports Fashion', is_d2c: false },
  Adidas: { category: 'Sports Fashion', is_d2c: false },
  Nike: { category: 'Sports Fashion', is_d2c: false },
  Decathlon: { category: 'Sports Retail', is_d2c: false },
  // Jewelry
  Tanishq: { category: 'Jewelry Retail', is_d2c: false },
  CaratLane: { category: 'D2C Jewelry', is_d2c: true },
  'Malabar Gold': { category: 'Jewelry Retail', is_d2c: false },
  'Senco Gold': { category: 'Jewelry Retail', is_d2c: false },
  // EdTech
  "BYJU'S": { category: 'EdTech', is_d2c: false },
  Vedantu: { category: 'EdTech', is_d2c: false },
  upGrad: { category: 'EdTech', is_d2c: false },
  'Physics Wallah': { category: 'EdTech', is_d2c: false },
  'Scaler Academy': { category: 'EdTech', is_d2c: false },
  // Food & Beverage — D2C
  'Country Delight': { category: 'D2C Dairy', is_d2c: true },
  'Blue Tokai': { category: 'D2C Coffee', is_d2c: true },
  'Sleepy Owl': { category: 'D2C Coffee', is_d2c: true },
  Vahdam: { category: 'D2C Tea', is_d2c: true },
  'Haldiram\'s': { category: 'Snacks & FMCG', is_d2c: false },
  Bikaji: { category: 'Snacks & FMCG', is_d2c: false },
  Farmley: { category: 'D2C Healthy Snacks', is_d2c: true },
  Happilo: { category: 'D2C Healthy Snacks', is_d2c: true },
  'Slurrp Farm': { category: 'D2C Kids Food', is_d2c: true },
  // Health & Wellness
  PharmEasy: { category: 'Health Tech', is_d2c: false },
  Netmeds: { category: 'Health Tech', is_d2c: false },
  'Apollo Pharmacy': { category: 'Pharmacy Retail', is_d2c: false },
  Cultfit: { category: 'Fitness', is_d2c: false },
  Ultrahuman: { category: 'D2C Health Tech', is_d2c: true },
  Kapiva: { category: 'D2C Ayurveda', is_d2c: true },
  'Organic India': { category: 'Organic Wellness', is_d2c: false },
  'The Moms Co': { category: 'D2C Maternity Care', is_d2c: true },
  'Pee Safe': { category: 'D2C Hygiene', is_d2c: true },
  Carmesi: { category: 'D2C Period Care', is_d2c: true },
  Nua: { category: 'D2C Women\'s Wellness', is_d2c: true },
  // Electronics — smartphones + audio D2C
  Vivo: { category: 'Consumer Electronics', is_d2c: false },
  Oppo: { category: 'Consumer Electronics', is_d2c: false },
  iQOO: { category: 'Consumer Electronics', is_d2c: false },
  JBL: { category: 'Audio Electronics', is_d2c: false },
  'Fire-Boltt': { category: 'D2C Smartwatches', is_d2c: true },
  Fastrack: { category: 'Fashion Accessories', is_d2c: false },
  Titan: { category: 'Watches & Jewelry', is_d2c: false },
  Mivi: { category: 'D2C Audio', is_d2c: true },
  Crossbeats: { category: 'D2C Audio', is_d2c: true },
  pTron: { category: 'D2C Electronics', is_d2c: true },
  Atomberg: { category: 'D2C Smart Appliances', is_d2c: true },
  Prestige: { category: 'Kitchen Appliances', is_d2c: false },
  // Travel & Hospitality
  MakeMyTrip: { category: 'Travel Tech', is_d2c: false },
  Goibibo: { category: 'Travel Tech', is_d2c: false },
  OYO: { category: 'Hospitality Tech', is_d2c: false },
  EaseMyTrip: { category: 'Travel Tech', is_d2c: false },
  // Home & Sleep
  Pepperfry: { category: 'Furniture & Home Decor', is_d2c: false },
  'Urban Ladder': { category: 'D2C Furniture', is_d2c: true },
  'The Sleep Company': { category: 'D2C Sleep', is_d2c: true },
  Sleepyhead: { category: 'D2C Sleep', is_d2c: true },
  // Fintech — additional
  BharatPe: { category: 'Fintech', is_d2c: false },
  MobiKwik: { category: 'Fintech', is_d2c: false },
  Jar: { category: 'D2C Savings', is_d2c: false },
  Navi: { category: 'Fintech', is_d2c: false },
  Slice: { category: 'Neobank', is_d2c: false },
  KreditBee: { category: 'Fintech Lending', is_d2c: false },
  // Services & Mobility
  'Urban Company': { category: 'Home Services', is_d2c: false },
  Rapido: { category: 'Mobility Tech', is_d2c: false },
  'Ola Electric': { category: 'EV Mobility', is_d2c: false },
  'Ather Energy': { category: 'D2C EV', is_d2c: true },
  // Pets
  'Heads Up For Tails': { category: 'D2C Pet Care', is_d2c: true },
  Supertails: { category: 'D2C Pet Care', is_d2c: true },
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
  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/channels')
    url.searchParams.set('part', 'snippet,statistics')
    url.searchParams.set('forHandle', handle)
    url.searchParams.set('key', YT_KEY)
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(3000) })
    const data = await res.json()
    const item = data.items?.[0]
    if (!item) return null
    // Skip channels with 0 subscribers — likely a dead/secondary account (e.g., bhuvan.bam22)
    if (!item.statistics?.subscriberCount || item.statistics.subscriberCount === '0') return null
    return {
      channelId: item.id,
      title: item.snippet.title,
      description: item.snippet.description ?? '',
      subscriberCount: item.statistics.subscriberCount ?? '0',
      handle: (item.snippet.customUrl ?? item.id).replace('@', ''),
    }
  } catch {
    return null
  }
}

async function searchChannel(query: string): Promise<YTChannel | null> {
  // search.list costs 100 quota units — only used as fallback
  try {
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
    searchUrl.searchParams.set('part', 'snippet')
    searchUrl.searchParams.set('q', query)
    searchUrl.searchParams.set('type', 'channel')
    searchUrl.searchParams.set('regionCode', 'IN')
    searchUrl.searchParams.set('maxResults', '1')
    searchUrl.searchParams.set('key', YT_KEY)
    const searchRes = await fetch(searchUrl.toString(), { signal: AbortSignal.timeout(3000) })
    const searchData = await searchRes.json()
    const channelId = searchData.items?.[0]?.id?.channelId
    if (!channelId) return null

    const detailUrl = new URL('https://www.googleapis.com/youtube/v3/channels')
    detailUrl.searchParams.set('part', 'snippet,statistics')
    detailUrl.searchParams.set('id', channelId)
    detailUrl.searchParams.set('key', YT_KEY)
    const detailRes = await fetch(detailUrl.toString(), { signal: AbortSignal.timeout(3000) })
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
  } catch {
    return null
  }
}

async function fetchRecentVideos(channelId: string): Promise<YTVideo[]> {
  try {
    // Uploads playlist ID = channel ID with "UC" prefix replaced by "UU" (saves 1 API call)
    const playlistId = channelId.replace(/^UC/, 'UU')

    const plUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems')
    plUrl.searchParams.set('part', 'contentDetails')
    plUrl.searchParams.set('playlistId', playlistId)
    plUrl.searchParams.set('maxResults', '12')
    plUrl.searchParams.set('key', YT_KEY)
    const plRes = await fetch(plUrl.toString(), { signal: AbortSignal.timeout(3000) })
    const plData = await plRes.json()
    const videoIds: string[] = (plData.items ?? []).map(
      (i: { contentDetails: { videoId: string } }) => i.contentDetails.videoId
    )
    if (!videoIds.length) return []

    const vUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
    vUrl.searchParams.set('part', 'snippet,statistics')
    vUrl.searchParams.set('id', videoIds.join(','))
    vUrl.searchParams.set('key', YT_KEY)
    const vRes = await fetch(vUrl.toString(), { signal: AbortSignal.timeout(3000) })
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
  } catch {
    return []
  }
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

// ── Instagram profile + posts via Apify (single actor call) ──────────────────

interface IGProfile {
  username: string
  fullName?: string
  biography?: string
  followersCount?: number
  isVerified?: boolean
}

interface IGPost {
  shortCode?: string
  url?: string
  likesCount?: number
  commentsCount?: number
  caption?: string
  captionText?: string
  timestamp?: string
  takenAtTimestamp?: number
  type?: string
  videoViewCount?: number
  paidPartnership?: boolean
}

// Profile scraper also returns latestPosts[] — read both from one response
async function scrapeInstagramProfile(handle: string): Promise<{ profile: IGProfile | null; posts: IGPost[] }> {
  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [handle], resultsLimit: 1 }),
        signal: AbortSignal.timeout(20000),
      }
    )
    if (!res.ok) return { profile: null, posts: [] }
    const items = await res.json() as Array<IGProfile & { latestPosts?: IGPost[] }>
    const account = items[0]
    if (!account?.username) return { profile: null, posts: [] }
    return {
      profile: {
        username: account.username,
        fullName: account.fullName,
        biography: account.biography,
        followersCount: account.followersCount,
        isVerified: account.isVerified,
      },
      posts: account.latestPosts ?? [],
    }
  } catch {
    return { profile: null, posts: [] }
  }
}

// Fallback posts scraper — runs in parallel with profile; whichever returns posts first wins
async function scrapeInstagramPosts(handle: string): Promise<IGPost[]> {
  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directUrls: [`https://www.instagram.com/${handle}/`],
          resultsType: 'posts',
          resultsLimit: 8,
        }),
        signal: AbortSignal.timeout(20000),
      }
    )
    if (!res.ok) return []
    return await res.json() as IGPost[]
  } catch {
    return []
  }
}

function getPostCaption(post: IGPost): string {
  return post.caption ?? post.captionText ?? ''
}

function getPostDate(post: IGPost): string {
  if (post.timestamp) return post.timestamp.substring(0, 10)
  if (post.takenAtTimestamp) return new Date(post.takenAtTimestamp * 1000).toISOString().substring(0, 10)
  return new Date().toISOString().substring(0, 10)
}

function calcIGEngagementRate(posts: IGPost[], followers: number): number | undefined {
  if (!followers || !posts.length) return undefined
  const valid = posts.filter(p => (p.likesCount ?? 0) > 0 || (p.commentsCount ?? 0) > 0)
  if (!valid.length) return undefined
  const avgInteractions = valid.reduce((s, p) => s + (p.likesCount ?? 0) + (p.commentsCount ?? 0), 0) / valid.length
  return parseFloat((avgInteractions / followers * 100).toFixed(2))
}

function calcIGAvgViews(posts: IGPost[]): number | undefined {
  const videoPosts = posts.filter(p =>
    (p.type === 'Video' || p.type === 'Reel') && (p.videoViewCount ?? 0) > 0
  )
  if (!videoPosts.length) return undefined
  return Math.round(videoPosts.reduce((s, p) => s + (p.videoViewCount ?? 0), 0) / videoPosts.length)
}

async function upsertInstagramCreator(
  profile: IGProfile,
  category: string,
  stats: { avg_engagement_rate?: number; avg_views?: number } = {}
) {
  const followers = profile.followersCount ?? 0
  const tier =
    followers >= 1_000_000 ? 'mega' :
    followers >= 500_000   ? 'macro' :
    followers >= 100_000   ? 'mid' :
    followers >= 10_000    ? 'micro' : 'nano'

  const { data, error } = await sb
    .from('creators')
    .upsert({
      handle: profile.username,
      platform: 'instagram',
      name: profile.fullName || profile.username,
      bio: (profile.biography ?? '').substring(0, 500),
      instagram_handle: profile.username,
      category,
      region: 'pan-india',
      languages: ['Hindi', 'English'],
      followers_instagram: followers,
      pricing_tier: tier,
      avg_engagement_rate: stats.avg_engagement_rate ?? null,
      avg_views: stats.avg_views ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'handle,platform' })
    .select('id')
    .single()

  if (error) { console.error('[on-demand] IG upsert:', error.message); return null }
  return data?.id as string | null
}

async function insertIGCollab(
  creatorId: string, brandId: string, post: IGPost, tags: string[], dealType: string
) {
  const evidenceUrl = post.shortCode
    ? `https://www.instagram.com/p/${post.shortCode}/`
    : post.url
  await sb.from('collaborations').upsert({
    creator_id: creatorId,
    brand_id: brandId,
    collab_date: getPostDate(post),
    source: 'instagram_post',
    deal_type: dealType,
    evidence_url: evidenceUrl,
    disclosure_tags: tags,
    notes: getPostCaption(post).substring(0, 200),
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
    const isHandleLike = !q.includes(' ') && q.length >= 3
    // YouTube handles don't allow underscores — skip lookup to save time for Instagram-style handles
    const isYouTubeHandleLike = isHandleLike && !q.includes('_')
    // 1. Try YouTube handle lookup (1 quota unit)
    let channel = isYouTubeHandleLike ? await lookupByHandle(q) : null

    // 2. If handle-like and no YT match, try Instagram — both run in parallel, posts merged from either
    if (!channel && isHandleLike && APIFY_TOKEN) {
      const [{ profile: igProfile, posts: profilePosts }, scraperPosts] = await Promise.all([
        scrapeInstagramProfile(q),
        scrapeInstagramPosts(q),
      ])
      // Use latestPosts from profile scraper; fall back to dedicated posts scraper if richer
      const igPosts = (profilePosts.length >= scraperPosts.length ? profilePosts : scraperPosts)

      if (igProfile?.username) {
        const category = inferCategory(igProfile.fullName ?? '', igProfile.biography ?? '')
        const followers = igProfile.followersCount ?? 0
        const avg_engagement_rate = calcIGEngagementRate(igPosts, followers)
        const avg_views = calcIGAvgViews(igPosts)

        const creatorId = await Promise.race([
          upsertInstagramCreator(igProfile, category, { avg_engagement_rate, avg_views }),
          new Promise<null>(resolve => setTimeout(() => resolve(null), 4000)),
        ])

        // Extract brand mentions across all posts
        type BrandCollab = {
          brand: { name: string; category: string; is_d2c: boolean }
          post: IGPost; tags: string[]; dealType: string
        }
        const toIndex: BrandCollab[] = []
        for (const post of igPosts) {
          const caption = getPostCaption(post)
          const isSponsored = post.paidPartnership === true || DISCLOSURE_PATTERNS.some(p => p.test(caption))
          if (!isSponsored && !caption) continue
          const brands = extractBrandMentions(caption)
          if (!brands.length) continue
          const tags = [
            ...(post.paidPartnership ? ['paid partnership'] : []),
            ...extractDisclosureTags(caption),
          ]
          const dealType = post.paidPartnership ? 'paid' : inferDealType(caption)
          for (const brand of brands) toIndex.push({ brand, post, tags, dealType })
        }

        // Deduplicate to latest post per brand, then batch upsert with 5s budget
        if (creatorId && toIndex.length > 0) {
          const latestIG = new Map<string, typeof toIndex[0]>()
          for (const item of toIndex) {
            const ex = latestIG.get(item.brand.name)
            const itemDate = getPostDate(item.post)
            if (!ex || itemDate > getPostDate(ex.post)) latestIG.set(item.brand.name, item)
          }
          const dedupedIG = [...latestIG.values()]
          const igBudget = new Promise<void>(resolve => setTimeout(resolve, 5000))
          await Promise.race([
            (async () => {
              const brandIds = await Promise.all(dedupedIG.map(x => upsertBrand(x.brand)))
              const brandIdMap = new Map(dedupedIG.map((x, i) => [x.brand.name, brandIds[i]]))
              await Promise.all(dedupedIG.map(x => {
                const brandId = brandIdMap.get(x.brand.name)
                if (!brandId) return
                return insertIGCollab(creatorId, brandId, x.post, x.tags, x.dealType)
              }))
            })(),
            igBudget,
          ])
        }

        return NextResponse.json({
          handle: igProfile.username,
          name: igProfile.fullName || igProfile.username,
          platform: 'instagram',
          followers_instagram: followers,
          avg_engagement_rate,
          avg_views,
          collab_count: toIndex.length,
        })
      }
    }

    // 3. Fall back to YouTube channel search (100 quota units) — handles name queries too
    if (!channel) {
      const found = await searchChannel(q)
      // Discard micro-channels from search noise (< 1000 subs is not a creator)
      if (found && parseInt(found.subscriberCount || '0', 10) >= 1000) {
        channel = found
      }
    }

    if (!channel) {
      return NextResponse.json({ error: 'Creator not found on YouTube or Instagram' }, { status: 404 })
    }

    // 4. Fetch recent videos + compute stats
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

    const category = inferCategory(channel.title, channel.description)

    // 5. Upsert creator (10s budget — Supabase sometimes hangs; still return data if it does)
    const creatorId = await Promise.race([
      upsertCreator(channel, category, { avg_views, avg_engagement_rate }),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 10000)),
    ])

    // 6. Extract brand mentions from video titles + descriptions, batch upsert collabs
    type YTCollab = { brand: { name: string; category: string; is_d2c: boolean }; video: YTVideo; tags: string[]; dealType: string }
    const toIndexYT: YTCollab[] = []
    for (const video of videos) {
      const fullText = video.title + ' ' + video.description
      const brands = extractBrandMentions(fullText)
      if (!brands.length) continue
      const tags = extractDisclosureTags(fullText)
      const dealType = inferDealType(fullText)
      for (const brand of brands) toIndexYT.push({ brand, video, tags, dealType })
    }

    let collabCount = 0
    if (creatorId && toIndexYT.length > 0) {
      // Keep only the most recent video per brand to bound Supabase calls
      const latestByBrand = new Map<string, typeof toIndexYT[0]>()
      for (const item of toIndexYT) {
        const ex = latestByBrand.get(item.brand.name)
        if (!ex || item.video.publishedAt > ex.video.publishedAt) latestByBrand.set(item.brand.name, item)
      }
      const deduped = [...latestByBrand.values()]

      // 5s budget for all collab writes — if Supabase hangs, we still return creator data
      const collabBudget = new Promise<void>(resolve => setTimeout(resolve, 5000))
      await Promise.race([
        (async () => {
          const brandIds = await Promise.all(deduped.map(x => upsertBrand(x.brand)))
          const brandIdMap = new Map(deduped.map((x, i) => [x.brand.name, brandIds[i]]))
          await Promise.all(deduped.map(x => {
            const brandId = brandIdMap.get(x.brand.name)
            if (!brandId) return
            collabCount++
            return insertCollab(creatorId, brandId, x.video, x.tags, x.dealType)
          }))
        })(),
        collabBudget,
      ])
    }

    return NextResponse.json({
      handle: channel.handle,
      name: channel.title,
      platform: 'youtube',
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
