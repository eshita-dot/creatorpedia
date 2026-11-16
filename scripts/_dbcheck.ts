import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
async function check() {
  const { count: withAvgViews } = await sb.from('creators').select('*', { count: 'exact', head: true }).not('avg_views', 'is', null)
  const { count: withER } = await sb.from('creators').select('*', { count: 'exact', head: true }).not('avg_engagement_rate', 'is', null)
  const { count: withIG } = await sb.from('creators').select('*', { count: 'exact', head: true }).not('followers_instagram', 'is', null)
  console.log('avg_views populated:', withAvgViews, '/ 1952')
  console.log('avg_engagement_rate populated:', withER, '/ 1952')
  console.log('instagram followers populated:', withIG, '/ 1952')
}
check().catch(console.error)
