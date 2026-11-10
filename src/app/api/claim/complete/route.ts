import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { handle, ...updates } = body

  if (!handle) return NextResponse.json({ error: 'Handle required' }, { status: 400 })

  const { data: creator } = await supabase
    .from('creators')
    .select('id, claim_status, claimed_user_id')
    .eq('handle', handle)
    .single()

  if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 })

  if (creator.claim_status === 'claimed' && creator.claimed_user_id !== user.id) {
    return NextResponse.json({ error: 'Profile already claimed by another user' }, { status: 403 })
  }

  // Use service role key to bypass RLS for the initial claim
  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await service
    .from('creators')
    .update({
      claim_status: 'claimed',
      claimed_user_id: user.id,
      verified: true,
      ...updates,
    })
    .eq('handle', handle)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
