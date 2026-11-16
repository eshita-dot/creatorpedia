import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
async function run() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  await sb.from('creators').update({ available_for_collabs: false }).neq('claim_status', 'claimed')
  const { count: total } = await sb.from('creators').select('*', { count: 'exact', head: true })
  const { count: collabs } = await sb.from('collaborations').select('*', { count: 'exact', head: true })
  const { count: brands } = await sb.from('brands').select('*', { count: 'exact', head: true })
  const { data: regions } = await sb.from('creators').select('region').limit(5000)
  const rc = {}
  for (const c of regions) rc[c.region] = (rc[c.region] ?? 0) + 1
  console.log('Total creators:', total)
  console.log('Collaborations:', collabs)
  console.log('Brands:', brands)
  console.log('Regions:', JSON.stringify(rc))
}
run()
