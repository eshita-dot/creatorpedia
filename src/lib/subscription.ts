import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

import { SESSION_COOKIE, PLAN_PRICE_INR, PLAN_LABEL } from './subscription-constants'
export { SESSION_COOKIE, PLAN_PRICE_INR, PLAN_LABEL }

export interface Subscription {
  id: string
  email: string
  agency_name: string | null
  plan: string
  status: string
  ends_at: string
}

export async function getSubscription(): Promise<Subscription | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const { data } = await sb
    .from('subscriptions')
    .select('id, email, agency_name, plan, status, ends_at')
    .eq('session_token', token)
    .eq('status', 'active')
    .gt('ends_at', new Date().toISOString())
    .single()

  return data ?? null
}

export async function isSubscribed(): Promise<boolean> {
  return (await getSubscription()) !== null
}
