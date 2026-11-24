'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Shield, Zap } from 'lucide-react'
import { PLAN_PRICE_INR, PLAN_LABEL } from '@/lib/subscription'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, any>) => { open(): void }
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function SubscribePage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', agency_name: '' })
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email.trim()) return
    setState('loading')
    setErrorMsg('')

    const loaded = await loadRazorpayScript()
    if (!loaded) { setErrorMsg('Could not load payment gateway. Please refresh and try again.'); setState('error'); return }

    // Create order
    const orderRes = await fetch('/api/subscribe/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email, agency_name: form.agency_name }),
    })
    const order = await orderRes.json()
    if (!orderRes.ok) { setErrorMsg(order.error ?? 'Could not create order'); setState('error'); return }

    // Open Razorpay
    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: 'The Creatorpedia',
      description: `${PLAN_LABEL} — 30 days`,
      prefill: { email: form.email },
      theme: { color: '#7c3aed' },
      handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
        // Verify + activate
        const verifyRes = await fetch('/api/subscribe/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            email: form.email,
            agency_name: form.agency_name,
          }),
        })
        const result = await verifyRes.json()
        if (result.ok) {
          setState('success')
          setTimeout(() => router.push('/compare'), 2000)
        } else {
          setErrorMsg(result.error ?? 'Payment verification failed')
          setState('error')
        }
      },
      modal: {
        ondismiss: () => setState('idle'),
      },
    })
    rzp.open()
    setState('idle')
  }

  if (state === 'success') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-4 size-14 text-green-500" />
          <h2 className="text-xl font-bold">You're in!</h2>
          <p className="mt-2 text-sm text-muted-foreground">Activating your access, redirecting…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="mb-8 text-center">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          <Zap className="size-3" />
          Early Access
        </span>
        <h1 className="mt-3 text-2xl font-bold">Activate your subscription</h1>
        <p className="mt-2 text-sm text-muted-foreground">30 days of full agency access, starting today.</p>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{PLAN_LABEL}</p>
            <p className="text-xs text-muted-foreground">30-day access</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">₹{PLAN_PRICE_INR.toLocaleString('en-IN')}</p>
            <p className="text-xs text-muted-foreground">incl. taxes</p>
          </div>
        </div>
        <div className="mt-4 border-t border-border pt-4 space-y-1.5">
          {[
            'Unlimited creator lookups',
            'Full brand collaboration history',
            'Competitive comparison (4 brands)',
            'CSV export',
          ].map(f => (
            <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5 shrink-0 text-brand-500" />
              {f}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handlePay} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Work email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="you@agency.com"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-400 transition-colors"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Agency name</label>
          <input
            value={form.agency_name}
            onChange={e => setForm(f => ({ ...f, agency_name: e.target.value }))}
            placeholder="Your agency name"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-400 transition-colors"
          />
        </div>

        {state === 'error' && (
          <p className="text-xs text-red-600">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={state === 'loading'}
          className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
        >
          {state === 'loading' ? 'Opening payment…' : `Pay ₹${PLAN_PRICE_INR.toLocaleString('en-IN')} & Activate`}
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <Shield className="size-3" />
          Secured by Razorpay. Your card is never stored.
        </div>
      </form>
    </div>
  )
}
