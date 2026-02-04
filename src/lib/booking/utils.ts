import type { TrailerDoc } from '@/lib/payload'

export function toId(v: unknown) {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return ''
}

// endDate = zwrot (exclusive). Noc = różnica dni UTC.
export function diffNightsUTC(startISO: string, endISO: string) {
  if (!startISO || !endISO) return 0
  const s = new Date(startISO)
  const e = new Date(endISO)
  const su = Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate())
  const eu = Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate())
  const days = Math.round((eu - su) / (1000 * 60 * 60 * 24))
  return Math.max(0, days)
}

export function getTrailerImageUrl(t: TrailerDoc): string | null {
  const anyT = t as any

  // U Ciebie masz heroImage + gallery[{image}]
  const hero = anyT?.heroImage
  const heroUrl = hero?.url ?? null
  if (heroUrl) return heroUrl

  const gallery = anyT?.gallery ?? []
  const first = Array.isArray(gallery) ? gallery[0] : null
  const img = first?.image
  const url = img?.url ?? null
  return url
}
