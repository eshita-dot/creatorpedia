import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { PLAN_PRICE_INR } from '@/lib/subscription'

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(req: NextRequest) {
  try {
    const { email, agency_name } = await req.json()
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const order = await razorpay.orders.create({
      amount: PLAN_PRICE_INR * 100, // paise
      currency: 'INR',
      receipt: `sub_${Date.now()}`.substring(0, 40),
      notes: { email: email.trim().toLowerCase(), agency_name: agency_name?.trim() ?? '' },
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[subscribe/create-order]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
