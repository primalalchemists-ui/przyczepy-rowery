'use client'

import * as React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'
import { CalendarIcon, ArrowUp, ArrowDown, ChevronUp, ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const today = new Date()
today.setHours(0, 0, 0, 0)


type Props = {
  initialFrom?: string // yyyy-MM-dd
  initialTo?: string   // yyyy-MM-dd
  initialSort?: string
}

function setParam(url: URL, key: string, value: string | null) {
  if (!value) url.searchParams.delete(key)
  else url.searchParams.set(key, value)
}

function toISODate(d: Date) {
  // yyyy-MM-dd
  return format(d, 'yyyy-MM-dd')
}

function safeParseISO(v: string): Date | undefined {
  try {
    if (!v) return undefined
    const d = parseISO(v)
    return isNaN(d.getTime()) ? undefined : d
  } catch {
    return undefined
  }
}

function pretty(d?: Date) {
  if (!d) return '—'
  return format(d, 'dd.MM.yyyy', { locale: pl })
}

export function TrailerFiltersBar({ initialFrom = '', initialTo = '', initialSort = '' }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  const [from, setFrom] = React.useState<string>(initialFrom)
  const [to, setTo] = React.useState<string>(initialTo)

  const fromDate = React.useMemo(() => safeParseISO(from), [from])
  const toDate = React.useMemo(() => safeParseISO(to), [to])

  const sort = initialSort || sp.get('sort') || ''

  const apply = React.useCallback(
    (next: { from?: string; to?: string; sort?: string }) => {
      const url = new URL(window.location.href)

      setParam(url, 'from', next.from ?? from)
      setParam(url, 'to', next.to ?? to)
      setParam(url, 'sort', next.sort ?? sort)

      // jeśli user ustawił tylko jedną datę -> nie filtruj (czyścimy)
      const f = url.searchParams.get('from')
      const t = url.searchParams.get('to')
      if (!f || !t) {
        url.searchParams.delete('from')
        url.searchParams.delete('to')
      }

      router.push(`${pathname}?${url.searchParams.toString()}`)
    },
    [from, to, sort, router, pathname],
  )

  const toggleSort = React.useCallback(() => {
    const next = sort === 'price_asc' ? 'price_desc' : 'price_asc'
    apply({ sort: next })
  }, [sort, apply])

  const clearDates = React.useCallback(() => {
    setFrom('')
    setTo('')
    apply({ from: '', to: '' })
  }, [apply])

  const isPriceAsc = sort === 'price_asc'
  const isPriceDesc = sort === 'price_desc'

  const canApply = Boolean(from && to)

  return (
    // ✅ bez “ramki” (usuń border/rounded/p-3)
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        {/* OD */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full justify-between gap-3 md:w-[220px]"
              aria-label="Wybierz datę od"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="text-xs text-muted-foreground">Od</span>
                <span className="truncate text-sm font-medium">{pretty(fromDate)}</span>
              </span>
              <CalendarIcon className="h-4 w-4 opacity-70" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="start"
            sideOffset={8}
            className="w-[calc(100vw-2rem)] max-w-[360px] p-2 sm:w-auto"
          >
            <div className="w-full">
              <Calendar
                mode="single"
                selected={fromDate}
                onSelect={(d) => setFrom(d ? toISODate(d) : '')}
                locale={pl}
                disabled={(date) => date < today}
              />
            </div>


          </PopoverContent>
        </Popover>

        {/* DO */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full justify-between gap-3 md:w-[220px]"
              aria-label="Wybierz datę do"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="text-xs text-muted-foreground">Do</span>
                <span className="truncate text-sm font-medium">{pretty(toDate)}</span>
              </span>
              <CalendarIcon className="h-4 w-4 opacity-70" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="start"
            sideOffset={8}
            className="w-[calc(100vw-2rem)] max-w-[360px] p-2 sm:w-auto"
          >
            <div className="w-full">
              <Calendar
                mode="single"
                selected={toDate}
                onSelect={(d) => setTo(d ? toISODate(d) : '')}
                locale={pl}
                disabled={(date) =>
                  date < today || (fromDate ? date < fromDate : false)
                }
              />
            </div>


          </PopoverContent>
        </Popover>

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => apply({ from, to })}
            disabled={!canApply}
            className="w-full md:w-auto"
          >
            Sprawdź dostępność
          </Button>

          <Button type="button" variant="outline" onClick={clearDates} className="w-full md:w-auto">
            Wyczyść
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 md:justify-end">
        <div className="text-sm text-muted-foreground">Cena</div>
       <Button
          type="button"
          variant="outline"
          onClick={toggleSort}
          className="gap-2 min-w-[130px] justify-between"
        >
          <span className="text-sm w-[70px]">
            {isPriceAsc ? 'Rosnąco' : isPriceDesc ? 'Malejąco' : 'sortuj'}
          </span>

          <span className="flex items-center gap-1">
            <ChevronUp className={isPriceAsc ? '' : 'opacity-40'} size={16} />
            <ChevronDown className={isPriceDesc ? '' : 'opacity-40'} size={16} />
          </span>
        </Button>

      </div>
    </div>
  )
}
