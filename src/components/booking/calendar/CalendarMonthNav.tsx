'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CalendarMonthNav(props: {
  monthLabel: string
  onPrev: () => void
  onNext: () => void
  disablePrev?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={props.onPrev}
        aria-label="Poprzedni miesiąc"
        disabled={props.disablePrev}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="text-sm font-medium capitalize" aria-live="polite">
        {props.monthLabel}
      </div>

      <Button type="button" variant="outline" size="icon" onClick={props.onNext} aria-label="Następny miesiąc">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
