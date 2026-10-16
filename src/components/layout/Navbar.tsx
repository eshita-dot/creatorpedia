'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Search } from 'lucide-react'
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
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="size-5 text-amber-500" />
          <span className="text-sm font-bold tracking-tight">
            The<span className="text-amber-500">Creatorpedia</span>
          </span>
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
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-500/20 transition-colors dark:text-amber-400"
          >
            List Your Profile
          </Link>
        </div>
      </div>
    </nav>
  )
}
