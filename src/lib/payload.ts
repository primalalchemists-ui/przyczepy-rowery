// src/lib/payload.ts
type PayloadListResponse<T> = {
  docs: T[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
}

export type MediaDoc = {
  id: number | string
  alt?: string | null
  url?: string | null
  filename?: string | null
}

export type AddonDoc = {
  id: number | string
  name: string
  price: number
  pricingType: 'perBooking' | 'perDay'
  active: boolean
  maxQuantity?: number | null
}

export type TrailerDoc = {
  id: number | string
  nazwa: string
  slug: string
  active: boolean
  opisKrotki: string
  opisDlugi: unknown
  heroImage?: MediaDoc | number | string | null
  gallery?: Array<{ image: MediaDoc | number | string }>
  specyfikacja?: Array<{
    title: string
    items: Array<{ label: string; value: string }>
  }>
  cena?: {
    basePricePerNight: number
    seasonalPricing?: Array<{
      name: string
      dateFrom: string
      dateTo: string
      pricePerNight: number
      minNights?: number | null
    }>
  }
  dodatki?: Array<AddonDoc | number | string> | null
}

export type SiteSettings = {
  siteName: string
  phone?: string | null
  email?: string | null
  address?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
}

export type BookingSettings = {
  bookingEnabled: boolean
  minNightsDefault: number
  serviceFee: number
  paymentMode: 'full' | 'deposit'
  depositType?: 'percent' | 'fixed' | null
  depositValue?: number | null
  regulaminPdf?: MediaDoc | number | string | null
  politykaPrywatnosciPdf?: MediaDoc | number | string | null
  paymentProviderDefault: 'stripe' | 'p24'
}

/**
 * Railway / prod:
 * - ustaw NEXT_PUBLIC_SERVER_URL na publiczny URL Twojej apki (np. https://caravans.up.railway.app)
 *
 * Lokalnie:
 * - NEXT_PUBLIC_SERVER_URL może być puste, wtedy użyjemy http://localhost:3000
 */
function getBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_SERVER_URL
  if (explicit) return explicit.replace(/\/$/, '')

  // Fallback lokalny
  return 'http://localhost:3000'
}

type PayloadFetchOpts = {
  revalidate?: number
}

/**
 * Ważne:
 * - Jak Payload/API jest dostępne -> zachowanie 1:1 (throw przy nie-ok status)
 * - Jak fetch "crashuje" (ECONNREFUSED w buildzie) -> zwracamy null, żeby nie ubić buildu.
 *
 * Dzięki temu runtime w prod działa normalnie, a build/CI nie jest loterią.
 */
async function payloadFetch<T>(path: string, opts?: PayloadFetchOpts): Promise<T | null> {
  const baseUrl = getBaseUrl()
  const url = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`

  try {
    const res = await fetch(url, {
      next: { revalidate: opts?.revalidate ?? 60 },
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      // zachowanie jak wcześniej: błąd "logiczny" (np. 401/404/500) ma być widoczny
      throw new Error(`Payload fetch failed: ${res.status} ${res.statusText} (${url}) ${text}`)
    }

    return (await res.json()) as T
  } catch (err: any) {
    // To jest klucz na build/CI: ECONNREFUSED itp.
    // Nie wywalamy całej aplikacji, tylko zwracamy null.
    const code = err?.cause?.code || err?.code
    if (code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ETIMEDOUT') {
      return null
    }

    // Inne błędy zachowujemy jak wcześniej (żebyś nie ukrył realnych problemów)
    throw err
  }
}

export function resolveMediaUrl(media?: MediaDoc | number | string | null) {
  const baseUrl = getBaseUrl()
  if (!media || typeof media === 'number' || typeof media === 'string') return null
  const url = media.url ?? null
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

export async function getSiteSettings() {
  return await payloadFetch<SiteSettings>(
    `/api/globals/ustawienia-strony?depth=2&draft=false&trash=false`,
    { revalidate: 300 },
  )
}

export async function getBookingSettings() {
  return await payloadFetch<BookingSettings>(
    `/api/globals/ustawienia-rezerwacji?depth=2&draft=false&trash=false`,
    { revalidate: 60 },
  )
}

export async function listActiveTrailers(params?: { limit?: number; depth?: number }) {
  const limit = params?.limit ?? 24
  const depth = params?.depth ?? 2
  const qs = new URLSearchParams()
  qs.set('limit', String(limit))
  qs.set('depth', String(depth))
  qs.set('where[active][equals]', 'true')
  qs.set('sort', '-updatedAt')

  const data = await payloadFetch<PayloadListResponse<TrailerDoc>>(
    `/api/przyczepy?${qs.toString()}`,
    { revalidate: 60 },
  )

  // Jeśli CMS niedostępny w build time -> pusta lista (UI już to ogarnia)
  return data?.docs ?? []
}

export async function getTrailerBySlug(slug: string) {
  const qs = new URLSearchParams()
  qs.set('limit', '1')
  qs.set('depth', '3')
  qs.set('where[slug][equals]', slug)

  const data = await payloadFetch<PayloadListResponse<TrailerDoc>>(
    `/api/przyczepy?${qs.toString()}`,
    { revalidate: 60 },
  )

  return data?.docs?.[0] ?? null
}
