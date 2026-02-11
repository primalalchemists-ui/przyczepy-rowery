'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { BookingSettings, ResourceDoc, AddonDoc, ResourceType } from '@/lib/payload'
import { bookingSchema, type BookingFormValues } from '@/lib/schemas/bookingSchema'

import { diffNightsUTC, toId } from '@/lib/booking/utils'

import { ResourceCarousel } from './resources/ResourceCarousel'
import { ResourceTypeToggle } from './ResourceTypeToggle'
import { BookingStep } from './steps/BookingStep'
import { CustomerStep } from './steps/CustomerStep'

import type { SelectedExtra } from './extras/types'
import { PriceSummary } from './summary/PriceSummary'

type PaymentMode = 'full' | 'deposit'
type DepositType = 'percent' | 'fixed'

function normalizeId(v: unknown): string | number {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const s = v.trim()
    if (/^\d+$/.test(s)) return Number(s)
    return s
  }
  return String(v ?? '')
}

/** ====== helpers do ISO date-only (UTC) ====== */
function parseISOToUTCDate(iso: string) {
  const [y, m, d] = iso.split('-').map((x) => Number(x))
  return new Date(Date.UTC(y, m - 1, d))
}

function addDaysISO(iso: string, days: number) {
  const dt = parseISOToUTCDate(iso)
  dt.setUTCDate(dt.getUTCDate() + days)
  const y = dt.getUTCFullYear()
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const d = String(dt.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// start inclusive, end exclusive
function enumerateISODays(startISO: string, endISO: string) {
  if (!startISO || !endISO) return []
  const s = parseISOToUTCDate(startISO)
  const e = parseISOToUTCDate(endISO)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return []

  const out: string[] = []
  for (let cur = new Date(s); cur.getTime() < e.getTime(); cur.setUTCDate(cur.getUTCDate() + 1)) {
    const y = cur.getUTCFullYear()
    const m = String(cur.getUTCMonth() + 1).padStart(2, '0')
    const d = String(cur.getUTCDate()).padStart(2, '0')
    out.push(`${y}-${m}-${d}`)
  }
  return out
}
/** ========================================== */

function pickBookingConfig(booking: BookingSettings, resourceType: ResourceType) {
  const per = resourceType === 'ebike' ? booking.dlaRowerow : booking.dlaPrzyczep

  return {
    minUnits: Number(per?.minUnits ?? 1),
    serviceFee: Number(per?.serviceFee ?? 0),

    paymentMode: (per?.paymentMode ?? 'full') as PaymentMode,
    depositType: (per?.depositType ?? 'percent') as DepositType,
    depositValue: Number(per?.depositValue ?? 0),

    paymentProviderDefault: booking.paymentProviderDefault ?? 'stripe',
  }
}

export function BookingFormClient(props: {
  resources: ResourceDoc[]
  booking: BookingSettings
  regulaminHref?: string
  politykaHref?: string
}) {
  const router = useRouter()
  const params = useSearchParams()
  const preselectSlug = params.get('resource')

  const [isPending, startTransition] = useTransition()
  const formAnchorRef = useRef<HTMLDivElement | null>(null)

  const [forceAvailKey, setForceAvailKey] = useState(0)

  const resourcesById = useMemo(() => {
    const m = new Map<string, ResourceDoc>()
    for (const r of props.resources ?? []) m.set(toId(r.id), r)
    return m
  }, [props.resources])

  const resourcesBySlug = useMemo(() => {
    const m = new Map<string, ResourceDoc>()
    for (const r of props.resources ?? []) m.set(r.slug, r)
    return m
  }, [props.resources])

  const [activeType, setActiveType] = useState<ResourceType>('przyczepa')

  useEffect(() => {
    if (!preselectSlug) return
    const r = resourcesBySlug.get(preselectSlug)
    if (!r) return
    setActiveType(r.typZasobu)
  }, [preselectSlug, resourcesBySlug])

  const enabledTrailers = props.booking?.dlaPrzyczep?.enabled !== false
  const enabledEbikes = props.booking?.dlaRowerow?.enabled !== false

  const visibleResources = useMemo(() => {
    const all = props.resources ?? []
    const typeFiltered = all.filter((r) => r.typZasobu === activeType)

    if (activeType === 'przyczepa') return enabledTrailers ? typeFiltered : []
    return enabledEbikes ? typeFiltered : []
  }, [props.resources, activeType, enabledTrailers, enabledEbikes])

  const defaultResourceId = useMemo(() => {
    if (preselectSlug) {
      const r = resourcesBySlug.get(preselectSlug)
      if (r && r.typZasobu === activeType) return toId(r.id)
    }
    return visibleResources[0] ? toId(visibleResources[0].id) : ''
  }, [preselectSlug, resourcesBySlug, activeType, visibleResources])

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      trailerId: defaultResourceId,
      startDate: '',
      endDate: '',

      ilosc: 1,

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
    if (!defaultResourceId) return
    form.setValue('trailerId', defaultResourceId, { shouldValidate: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultResourceId])

  const [total, setTotal] = useState(0)
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([])
  const [showClientForm, setShowClientForm] = useState(false)
  const [autoScroll, setAutoScroll] = useState(false)

  const resourceId = form.watch('trailerId')
  const startDate = form.watch('startDate')
  const endDate = form.watch('endDate')
  const ilosc = form.watch('ilosc')

  const selectedResource = resourceId ? resourcesById.get(resourceId) ?? null : null
  const resourceType = (selectedResource?.typZasobu ?? activeType) as ResourceType

  const effective = useMemo(() => pickBookingConfig(props.booking, resourceType), [props.booking, resourceType])

  const availableAddons: AddonDoc[] = useMemo(() => {
    const raw = (selectedResource as any)?.dodatki ?? []
    return raw
      .map((x: any) => (typeof x === 'object' && x ? (x as AddonDoc) : null))
      .filter((x: AddonDoc | null): x is AddonDoc => Boolean(x && x.active))
  }, [selectedResource])

  /** ✅ dynamiczny max dla e-bike (po zakresie dat) */
  const [maxQtyDynamic, setMaxQtyDynamic] = useState<number>(() =>
    Math.max(1, Number((selectedResource as any)?.iloscSztuk ?? 1)),
  )

  // canProceed
  const unitType = String((selectedResource as any)?.cena?.jednostka ?? 'noc') as 'noc' | 'dzien'
  const safeEndForProceed =
    unitType === 'dzien' && startDate && !endDate
      ? (() => {
          const d = new Date(startDate)
          d.setDate(d.getDate() + 1)
          const y = d.getFullYear()
          const m = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          return `${y}-${m}-${dd}`
        })()
      : endDate

  const unitsForProceed = diffNightsUTC(startDate, safeEndForProceed)
  const canProceed = Boolean(resourceId) && unitsForProceed >= 1

  // ✅ wymuś ilosc=1 dla przyczepy + clamp bazowy
  useEffect(() => {
    if (resourceType === 'przyczepa') {
      setMaxQtyDynamic(1)
      form.setValue('ilosc', 1, { shouldValidate: true, shouldDirty: true })
      return
    }

    // ebike: clamp 1..stock (na sucho, zanim policzymy dynamiczne)
    const stock = Math.max(1, Number((selectedResource as any)?.iloscSztuk ?? 1))
    const cur = Math.max(1, Number(ilosc ?? 1))
    const next = Math.min(stock, cur)
    if (next !== cur) form.setValue('ilosc', next, { shouldValidate: true, shouldDirty: true })
    setMaxQtyDynamic(stock)
  }, [resourceType, selectedResource, form, ilosc])

  // ✅ policz maxQtyDynamic po wybraniu zakresu (min remainingByDay w zakresie)
  useEffect(() => {
    if (resourceType !== 'ebike') return

    const stock = Math.max(1, Number((selectedResource as any)?.iloscSztuk ?? 1))

    // bez kompletu -> pokazuj stock
    if (!resourceId || !startDate || !safeEndForProceed) {
      setMaxQtyDynamic(stock)
      const cur = Math.max(1, Number(form.watch('ilosc') ?? 1))
      const next = Math.min(stock, cur)
      if (next !== cur) form.setValue('ilosc', next, { shouldValidate: true, shouldDirty: true })
      return
    }

    let alive = true

    ;(async () => {
      try {
        const url = new URL('/api/availability', window.location.origin)
        url.searchParams.set('resourceId', String(resourceId))
        url.searchParams.set('from', startDate)

        // API robi: to = startOfDayUTC(to) + 1
        // więc dla endExclusive podajemy lastDay = endExclusive - 1
        const lastDay = addDaysISO(safeEndForProceed, -1)
        url.searchParams.set('to', lastDay)

        const res = await fetch(url.toString(), { method: 'GET', cache: 'no-store' })
        if (!res.ok) {
          if (alive) setMaxQtyDynamic(stock)
          return
        }

        const json = (await res.json()) as { remainingByDay?: Record<string, number> }
        const remainingByDay = json?.remainingByDay ?? {}

        const days = enumerateISODays(startDate, safeEndForProceed)
        if (!days.length) {
          if (alive) setMaxQtyDynamic(stock)
          return
        }

        let minRemaining = stock
        for (const day of days) {
          const r = remainingByDay[day]
          if (typeof r === 'number') minRemaining = Math.min(minRemaining, r)
        }

        const maxAllowed = Math.max(1, minRemaining) // u Ciebie i tak nie da się wybrać dnia z 0 (to byłby "booked")
        if (!alive) return

        setMaxQtyDynamic(maxAllowed)

        // clamp ilosc do maxAllowed
        const cur = Math.max(1, Number(form.watch('ilosc') ?? 1))
        const next = Math.min(maxAllowed, cur)
        if (next !== cur) form.setValue('ilosc', next, { shouldValidate: true, shouldDirty: true })
      } catch {
        if (alive) setMaxQtyDynamic(stock)
      }
    })()

    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceType, resourceId, selectedResource, startDate, safeEndForProceed])

  useEffect(() => {
    if (!canProceed) setShowClientForm(false)
  }, [canProceed])

  // reset wyboru dat/dodatków/formy po zmianie zasobu
  const prevResourceIdRef = useRef<string>('')

  useEffect(() => {
    if (!resourceId) return

    if (!prevResourceIdRef.current) {
      prevResourceIdRef.current = resourceId
      return
    }

    if (prevResourceIdRef.current !== resourceId) {
      prevResourceIdRef.current = resourceId

      form.setValue('startDate', '', { shouldValidate: true, shouldDirty: true })
      form.setValue('endDate', '', { shouldValidate: true, shouldDirty: true })

      form.setValue('ilosc', 1, { shouldValidate: true, shouldDirty: true })

      setSelectedExtras([])
      setShowClientForm(false)
      setAutoScroll(false)
    }
  }, [resourceId, form])

  // reset po zmianie typu (ważne!)
  const prevTypeRef = useRef<ResourceType>('przyczepa')
  useEffect(() => {
    if (prevTypeRef.current === activeType) return
    prevTypeRef.current = activeType

    const nextId = visibleResources[0] ? toId(visibleResources[0].id) : ''
    form.setValue('trailerId', nextId, { shouldValidate: true })

    form.setValue('startDate', '', { shouldValidate: true, shouldDirty: true })
    form.setValue('endDate', '', { shouldValidate: true, shouldDirty: true })

    form.setValue('ilosc', 1, { shouldValidate: true, shouldDirty: true })

    setSelectedExtras([])
    setShowClientForm(false)
    setAutoScroll(false)
  }, [activeType, visibleResources, form])

  async function onSubmit(values: BookingFormValues) {
    startTransition(async () => {
      const unitType = String((selectedResource as any)?.cena?.jednostka ?? 'noc') as 'noc' | 'dzien'

      const safeEndDate =
        unitType === 'dzien' && values.startDate && !values.endDate
          ? (() => {
              const d = new Date(values.startDate)
              d.setDate(d.getDate() + 1)
              const y = d.getFullYear()
              const m = String(d.getMonth() + 1).padStart(2, '0')
              const dd = String(d.getDate()).padStart(2, '0')
              return `${y}-${m}-${dd}`
            })()
          : values.endDate

      const isEbike = resourceType === 'ebike'
      const stock = Math.max(1, Number((selectedResource as any)?.iloscSztuk ?? 1))
      const maxQ = isEbike ? Math.min(stock, Math.max(1, Number(maxQtyDynamic ?? stock))) : 1
      const qty = isEbike ? Math.min(maxQ, Math.max(1, Number(values.ilosc ?? 1))) : 1

      const payload = {
        zasob: values.trailerId,
        startDate: values.startDate,
        endDate: safeEndDate,

        ilosc: qty,

        status: 'pending_payment',

        extras: selectedExtras.map((e) => ({
          dodatek: normalizeId(e.addonId),
          quantity: Math.max(1, Number(e.quantity ?? 1)),
        })),

        klient: {
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          wantsInvoice: Boolean(values.wantsInvoice),
          nip: values.wantsInvoice ? (values.nip || undefined) : undefined,
          notes: values.notes || undefined,
          disability: Boolean(values.disability),
        },
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        alert(`Nie udało się zapisać rezerwacji: ${res.status}\n${txt}`)
        return
      }

      alert('Rezerwacja została zapisana ✅')

      setForceAvailKey((x) => x + 1)
      router.refresh()

      const nextDefault = defaultResourceId

      form.reset({
        trailerId: nextDefault,
        startDate: '',
        endDate: '',

        ilosc: 1,

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

  const typeDisabled =
    (activeType === 'przyczepa' && !enabledTrailers) || (activeType === 'ebike' && !enabledEbikes)

  if (typeDisabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rezerwacje są wyłączone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Ten typ zasobu ma wyłączone rezerwacje w ustawieniach.</p>
        </CardContent>
      </Card>
    )
  }

  if (!visibleResources.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brak zasobów</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Brak aktywnych zasobów dla wybranego typu.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid min-w-0 gap-6">
        <section className="grid gap-4" aria-label="Wybór typu zasobu">
          <ResourceTypeToggle
            value={activeType}
            onChange={setActiveType}
            disabledPrzyczepa={!enabledTrailers}
            disabledEbike={!enabledEbikes}
          />
        </section>

        <section className="grid gap-6" aria-label="Wybór zasobu i terminu">
          <ResourceCarousel
            resources={visibleResources}
            selectedId={resourceId}
            onSelect={(id) => form.setValue('trailerId', id, { shouldValidate: true })}
          />

          <BookingStep
            resourceId={resourceId}
            selectedResource={selectedResource}
            resourceType={resourceType}
            startDate={startDate}
            endDate={endDate}
            quantity={Math.max(1, Number(ilosc ?? 1))}
            maxQuantity={resourceType === 'ebike' ? Math.max(1, Number(maxQtyDynamic ?? 1)) : 1}
            onQuantityChange={(q) => form.setValue('ilosc', q, { shouldValidate: true, shouldDirty: true })}
            availableAddons={availableAddons}
            selectedExtras={selectedExtras}
            onExtrasChange={setSelectedExtras}
            onDatesChange={(v) => {
              form.setValue('startDate', v.startDate, { shouldValidate: true })
              form.setValue('endDate', v.endDate, { shouldValidate: true })
            }}
            onProceed={openClientForm}
            minUnitsDefault={effective.minUnits}
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
            paymentMode={effective.paymentMode}
            depositType={effective.depositType}
            depositValue={effective.depositValue}
          />
        ) : null}
      </div>

      <aside className="grid min-w-0 gap-6 lg:sticky lg:top-6 lg:self-start">
        {selectedResource ? (
          <PriceSummary
            quantity={resourceType === 'ebike' ? Math.max(1, Number(form.watch('ilosc') ?? 1)) : 1}
            unitType={String((selectedResource as any)?.cena?.jednostka ?? 'noc') as 'noc' | 'dzien'}
            basePrice={Number((selectedResource as any)?.cena?.basePrice ?? 0)}
            seasonalPricing={(selectedResource as any)?.cena?.seasonalPricing ?? []}
            startDate={startDate}
            endDate={endDate}
            serviceFee={effective.serviceFee}
            minUnitsDefault={effective.minUnits}
            availableAddons={availableAddons}
            selectedExtras={selectedExtras}
            onTotalChange={setTotal}
            paymentMode={effective.paymentMode}
            depositType={effective.depositType}
            depositValue={effective.depositValue}
          />
        ) : null}
      </aside>
    </div>
  )
}
