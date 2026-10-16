export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Languages,
} from 'lucide-react'

function IgIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3 fill-pink-500" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

function YtIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3 fill-red-500" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

import { createClient } from '@/lib/supabase/server'
import { formatFollowers, regionLabel, tierLabel } from '@/lib/mock-data'
import { MetricsGrid } from '@/components/creator/MetricsGrid'
import { CollabTimeline } from '@/components/creator/CollabTimeline'
import { PaywallGate } from '@/components/creator/PaywallGate'
import type { Creator, Collaboration, Brand } from '@/types'

const FREE_COLLAB_LIMIT = 3

interface CreatorPageProps {
  params: Promise<{ handle: string }>
}

export default async function CreatorPage({ params }: CreatorPageProps) {
  const { handle } = await params
  const supabase = await createClient()

  const { data: creatorRow } = await supabase
    .from('creators')
    .select('*')
    .eq('handle', handle)
    .single()

  if (!creatorRow) notFound()

  const { data: collabRows } = await supabase
    .from('collaborations')
    .select(`
      *,
      brands (*)
    `)
    .eq('creator_id', creatorRow.id)
    .order('collab_date', { ascending: false })

  const creator = creatorRow as Creator

  const allCollabs: Collaboration[] = (collabRows ?? []).map((row) => ({
    id: row.id,
    creator_id: row.creator_id,
    collab_date: row.collab_date,
    source: row.source,
    deal_type: row.deal_type,
    evidence_url: row.evidence_url,
    disclosure_tags: row.disclosure_tags ?? [],
    notes: row.notes,
    brand: row.brands as Brand,
  }))

  const freeCollabs = allCollabs.slice(0, FREE_COLLAB_LIMIT)
  const hiddenCount = Math.max(0, allCollabs.length - FREE_COLLAB_LIMIT)

  const PLATFORM_LABEL: Record<string, string> = {
    instagram: 'Instagram',
    youtube: 'YouTube',
    both: 'Instagram + YouTube',
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Back */}
      <Link
        href="/search"
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Back to search
      </Link>

      {/* Profile header */}
      <div className="mb-6 flex items-start gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-xl font-bold text-white shadow-sm">
          {creator.name.charAt(0)}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold">{creator.name}</h1>
            {creator.verified && (
              <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                <CheckCircle2 className="size-3" />
                Verified
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{creator.handle}</p>

          {creator.bio && (
            <p className="mt-1.5 text-sm text-muted-foreground">{creator.bio}</p>
          )}

          {/* Meta tags */}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 capitalize">
              {creator.platform === 'instagram' && <IgIcon />}
              {creator.platform === 'youtube' && <YtIcon />}
              {creator.platform === 'both' && (
                <>
                  <IgIcon />
                  <YtIcon />
                </>
              )}
              {PLATFORM_LABEL[creator.platform]}
            </span>

            <span className="flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 capitalize">
              {creator.category}
            </span>

            <span className="flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1">
              <MapPin className="size-3" />
              {regionLabel(creator.region)}
            </span>

            <span className="flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1">
              <Languages className="size-3" />
              {(creator.languages ?? []).join(', ')}
            </span>

            {creator.pricing_tier && (
              <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 font-medium text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-400">
                {tierLabel(creator.pricing_tier)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold">Audience &amp; Reach</h2>
        <MetricsGrid creator={creator} />
      </div>

      {/* Brand collaboration history */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            Brand Collaboration History
            {allCollabs.length > 0 && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                {allCollabs.length} total
              </span>
            )}
          </h2>
          <span className="text-xs text-muted-foreground">
            Sourced from ASCI disclosures + YouTube API
          </span>
        </div>

        {allCollabs.length === 0 ? (
          <div className="rounded-lg border border-border py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No collaborations indexed yet.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Data is updated daily from public disclosures.
            </p>
          </div>
        ) : (
          <>
            <CollabTimeline collabs={freeCollabs} />

            {hiddenCount > 0 && (
              <PaywallGate hiddenCount={hiddenCount} creatorName={creator.name} />
            )}
          </>
        )}
      </div>

      {/* Data notice */}
      <div className="mt-8 rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <strong>Data sources:</strong> ASCI-mandated public disclosures (#ad, #sponsored, #collab),
        YouTube Data API v3, and creator-verified opt-in via OAuth. We do not scrape private
        data. See our{' '}
        <Link href="/legal" className="underline hover:text-foreground">
          data policy
        </Link>
        .
      </div>
    </div>
  )
}
