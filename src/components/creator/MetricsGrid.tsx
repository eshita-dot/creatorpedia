import { Users, TrendingUp, Play, Calendar } from 'lucide-react'
import { formatFollowers } from '@/lib/mock-data'
import type { Creator } from '@/types'

interface MetricsGridProps {
  creator: Creator
}

export function MetricsGrid({ creator }: MetricsGridProps) {
  const metrics = [
    {
      icon: Users,
      label: 'Instagram Followers',
      value: formatFollowers(creator.followers_instagram),
      show: !!creator.followers_instagram,
    },
    {
      icon: Users,
      label: 'YouTube Subscribers',
      value: formatFollowers(creator.followers_youtube),
      show: !!creator.followers_youtube,
    },
    {
      icon: TrendingUp,
      label: 'Avg Engagement Rate',
      value: creator.avg_engagement_rate ? `${creator.avg_engagement_rate}%` : '—',
      show: true,
    },
    {
      icon: Play,
      label: 'Avg Views / Video',
      value: formatFollowers(creator.avg_views),
      show: true,
    },
  ].filter((m) => m.show)

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-3"
        >
          <m.icon className="size-4 text-amber-500" />
          <span className="text-lg font-bold">{m.value}</span>
          <span className="text-[11px] text-muted-foreground">{m.label}</span>
        </div>
      ))}
    </div>
  )
}
