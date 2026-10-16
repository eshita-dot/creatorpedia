import { CheckCircle2, Shield, TrendingUp, Users, Zap } from 'lucide-react'

export default function OnboardPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/50 dark:text-amber-400">
          <Zap className="size-3" />
          For Creators
        </div>
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight">
          List yourself on Creatorpedia
        </h1>
        <p className="text-sm text-muted-foreground">
          Get discovered by India&apos;s top D2C brands, agencies, and performance marketers.
          Your verified profile puts you in front of the right decision-makers.
        </p>
      </div>

      {/* Benefits */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {[
          {
            icon: Users,
            title: 'Get inbound brand deals',
            body: 'Brands search Creatorpedia before they reach out. A verified profile means more direct deal enquiries.',
          },
          {
            icon: TrendingUp,
            title: 'Control your pricing narrative',
            body: 'Set your own pricing tier and rates. Stop being lowballed — let brands see your real market value.',
          },
          {
            icon: Shield,
            title: 'Data you control',
            body: 'You choose what to show. OAuth connection means only you can authorise access to your private metrics.',
          },
          {
            icon: CheckCircle2,
            title: 'Verified badge on your profile',
            body: 'Creator-verified profiles rank higher in search and show a Verified badge that builds brand trust.',
          },
        ].map((b) => (
          <div key={b.title} className="rounded-xl border border-border p-4">
            <b.icon className="mb-2 size-5 text-amber-500" />
            <h3 className="mb-1 text-sm font-semibold">{b.title}</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">{b.body}</p>
          </div>
        ))}
      </div>

      {/* Onboarding form */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Get early access</h2>

        <form className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium">Full name</label>
            <input
              type="text"
              placeholder="Riya Sharma"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/40"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/40"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium">Instagram handle</label>
              <input
                type="text"
                placeholder="@yourhandle"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">YouTube channel (optional)</label>
              <input
                type="text"
                placeholder="youtube.com/c/yourchannel"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Primary niche</label>
            <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/40">
              <option value="">Select a category</option>
              {['Beauty', 'Fashion', 'Finance', 'Food', 'Fitness', 'Tech', 'Travel', 'Entertainment', 'Parenting', 'Gaming', 'Lifestyle'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-amber-200/50 bg-amber-50/50 p-3 text-xs text-amber-700 dark:border-amber-800/30 dark:bg-amber-950/30 dark:text-amber-400">
            After submitting, we&apos;ll send you an OAuth link to connect your Instagram Business
            or Creator account. This lets us display verified metrics on your public profile.
            You can revoke access any time.
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
          >
            Request Early Access
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Already indexed on Creatorpedia?{' '}
        <a href="mailto:hello@creatorpedia.in" className="underline hover:text-foreground">
          Claim your profile →
        </a>
      </p>
    </div>
  )
}
