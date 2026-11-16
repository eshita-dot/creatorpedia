import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
async function run() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  // Fetch in batches to get all 1952
  let all: any[] = []
  let from = 0
  while (true) {
    const { data } = await sb.from('creators').select('id, name, handle, bio').range(from, from + 999)
    if (!data || data.length === 0) break
    all = all.concat(data)
    if (data.length < 1000) break
    from += 1000
  }
  // Extract instagram handles from bios
  const igRegex = /(?:instagram\.com\/|@)([\w.]+)/gi
  let withIg = 0
  const samples: string[] = []
  for (const c of all) {
    const text = c.bio ?? ''
    const matches = [...text.matchAll(igRegex)]
    if (matches.length > 0) {
      withIg++
      if (samples.length < 10) samples.push(`${c.name}: ${matches.map(m => m[1]).join(', ')}`)
    }
  }
  console.log(`Total creators: ${all.length}`)
  console.log(`With Instagram handle in bio: ${withIg}`)
  console.log('\nSamples:')
  samples.forEach(s => console.log(' -', s))
}
run()
