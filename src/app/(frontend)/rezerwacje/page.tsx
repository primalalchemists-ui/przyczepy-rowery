// src/app/(frontend)/rezerwacje/page.tsx
import { Suspense } from 'react'
import { listActiveTrailers, getBookingSettings, resolveMediaUrl } from '@/lib/payload'
import { BookingFormClient } from '@/components/booking/BookingFormClient'
import { Card, CardContent } from '@/components/ui/card'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RezerwacjePage() {
  const [trailers, booking] = await Promise.all([
    listActiveTrailers({ limit: 50, depth: 3 }),
    getBookingSettings(),
  ])

  if (!trailers?.length) {
    return (
      <main className="container mx-auto px-4 py-8 md:p-0">
        <header className="mb-6 grid gap-2">
          <h1 className="text-2xl font-bold md:text-3xl">Rezerwacje</h1>
          <p className="text-muted-foreground">
            Aktualnie brak dostępnych przyczep do rezerwacji.
          </p>
        </header>

        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Dodaj aktywne przyczepy w panelu CMS, aby rezerwacje działały.
          </CardContent>
        </Card>
      </main>
    )
  }

  if (!booking) {
    return (
      <main className="container mx-auto px-4 py-8 md:p-0">
        <header className="mb-6 grid gap-2">
          <h1 className="text-2xl font-bold md:text-3xl">Rezerwacje</h1>
          <p className="text-muted-foreground">
            Formularz jest tymczasowo niedostępny.
          </p>
        </header>

        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Brak konfiguracji rezerwacji.
          </CardContent>
        </Card>
      </main>
    )
  }

  const regulaminHref = resolveMediaUrl(booking.regulaminPdf)
  const politykaHref = resolveMediaUrl(booking.politykaPrywatnosciPdf)

  return (
    <main className="container mx-auto px-4 py-8 md:px-0">
      {booking.bookingEnabled && (
        <header className="mb-6 grid gap-2">
          <h1 className="text-2xl font-bold md:text-3xl">Rezerwacje</h1>
          <p className="text-muted-foreground">
            Wybierz przyczepę, termin oraz dodatki — następnie podaj dane kontaktowe.
          </p>
        </header>
      )}

      <Suspense fallback={null}>
        <BookingFormClient
          trailers={trailers}
          booking={booking}
          regulaminHref={regulaminHref}
          politykaHref={politykaHref}
        />
      </Suspense>
    </main>
  )
}
