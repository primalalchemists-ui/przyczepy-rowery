import { NextResponse } from 'next/server'
import { contactSchema } from '@/lib/schemas/contactSchema'

export async function POST(req: Request) {
  const json = await req.json()
  const data = contactSchema.parse(json)

  console.log('CONTACT_MESSAGE:', data)

  return NextResponse.json({ ok: true })
}
