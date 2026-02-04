// src/app/api/bookings/route.ts
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const body = await req.json()

    const created = await payload.create({
      collection: 'rezerwacje',
      data: body,
    })

    return NextResponse.json({ ok: true, id: created.id })
  } catch (e: any) {
    return new NextResponse(e?.message ?? 'Server error', { status: 500 })
  }
}
