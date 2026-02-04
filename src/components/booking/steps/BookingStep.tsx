'use client'

import type { TrailerDoc, AddonDoc } from '@/lib/payload'
import { Button } from '@/components/ui/button'
import { DateRangePlaceholder } from '../calendar/DateRangePlaceholder'
import { ExtrasPicker } from '../extras/ExtrasPicker'
import type { SelectedExtra } from '../extras/types'
import { diffNightsUTC } from '@/lib/booking/utils'

type SeasonalRow = {
  name: string
  dateFrom: string
  dateTo: string
  pricePerNight: number
  minNights?: number | null
}

function addDaysISO(iso: string, days: number) {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function formatNights(count: number) {
  if (count === 1) return 'noc'
  if (count >= 2 && count <= 4) return 'noce'
  return 'nocy'
}

function buildRequiredSeasonMinNights(params: { startISO: string; endISO: string; seasonal: SeasonalRow[] }) {
  const nights = diffNightsUTC(params.startISO, params.endISO)
  if (!params.startISO || !params.endISO || nights <= 0) return 0

  const seasonalSorted = [...(params.seasonal ?? [])].sort((a, b) => (a.dateFrom < b.dateFrom ? -1 : 1))

  let maxMin = 0
  let cur = params.startISO

  for (let i = 0; i < nights; i++) {
    for (const s of seasonalSorted) {
      if (cur >= s.dateFrom && cur <= s.dateTo) {
        const mn = s.minNights != null ? Number(s.minNights) : 0
        if (Number.isFinite(mn) && mn > 0) maxMin = Math.max(maxMin, mn)
        break
      }
    }
    cur = addDaysISO(cur, 1)
  }

  return maxMin
}

export function BookingStep(props: {
  trailerId: string
  selectedTrailer: TrailerDoc | null
  startDate: string
  endDate: string
  minNightsDefault: number
  onDatesChange: (v: { startDate: string; endDate: string }) => void

  availableAddons: AddonDoc[]
  selectedExtras: SelectedExtra[]
  onExtrasChange: (next: SelectedExtra[]) => void

  onProceed: () => void

  // ✅ NEW: trigger do refetch availability po udanej rezerwacji
  forceAvailKey?: number
}) {
  const nights = diffNightsUTC(props.startDate, props.endDate)

  const seasonal = (props.selectedTrailer?.cena?.seasonalPricing ?? []) as SeasonalRow[]
  const seasonMin = buildRequiredSeasonMinNights({
    startISO: props.startDate,
    endISO: props.endDate,
    seasonal,
  })

  const requiredMinNights = Math.max(Number(props.minNightsDefault ?? 1), Number(seasonMin ?? 0))

  const canProceed = Boolean(props.trailerId) && nights >= requiredMinNights

  const minNightsMsg =
    !canProceed && nights > 0 ? `Minimum ${requiredMinNights} ${formatNights(requiredMinNights)}` : ''

  return (
    <section className="grid gap-4" aria-label="Wybór terminu i dodatków">
      <DateRangePlaceholder
        trailerId={props.trailerId}
        startDate={props.startDate}
        endDate={props.endDate}
        onChange={props.onDatesChange}
        // ✅ NEW: wymuś przeładowanie availability w kalendarzu
        forceKey={props.forceAvailKey}
      />

      <ExtrasPicker availableAddons={props.availableAddons} selected={props.selectedExtras} onChange={props.onExtrasChange} />

      <div className="grid gap-3">
        <div className="grid gap-2 text-sm">
          <div>
            <span className="font-medium">Wybrana przyczepa:</span>{' '}
            <span className="text-muted-foreground">{props.selectedTrailer?.nazwa ?? '—'}</span>
          </div>

          <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
            <div>
              <span className="font-medium">Liczba nocy:</span>{' '}
              <span className="text-muted-foreground">{nights > 0 ? nights : '—'}</span>
            </div>
            <div>
              <span className="font-medium">Start:</span> <span className="text-muted-foreground">{props.startDate || '—'}</span>
            </div>
            <div>
              <span className="font-medium">Zwrot:</span> <span className="text-muted-foreground">{props.endDate || '—'}</span>
            </div>
          </div>
        </div>

        <Button type="button" className="h-11" disabled={!canProceed} onClick={props.onProceed}>
          Podaj dane
        </Button>

        <p
          className="text-sm text-destructive min-h-[20px]"
          role={!canProceed && nights > 0 ? 'alert' : undefined}
          aria-live="polite"
        >
          {minNightsMsg}
        </p>
      </div>
    </section>
  )
}
