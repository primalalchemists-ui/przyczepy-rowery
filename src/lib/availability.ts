// src/lib/availability.ts
import { getPayload } from 'payload'
import config from '@payload-config'

export type BookingStatus =
  | 'pending_payment'
  | 'deposit_paid'
  | 'paid'
  | 'confirmed'
  | 'cancelled'
  | 'blocked'

export function toDate(v: unknown): Date | null {
  if (!v) return null
  const d = v instanceof Date ? v : new Date(String(v))
  return Number.isNaN(d.getTime()) ? null : d
}

export function isoUTC(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(
    2,
    '0',
  )}`
}

export function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

export function addDaysUTC(date: Date, days: number) {
  const d = startOfDayUTC(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

// start inclusive, end exclusive
export function expandDays(start: Date, end: Date): string[] {
  const s = startOfDayUTC(start)
  const e = startOfDayUTC(end)

  const out: string[] = []
  for (let cur = s; cur.getTime() < e.getTime(); cur = addDaysUTC(cur, 1)) {
    out.push(isoUTC(cur))
  }
  return out
}

export function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime()
}

export function parseISODateOnly(v: string | null): Date | null {
  if (!v) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  const dt = new Date(Date.UTC(y, mo, d))
  return Number.isNaN(dt.getTime()) ? null : dt
}

function normalizeRelId(v: unknown) {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const s = v.trim()
    if (/^\d+$/.test(s)) return Number(s)
    return s
  }
  return v as any
}

export function getResourceStock(resource: any) {
  return Math.max(0, Number(resource?.iloscSztuk ?? 1))
}

type DayCounts = Map<string, number>
function inc(m: DayCounts, day: string, qty: number) {
  m.set(day, (m.get(day) ?? 0) + qty)
}

/**
 * ✅ Availability for resource range
 * - UI wysyła from/to jako date-only.
 * - My NORMALIZUJEMY:
 *   from = startOfDayUTC(from)
 *   to   = startOfDayUTC(to) + 1 dzień  (żeby nie ucinało ostatniego dnia w kalendarzu)
 *
 * ✅ NOWE: remainingByDay[YYYY-MM-DD] = ile sztuk zostaje (0..stock)
 */
export async function getAvailabilityForResourceRange(args: { resourceId: string; from: Date; to: Date }) {
  const payload = await getPayload({ config })

  const resourceIdNorm = normalizeRelId(args.resourceId)

  const from = startOfDayUTC(args.from)
  const to = addDaysUTC(startOfDayUTC(args.to), 1)

  const occupyingStatuses: BookingStatus[] = ['pending_payment', 'deposit_paid', 'paid', 'confirmed']

  // ===== RESOURCE + STOCK =====
  const resource = await payload.findByID({
    collection: 'zasoby',
    id: resourceIdNorm,
    depth: 0,
    overrideAccess: true,
  })

  // - przyczepa (noc): blokujemy też dzień zwrotu (end + 1)
  // - ebike (dzien): NIE blokujemy dnia po endDate (endDate i tak jest exclusive)
  const unitType = String(
    (resource as any)?.cena?.jednostka ?? ((resource as any)?.typZasobu === 'ebike' ? 'dzien' : 'noc'),
  ) as 'noc' | 'dzien'

  const shouldBlockReturnDay = unitType === 'noc'
  const stock = getResourceStock(resource)

  const allDaysInQuery = expandDays(from, to)

  if (stock <= 0) {
    const remainingByDay: Record<string, number> = {}
    for (const day of allDaysInQuery) remainingByDay[day] = 0
    return { booked: [], unavailable: allDaysInQuery, remainingByDay, stock }
  }

  // ===== BOOKINGS + BLOCKS =====
  const bookingsCountByDay = new Map<string, number>()
  const blocksCountByDay = new Map<string, number>()

  const bookingsRes = await payload.find({
    collection: 'rezerwacje',
    depth: 0,
    limit: 5000,
    overrideAccess: true,
    where: {
      and: [
        { zasob: { equals: resourceIdNorm } },
        { status: { in: occupyingStatuses as any } },
        { startDate: { less_than: to.toISOString() } },
        { endDate: { greater_than: from.toISOString() } },
      ],
    },
  })

  for (const b of bookingsRes.docs as any[]) {
    const s = toDate(b?.startDate)
    const e = toDate(b?.endDate)
    if (!s || !e) continue
    if (!overlaps(s, e, from, to)) continue

    const bookingQty = Math.max(1, Number(b?.ilosc ?? 1))
    const endToCount = shouldBlockReturnDay ? addDaysUTC(e, 1) : e
    const days = expandDays(s, endToCount)

    for (const day of days) inc(bookingsCountByDay, day, bookingQty)
  }

  const blocksRes = await payload.find({
    collection: 'blokady',
    depth: 0,
    limit: 5000,
    overrideAccess: true,
    where: {
      and: [
        { zasob: { equals: resourceIdNorm } },
        { active: { equals: true } },
        { dateFrom: { less_than: to.toISOString() } },
        { dateTo: { greater_than: from.toISOString() } },
      ],
    },
  })

  for (const bl of blocksRes.docs as any[]) {
    const s = toDate(bl?.dateFrom)
    const e = toDate(bl?.dateTo)
    if (!s || !e) continue
    if (!overlaps(s, e, from, to)) continue

    const qty = Math.max(1, Number(bl?.ilosc ?? 1))
    const endToCount = shouldBlockReturnDay ? addDaysUTC(e, 1) : e
    const days = expandDays(s, endToCount)

    for (const day of days) inc(blocksCountByDay, day, qty)
  }

  // ===== OUTPUT =====
  const booked = new Set<string>()
  const unavailable = new Set<string>()
  const remainingByDay: Record<string, number> = {}

  // liczymy dla KAŻDEGO dnia w query (żeby UI mogło wyciągnąć min dla range)
  for (const day of allDaysInQuery) {
    const b = bookingsCountByDay.get(day) ?? 0
    const bl = blocksCountByDay.get(day) ?? 0

    if (bl >= stock) {
      unavailable.add(day)
      remainingByDay[day] = 0
      continue
    }

    const used = b + bl
    const remaining = Math.max(0, stock - used)
    remainingByDay[day] = remaining

    if (used >= stock) booked.add(day)
  }

  return {
    booked: Array.from(booked),
    unavailable: Array.from(unavailable),
    remainingByDay,
    stock,
  }
}

/**
 * ✅ SSR helper: filtruj zasoby po dostępności w zakresie dat.
 * Zasób jest OK, jeśli żaden dzień w wymaganym zakresie nie jest w (booked ∪ unavailable).
 */
export async function filterResourcesByAvailability(args: {
  resources: Array<{ id: number | string }>
  from: Date
  to: Date
}) {
  const requiredDays = expandDays(startOfDayUTC(args.from), addDaysUTC(startOfDayUTC(args.to), 1))

  const checks = await Promise.all(
    (args.resources ?? []).map(async (r) => {
      const result = await getAvailabilityForResourceRange({
        resourceId: String((r as any).id),
        from: args.from,
        to: args.to,
      })

      const blocked = new Set<string>([...(result.booked ?? []), ...(result.unavailable ?? [])])
      const ok = requiredDays.every((day) => !blocked.has(day))

      return ok ? r : null
    }),
  )

  return checks.filter(Boolean) as typeof args.resources
}

export function getResourcePrice(resource: any) {
  return Number(resource?.cena?.basePrice ?? 0)
}
