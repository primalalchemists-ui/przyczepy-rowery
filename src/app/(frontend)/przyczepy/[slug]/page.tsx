// src/app/(frontend)/przyczepy/[slug]/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from 'lexical'

import { Plus, Minus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { getTrailerBySlug } from '@/lib/payload'
import { formatPLN } from '@/lib/utils'
import { TrailerBreadcrumbs } from '@/components/trailers/TrailerBreadcrumbs'
import { TrailerGallery } from '@/components/trailers/TrailerGallery'
import { AvailabilityCalendar } from '@/components/booking/calendar/AvailabilityCalendar'
import { toId } from '@/lib/booking/utils'

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function fmtDayMonth(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}`
}

export const revalidate = 60

export default async function TrailerDetailPage(props: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await props.params
  const trailer = await getTrailerBySlug(slug)

  if (!trailer || !trailer.active) return notFound()

  const seasonal = (trailer.cena?.seasonalPricing ?? []).slice().sort((a, b) =>
    a.dateFrom < b.dateFrom ? -1 : 1
  )

  const basePrice = Number(trailer.cena?.basePricePerNight ?? 0)

  return (
    <main className="container mx-auto px-4 lg:px-0 py-8">
      <TrailerBreadcrumbs trailerName={trailer.nazwa} />

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-6">
          <header className="grid gap-2">
            <h1 className="text-2xl font-bold md:text-3xl">{trailer.nazwa}</h1>
            <p className="text-muted-foreground">{trailer.opisKrotki || ''}</p>
          </header>

          <TrailerGallery
            hero={trailer.heroImage ?? null}
            gallery={trailer.gallery ?? null}
            altBase={trailer.nazwa}
          />

          <Tabs defaultValue="opis">
            <TabsList>
              <TabsTrigger value="opis">Opis</TabsTrigger>
              <TabsTrigger value="spec">Specyfikacja</TabsTrigger>
            </TabsList>

            <TabsContent value="opis" className="mt-4">
              <Card className="border-none shadow-none">
                <CardContent className="text-muted-foreground p-4">
                  {trailer.opisDlugi ? (
                    <RichText data={trailer.opisDlugi as SerializedEditorState} />
                  ) : (
                    <p>Brak pełnego opisu.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="spec" className="mt-4">
              {trailer.specyfikacja?.length ? (
                <Accordion type="single" collapsible className="grid gap-3">
                  {trailer.specyfikacja.map((sec, idx) => {
                    const value = `spec-${idx}`
                    return (
                      <AccordionItem key={value} value={value} className="rounded-xl border px-2">
                        <AccordionTrigger className="py-4 text-base font-medium hover:no-underline">
                          <div className="flex w-full items-center justify-between gap-3">
                            <span>{sec.title}</span>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="pb-4">
                          <div className="grid gap-2 text-sm">
                            {sec.items?.map((it, i) => (
                              <div key={`${it.label}-${i}`} className="flex items-start justify-between gap-4">
                                <span className="text-muted-foreground">{it.label}</span>
                                <span className="font-medium text-right">{it.value}</span>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              ) : (
                <Card>
                  <CardContent className="p-6 text-sm text-muted-foreground">Brak specyfikacji.</CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </section>

        <aside className="grid gap-4 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>{/* <CardTitle className="text-base">Cena</CardTitle> */}</CardHeader>

            <CardContent className="grid gap-2 text-sm">
              {basePrice > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <span>Cena standardowa</span>
                    <span className="font-semibold">{formatPLN(basePrice)} / noc</span>
                  </div>

                  {seasonal.length ? (
                    <div className="mt-2 grid gap-1">
                      <div className="">Ceny sezonowe</div>
                      {seasonal.map((s, idx) => (
                        <div key={`${s.name}-${idx}`} className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">
                            {fmtDayMonth(s.dateFrom)} – {fmtDayMonth(s.dateTo)}
                            {s.minNights ? ` (${s.name})` : ''}
                          </span>
                          <span className="font-medium">{formatPLN(Number(s.pricePerNight ?? 0))} / noc</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-muted-foreground">Brak ustawionej ceny.</p>
              )}

              <Button asChild className="h-11 mt-4">
                <Link href={`/rezerwacje?caravan=${encodeURIComponent(trailer.slug)}`}>Rezerwuj</Link>
              </Button>

              <Button asChild variant="outline" className="h-11">
                <Link href="/przyczepy">Wróć do listy</Link>
              </Button>
            </CardContent>
          </Card>

          <AvailabilityCalendar trailerId={toId(trailer.id)} title="Dostępność" />
        </aside>
      </div>
    </main>
  )
}
