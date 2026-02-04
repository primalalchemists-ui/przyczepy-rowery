import { NextResponse } from 'next/server'

function getBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_SERVER_URL
  if (explicit) return explicit.replace(/\/$/, '')

  const vercel = process.env.VERCEL_URL
  if (vercel) return `https://${vercel}`

  return 'http://localhost:3000'
}

type BookingSettings = {
  regulaminPdf?: { url?: string | null } | number | string | null
}

function resolveMediaUrl(media?: any) {
  const baseUrl = getBaseUrl()
  if (!media || typeof media === 'number' || typeof media === 'string') return null
  const url = media.url ?? null
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

export async function GET() {
  const baseUrl = getBaseUrl()

  // ✅ ważne: no-store, żeby od razu widzieć nowe PDF-y po zmianie w panelu
  const booking = await fetch(
    `${baseUrl}/api/globals/ustawienia-rezerwacji?depth=2&draft=false&trash=false`,
    { cache: 'no-store' },
  ).then((r) => r.json() as Promise<BookingSettings>)

  const fileUrl = resolveMediaUrl(booking?.regulaminPdf ?? null)

  if (!fileUrl) {
    return NextResponse.json({ error: 'Brak pliku regulaminu w ustawieniach.' }, { status: 404 })
  }

  const res = await fetch(fileUrl, { cache: 'no-store' })
  if (!res.ok) {
    return NextResponse.json({ error: 'Nie udało się pobrać pliku z serwera.' }, { status: 502 })
  }

  const arrayBuffer = await res.arrayBuffer()

  return new NextResponse(arrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="regulamin.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
