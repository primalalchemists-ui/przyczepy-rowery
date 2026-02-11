// src/app/(frontend)/oferta/page.tsx
import { listActiveResources } from '@/lib/payload'
import { Card, CardContent } from '@/components/ui/card'
import { OfertaFiltersBar } from '@/components/OfertaFiltersBar'
import { filterResourcesByAvailability, parseISODateOnly } from '@/lib/availability'
import { ResourceTileCard } from '@/components/resource-tile-card'

type SearchParams = {
  from?: string
  to?: string
  sort?: string
  type?: 'przyczepa' | 'ebike' | '' // ✅ poprawione: ebike
}

function getResourceBasePrice(resource: any) {
  return Number(resource?.cena?.basePrice ?? 0)
}

export default async function OfertaPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams

  const from = parseISODateOnly(searchParams?.from ?? null)
  const to = parseISODateOnly(searchParams?.to ?? null)
  const sort = searchParams?.sort ?? ''
  const type = (searchParams?.type ?? '') as any

  let zasoby = await listActiveResources({ limit: 60, depth: 2, type })

  // ✅ filtr dostępności (SSR)
  if (from && to) {
    zasoby = await filterResourcesByAvailability({ resources: zasoby, from, to })
  }

  // ✅ sort po cenie (bazowa)
  if (sort === 'price_asc' || sort === 'price_desc') {
    const dir = sort === 'price_asc' ? 1 : -1
    zasoby = [...zasoby].sort((a: any, b: any) => {
      const pa = getResourceBasePrice(a)
      const pb = getResourceBasePrice(b)
      return (pa - pb) * dir
    })
  }

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
          initialFrom={searchParams?.from ?? ''}
          initialTo={searchParams?.to ?? ''}
          initialSort={sort}
          initialType={type}
        />

        {!zasoby?.length ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground" role="status" aria-live="polite">
              {from && to
                ? 'Brak dostępnych zasobów w wybranym terminie.'
                : 'Brak aktywnych zasobów w systemie. Dodaj je w panelu CMS i ustaw jako „active”.'}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3" role="list" aria-label="Lista zasobów">
            {zasoby.map((z: any) => (
              <div key={z.slug} role="listitem">
                <ResourceTileCard zasob={z} />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
