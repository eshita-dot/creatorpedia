// Netlify scheduled function — runs every Monday 3am IST (Sunday 21:30 UTC)
// Calls the Next.js refresh endpoint to re-index stale creators

export default async () => {
  const secret = process.env.CRON_SECRET ?? ''
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://creatorpedia.in'

  try {
    const res = await fetch(`${siteUrl}/api/refresh-creators?secret=${secret}`, {
      signal: AbortSignal.timeout(270000), // 4.5 min — Netlify functions max 5 min
    })
    const data = await res.json()
    console.log('[cron] refresh-creators result:', JSON.stringify(data))
  } catch (err) {
    console.error('[cron] refresh-creators failed:', err)
  }
}

export const config = {
  schedule: '30 21 * * 0', // Every Sunday 21:30 UTC = Monday 3:00 IST
}
