import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Shield, TrendingUp, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ClaimEmailForm } from './ClaimEmailForm'

interface ClaimPageProps {
  params: Promise<{ handle: string }>
}

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { handle } = await params
  const supabase = await createClient()

  const { data: creator } = await supabase
    .from('creators')
    .select('id, name, handle, platform, claim_status, pricing_tier')
    .eq('handle', handle)
    .single()

  if (!creator) notFound()

  if (creator.claim_status === 'claimed') {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto mb-4 size-10 text-brand-600" />
        <h1 className="mb-2 text-xl font-bold">Profile already claimed</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          @{handle} has already been verified by its creator.
        </p>
        <p className="text-xs text-muted-foreground">
          Think this is a mistake?{' '}
          <a href="mailto:hello@creatorpedia.in" className="underline hover:text-foreground">
            Contact us →
          </a>
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <Link
        href={`/creator/${handle}`}
        className="mb-8 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Back to @{handle}&apos;s profile
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-800/50 dark:bg-brand-950/50 dark:text-brand-400">
          <Zap className="size-3" />
          Creator verification
        </div>
        <h1 className="mb-2 text-2xl font-extrabold tracking-tight">
          Is this your profile?
        </h1>
        <p className="text-sm text-muted-foreground">
          Claim <strong>@{handle}</strong> to add your rate card, Instagram, and earn a Verified badge.
          Brands see verified profiles first.
        </p>
      </div>

      {/* Benefits */}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {[
          { icon: TrendingUp, title: 'Set your rates', body: 'Show brands your real pricing — stop being lowballed.' },
          { icon: Shield, title: 'Get verified', body: 'Verified badge + higher search ranking.' },
          { icon: CheckCircle2, title: 'Inbound deals', body: 'Brands DM verified creators directly.' },
        ].map((b) => (
          <div key={b.title} className="rounded-xl border border-border p-3">
            <b.icon className="mb-1.5 size-4 text-brand-600" />
            <p className="text-xs font-semibold">{b.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{b.body}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold">Verify with magic link</h2>
        <ClaimEmailForm handle={handle} creatorName={creator.name} />
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Not indexed yet?{' '}
        <Link href="/onboard" className="underline hover:text-foreground">
          List yourself →
        </Link>
      </p>
    </div>
  )
}
