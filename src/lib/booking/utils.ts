import type { ResourceDoc } from '@/lib/payload'
import { resolveMediaUrl } from '@/lib/payload'

export function toId(v: unknown): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return ''
}

// endDate = exclusive
export function diffNightsUTC(startISO: string, endISO: string): number {
  if (!startISO || !endISO) return 0

  const s = new Date(startISO)
  const e = new Date(endISO)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0

  const su = Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate())
  const eu = Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate())

  const days = Math.round((eu - su) / (1000 * 60 * 60 * 24))
  return Math.max(0, days)
}

export function getResourceImageUrl(resource: ResourceDoc): string | null {
  if (!resource) return null

  // ✅ zgodnie z kolekcją: heroMedia
  const heroUrl = resolveMediaUrl((resource as any).heroMedia ?? null)
  if (heroUrl) return heroUrl

  // ✅ zgodnie z kolekcją: gallery[].media
  const first = Array.isArray((resource as any).gallery) ? (resource as any).gallery[0] : null
  const galleryUrl = resolveMediaUrl(first?.media ?? null)

  return galleryUrl ?? null
}
