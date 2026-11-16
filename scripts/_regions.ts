import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
async function run() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  for (const region of ['pan-india','north-india','south-india','east-india','west-india']) {
    const { count } = await sb.from('creators').select('*', { count: 'exact', head: true }).eq('region', region)
    console.log(count, region)
  }
}
run()
