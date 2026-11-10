import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ClaimCompleteForm } from './ClaimCompleteForm'
import type { Creator } from '@/types'

interface ClaimCompletePageProps {
  params: Promise<{ handle: string }>
}

export default async function ClaimCompletePage({ params }: ClaimCompletePageProps) {
  const { handle } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/claim/${handle}`)

  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('handle', handle)
    .single()

  if (!creator) redirect('/')

  if (creator.claim_status === 'claimed' && creator.claimed_user_id !== user.id) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="mb-2 text-xl font-bold">Already claimed</h1>
        <p className="text-sm text-muted-foreground">
          @{handle} has been verified by its creator. If this is wrong, email{' '}
          <a href="mailto:hello@creatorpedia.in" className="underline">hello@creatorpedia.in</a>.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <Link
        href={`/creator/${handle}`}
        className="mb-8 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Back to @{handle}&apos;s profile
      </Link>

      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-extrabold tracking-tight">Complete your profile</h1>
        <p className="text-sm text-muted-foreground">
          Add your rate card and preferences. This is what brands see before reaching out.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <ClaimCompleteForm creator={creator as Creator} userEmail={user.email!} />
      </div>
    </div>
  )
}
