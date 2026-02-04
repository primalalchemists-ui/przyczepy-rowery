// src/app/(frontend)/przyczepy/page.tsx
import { listActiveTrailers } from '@/lib/payload'
import { TrailerCard } from '@/components/trailer-card'
import { Card, CardContent } from '@/components/ui/card'
import { TrailerFiltersBar } from '@/components/trailer-filters-bar'
import { filterTrailersByAvailability, getTrailerPrice, parseISODateOnly } from '@/lib/availability'

type SearchParams = {
  from?: string
  to?: string
  sort?: string
}

export default async function PrzyczepyPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams

  const from = parseISODateOnly(searchParams?.from ?? null)
  const to = parseISODateOnly(searchParams?.to ?? null)
  const sort = searchParams?.sort ?? ''

  let przyczepy = await listActiveTrailers({ limit: 60, depth: 2 })

  // ✅ filtr dostępności (SSR)
  if (from && to) {
    przyczepy = await filterTrailersByAvailability({ trailers: przyczepy, from, to })
  }

  // ✅ sort po cenie
  if (sort === 'price_asc' || sort === 'price_desc') {
    const dir = sort === 'price_asc' ? 1 : -1
    przyczepy = [...przyczepy].sort((a: any, b: any) => {
      const pa = getTrailerPrice(a)
      const pb = getTrailerPrice(b)
      return (pa - pb) * dir
    })
  }

  return (
    <section aria-labelledby="przyczepy-heading" className="space-y-4 p-4 lg:p-0">
      <h1 className="text-2xl font-bold md:text-3xl">Przyczepy</h1>
      <p className="text-muted-foreground">
        Aktualna oferta aktywnych przyczep.
      </p>

      <TrailerFiltersBar
        initialFrom={searchParams?.from ?? ''}
        initialTo={searchParams?.to ?? ''}
        initialSort={sort}
      />

      {!przyczepy?.length ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            {from && to
              ? 'Brak dostępnych przyczep w wybranym terminie.'
              : 'Brak aktywnych przyczep w systemie. Dodaj je w panelu CMS i ustaw jako „active”.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {przyczepy.map((p: any) => (
            <TrailerCard key={p.slug} przyczepa={p} />
          ))}
        </div>
      )}
    </section>
  )
}
