'use client'

import type { CalendarCell } from './types'
import { WEEK_DAYS_PL, dayStatusOf, isNightSelected, isReturnSelected } from './CalendarUtils'
import { AnimatePresence, motion } from 'framer-motion'

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export function CalendarGrid(props: {
  grid: CalendarCell[]
  bookedSet: Set<string>
  unavailableSet: Set<string>
  startDate: string
  endDate: string
  onPick: (iso: string) => void

  // ✅ NOWE: tryb zaznaczania
  unitType?: 'noc' | 'dzien'

  // ✅ loader
  loading?: boolean
  loadingLabel?: string
  monthKey?: string | number
}) {
  const weeks = chunk(props.grid, 7)
  const isGatedLoading = Boolean(props.loading)
  const unitType = props.unitType ?? 'noc'

  return (
    <div className="relative w-full min-w-0 overflow-hidden">
      <motion.div
        key={props.monthKey ?? 'calendar'}
        initial={{ opacity: 0 }}
        animate={{ opacity: isGatedLoading ? 0 : 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{ pointerEvents: isGatedLoading ? 'none' : 'auto' }}
      >
        <table className="w-full min-w-0 table-fixed border-separate border-spacing-1" aria-label="Kalendarz dostępności">
          <thead>
            <tr>
              {WEEK_DAYS_PL.map((w) => (
                <th
                  key={w}
                  scope="col"
                  className="py-1 text-center text-[10px] sm:text-xs font-medium text-muted-foreground"
                >
                  {w}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {weeks.map((week, wi) => (
              <tr key={wi}>
                {week.map((cell, ci) => {
                  if (!cell.date || !cell.iso) {
                    return <td key={`${wi}-${ci}`} className="h-8 sm:h-10 p-0" aria-hidden="true" />
                  }

                  const iso = cell.iso
                  const status = dayStatusOf(iso, props.bookedSet, props.unavailableSet)

                  // ✅ zaznaczanie "w środku zakresu" (zawsze start <= day < end)
                  const selectedNights =
                    props.startDate && props.endDate ? isNightSelected(iso, props.startDate, props.endDate) : false

                  // ✅ DLA DNIA (ebike) NIE RYSUJEMY RETURN (bo wygląda jak 2 dni)
                  const selectedReturn =
                    unitType === 'noc' && props.endDate ? isReturnSelected(iso, props.endDate) : false

                  // ✅ return może być klikany mimo booked/unavailable — ALE TYLKO DLA NOCY
                  const isReturnCandidate =
                    unitType === 'noc' &&
                    Boolean(props.startDate) &&
                    fromISOish(iso) > fromISOish(props.startDate) &&
                    iso === props.endDate

                  const disabled = status !== 'available' && !isReturnCandidate

                  const base =
                    'h-8 sm:h-10 w-full rounded-md text-xs sm:text-sm transition-colors flex items-center justify-center select-none'

                  const availableBg = 'bg-emerald-400/50'
                  const availableHover = 'hover:bg-emerald-400/40'

                  const bg =
                    status === 'available'
                      ? `${availableBg} ${availableHover}`
                      : status === 'booked'
                        ? 'bg-red-500/60'
                        : 'bg-black/70 text-white'

                  const selectedStart = Boolean(props.startDate && iso === props.startDate)

                  // ✅ ring: start + zaznaczone dni + (return tylko noc)
                  const ring = selectedStart || selectedNights || selectedReturn ? 'ring-2 ring-black' : ''

                  const label =
                    status === 'available'
                      ? `Dostępne: ${iso}`
                      : status === 'booked'
                        ? `Zajęte: ${iso}`
                        : `Niedostępne: ${iso}`

                  return (
                    <td key={iso} className="h-8 sm:h-10 p-0">
                      <button
                        type="button"
                        className={[
                          base,
                          bg,
                          ring,
                          disabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer',
                        ].join(' ')}
                        onClick={() => props.onPick(iso)}
                        disabled={disabled}
                        aria-label={label}
                        title={iso}
                      >
                        {cell.date.getDate()}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      <AnimatePresence>
        {isGatedLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-0 grid place-items-center bg-white/70 backdrop-blur-sm"
          >
            <div className="grid place-items-center gap-3">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-black/20 border-t-black" />
              <div className="text-sm text-muted-foreground">
                {props.loadingLabel ?? 'Ładowanie dostępności…'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function fromISOish(iso: string) {
  const [y, m, d] = iso.split('-').map((x) => Number(x))
  return new Date(y, m - 1, d).getTime()
}
