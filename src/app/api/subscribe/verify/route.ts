import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { SESSION_COOKIE } from '@/lib/subscription'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, agency_name } =
      await req.json()

    // Verify Razorpay signature
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expected !== razorpay_signature) {
      return NextResponse.json({ ok: false, error: 'Invalid payment signature' }, { status: 400 })
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex')
    const endsAt = new Date()
    endsAt.setDate(endsAt.getDate() + 30)

    // Store subscription
    const { error } = await sb.from('subscriptions').insert({
      email: email.trim().toLowerCase(),
      agency_name: agency_name?.trim() || null,
      session_token: sessionToken,
      razorpay_order_id,
      razorpay_payment_id,
      ends_at: endsAt.toISOString(),
    })

    if (error) {
      console.error('[subscribe/verify] DB insert:', error)
      return NextResponse.json({ ok: false, error: 'Could not activate subscription' }, { status: 500 })
    }

    // Update waitlist status if they were on it
    await sb
      .from('waitlist')
      .update({ status: 'subscribed' })
      .eq('email', email.trim().toLowerCase())

    // Set session cookie — 30 days
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[subscribe/verify]', e)
    return NextResponse.json({ ok: false, error: 'Something went wrong' }, { status: 500 })
  }
}
