import type { Availability, CalendarCell, DayStatus, IsoRange } from './types'

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

export function toISO(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function fromISO(iso: string) {
  const [y, m, d] = iso.split('-').map((x) => Number(x))
  return new Date(y, m - 1, d)
}

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1)
}

export function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

export function addDaysISO(iso: string, days: number) {
  const d = fromISO(iso)
  d.setDate(d.getDate() + days)
  return toISO(d)
}

export function toSet(list: string[]) {
  return new Set(list.filter(Boolean))
}

// endDate = zwrot (exclusive). Noclegi = dni: start <= day < end
export function isNightSelected(dayISO: string, startISO: string, endISO: string) {
  if (!startISO || !endISO) return false
  const day = fromISO(dayISO).getTime()
  const start = fromISO(startISO).getTime()
  const end = fromISO(endISO).getTime()
  return day >= start && day < end
}

// ✅ UI helper: zaznacz też dzień zwrotu (endDate), mimo że jest exclusive
export function isReturnSelected(dayISO: string, endISO: string) {
  if (!endISO) return false
  return dayISO === endISO
}

export function buildMonthGrid(month: Date): CalendarCell[] {
  const first = startOfMonth(month)
  const firstWeekday = (first.getDay() + 6) % 7 // pon=0 ... nd=6
  const count = daysInMonth(month)

  const cells: CalendarCell[] = []
  for (let i = 0; i < 42; i++) {
    const dayNum = i - firstWeekday + 1
    if (dayNum < 1 || dayNum > count) {
      cells.push({ date: null, iso: null })
    } else {
      const d = new Date(month.getFullYear(), month.getMonth(), dayNum)
      cells.push({ date: d, iso: toISO(d) })
    }
  }
  return cells
}

export function gridToRange(grid: CalendarCell[], month: Date): IsoRange {
  const isos = grid.map((c) => c.iso).filter(Boolean) as string[]
  const from = isos[0] ?? toISO(startOfMonth(month))
  const to = isos[isos.length - 1] ?? toISO(addMonths(startOfMonth(month), 1))
  return { from, to }
}

export function dayStatusOf(iso: string, bookedSet: Set<string>, unavailableSet: Set<string>): DayStatus {
  if (unavailableSet.has(iso)) return 'unavailable'
  if (bookedSet.has(iso)) return 'booked'
  return 'available'
}

export function rangeIsAllAvailable(params: {
  startISO: string
  endISO: string
  bookedSet: Set<string>
  unavailableSet: Set<string>
}) {
  // sprawdzamy noclegi: start <= day < end
  let cur = params.startISO
  while (fromISO(cur).getTime() < fromISO(params.endISO).getTime()) {
    const st = dayStatusOf(cur, params.bookedSet, params.unavailableSet)
    if (st !== 'available') return false
    cur = addDaysISO(cur, 1)
  }
  return true
}

/**
 * UX selection rules (start-only first):
 * - 1 klik: ustaw START, end = '' (0 nocy)
 * - 2 klik:
 *    - jeśli klik > start: ustaw ZWROT = klik (exclusive) i licz noclegi: start <= day < end
 *    - jeśli klik == start: odklik (czyści)
 *    - jeśli klik < start: przenieś START na klik (end dalej puste)
 */
export function computeNextRange(params: {
  clickedISO: string
  startISO: string
  endISO: string
  bookedSet: Set<string>
  unavailableSet: Set<string>
}): { startDate: string; endDate: string } | null {
  const clickedStatus = dayStatusOf(params.clickedISO, params.bookedSet, params.unavailableSet)
  if (clickedStatus !== 'available') return null

  // 1) nic nie wybrane -> ustaw start, bez end (0 nocy)
  if (!params.startISO) {
    return { startDate: params.clickedISO, endDate: '' }
  }

  const start = params.startISO
  const end = params.endISO

  // 2) klik w start -> toggle off
  if (params.clickedISO === start) {
    return { startDate: '', endDate: '' }
  }

  // 3) klik przed startem -> nowy start, dalej bez end
  if (fromISO(params.clickedISO).getTime() < fromISO(start).getTime()) {
    return { startDate: params.clickedISO, endDate: '' }
  }

  // 4) klik po starcie -> ustaw zwrot = klik (exclusive)
  const newEnd = params.clickedISO

  // end musi być po starcie (minimum 1 noc)
  if (fromISO(newEnd).getTime() <= fromISO(start).getTime()) return null

  // sprawdzamy dostępność noclegów: start <= day < end
  if (
    !rangeIsAllAvailable({
      startISO: start,
      endISO: newEnd,
      bookedSet: params.bookedSet,
      unavailableSet: params.unavailableSet,
    })
  ) return null

  return { startDate: start, endDate: newEnd }
}


export const WEEK_DAYS_PL = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'] as const

export function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function todayISO() {
  return toISO(startOfToday())
}

export function isBeforeISO(a: string, b: string) {
  // porównanie yyyy-MM-dd działa leksykograficznie
  return a < b
}
