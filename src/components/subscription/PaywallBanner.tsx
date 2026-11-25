import Link from 'next/link'
import { Lock } from 'lucide-react'

interface PaywallBannerProps {
  hiddenCount: number
  noun?: string // e.g. "creators", "collabs"
}

export function PaywallBanner({ hiddenCount, noun = 'results' }: PaywallBannerProps) {
  return (
    <div className="relative">
      {/* Fade overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background/0 to-background/80" />
      <div className="flex flex-col items-center gap-3 rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white px-6 py-8 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-brand-100">
          <Lock className="size-4 text-brand-600" />
        </div>
        <div>
          <p className="text-sm font-semibold">
            {hiddenCount} more {noun} hidden
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Unlimited lookups, brand intel, and CSV export.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/subscribe"
            className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Subscribe · ₹1,499/month
          </Link>
          <Link
            href="/early-access"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Learn more
          </Link>
        </div>
        <p className="text-[10px] text-muted-foreground">Early access · 30-day access · Cancel anytime</p>
      </div>
    </div>
  )
}
