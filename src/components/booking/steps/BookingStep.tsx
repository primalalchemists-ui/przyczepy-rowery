'use client'

import type { ResourceDoc, AddonDoc, ResourceType } from '@/lib/payload'
import { Button } from '@/components/ui/button'
import { DateRangePlaceholder } from '../calendar/DateRangePlaceholder'
import { ExtrasPicker } from '../extras/ExtrasPicker'
import type { SelectedExtra } from '../extras/types'
import { diffNightsUTC } from '@/lib/booking/utils'

type SeasonalRow = {
  name: string
  dateFrom: string
  dateTo: string
  price: number
  minUnits?: number | null
}

function subDaysISO(iso: string, days: number) {
  if (!iso) return ''
  const d = new Date(iso)
  d.setDate(d.getDate() - days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function addDaysISO(iso: string, days: number) {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function formatUnits(count: number, unitType: 'noc' | 'dzien') {
  if (unitType === 'dzien') {
    if (count === 1) return 'dzień'
    return 'dni'
  }
  if (count === 1) return 'noc'
  if (count >= 2 && count <= 4) return 'noce'
  return 'nocy'
}

function buildRequiredSeasonMinUnits(params: { startISO: string; endISO: string; seasonal: SeasonalRow[] }) {
  const units = diffNightsUTC(params.startISO, params.endISO)
  if (!params.startISO || !params.endISO || units <= 0) return 0

  const seasonalSorted = [...(params.seasonal ?? [])].sort((a, b) => (a.dateFrom < b.dateFrom ? -1 : 1))

  let maxMin = 0
  let cur = params.startISO

  for (let i = 0; i < units; i++) {
    for (const s of seasonalSorted) {
      if (cur >= s.dateFrom && cur <= s.dateTo) {
        const mn = s.minUnits != null ? Number(s.minUnits) : 0
        if (Number.isFinite(mn) && mn > 0) maxMin = Math.max(maxMin, mn)
        break
      }
    }
    cur = addDaysISO(cur, 1)
  }

  return maxMin
}

export function BookingStep(props: {
  resourceId: string
  selectedResource: ResourceDoc | null

  resourceType: ResourceType

  startDate: string
  endDate: string

  quantity: number
  maxQuantity: number
  onQuantityChange: (q: number) => void

  minUnitsDefault: number
  onDatesChange: (v: { startDate: string; endDate: string }) => void

  availableAddons: AddonDoc[]
  selectedExtras: SelectedExtra[]
  onExtrasChange: (next: SelectedExtra[]) => void

  onProceed: () => void
  forceAvailKey?: number
}) {
  const units = diffNightsUTC(props.startDate, props.endDate)

  const unitType = String((props.selectedResource as any)?.cena?.jednostka ?? 'noc') as 'noc' | 'dzien'
  const displayReturn = unitType === 'dzien' && props.endDate ? subDaysISO(props.endDate, 1) : props.endDate

  const seasonal = ((props.selectedResource as any)?.cena?.seasonalPricing ?? []) as SeasonalRow[]

  const seasonMin = buildRequiredSeasonMinUnits({
    startISO: props.startDate,
    endISO: props.endDate,
    seasonal,
  })

  const requiredMinUnits = Math.max(Number(props.minUnitsDefault ?? 1), Number(seasonMin ?? 0))
  const canProceed = Boolean(props.resourceId) && units >= requiredMinUnits

  const minMsg = !canProceed && units > 0 ? `Minimum ${requiredMinUnits} ${formatUnits(requiredMinUnits, unitType)}` : ''

  const isEbike = props.resourceType === 'ebike'
  const safeQty = Math.max(1, Number(props.quantity ?? 1))
  const maxQ = Math.max(1, Number(props.maxQuantity ?? 1))

  return (
    <section className="grid gap-4" aria-label="Wybór terminu i dodatków">
      <DateRangePlaceholder
        resourceId={props.resourceId}
        startDate={props.startDate}
        endDate={props.endDate}
        onChange={props.onDatesChange}
        forceKey={props.forceAvailKey}
        unitType={unitType}
      />

      {/* ✅ ILOŚĆ tylko dla e-bike */}
      {isEbike ? (
        <div className="grid gap-2">
          <div className="text-sm">
            <span className="font-medium">Ilość sztuk:</span>{' '}
            <span className="text-muted-foreground">
              {safeQty} / {maxQ}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 px-3"
              onClick={() => props.onQuantityChange(Math.max(1, safeQty - 1))}
              disabled={safeQty <= 1}
              aria-label="Zmniejsz ilość"
            >
              −
            </Button>

            <div className="min-w-[44px] text-center text-sm font-medium">{safeQty}</div>

            <Button
              type="button"
              variant="outline"
              className="h-9 px-3"
              onClick={() => props.onQuantityChange(Math.min(maxQ, safeQty + 1))}
              disabled={safeQty >= maxQ}
              aria-label="Zwiększ ilość"
            >
              +
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Rezerwujesz {safeQty} szt. tego modelu.
          </p>
        </div>
      ) : null}

      <ExtrasPicker availableAddons={props.availableAddons} selected={props.selectedExtras} onChange={props.onExtrasChange} />

      <div className="grid gap-3">
        <div className="grid gap-2 text-sm">
          <div>
            <span className="font-medium">Wybrany zasób:</span>{' '}
            <span className="text-muted-foreground">{props.selectedResource?.nazwa ?? '—'}</span>
          </div>

          <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
            <div>
              <span className="font-medium">Liczba {unitType === 'dzien' ? 'dni' : 'nocy'}:</span>{' '}
              <span className="text-muted-foreground">{units > 0 ? units : '—'}</span>
            </div>
            <div>
              <span className="font-medium">Start:</span>{' '}
              <span className="text-muted-foreground">{props.startDate || '—'}</span>
            </div>
            <div>
              <span className="font-medium">Zwrot:</span>{' '}
              <span className="text-muted-foreground">{displayReturn || '—'}</span>
            </div>
          </div>
        </div>

        <Button type="button" className="h-11" disabled={!canProceed} onClick={props.onProceed}>
          Podaj dane
        </Button>

        <p
          className="text-sm text-destructive min-h-[20px]"
          role={!canProceed && units > 0 ? 'alert' : undefined}
          aria-live="polite"
        >
          {minMsg}
        </p>
      </div>
    </section>
  )
}
