import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
async function run() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { count: total } = await sb.from('creators').select('*', { count: 'exact', head: true })
  const { count: claimed } = await sb.from('creators').select('*', { count: 'exact', head: true }).eq('claim_status', 'claimed')
  const { count: verified } = await sb.from('creators').select('*', { count: 'exact', head: true }).eq('verified', true)
  const { count: available } = await sb.from('creators').select('*', { count: 'exact', head: true }).eq('available_for_collabs', true)
  const { count: brands } = await sb.from('brands').select('*', { count: 'exact', head: true })
  const { count: collabs } = await sb.from('collaborations').select('*', { count: 'exact', head: true })
  console.log('Total creators:', total)
  console.log('Claimed profiles:', claimed)
  console.log('Verified:', verified)
  console.log('Open for collabs:', available)
  console.log('Brands indexed:', brands)
  console.log('Collaborations indexed:', collabs)
}
run()
