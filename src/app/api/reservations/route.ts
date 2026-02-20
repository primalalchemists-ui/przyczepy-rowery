import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ReservationMailPayload = {
  fullName: string
  email: string
  phone: string
  resourceName: string
  resourceSlug: string
  resourceType: 'przyczepa' | 'ebike'
  startDate: string
  endDate: string
  ilosc: number
  reservationNumber?: string
  extrasLabel?: string
  notes?: string
}

const UI_MESSAGE =
  'Twoje zgłoszenie rezerwacji zostało przyjęte i czeka na potwierdzenie. ' +
  'Odezwiemy się w sprawie płatności zadatku i kaucji do 5 dni roboczych. ' +
  'Dostarczymy również dane potrzebne do odbioru. ' +
  'Płatność reszty odbywa się na miejscu odbioru.'

function isTruthy(v: string | undefined) {
  return v === '1' || v === 'true' || v === 'TRUE' || v === 'yes' || v === 'on'
}

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY missing at runtime')
    return NextResponse.json({ ok: false, error: 'SERVER_CONFIG', message: UI_MESSAGE }, { status: 500 })
  }

  const resend = new Resend(apiKey)

  let data: ReservationMailPayload
  try {
    data = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_JSON', message: UI_MESSAGE }, { status: 400 })
  }

  const toAdmin = process.env.RESERVATIONS_TO || 'rezerwacje@easyapartments.pl'
  const from = process.env.MAIL_FROM || 'Easy Apartments <onboarding@resend.dev>'

  const missing =
    !data?.fullName ||
    !data?.email ||
    !data?.phone ||
    !data?.resourceName ||
    !data?.resourceSlug ||
    !data?.resourceType ||
    !data?.startDate ||
    !data?.endDate ||
    !Number.isFinite(Number(data?.ilosc))

  if (missing) {
    return NextResponse.json({ ok: false, error: 'MISSING_FIELDS', message: UI_MESSAGE }, { status: 400 })
  }

  const ilosc = Math.max(1, Number(data.ilosc))
  const rn = String(data.reservationNumber ?? '').trim()

  const adminText =
    `NOWA REZERWACJA (ZGŁOSZENIE)\n\n` +
    (rn ? `Numer rezerwacji: ${rn}\n\n` : '') +
    `Klient: ${data.fullName}\n` +
    `Email: ${data.email}\n` +
    `Telefon: ${data.phone}\n\n` +
    `Zasób: ${data.resourceName}\n` +
    `Typ: ${data.resourceType}\n` +
    `Termin: ${data.startDate} → ${data.endDate}\n` +
    `Ilość: ${ilosc}\n` +
    `Dodatki: ${data.extrasLabel || '-'}\n` +
    `Uwagi: ${data.notes || '-'}\n\n` +
    `Link: /oferta/${data.resourceSlug}\n\n` +
    `---\n${UI_MESSAGE}\n`

  const customerText =
    `Dziękujemy!\n\n` +
    `Twoje zgłoszenie rezerwacji:\n` +
    (rn ? `• Numer rezerwacji: ${rn}\n` : '') +
    `• Zasób: ${data.resourceName}\n` +
    `• Termin: ${data.startDate} → ${data.endDate}\n` +
    `• Ilość: ${ilosc}\n` +
    (data.extrasLabel ? `• Dodatki: ${data.extrasLabel}\n` : '') +
    `\n${UI_MESSAGE}\n\n` +
    `W razie braku odpowiedzi, napisz do nas na rezerwacje@easyapartments.pl i podaj numer rezerwacji.\n\n` +
    `Pozdrawiamy\nEasy Apartments`

  const testMode = isTruthy(process.env.RESEND_TEST_MODE)
  const testTo = process.env.RESEND_TEST_TO || ''
  const customerTo = testMode && testTo ? testTo : data.email

  try {
    await resend.emails.send({
      from,
      to: toAdmin,
      replyTo: data.email,
      subject: `${rn ? `[${rn}] ` : ''}Nowa rezerwacja: ${data.resourceName} (${data.startDate} → ${data.endDate})`,
      text: adminText,
    })

    await resend.emails.send({
      from,
      to: customerTo,
      replyTo: toAdmin,
      subject: `${rn ? `[${rn}] ` : ''}Zgłoszenie rezerwacji przyjęte: ${data.resourceName}`,
      text: customerText,
    })

    return NextResponse.json({ ok: true, message: UI_MESSAGE })
  } catch (e: any) {
    return NextResponse.json({
      ok: true,
      message: UI_MESSAGE + ' (Potwierdzenie e-mail może dotrzeć z opóźnieniem.)',
      mailError: String(e?.message || e),
    })
  }
}
