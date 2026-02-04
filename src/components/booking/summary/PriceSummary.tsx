import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPLN } from '@/lib/utils'
import type { AddonDoc } from '@/lib/payload'
import type { SelectedExtra } from '@/components/booking/extras/types'
import { useEffect, useMemo } from 'react'
import { calcPayableNow } from '@/lib/booking/payable'

type SeasonalRow = {
  name: string
  dateFrom: string
  dateTo: string
  pricePerNight: number
  minNights?: number | null
}

function diffNightsUTC(startISO: string, endISO: string) {
  if (!startISO || !endISO) return 0
  const s = new Date(startISO)
  const e = new Date(endISO)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0
  const su = Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate())
  const eu = Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate())
  const days = Math.round((eu - su) / (1000 * 60 * 60 * 24))
  return Math.max(0, days)
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function addDaysISO(iso: string, days: number) {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

function inSeason(nightISO: string, s: SeasonalRow) {
  // inclusive range for season boundaries
  return nightISO >= s.dateFrom && nightISO <= s.dateTo
}

type Segment = {
  label: string
  nights: number
  pricePerNight: number
  total: number
  minNights?: number | null
}

function buildNightSegments(params: {
  startISO: string
  endISO: string
  base: number
  seasonal: SeasonalRow[]
}) {
  const nights = diffNightsUTC(params.startISO, params.endISO)
  if (!params.startISO || !params.endISO || nights <= 0) {
    return {
      segments: [] as Segment[],
      requiredMinNightsFromSeasons: 0,
      firstNightPrice: params.base,
      lodgingTotal: 0,
    }
  }

  const seasonalSorted = [...(params.seasonal ?? [])].sort((a, b) => (a.dateFrom < b.dateFrom ? -1 : 1))

  const pickSeasonForNight = (nightISO: string) => {
    for (const s of seasonalSorted) {
      if (inSeason(nightISO, s)) return s
    }
    return null
  }

  let requiredMinNightsFromSeasons = 0

  const segments: Segment[] = []
  let curNight = params.startISO

  let activeSeason: SeasonalRow | null = null
  let activePrice = params.base
  let segNights = 0

  const flush = () => {
    if (segNights <= 0) return
    segments.push({
      label: activeSeason ? activeSeason.name : 'Poza sezonem',
      nights: segNights,
      pricePerNight: activePrice,
      total: activePrice * segNights,
      minNights: activeSeason?.minNights ?? null,
    })
  }

  for (let i = 0; i < nights; i++) {
    const season = pickSeasonForNight(curNight)
    const price = season ? Number(season.pricePerNight ?? params.base) : params.base

    if (season?.minNights) {
      requiredMinNightsFromSeasons = Math.max(requiredMinNightsFromSeasons, Number(season.minNights))
    }

    if (i === 0) {
      activeSeason = season
      activePrice = price
      segNights = 1
    } else {
      const sameSeason = (activeSeason?.name ?? '') === (season?.name ?? '')
      const samePrice = activePrice === price

      if (sameSeason && samePrice) {
        segNights += 1
      } else {
        flush()
        activeSeason = season
        activePrice = price
        segNights = 1
      }
    }

    curNight = addDaysISO(curNight, 1)
  }

  flush()

  const lodgingTotal = segments.reduce((sum, s) => sum + s.total, 0)
  const firstNightPrice = segments[0]?.pricePerNight ?? params.base

  return { segments, requiredMinNightsFromSeasons, firstNightPrice, lodgingTotal }
}

export function PriceSummary(props: {
  basePricePerNight: number
  seasonalPricing?: SeasonalRow[]
  startDate: string
  endDate: string
  serviceFee: number
  minNightsDefault: number
  availableAddons: AddonDoc[]
  selectedExtras: SelectedExtra[]
  onTotalChange?: (total: number) => void

  paymentMode?: 'full' | 'deposit'
  depositType?: 'percent' | 'fixed' | null
  depositValue?: number | null
}) {
  const nights = diffNightsUTC(props.startDate, props.endDate)

  const pricing = useMemo(() => {
    return buildNightSegments({
      startISO: props.startDate,
      endISO: props.endDate,
      base: Number(props.basePricePerNight ?? 0),
      seasonal: (props.seasonalPricing ?? []) as SeasonalRow[],
    })
  }, [props.startDate, props.endDate, props.basePricePerNight, props.seasonalPricing])

  let extrasTotal = 0
  for (const s of props.selectedExtras) {
    const addon = props.availableAddons.find((a) => String(a.id) === s.addonId)
    if (!addon) continue
    const qty = Math.max(1, Number(s.quantity ?? 1))
    extrasTotal += addon.pricingType === 'perDay' ? addon.price * qty * nights : addon.price * qty
  }

  const lodgingTotal = pricing.lodgingTotal
  const total = lodgingTotal + extrasTotal + Number(props.serviceFee ?? 0)

  useEffect(() => {
    props.onTotalChange?.(total)
  }, [total, props.onTotalChange])

  const payableNow = useMemo(() => {
    return calcPayableNow(total, {
      paymentMode: props.paymentMode,
      depositType: props.depositType ?? undefined,
      depositValue: props.depositValue ?? undefined,
    })
  }, [total, props.paymentMode, props.depositType, props.depositValue])

  const depositLabel =
    props.paymentMode === 'deposit'
      ? props.depositType === 'percent'
        ? `Zaliczka (${Number(props.depositValue ?? 0)}%)`
        : `Zaliczka (${formatPLN(Number(props.depositValue ?? 0))})`
      : 'Do zapłaty teraz'

  const segments = pricing.segments ?? []

  // ile nocy z wybranego zakresu wpada w sezony (po nazwie)
  const seasonalNightsByName = useMemo(() => {
    const m = new Map<string, number>()
    for (const seg of segments) {
      if (seg.label === 'Poza sezonem') continue
      m.set(seg.label, (m.get(seg.label) ?? 0) + seg.nights)
    }
    return m
  }, [segments])

  const nightsInSeasons = useMemo(() => {
    let sum = 0
    for (const v of seasonalNightsByName.values()) sum += v
    return sum
  }, [seasonalNightsByName])

  // ✅ baza zawsze stała (basePricePerNight), a liczba nocy bazy = tylko poza sezonami
  const basePrice = Number(props.basePricePerNight ?? 0)
  const baseNights = Math.max(0, nights - nightsInSeasons)

  // ✅ sezonówki zawsze widoczne jeśli istnieją w przyczepie (nawet gdy brak dat -> 0 nocy)
  const allSeasons = useMemo(() => {
    return [...(props.seasonalPricing ?? [])].sort((a, b) => (a.dateFrom < b.dateFrom ? -1 : 1))
  }, [props.seasonalPricing])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Podsumowanie ceny</CardTitle>
      </CardHeader>

      <CardContent className="grid gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span>Cena standardowa / noc</span>
          <span className="font-medium">{formatPLN(basePrice)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span>Liczba nocy</span>
          <span className="font-medium">{baseNights}</span>
        </div>

        {allSeasons.length ? (
          <div className="grid gap-2">
            {allSeasons.map((s, idx) => {
              const seasonName = String(s.name ?? `Sezon ${idx + 1}`)
              const seasonNights = seasonalNightsByName.get(seasonName) ?? 0

              return (
                <div key={`${seasonName}-${idx}`} className="grid gap-1">
                  <div className="flex items-center justify-between">
                    <span className="">Cena okresowa ({seasonName}) / noc</span>
                    <span className="font-medium">{formatPLN(Number(s.pricePerNight ?? 0))} </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Liczba nocy</span>
                    <span className="font-medium">{seasonNights}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <span>Noclegi</span>
          <span className="font-medium">{formatPLN(lodgingTotal)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span>Dodatki</span>
          <span className="font-medium">{formatPLN(extrasTotal)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span>Opłata serwisowa</span>
          <span className="font-medium">{formatPLN(Number(props.serviceFee ?? 0))}</span>
        </div>

        <div className="flex items-center justify-between">
          <span>{depositLabel}</span>
          <span className="font-semibold">{formatPLN(payableNow)}</span>
        </div>

        <div className="my-2 h-px bg-border" />

        <div className="flex items-center justify-between text-base">
          <span className="font-semibold">Razem</span>
          <span className="font-semibold">{formatPLN(total)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
