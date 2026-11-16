import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
async function run() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const { error } = await sb.from('creators').update({ available_for_collabs: false }).neq('claim_status', 'claimed')
  if (error) console.error(error.message)
  else console.log('All unclaimed creators reset to available_for_collabs=false')
}
run()
