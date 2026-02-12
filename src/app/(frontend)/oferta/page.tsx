// src/app/(frontend)/oferta/page.tsx
import { listActiveResources } from '@/lib/payload'
import { OfertaFiltersBar } from '@/components/OfertaFiltersBar'
import { parseISODateOnly } from '@/lib/availability'
import { OfertaResultsClient } from '@/components/oferta/OfertaResultsClient'

type SearchParams = {
  from?: string
  to?: string
  sort?: string
  type?: 'przyczepa' | 'ebike' | ''
}

function getResourceBasePrice(resource: any) {
  return Number(resource?.cena?.basePrice ?? 0)
}

export default async function OfertaPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams

  const fromISO = searchParams?.from ?? ''
  const toISO = searchParams?.to ?? ''

  // tylko do walidacji “czy daty są poprawne”
  const from = parseISODateOnly(fromISO || null)
  const to = parseISODateOnly(toISO || null)

  const sort = searchParams?.sort ?? ''
  const type = (searchParams?.type ?? '') as any

  let zasoby = await listActiveResources({ limit: 60, depth: 2, type })

  // sort po cenie (bazowa) - niezależne od dostępności
  if (sort === 'price_asc' || sort === 'price_desc') {
    const dir = sort === 'price_asc' ? 1 : -1
    zasoby = [...zasoby].sort((a: any, b: any) => {
      const pa = getResourceBasePrice(a)
      const pb = getResourceBasePrice(b)
      return (pa - pb) * dir
    })
  }

  const hasDateFilter = Boolean(from && to)

  return (
    <main className="container mx-auto px-4 lg:px-0 py-8">
      <section aria-labelledby="oferta-heading" className="space-y-4">
        <header className="space-y-1">
          <h1 id="oferta-heading" className="text-2xl font-bold md:text-3xl">
            Oferta
          </h1>
          <p className="text-muted-foreground">Przyczepy i rowery elektryczne dostępne do rezerwacji.</p>
        </header>

        <OfertaFiltersBar
          initialFrom={fromISO}
          initialTo={toISO}
          initialSort={sort}
          initialType={type}
        />

        <OfertaResultsClient resources={zasoby} from={fromISO} to={toISO} hasDateFilter={hasDateFilter} />
      </section>
    </main>
  )
}
