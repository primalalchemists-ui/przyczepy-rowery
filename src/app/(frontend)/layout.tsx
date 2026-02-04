export const dynamic = 'force-dynamic'
export const revalidate = 0

// src/app/(frontend)/layout.tsx
import type { ReactNode } from 'react'
import { getSiteSettings, getBookingSettings } from '@/lib/payload'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import "./globals.css"


export default async function FrontendLayout({ children }: { children: ReactNode }) {
  const site = await getSiteSettings()
  const booking = await getBookingSettings()

  return (
    <html lang="pl">
      <body className='bg-gradient-to-b from-[hsl(var(--brand-stone))] to-white'>
        {/* Skip link – WCAG 2.1 */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:shadow"
        >
          Przejdź do treści
        </a>

        <SiteHeader siteName={site?.siteName ?? 'Caravans'} />
        <div className="h-full">
          <main className="mx-auto w-full max-w-[1400px] md:px-4 md:py-8 min-h-dvh">{children}</main>
        </div>

        <SiteFooter site={site} />
      </body>
    </html>
  )
}
