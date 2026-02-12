// src/app/api/availability/route.ts
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { parseISODateOnly, getAvailabilityForResourceRange } from '@/lib/availability'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)

    const resourceId = url.searchParams.get('resourceId') || ''
    const fromISO = url.searchParams.get('from') || ''
    const toISO = url.searchParams.get('to') || ''

    if (!resourceId || !fromISO || !toISO) {
      return NextResponse.json({ booked: [], unavailable: [], remainingByDay: {}, stock: 0 }, { status: 200 })
    }

    const from = parseISODateOnly(fromISO)
    const to = parseISODateOnly(toISO)

    if (!from || !to) {
      return NextResponse.json({ booked: [], unavailable: [], remainingByDay: {}, stock: 0 }, { status: 200 })
    }

    const result = await getAvailabilityForResourceRange({
      resourceId,
      from,
      to,
    })

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })

  } catch (e: any) {
    console.error('❌ Availability API error:', e)

    return NextResponse.json(
      {
        booked: [],
        unavailable: [],
        remainingByDay: {},
        stock: 0,
        error: String(e?.message ?? e),
      },
      { status: 500 },
    )
  }
}
