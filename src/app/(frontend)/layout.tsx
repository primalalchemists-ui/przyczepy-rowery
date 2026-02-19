export const dynamic = 'force-dynamic'
export const revalidate = 0

// src/app/(frontend)/layout.tsx
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Lato } from 'next/font/google'
import { getSiteSettings, getBookingSettings } from '@/lib/payload'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import Script from "next/script";
import './globals.css'

const lato = Lato({
  subsets: ['latin'],
  weight: ['100', '300', '400', '700', '900'],
  display: 'swap',
  variable: '--font-lato',
})



export const metadata: Metadata = {
  title: {
    default: 'Rezerwacje przyczep i rowerów | Easy Apartments',
    template: '%s | Easy Apartments',
  },
  description:
    'Rezerwacje przyczep kempingowych oraz rowerów. Sprawdź dostępność i zarezerwuj termin.',
}

// const AccessibilityPanelScript = (
//   <Script
//     id="wcag-dock"
//     strategy="afterInteractive"
//     src="//wcag.dock.codes/accessibility/2fjsAgafdGljbsDdjFqS/start.js"
//   />
// );


export default async function FrontendLayout({ children }: { children: ReactNode }) {
  const site = await getSiteSettings()
  const booking = await getBookingSettings()

  return (
    <html lang="pl" className={lato.variable}>
      <body
        className="min-h-dvh bg-background text-foreground flex flex-col"
        style={{
          fontFamily:
            'var(--font-lato), system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
        }}
      >
        {/* Skip link – WCAG 2.1 */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:shadow"
        >
          Przejdź do treści
        </a>

        <SiteHeader siteName={site?.siteName ?? 'Caravans'} />

        {/* ✅ flex-1 wypycha stopkę na dół */}
        <main id="main" className="flex-1 mx-auto w-full max-w-[1400px] md:px-4">
          {children}
        </main>

        <SiteFooter site={site} />
      </body>
    </html>
  )
}
