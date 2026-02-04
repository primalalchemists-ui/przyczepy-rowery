import Link from 'next/link'
import { getBookingSettings } from '@/lib/payload'
import type { SiteSettings } from '@/lib/payload'
import { ScrollToTopButton } from './scroll-to-top-button'

type Props = {
  site: SiteSettings
}

export async function SiteFooter({ site }: Props) {
  const booking = await getBookingSettings()

  const hasRegulamin = Boolean(booking?.regulaminPdf)
  const hasPolityka = Boolean(booking?.politykaPrywatnosciPdf)

  return (
    <footer id="kontakt" className="border-t">
      <div className="shadow-sm">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-6 text-xs text-[hsl(30_20%_18%)] md:flex-row md:items-center md:justify-between">
          {/* LEWO */}
          <p>
            © {new Date().getFullYear()} <b>{site?.siteName}.</b>
          </p>

          {/* ŚRODEK */}
          <div className="flex items-center gap-4">
            {hasRegulamin && (
              <a
                href="/api/download/regulamin"
                className="underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Regulamin (PDF)
              </a>
            )}

            {hasPolityka && (
              <a
                href="/api/download/polityka"
                className="underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Polityka prywatności (PDF)
              </a>
            )}

            <Link
              href="/dofinansowanie"
              className="underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              Dofinansowanie
            </Link>
          </div>





          {/* PRAWO */}
          <div className="flex items-center gap-3 md:justify-end">
            <ScrollToTopButton />
          </div>
        </div>
      </div>
    </footer>
  )
}
