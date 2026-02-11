'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

import type { Availability } from './types'
import {
  addMonths,
  buildMonthGrid,
  gridToRange,
  startOfMonth,
  toSet,
  startOfToday,
  todayISO as getTodayISO,
} from './CalendarUtils'
import { useAvailability } from './useAvailability'
import { CalendarLegend } from './CalendarLegend'
import { CalendarMonthNav } from './CalendarMonthNav'
import { CalendarGridReadonly } from './CalendarGridReadonly'

export function AvailabilityCalendar(props: {
  resourceId: string
  title?: string
  availability?: Availability
}) {
  const minMonth = useMemo(() => startOfMonth(startOfToday()), [])
  const [month, setMonth] = useState<Date>(() => minMonth)

  const monthLabel = useMemo(() => {
    const pl = new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' })
    return pl.format(month)
  }, [month])

  const grid = useMemo(() => buildMonthGrid(month), [month])
  const range = useMemo(() => gridToRange(grid, month), [grid, month])

  const { availability: apiAvailability, loading } = useAvailability({
    resourceId: props.resourceId,
    range,
    enabled: Boolean(props.resourceId),
  })

  const [fetchedOnce, setFetchedOnce] = useState(false)
  useEffect(() => {
    if (!props.resourceId) {
      setFetchedOnce(false)
      return
    }
    if (!loading) setFetchedOnce(true)
  }, [loading, props.resourceId])

  const isGatedLoading = Boolean(props.resourceId) && (!fetchedOnce || loading)

  const availability = props.availability ?? apiAvailability
  const bookedSet = useMemo(() => toSet(availability.booked ?? []), [availability.booked])

  const todayISO = useMemo(() => getTodayISO(), [])
  const unavailableSet = useMemo(() => {
    const s = toSet(availability.unavailable ?? [])
    for (const cell of grid) {
      if (cell.iso && cell.iso < todayISO) s.add(cell.iso)
    }
    return s
  }, [availability.unavailable, grid, todayISO])

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

        <CalendarLegend readonly={true} />
      </CardHeader>

      <CardContent className="grid gap-3 sm:gap-4">
        <CalendarGridReadonly
          grid={grid}
          bookedSet={bookedSet}
          unavailableSet={unavailableSet}
          todayISO={todayISO}
          loading={isGatedLoading}
          loadingLabel="Ładowanie dostępności…"
          monthKey={month.getTime()}
        />
      </CardContent>
    </Card>
  )
}
