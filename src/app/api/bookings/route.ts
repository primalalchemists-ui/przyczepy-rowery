import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

function subDaysISO(iso: string, days: number) {
  if (!iso) return ''
  const d = new Date(iso)
  d.setDate(d.getDate() - days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const body = await req.json()

    // endDate w systemie jest EXCLUSIVE
    // dla "dzien" (ebike) zwrot = endDate - 1 (inclusive)
    const unitType = String(body?.unitType ?? 'noc') as 'noc' | 'dzien'

    if (unitType === 'dzien' && body?.endDate) {
      body.returnDate = subDaysISO(body.endDate, 1)
    } else {
      body.returnDate = body?.endDate ?? ''
    }

    const created = await payload.create({
      collection: 'rezerwacje',
      data: body,
    })

    return NextResponse.json({ ok: true, id: created.id })
  } catch (e: any) {
    return new NextResponse(e?.message ?? 'Server error', { status: 500 })
  }
}
