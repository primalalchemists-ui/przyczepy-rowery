'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPLN } from '@/lib/utils'
import type { AddonDoc } from '@/lib/payload'
import type { SelectedExtra } from '@/components/booking/extras/types'
import { useEffect, useMemo } from 'react'
import { calcPayableNow } from '@/lib/booking/payable'
import { Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type SeasonalRow = {
  name: string
  dateFrom: string
  dateTo: string
  price: number
  minUnits?: number | null
}

function diffUnitsUTC(startISO: string, endISO: string): number {
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

function inSeason(dayISO: string, s: SeasonalRow) {
  return dayISO >= s.dateFrom && dayISO <= s.dateTo
}

type Segment = {
  label: string
  units: number
  pricePerUnit: number
  total: number
  minUnits?: number | null
}

function buildSegments(params: {
  startISO: string
  endISO: string
  base: number
  seasonal: SeasonalRow[]
}) {
  const units = diffUnitsUTC(params.startISO, params.endISO)
  if (!params.startISO || !params.endISO || units <= 0) {
    return {
      segments: [] as Segment[],
      requiredMinUnitsFromSeasons: 0,
      lodgingTotal: 0,
    }
  }

  const seasonalSorted = [...(params.seasonal ?? [])].sort((a, b) => (a.dateFrom < b.dateFrom ? -1 : 1))

  const pickSeasonForDay = (dayISO: string) => {
    for (const s of seasonalSorted) {
      if (inSeason(dayISO, s)) return s
    }
    return null
  }

  let requiredMinUnitsFromSeasons = 0
  const segments: Segment[] = []

  let cur = params.startISO
  let activeSeason: SeasonalRow | null = null
  let activePrice = params.base
  let segUnits = 0

  const flush = () => {
    if (segUnits <= 0) return
    segments.push({
      label: activeSeason ? activeSeason.name : 'Poza sezonem',
      units: segUnits,
      pricePerUnit: activePrice,
      total: activePrice * segUnits,
      minUnits: activeSeason?.minUnits ?? null,
    })
  }

  for (let i = 0; i < units; i++) {
    const season = pickSeasonForDay(cur)
    const price = season ? Number(season.price ?? params.base) : params.base

    if (season?.minUnits) {
      requiredMinUnitsFromSeasons = Math.max(requiredMinUnitsFromSeasons, Number(season.minUnits))
    }

    if (i === 0) {
      activeSeason = season
      activePrice = price
      segUnits = 1
    } else {
      const sameSeason = (activeSeason?.name ?? '') === (season?.name ?? '')
      const samePrice = activePrice === price

      if (sameSeason && samePrice) segUnits += 1
      else {
        flush()
        activeSeason = season
        activePrice = price
        segUnits = 1
      }
    }

    cur = addDaysISO(cur, 1)
  }

  flush()

  const lodgingTotal = segments.reduce((sum, s) => sum + s.total, 0)
  return { segments, requiredMinUnitsFromSeasons, lodgingTotal }
}

export function PriceSummary(props: {
  resourceType: 'przyczepa' | 'ebike'
  unitType: 'noc' | 'dzien'
  basePrice: number
  seasonalPricing?: SeasonalRow[]

  startDate: string
  endDate: string

  serviceFee: number
  minUnitsDefault: number

  availableAddons: AddonDoc[]
  selectedExtras: SelectedExtra[]

  // ✅ NOWE
  quantity?: number

  onTotalChange?: (total: number) => void

  paymentMode?: 'full' | 'deposit'
  depositType?: 'percent' | 'fixed' | null
  depositValue?: number | null
}) {
  const units = diffUnitsUTC(props.startDate, props.endDate)

  const qty = Math.max(1, Number(props.quantity ?? 1))
  const kaucja = props.resourceType === 'ebike' ? 1000 : 4000


  const pricing = useMemo(() => {
    return buildSegments({
      startISO: props.startDate,
      endISO: props.endDate,
      base: Number(props.basePrice ?? 0),
      seasonal: (props.seasonalPricing ?? []) as SeasonalRow[],
    })
  }, [props.startDate, props.endDate, props.basePrice, props.seasonalPricing])

  let extrasTotal = 0
  for (const s of props.selectedExtras) {
    const addon = props.availableAddons.find((a) => String(a.id) === String(s.addonId))
    if (!addon) continue
    const q = Math.max(1, Number(s.quantity ?? 1))
    extrasTotal += addon.pricingType === 'perDay' ? addon.price * q * units : addon.price * q
  }

  // ✅ mnożymy koszty zależne od liczby sztuk
  const lodgingTotal = pricing.lodgingTotal * qty
  const extrasTotalMultiplied = extrasTotal * qty

  // ✅ serviceFee jako opłata za rezerwację (nie mnożymy)
  const total = lodgingTotal + extrasTotalMultiplied + Number(props.serviceFee ?? 0)

  useEffect(() => {
    props.onTotalChange?.(total)
  }, [total, props.onTotalChange])

  const payableNow = useMemo(() => {
    return calcPayableNow(total, {
      paymentMode: props.paymentMode,
      depositType: (props.depositType ?? undefined) as any,
      depositValue: props.depositValue ?? undefined,
    })
  }, [total, props.paymentMode, props.depositType, props.depositValue])

  const unitLabel = props.unitType === 'dzien' ? 'dzień' : 'noc'

  const depositLabel =
    props.paymentMode === 'deposit'
      ? props.depositType === 'percent'
        ? `Zadatek (${Number(props.depositValue ?? 0)}%)`
        : `Zadatek (${formatPLN(Number(props.depositValue ?? 0))})`
      : 'Do zapłaty teraz'

  const allSeasons = useMemo(() => {
    return [...(props.seasonalPricing ?? [])].sort((a, b) => (a.dateFrom < b.dateFrom ? -1 : 1))
  }, [props.seasonalPricing])

  const seasonalUnitsByName = useMemo(() => {
    const m = new Map<string, number>()
    for (const seg of pricing.segments ?? []) {
      if (seg.label === 'Poza sezonem') continue
      m.set(seg.label, (m.get(seg.label) ?? 0) + seg.units)
    }
    return m
  }, [pricing.segments])

  const unitsInSeasons = useMemo(() => {
    let sum = 0
    for (const v of seasonalUnitsByName.values()) sum += v
    return sum
  }, [seasonalUnitsByName])

  const baseUnits = Math.max(0, units - unitsInSeasons)

  return (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Podsumowanie ceny</CardTitle>
    </CardHeader>

    <CardContent className="grid gap-2 text-sm">
      {qty > 1 ? (
        <div className="flex items-center justify-between">
          <span>Ilość sztuk</span>
          <span className="font-medium">{qty}</span>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <span>Cena standardowa / {unitLabel}</span>
        <span className="font-medium">{formatPLN(Number(props.basePrice ?? 0))}</span>
      </div>

      <div className="flex items-center justify-between">
        <span>Liczba {props.unitType === 'dzien' ? 'dni' : 'nocy'}</span>
        <span className="font-medium">{baseUnits}</span>
      </div>

      {allSeasons.length ? (
        <div className="grid gap-2" aria-label="Ceny sezonowe">
          {allSeasons.map((s, idx) => {
            const seasonName = String(s.name ?? `Sezon ${idx + 1}`)
            const seasonUnits = seasonalUnitsByName.get(seasonName) ?? 0

            return (
              <div key={`${seasonName}-${idx}`} className="grid gap-1">
                <div className="flex items-center justify-between">
                  <span>
                    Cena sezonowa ({seasonName}) / {unitLabel}
                  </span>
                  <span className="font-medium">{formatPLN(Number(s.price ?? 0))}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Liczba {props.unitType === 'dzien' ? 'dni' : 'nocy'}</span>
                  <span className="font-medium">{seasonUnits}</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <span>Noclegi / wynajem</span>
        <span className="font-medium">{formatPLN(lodgingTotal)}</span>
      </div>

      <div className="flex items-center justify-between">
        <span>Dodatki</span>
        <span className="font-medium">{formatPLN(extrasTotalMultiplied)}</span>
      </div>

      <div className="flex items-center justify-between">
        <span>Opłata serwisowa</span>
        <span className="font-medium">{formatPLN(Number(props.serviceFee ?? 0))}</span>
      </div>

      {/* ✅ Kluczowe: klient ma wiedzieć ile płaci TERAZ */}
      <div className="flex items-center justify-between">
        <span className="font-medium">
          Do zapłaty teraz <span className="text-xs text-muted-foreground">({depositLabel})</span>
        </span>
        <span className="font-semibold">{formatPLN(payableNow)}</span>
      </div>

      <div className="my-2 h-px bg-border" />

      <div className="flex items-center justify-between text-base">
        <span className="font-semibold">Razem</span>
        <span className="font-semibold">{formatPLN(total)}</span>
      </div>

      {/* ✅ Kaucja jako „bezpieczne zabezpieczenie” */}
     <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-semibold">Kaucja</span>

        <Badge variant="secondary">zwrotna</Badge>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center"
              aria-label="Informacja o kaucji"
            >
              <Info className="h-4 w-4 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer" />
            </button>
          </PopoverTrigger>

          <PopoverContent className="w-64 text-xs">
            Kaucja jest w pełni zwrotna po bezszkodowym zwrocie.
          </PopoverContent>
        </Popover>
      </div>

      <span className="font-semibold">{formatPLN(kaucja)}</span>

    </div>
    </CardContent>
  </Card>
)

}
