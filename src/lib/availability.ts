// src/lib/availability.ts
import { getPayload } from 'payload'
import config from '@payload-config'

/* ===========================================
   STATUSY
=========================================== */

export type BookingStatus =
  | 'pending_payment'
  | 'deposit_paid'
  | 'paid'
  | 'confirmed'
  | 'cancelled'
  | 'blocked'

/* ===========================================
   HELPERY
=========================================== */

export function toDate(v: unknown): Date | null {
  if (!v) return null
  const d = v instanceof Date ? v : new Date(String(v))
  return Number.isNaN(d.getTime()) ? null : d
}

export function isoUTC(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
    d.getUTCDate(),
  ).padStart(2, '0')}`
}

export function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

export function addDaysUTC(date: Date, days: number) {
  const d = startOfDayUTC(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

// noclegi = start inclusive, end exclusive
export function expandNights(start: Date, end: Date): string[] {
  const s = startOfDayUTC(start)
  const e = startOfDayUTC(end)

  const out: string[] = []
  for (let cur = s; cur.getTime() < e.getTime(); cur = addDaysUTC(cur, 1)) {
    out.push(isoUTC(cur))
  }

  return out
}

// overlap przy end-exclusive
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

/* ===========================================
   NORMALIZACJA RELATION ID (string/number)
=========================================== */

function normalizeRelId(v: unknown) {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const s = v.trim()
    if (/^\d+$/.test(s)) return Number(s)
    return s
  }
  return v as any
}

/* ===========================================
   STOCK
=========================================== */

export function getTrailerStock(trailer: any) {
  return Math.max(0, Number(trailer?.iloscSztuk ?? 1))
}

type DayCounts = Map<string, number>

function inc(m: DayCounts, day: string, qty: number) {
  m.set(day, (m.get(day) ?? 0) + qty)
}

/* ===========================================
   GŁÓWNE: AVAILABILITY RANGE
=========================================== */

export async function getAvailabilityForTrailerRange(args: {
  trailerId: string
  from: Date
  to: Date
}) {
  const payload = await getPayload({ config })

  const trailerIdNorm = normalizeRelId(args.trailerId)
  const from = startOfDayUTC(args.from)
  const to = addDaysUTC(startOfDayUTC(args.to), 1)


  /* ✅ STATUSY KTÓRE BLOKUJĄ TERMIN */
  const occupyingStatuses: BookingStatus[] = [
    'pending_payment',
    'deposit_paid',
    'paid',
    'confirmed',
  ]

  /* ===========================================
     TRAILER + STOCK
  =========================================== */

  const trailer = await payload.findByID({
    collection: 'przyczepy',
    id: trailerIdNorm,
    depth: 0,
    overrideAccess: true,
  })

  const stock = getTrailerStock(trailer)

  if (stock <= 0) {
    const all: string[] = []
    for (let cur = startOfDayUTC(from); cur.getTime() <= to.getTime(); cur = addDaysUTC(cur, 1)) {
      all.push(isoUTC(cur))
    }
    return { booked: [], unavailable: all }
  }

  /* ===========================================
     BOOKINGS + BLOCKS
  =========================================== */

  const bookingsCountByDay = new Map<string, number>()
  const blocksCountByDay = new Map<string, number>()

  /* ✅ BOOKINGS (overrideAccess = FIX 500!) */
  const bookingsRes = await payload.find({
    collection: 'rezerwacje',
    depth: 0,
    limit: 2000,
    overrideAccess: true,
    where: {
      and: [
        { przyczepa: { equals: trailerIdNorm } },
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

    const nights = expandNights(s, e)
    for (const day of nights) inc(bookingsCountByDay, day, 1)
  }

  /* ✅ BLOCKS */
  const blocksRes = await payload.find({
    collection: 'blokady',
    depth: 0,
    limit: 2000,
    overrideAccess: true,
    where: {
      and: [
        { przyczepa: { equals: trailerIdNorm } },
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
    const nights = expandNights(s, e)
    for (const day of nights) inc(blocksCountByDay, day, qty)
  }

  /* ===========================================
     OUTPUT: booked + unavailable
  =========================================== */

  const allDays = new Set<string>()
  for (const k of bookingsCountByDay.keys()) allDays.add(k)
  for (const k of blocksCountByDay.keys()) allDays.add(k)

  const booked = new Set<string>()
  const unavailable = new Set<string>()

  for (const day of allDays) {
    const b = bookingsCountByDay.get(day) ?? 0
    const bl = blocksCountByDay.get(day) ?? 0

    if (bl >= stock) {
      unavailable.add(day)
      continue
    }

    if (b + bl >= stock) {
      booked.add(day)
      continue
    }
  }

  return {
    booked: Array.from(booked),
    unavailable: Array.from(unavailable),
  }
}

export function getTrailerPrice(trailer: any) {
  // zgodnie z tym co używasz w PriceSummary: trailer.cena.basePricePerNight
  return Number(trailer?.cena?.basePricePerNight ?? 0)
}

export async function filterTrailersByAvailability(args: {
  trailers: any[]
  from: Date
  to: Date
}) {
  const { trailers, from, to } = args

  // jeśli ktoś podał odwrotnie, napraw
  if (from.getTime() >= to.getTime()) return []

  // rób zapytania równolegle
  const results = await Promise.all(
    trailers.map(async (t) => {
      const id = String((t as any)?.id ?? '')
      if (!id) return { ok: false, trailer: t }

      try {
        const { booked, unavailable } = await getAvailabilityForTrailerRange({
          trailerId: id,
          from,
          to,
        })

        // jeśli w zakresie jest jakikolwiek dzień booked/unavailable, uznaj że niedostępna
        const blockedDays = new Set([...(booked ?? []), ...(unavailable ?? [])])
        const nights = expandNights(from, to)

        const isAvailable = nights.every((d) => !blockedDays.has(d))
        return { ok: isAvailable, trailer: t }
      } catch {
        // jak availability wywali (np. db down), nie blokuj całej strony
        return { ok: true, trailer: t }
      }
    }),
  )

  return results.filter((r) => r.ok).map((r) => r.trailer)
}
