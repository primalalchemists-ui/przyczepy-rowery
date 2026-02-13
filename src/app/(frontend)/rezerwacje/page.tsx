// src/app/(frontend)/rezerwacje/page.tsx
import { Suspense } from 'react'
import { PageEnter } from '@/components/motion/PageEnter'
import { listActiveResources, getBookingSettings, resolveMediaUrl } from '@/lib/payload'
import { BookingFormClient } from '@/components/booking/BookingFormClient'
import { Card, CardContent } from '@/components/ui/card'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RezerwacjePage() {
  const [resources, booking] = await Promise.all([
    listActiveResources({ limit: 50, depth: 3 }),
    getBookingSettings(),
  ])

  let content: React.ReactNode = null

  if (!resources?.length) {
    content = (
      <>
        <header className="mb-6 grid gap-2">
          <h1 className="text-2xl font-bold md:text-3xl">Rezerwacje</h1>
          <p className="text-muted-foreground">Aktualnie brak dostępnych zasobów do rezerwacji.</p>
        </header>

        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Dodaj aktywne zasoby w panelu CMS, aby rezerwacje działały.
          </CardContent>
        </Card>
      </>
    )
  } else if (!booking) {
    content = (
      <>
        <header className="mb-6 grid gap-2">
          <h1 className="text-2xl font-bold md:text-3xl">Rezerwacje</h1>
          <p className="text-muted-foreground">Formularz jest tymczasowo niedostępny.</p>
        </header>

        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Brak konfiguracji rezerwacji.</CardContent>
        </Card>
      </>
    )
  } else {
    const regulaminHref = resolveMediaUrl(booking.regulaminPdf) ?? undefined
    const politykaHref = resolveMediaUrl(booking.politykaPrywatnosciPdf) ?? undefined

    const enabledTrailers = booking.dlaPrzyczep?.enabled !== false
    const enabledEbikes = booking.dlaRowerow?.enabled !== false

    const filtered = resources.filter((r) => {
      if (r.typZasobu === 'przyczepa') return enabledTrailers
      if (r.typZasobu === 'ebike') return enabledEbikes
      return true
    })

    if (!filtered.length) {
      let msg = 'Rezerwacje są aktualnie wyłączone.'
      if (!enabledTrailers && !enabledEbikes) msg = 'Rezerwacje dla przyczep i e-bike są wyłączone.'
      else if (!enabledTrailers) msg = 'Rezerwacje dla przyczep są wyłączone.'
      else if (!enabledEbikes) msg = 'Rezerwacje dla e-bike są wyłączone.'

      content = (
        <>
          <header className="mb-6 grid gap-2">
            <h1 className="text-2xl font-bold md:text-3xl">Rezerwacje</h1>
            <p className="text-muted-foreground">{msg}</p>
          </header>

          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground" role="status" aria-live="polite">
              Skontaktuj się z nami, jeśli chcesz zarezerwować termin.
            </CardContent>
          </Card>
        </>
      )
    } else {
      content = (
        <>
          <header className="mb-6 grid gap-2">
            <h1 className="text-2xl font-bold md:text-3xl">Rezerwacje</h1>
            <p className="text-muted-foreground">
              Wybierz zasób, termin oraz dodatki — następnie podaj dane kontaktowe.
            </p>
          </header>

          <Suspense fallback={null}>
            <BookingFormClient
              resources={filtered}
              booking={booking}
              regulaminHref={regulaminHref}
              politykaHref={politykaHref}
            />
          </Suspense>
        </>
      )
    }
  }

  return (
    <PageEnter>
      <section className="container mx-auto px-4 py-8 md:px-0">{content}</section>
    </PageEnter>
  )
}
