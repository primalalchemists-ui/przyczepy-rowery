'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import type { Availability } from './types'
import {
  addMonths,
  buildMonthGrid,
  gridToRange,
  startOfMonth,
  toSet,
  computeNextRange,
  startOfToday,
  todayISO as getTodayISO,
} from './CalendarUtils'
import { useAvailability } from './useAvailability'
import { CalendarLegend } from './CalendarLegend'
import { CalendarMonthNav } from './CalendarMonthNav'
import { CalendarGrid } from './CalendarGrid'

export function DateRangePlaceholder(props: {
  trailerId?: string
  startDate: string
  endDate: string
  onChange: (v: { startDate: string; endDate: string }) => void
  availability?: Availability

  // ✅ NEW: trigger do refetch po udanej rezerwacji
  forceKey?: number
}) {
  const minMonth = useMemo(() => startOfMonth(startOfToday()), [])
  const todayISO = useMemo(() => getTodayISO(), [])

  const initialMonth = useMemo(() => {
    if (props.startDate) {
      const m = startOfMonth(new Date(props.startDate))
      return m.getTime() < minMonth.getTime() ? minMonth : m
    }
    return minMonth
  }, [props.startDate, minMonth])

  const [month, setMonth] = useState<Date>(initialMonth)

  const monthLabel = useMemo(() => {
    const pl = new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' })
    return pl.format(month)
  }, [month])

  const grid = useMemo(() => buildMonthGrid(month), [month])
  const range = useMemo(() => gridToRange(grid, month), [grid, month])

  const { availability: apiAvailability, loading } = useAvailability({
    trailerId: props.trailerId,
    range,
    enabled: Boolean(props.trailerId),
    forceKey: props.forceKey,
  })

  // ✅ fetchedOnce reset na zmianę trailerId
  const [fetchedOnce, setFetchedOnce] = useState(false)

  useEffect(() => {
    setFetchedOnce(false)
  }, [props.trailerId])

  useEffect(() => {
    if (!props.trailerId) {
      setFetchedOnce(false)
      return
    }
    if (!loading) setFetchedOnce(true)
  }, [loading, props.trailerId])

  const isGatedLoading = Boolean(props.trailerId) && (!fetchedOnce || loading)

  const availability = props.availability ?? apiAvailability
  const bookedSet = useMemo(() => toSet(availability.booked ?? []), [availability.booked])

  const unavailableSet = useMemo(() => {
    const s = toSet(availability.unavailable ?? [])
    for (const cell of grid) {
      if (cell.iso && cell.iso < todayISO) s.add(cell.iso)
    }
    return s
  }, [availability.unavailable, grid, todayISO])

  function onPick(iso: string) {
    const next = computeNextRange({
      clickedISO: iso,
      startISO: props.startDate,
      endISO: props.endDate,
      bookedSet,
      unavailableSet,
    })
    if (!next) return
    props.onChange(next)
  }

  const disablePrev = useMemo(() => month.getTime() <= minMonth.getTime(), [month, minMonth])

  return (
    <Card>
      <CardHeader className="space-y-2 sm:space-y-3">
        <CalendarMonthNav
          monthLabel={monthLabel}
          disablePrev={disablePrev}
          onPrev={() => {
            if (disablePrev) return
            setMonth(addMonths(month, -1))
          }}
          onNext={() => setMonth(addMonths(month, 1))}
        />

        <CalendarLegend />
      </CardHeader>

      <CardContent className="grid gap-3 sm:gap-4">
        <CalendarGrid
          grid={grid}
          bookedSet={bookedSet}
          unavailableSet={unavailableSet}
          startDate={props.startDate}
          endDate={props.endDate}
          onPick={onPick}
          loading={isGatedLoading}
          loadingLabel="Ładowanie dostępności…"
          monthKey={month.getTime()}
        />

        <div className="flex items-center justify-start">
          <Button
            type="button"
            variant="outline"
            className="h-9"
            onClick={() => props.onChange({ startDate: '', endDate: '' })}
            disabled={!props.startDate && !props.endDate}
            aria-label="Resetuj wybrany termin wynajmu"
          >
            Resetuj
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
