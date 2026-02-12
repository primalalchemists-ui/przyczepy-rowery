// src/app/(frontend)/oferta/[slug]/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from 'lexical'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { getResourceBySlug } from '@/lib/payload'
import { formatPLN } from '@/lib/utils'
import { AvailabilityCalendar } from '@/components/booking/calendar/AvailabilityCalendar'
import { toId } from '@/lib/booking/utils'

import { ResourceBreadcrumbs } from '@/components/resources/ResourceBreadcrumbs'
import { ResourceGallery } from '@/components/resources/ResourceGallery'

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function fmtDayMonth(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${pad2(d.getUTCDate())}.${pad2(d.getUTCMonth() + 1)}`
}

export const revalidate = 60

export default async function ResourceDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const resource = await getResourceBySlug(slug)
  if (!resource || !resource.active) return notFound()

  const seasonal = (resource.cena?.seasonalPricing ?? []).slice().sort((a, b) =>
    a.dateFrom < b.dateFrom ? -1 : 1,
  )

  const basePrice = Number(resource.cena?.basePrice ?? 0)
  const unitLabel = resource.cena?.jednostka === 'dzien' ? 'dzień' : 'noc'
  const resourceId = toId(resource.id)

  return (
    <main className="container mx-auto px-4 lg:px-0 py-8">
      <ResourceBreadcrumbs resourceName={resource.nazwa} />

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section aria-labelledby="resource-title" className="grid gap-6">
          <header className="grid gap-2">
            <h1 id="resource-title" className="text-2xl font-bold md:text-3xl">
              {resource.nazwa}
            </h1>
            {resource.opisKrotki ? <p className="text-muted-foreground">{resource.opisKrotki}</p> : null}
          </header>

          <ResourceGallery
            hero={(resource as any).heroMedia ?? null}
            gallery={resource.gallery ?? null}
            altBase={resource.nazwa}
          />

          <Tabs defaultValue="opis">
            <TabsList aria-label="Sekcje zasobu">
              <TabsTrigger value="opis">Opis</TabsTrigger>
              <TabsTrigger value="spec">Specyfikacja</TabsTrigger>
            </TabsList>

            <TabsContent value="opis" className="mt-4">
              <Card className="border-none shadow-none">
                <CardContent className="text-muted-foreground p-4">
                  {resource.opisDlugi ? (
                    <RichText data={resource.opisDlugi as SerializedEditorState} />
                  ) : (
                    <p>Brak pełnego opisu.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="spec" className="mt-4">
              {resource.specyfikacja?.length ? (
                <Card>
                  <CardContent className="p-6">
                    <dl className="grid gap-3 text-sm">
                      {resource.specyfikacja.map((row, idx) => (
                        <div key={`${row.label}-${idx}`} className="flex items-start justify-between gap-4">
                          <dt className="text-muted-foreground">{row.label}</dt>
                          <dd className="font-medium text-right">{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 text-sm text-muted-foreground">Brak specyfikacji.</CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </section>

        <aside className="grid gap-4 lg:sticky lg:top-6 lg:self-start" aria-label="Panel rezerwacji">
          <Card>
            <CardHeader />

            <CardContent className="grid gap-2 text-sm">
              {basePrice > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <span>Cena standardowa</span>
                    <span className="font-semibold">
                      {formatPLN(basePrice)} / {unitLabel}
                    </span>
                  </div>

                  {seasonal.length ? (
                    <div className="mt-2 grid gap-1" aria-label="Ceny sezonowe">
                      <div>Ceny sezonowe</div>

                      <ul className="grid gap-1">
                        {seasonal.map((s, idx) => (
                          <li key={`${s.name}-${idx}`} className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">
                              {fmtDayMonth(s.dateFrom)} – {fmtDayMonth(s.dateTo)}
                              {s.name ? ` (${s.name})` : ''}
                              {s.minUnits ? ` · min ${s.minUnits}` : ''}
                            </span>
                            <span className="font-medium">
                              {formatPLN(Number(s.price ?? 0))} / {unitLabel}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-muted-foreground">Brak ustawionej ceny.</p>
              )}

              <Button asChild className="h-11 mt-4">
                <Link href={`/rezerwacje?resource=${encodeURIComponent(resource.slug)}`}>
                  Rezerwuj
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-11">
                <Link href="/oferta">Wróć do oferty</Link>
              </Button>
            </CardContent>
          </Card>

          <AvailabilityCalendar resourceId={resourceId} title="Dostępność" />
        </aside>
      </div>
    </main>
  )
}
