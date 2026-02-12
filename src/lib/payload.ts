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

export type ResourceType = 'przyczepa' | 'ebike'

export type AddonDoc = {
  id: number | string
  name: string
  price: number
  pricingType: 'perBooking' | 'perDay'
  active: boolean
  maxQuantity?: number | null
  dostepneDla?: ResourceType[] | null
}

export type ResourceDoc = {
  id: number | string
  typZasobu: ResourceType
  nazwa: string
  slug: string
  active: boolean
  iloscSztuk?: number | null

  opisKrotki?: string | null
  opisDlugi?: unknown

  heroMedia?: MediaDoc | number | string | null
  gallery?: Array<{ media: MediaDoc | number | string }>

  specyfikacja?: Array<{ label: string; value: string }>

  przyczepa?: {
    dmc?: string | null
    iloscOsob?: number | null
  } | null

  ebike?: {
    marka?: string | null
    model?: string | null
    rozmiarRamy?: string | null
    bateriaWh?: number | null
    zasiegKm?: number | null
    typ?: 'mtb' | 'city' | 'trekking' | 'gravel' | null
  } | null

  cena?: {
    jednostka: 'noc' | 'dzien'
    basePrice: number
    seasonalPricing?: Array<{
      name: string
      dateFrom: string
      dateTo: string
      price: number
      minUnits?: number | null
    }>
  } | null

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

export type BookingTypeSettings = {
  minUnits: number
  serviceFee: number
  paymentMode: 'full' | 'deposit'
  depositType?: 'percent' | 'fixed' | null
  depositValue?: number | null
}

export type BookingSettings = {
  dlaPrzyczep: BookingTypeSettings
  dlaRowerow: BookingTypeSettings
  regulaminPdf?: MediaDoc | number | string | null
  politykaPrywatnosciPdf?: MediaDoc | number | string | null
  paymentProviderDefault: 'stripe' | 'p24'
}

/**
 * Railway / prod:
 * - ustaw NEXT_PUBLIC_SERVER_URL na publiczny URL Twojej apki
 * Lokalnie:
 * - fallback http://localhost:3000
 */
function getBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_SERVER_URL
  if (explicit) return explicit.replace(/\/$/, '')
  return 'http://localhost:3000'
}

type PayloadFetchOpts = {
  /**
   * number => ISR co X sekund
   * false  => zawsze świeże (no-store)
   */
  revalidate?: number | false
  /**
   * tagi do on-demand revalidateTag()
   */
  tags?: string[]
}

async function payloadFetch<T>(path: string, opts?: PayloadFetchOpts): Promise<T | null> {
  const baseUrl = getBaseUrl()
  const url = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`

  const isNoStore = opts?.revalidate === false

  const res = await fetch(url, {
    cache: isNoStore ? 'no-store' : undefined,
    next: isNoStore ? undefined : { revalidate: opts?.revalidate ?? 60, tags: opts?.tags },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Payload fetch failed: ${res.status} ${res.statusText} (${url}) ${text}`)
  }

  return (await res.json()) as T
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
    { revalidate: 300, tags: ['global:ustawienia-strony'] },
  )
}

export async function getBookingSettings() {
  return await payloadFetch<BookingSettings>(
    `/api/globals/ustawienia-rezerwacji?depth=2&draft=false&trash=false`,
    { revalidate: 60, tags: ['global:ustawienia-rezerwacji'] },
  )
}

export async function listActiveResources(params?: {
  limit?: number
  depth?: number
  type?: ResourceType | ''
}) {
  const limit = params?.limit ?? 24
  const depth = params?.depth ?? 2
  const type = params?.type ?? ''

  const qs = new URLSearchParams()
  qs.set('limit', String(limit))
  qs.set('depth', String(depth))
  qs.set('where[active][equals]', 'true')
  qs.set('sort', '-updatedAt')
  if (type) qs.set('where[typZasobu][equals]', type)

  const data = await payloadFetch<PayloadListResponse<ResourceDoc>>(`/api/zasoby?${qs.toString()}`, {
    revalidate: 60,
    tags: ['zasoby'],
  })

  return data?.docs ?? []
}

export async function getResourceBySlug(slug: string) {
  let safeSlug = slug

  try {
    safeSlug = decodeURIComponent(slug)
  } catch {
    // leave as-is
  }

  const qs = new URLSearchParams()
  qs.set('limit', '1')
  qs.set('depth', '3')
  qs.set('where[slug][equals]', safeSlug)

  const data = await payloadFetch<PayloadListResponse<ResourceDoc>>(`/api/zasoby?${qs.toString()}`, {
    revalidate: 60,
    tags: ['zasoby', `zasob:${safeSlug}`],
  })

  return data?.docs?.[0] ?? null
}
