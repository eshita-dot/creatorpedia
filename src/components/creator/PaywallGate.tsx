'use client'

import { Lock } from 'lucide-react'

interface PaywallGateProps {
  hiddenCount: number
  creatorName: string
}

export function PaywallGate({ hiddenCount, creatorName }: PaywallGateProps) {
  return (
    <div className="relative mt-2 overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-b from-background to-amber-50/30 dark:border-amber-800/40 dark:to-amber-950/20">
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
        <Lock className="mb-2 size-5 text-amber-500" />
        <p className="mb-0.5 text-sm font-semibold">
          {hiddenCount} more collab{hiddenCount !== 1 ? 's' : ''} hidden
        </p>
        <p className="mb-4 text-xs text-muted-foreground">
          Unlock {creatorName}&apos;s full brand history + pricing tier
        </p>
        <button
          onClick={() => alert('Razorpay integration coming soon — ₹499 unlock')}
          className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors shadow-sm"
        >
          Unlock Full Profile — ₹499
        </button>
        <p className="mt-2 text-[10px] text-muted-foreground">One-time payment · Instant access</p>
      </div>
    </div>
  )
}
