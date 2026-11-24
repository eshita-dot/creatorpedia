import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { name, agency_name, email, use_case } = await req.json()

    if (!name?.trim() || !agency_name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name, agency name and email are required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const { error } = await sb.from('waitlist').insert({
      name: name.trim(),
      agency_name: agency_name.trim(),
      email: email.trim().toLowerCase(),
      use_case: use_case?.trim() || null,
    })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This email is already on the waitlist' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[waitlist] error:', e)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
