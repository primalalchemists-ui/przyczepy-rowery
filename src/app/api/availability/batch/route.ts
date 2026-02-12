// src/app/api/availability/batch/route.ts
import { NextResponse } from 'next/server'
import { parseISODateOnly, getAvailableResourceIdsForRange } from '@/lib/availability'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function noStoreHeaders() {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))

    const resourceIds = Array.isArray(body?.resourceIds) ? body.resourceIds.map(String) : []
    const fromISO = String(body?.from ?? '')
    const toISO = String(body?.to ?? '')

    if (!resourceIds.length || !fromISO || !toISO) {
      return NextResponse.json({ availableIds: [] }, { status: 200, headers: noStoreHeaders() })
    }

    const from = parseISODateOnly(fromISO)
    const to = parseISODateOnly(toISO)

    if (!from || !to) {
      return NextResponse.json({ availableIds: [] }, { status: 200, headers: noStoreHeaders() })
    }

    const availableIds = await getAvailableResourceIdsForRange({ resourceIds, from, to })

    return NextResponse.json({ availableIds }, { status: 200, headers: noStoreHeaders() })
  } catch (e: any) {
    console.error('❌ Availability batch API error:', e)
    return NextResponse.json(
      { availableIds: [], error: String(e?.message ?? e) },
      { status: 500, headers: noStoreHeaders() },
    )
  }
}
