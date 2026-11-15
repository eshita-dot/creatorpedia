/**
 * Backfill avg_views and avg_engagement_rate for all existing YouTube creators.
 *
 * Usage:
 *   npx tsx scripts/refresh-yt-stats.ts
 *   npx tsx scripts/refresh-yt-stats.ts --limit 100   # test with first 100
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const YT_KEY = process.env.YOUTUBE_API_KEY!

async function getUploadsPlaylistId(handle: string): Promise<{ channelId: string; playlistId: string } | null> {
  const url = new URL('https://www.googleapis.com/youtube/v3/channels')
  url.searchParams.set('part', 'contentDetails')
  url.searchParams.set('forHandle', handle)
  url.searchParams.set('key', YT_KEY)
  const res = await fetch(url.toString())
  const data = await res.json()
  const item = data.items?.[0]
  if (!item) return null
  return {
    channelId: item.id,
    playlistId: item.contentDetails.relatedPlaylists.uploads,
  }
}

async function getVideoIds(playlistId: string): Promise<string[]> {
  const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems')
  url.searchParams.set('part', 'contentDetails')
  url.searchParams.set('playlistId', playlistId)
  url.searchParams.set('maxResults', '30')
  url.searchParams.set('key', YT_KEY)
  const res = await fetch(url.toString())
  const data = await res.json()
  return (data.items ?? []).map((i: { contentDetails: { videoId: string } }) => i.contentDetails.videoId)
}

async function getVideoStats(videoIds: string[]): Promise<Array<{ viewCount: number; likeCount: number; commentCount: number }>> {
  const url = new URL('https://www.googleapis.com/youtube/v3/videos')
  url.searchParams.set('part', 'statistics')
  url.searchParams.set('id', videoIds.join(','))
  url.searchParams.set('key', YT_KEY)
  const res = await fetch(url.toString())
  const data = await res.json()
  return (data.items ?? [])
    .map((i: { statistics: { viewCount?: string; likeCount?: string; commentCount?: string } }) => ({
      viewCount: parseInt(i.statistics.viewCount ?? '0', 10),
      likeCount: parseInt(i.statistics.likeCount ?? '0', 10),
      commentCount: parseInt(i.statistics.commentCount ?? '0', 10),
    }))
    .filter((s: { viewCount: number }) => s.viewCount > 0)
}

async function run() {
  const args = process.argv.slice(2)
  const limitFlag = args.indexOf('--limit')
  const limit = limitFlag !== -1 ? parseInt(args[limitFlag + 1], 10) : 10000

  // Fetch all YouTube creators (platform = youtube or both)
  let creators: Array<{ id: string; handle: string; name: string }> = []
  let from = 0
  while (true) {
    const { data } = await sb
      .from('creators')
      .select('id, handle, name')
      .in('platform', ['youtube', 'both'])
      .range(from, from + 999)
    if (!data || data.length === 0) break
    creators = creators.concat(data)
    if (data.length < 1000) break
    from += 1000
  }

  creators = creators.slice(0, limit)
  console.log(`Refreshing stats for ${creators.length} creators...`)

  let updated = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < creators.length; i++) {
    const creator = creators[i]
    process.stdout.write(`[${i + 1}/${creators.length}] ${creator.name} (@${creator.handle}) ... `)

    try {
      const channel = await getUploadsPlaylistId(creator.handle)
      if (!channel) {
        console.log('no channel found')
        skipped++
        await new Promise(r => setTimeout(r, 100))
        continue
      }

      const videoIds = await getVideoIds(channel.playlistId)
      if (videoIds.length === 0) {
        console.log('no videos')
        skipped++
        await new Promise(r => setTimeout(r, 100))
        continue
      }

      const stats = await getVideoStats(videoIds)
      if (stats.length === 0) {
        console.log('no stats')
        skipped++
        await new Promise(r => setTimeout(r, 100))
        continue
      }

      const avg_views = Math.round(stats.reduce((s, v) => s + v.viewCount, 0) / stats.length)
      const avg_engagement_rate = parseFloat(
        (stats.reduce((s, v) => s + (v.likeCount + v.commentCount) / v.viewCount, 0) / stats.length * 100).toFixed(2)
      )

      const { error } = await sb
        .from('creators')
        .update({ avg_views, avg_engagement_rate, updated_at: new Date().toISOString() })
        .eq('id', creator.id)

      if (error) {
        console.log(`DB error: ${error.message}`)
        failed++
      } else {
        console.log(`${avg_views.toLocaleString()} avg views, ${avg_engagement_rate}% ER`)
        updated++
      }
    } catch (e) {
      console.log(`error: ${(e as Error).message}`)
      failed++
    }

    // ~300ms between creators to stay well under YouTube quota
    await new Promise(r => setTimeout(r, 300))
  }

  console.log(`\nDone. Updated: ${updated}, skipped: ${skipped}, failed: ${failed}`)
}

run().catch(e => { console.error(e); process.exit(1) })
