import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-revalidate-secret')
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const { tags } = await req.json().catch(() => ({ tags: [] as string[] }))
  for (const t of tags ?? []) revalidateTag(t)

  return NextResponse.json({ ok: true })
}
