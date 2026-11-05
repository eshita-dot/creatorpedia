import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'The Creatorpedia — India\'s Influencer Intelligence Engine',
  description:
    'Search 4M+ Indian creators. Find who they\'ve worked with, what brands they\'ve done, and what it costs. Built for D2C brands, agencies & performance marketers.',
  keywords: 'influencer marketing India, creator database, brand collaborations, influencer search',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>© 2026 The Creatorpedia. Built for India's D2C ecosystem.</p>
            <p>
              Data sourced via official APIs, ASCI-mandated disclosures & creator opt-in.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
