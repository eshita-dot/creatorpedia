'use client'

import { useState } from 'react'
import { Lock, Loader2 } from 'lucide-react'

interface PaywallGateProps {
  hiddenCount: number
  creatorName: string
  creatorId: string
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, any>) => { open(): void }
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve()
    script.onerror = reject
    document.body.appendChild(script)
  })
}

export function PaywallGate({ hiddenCount, creatorName, creatorId }: PaywallGateProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUnlock() {
    setLoading(true)
    setError(null)
    try {
      await loadRazorpayScript()

      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId }),
      })
      if (!orderRes.ok) throw new Error('Failed to create order')
      const { orderId, amount, currency, keyId } = await orderRes.json()

      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        order_id: orderId,
        name: 'The Creatorpedia',
        description: `Unlock ${creatorName}'s full profile`,
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, creatorId }),
          })
          if (verifyRes.ok) {
            window.location.reload()
          } else {
            setError('Payment verification failed. Contact support.')
            setLoading(false)
          }
        },
        theme: { color: '#7c3aed' },
        modal: { ondismiss: () => setLoading(false) },
      })
      rzp.open()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="relative mt-2 overflow-hidden rounded-xl border border-brand-200 bg-gradient-to-b from-background to-brand-50/30 dark:border-brand-800/40 dark:to-brand-950/20">
      {/* Blurred preview rows */}
      <div className="select-none space-y-2 p-3">
        {Array.from({ length: Math.min(hiddenCount, 3) }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 blur-[3px]"
          >
            <div className="size-9 rounded-md bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-2.5 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>

      {/* Overlay CTA */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-[2px]">
        <Lock className="mb-2 size-5 text-brand-600" />
        <p className="mb-0.5 text-sm font-semibold">
          {hiddenCount} more collab{hiddenCount !== 1 ? 's' : ''} hidden
        </p>
        <p className="mb-4 text-xs text-muted-foreground">
          Unlock {creatorName}&apos;s full brand history + pricing tier
        </p>
        {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
        <button
          onClick={handleUnlock}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-70 transition-colors shadow-sm"
        >
          {loading && <Loader2 className="size-3.5 animate-spin" />}
          Unlock Full Profile — ₹499
        </button>
        <p className="mt-2 text-[10px] text-muted-foreground">One-time payment · Instant access</p>
      </div>
    </div>
  )
}
