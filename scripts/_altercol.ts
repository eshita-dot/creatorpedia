import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
async function run() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const { error } = await sb.rpc('exec_sql', { sql: "ALTER TABLE creators ALTER COLUMN available_for_collabs SET DEFAULT false" })
  if (error) console.error('RPC error (expected if exec_sql not available):', error.message)
  else console.log('Column default updated')
}
run()
