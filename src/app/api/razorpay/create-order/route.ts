import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(req: NextRequest) {
  try {
    const { creatorId } = await req.json()

    const order = await razorpay.orders.create({
      amount: 49900, // ₹499 in paise
      currency: 'INR',
      receipt: `unlock_${creatorId}_${Date.now()}`.substring(0, 40),
      notes: { creatorId },
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[create-order] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
