'use client'

import Link from 'next/link'

function brandSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function BrandLink({ name }: { name: string }) {
  return (
    <Link
      href={`/brand/${brandSlug(name)}`}
      onClick={(e) => e.stopPropagation()}
      className="font-medium text-foreground hover:text-brand-600 hover:underline transition-colors"
    >
      {name}
    </Link>
  )
}
