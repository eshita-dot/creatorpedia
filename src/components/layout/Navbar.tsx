'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { cn } from 'cn'

export function Navbar() {
  const pathname = usePathname()
  const isHome = pathname === '/'

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80',
        isHome && 'border-transparent bg-transparent'
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Creatorpedia — Influencer Intelligence"
            width={180}
            height={60}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>

        <div className="flex items-center gap-4">
          {!isHome && (
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search className="size-3.5" />
              New Search
            </Link>
          )}
          <Link
            href="/onboard"
            className="rounded-lg border border-brand-500/30 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 transition-colors"
          >
            List Your Profile
          </Link>
        </div>
      </div>
    </nav>
  )
}
