// src/app/api/availability/route.ts
import { NextResponse } from 'next/server'
import { parseISODateOnly, getAvailabilityForTrailerRange } from '@/lib/availability'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)

    const trailerId = url.searchParams.get('trailerId') || ''
    const fromISO = url.searchParams.get('from') || ''
    const toISO = url.searchParams.get('to') || ''

    if (!trailerId || !fromISO || !toISO) {
      return NextResponse.json({ booked: [], unavailable: [] }, { status: 200 })
    }

    const from = parseISODateOnly(fromISO)
    const to = parseISODateOnly(toISO)

    if (!from || !to) {
      return NextResponse.json({ booked: [], unavailable: [] }, { status: 200 })
    }

    const result = await getAvailabilityForTrailerRange({
      trailerId,
      from,
      to,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (e: any) {
    console.error('❌ Availability API error:', e)

    return NextResponse.json(
      {
        booked: [],
        unavailable: [],
        error: String(e?.message ?? e),
      },
      { status: 500 },
    )
  }
}
