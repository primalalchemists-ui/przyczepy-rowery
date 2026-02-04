'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { BookingSettings, TrailerDoc, AddonDoc } from '@/lib/payload'
import { bookingSchema, type BookingFormValues } from '@/lib/schemas/bookingSchema'

import { diffNightsUTC, toId } from '@/lib/booking/utils'

import { TrailerCarousel } from './trailers/TrailerCarousel'
import { BookingStep } from './steps/BookingStep'
import { CustomerStep } from './steps/CustomerStep'

import type { SelectedExtra } from './extras/types'
import { PriceSummary } from './summary/PriceSummary'

export function BookingFormClient(props: {
  trailers: TrailerDoc[]
  booking: BookingSettings
  regulaminHref?: string
  politykaHref?: string
}) {
  const [total, setTotal] = useState(0)

  const params = useSearchParams()
  const router = useRouter()

  const preselectSlug = params.get('caravan')
  const [isPending, startTransition] = useTransition()

  const formAnchorRef = useRef<HTMLDivElement | null>(null)

  // ✅ trigger do odświeżenia availability po rezerwacji
  const [forceAvailKey, setForceAvailKey] = useState(0)

  const trailersById = useMemo(() => {
    const m = new Map<string, TrailerDoc>()
    for (const t of props.trailers) m.set(toId(t.id), t)
    return m
  }, [props.trailers])

  const trailersBySlug = useMemo(() => {
    const m = new Map<string, TrailerDoc>()
    for (const t of props.trailers) m.set(t.slug, t)
    return m
  }, [props.trailers])

  const defaultTrailerId = useMemo(() => {
    if (preselectSlug) {
      const t = trailersBySlug.get(preselectSlug)
      if (t) return toId(t.id)
    }
    return props.trailers[0] ? toId(props.trailers[0].id) : ''
  }, [preselectSlug, trailersBySlug, props.trailers])

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      trailerId: defaultTrailerId,
      startDate: '',
      endDate: '',
      fullName: '',
      email: '',
      phone: '',

      wantsInvoice: false,
      nip: '',

      notes: '',
      disability: false,

      acceptRegulamin: false,
      acceptPolityka: false,
    },
    mode: 'onBlur',
  })

  useEffect(() => {
    if (!preselectSlug) return
    const t = trailersBySlug.get(preselectSlug)
    if (!t) return
    form.setValue('trailerId', toId(t.id), { shouldValidate: true })
  }, [preselectSlug, trailersBySlug, form])

  const trailerId = form.watch('trailerId')
  const startDate = form.watch('startDate')
  const endDate = form.watch('endDate')

  // ✅ Reset wyboru dat po zmianie przyczepy
  const prevTrailerIdRef = useRef<string>('')

  useEffect(() => {
    if (!trailerId) return

    if (!prevTrailerIdRef.current) {
      prevTrailerIdRef.current = trailerId
      return
    }

    if (prevTrailerIdRef.current !== trailerId) {
      prevTrailerIdRef.current = trailerId

      form.setValue('startDate', '', { shouldValidate: true, shouldDirty: true })
      form.setValue('endDate', '', { shouldValidate: true, shouldDirty: true })

      setSelectedExtras([])
      setShowClientForm(false)
      setAutoScroll(false)
    }
  }, [trailerId, form])

  const selectedTrailer = trailerId ? trailersById.get(trailerId) ?? null : null

  const availableAddons: AddonDoc[] = useMemo(() => {
    const raw = (selectedTrailer as any)?.dodatki ?? []
    return raw
      .map((x: any) => (typeof x === 'object' && x ? (x as AddonDoc) : null))
      .filter((x: AddonDoc | null): x is AddonDoc => Boolean(x && x.active))
  }, [selectedTrailer])

  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([])
  const [showClientForm, setShowClientForm] = useState(false)
  const [autoScroll, setAutoScroll] = useState(false)

  const nights = diffNightsUTC(startDate, endDate)
  const canProceed = Boolean(trailerId) && nights >= 1

  useEffect(() => {
    if (!canProceed) setShowClientForm(false)
  }, [canProceed])

  if (!props.booking.bookingEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rezerwacje są wyłączone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aktualnie nie można składać rezerwacji online. Skontaktuj się z obsługą telefonicznie lub mailowo.
          </p>
        </CardContent>
      </Card>
    )
  }

  async function onSubmit(values: BookingFormValues) {
    startTransition(async () => {
      const wantsInvoice = Boolean(values.wantsInvoice)

      const payload = {
        przyczepa: values.trailerId,
        startDate: values.startDate,
        endDate: values.endDate,
        status: 'pending_payment', // ✅ FIX
        extras: selectedExtras.map((e) => ({
          dodatek: Number(e.addonId),
          quantity: Number(e.quantity),
        })),
        klient: {
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          wantsInvoice: Boolean(values.wantsInvoice),
          nip: values.wantsInvoice ? (values.nip || undefined) : undefined,
          notes: values.notes || undefined,
          disability: values.disability,
        },
      }


      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })

      console.log('BOOKING PAYLOAD', payload)

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        alert(`Nie udało się zapisać rezerwacji: ${res.status}\n${txt}`)
        return
      }

      alert('Rezerwacja została zapisana ✅')

      // ✅ KLUCZ: wymuś odświeżenie availability w kalendarzu
      setForceAvailKey((x) => x + 1)

      // (opcjonalnie) jeśli coś SSR się opiera o dane z serwera
      router.refresh()

      form.reset({
        trailerId: defaultTrailerId,
        startDate: '',
        endDate: '',
        fullName: '',
        email: '',
        phone: '',

        wantsInvoice: false,
        nip: '',

        notes: '',
        disability: false,

        acceptRegulamin: false,
        acceptPolityka: false,
      })

      setSelectedExtras([])
      setShowClientForm(false)
      setAutoScroll(false)
    })
  }

  function openClientForm() {
    if (!canProceed) return
    setShowClientForm(true)
    setAutoScroll(true)
  }

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid min-w-0 gap-6">
        <section className="grid gap-6" aria-label="Wybór przyczepy i terminu">
          <TrailerCarousel
            trailers={props.trailers}
            selectedId={trailerId}
            onSelect={(id) => form.setValue('trailerId', id, { shouldValidate: true })}
          />

          <BookingStep
            trailerId={trailerId}
            selectedTrailer={selectedTrailer}
            startDate={startDate}
            endDate={endDate}
            availableAddons={availableAddons}
            selectedExtras={selectedExtras}
            onExtrasChange={setSelectedExtras}
            onDatesChange={(v) => {
              form.setValue('startDate', v.startDate, { shouldValidate: true })
              form.setValue('endDate', v.endDate, { shouldValidate: true })
            }}
            onProceed={openClientForm}
            minNightsDefault={Number(props.booking.minNightsDefault ?? 1)}
            // ✅ NOWE: trigger refetch w BookingStep
            forceAvailKey={forceAvailKey}
          />
        </section>

        {showClientForm ? (
          <CustomerStep
            form={form}
            onSubmit={onSubmit}
            isPending={isPending}
            scrollRef={formAnchorRef}
            regulaminHref={props.regulaminHref}
            politykaHref={props.politykaHref}
            total={total}
            paymentMode={props.booking.paymentMode}
            depositType={props.booking.depositType ?? undefined}
            depositValue={props.booking.depositValue ?? undefined}
          />
        ) : null}
      </div>

      <aside className="grid min-w-0 gap-6 lg:sticky lg:top-6 lg:self-start">
        {selectedTrailer ? (
          <PriceSummary
            basePricePerNight={Number((selectedTrailer as any)?.cena?.basePricePerNight ?? 0)}
            seasonalPricing={(selectedTrailer as any)?.cena?.seasonalPricing ?? []}
            startDate={startDate}
            endDate={endDate}
            serviceFee={Number(props.booking.serviceFee ?? 0)}
            minNightsDefault={Number(props.booking.minNightsDefault ?? 1)}
            availableAddons={availableAddons}
            selectedExtras={selectedExtras}
            onTotalChange={setTotal}
            paymentMode={props.booking.paymentMode}
            depositType={props.booking.depositType ?? null}
            depositValue={props.booking.depositValue ?? null}
          />
        ) : null}
      </aside>
    </div>
  )
}
