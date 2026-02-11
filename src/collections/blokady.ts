import type { CollectionConfig, CollectionBeforeValidateHook, CollectionBeforeChangeHook } from 'payload'

const toDate = (v: unknown): Date | null => {
  if (!v) return null
  const d = v instanceof Date ? v : new Date(String(v))
  return Number.isNaN(d.getTime()) ? null : d
}

const overlaps = (startA: Date, endA: Date, startB: Date, endB: Date) =>
  startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime()

const diffUnits = (start: Date, end: Date) => {
  const s = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  const e = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
  return Math.round((e - s) / (1000 * 60 * 60 * 24))
}

const beforeValidate: CollectionBeforeValidateHook = async ({ data }) => {
  const start = toDate((data as any)?.dateFrom)
  const end = toDate((data as any)?.dateTo)
  if (!start || !end) return data

  const units = diffUnits(start, end)
  if (units <= 0) throw new Error('Data zakończenia musi być później niż data rozpoczęcia (minimum 1 dzień).')
  return data
}

const beforeChange: CollectionBeforeChangeHook = async ({ data, req, originalDoc }) => {
  const start = toDate((data as any)?.dateFrom)
  const end = toDate((data as any)?.dateTo)
  if (!start || !end) return data

  const units = diffUnits(start, end)
  if (units <= 0) throw new Error('Data zakończenia musi być później niż data rozpoczęcia (minimum 1 dzień).')

  const zasobId = (data as any)?.zasob
  if (!zasobId) throw new Error('Pole „Zasób” jest wymagane.')

  const active = (data as any)?.active ?? true
  if (!active) return data

  const qtyThisBlock = Math.max(1, Number((data as any)?.ilosc ?? 1))

  const zasob = await req.payload.findByID({
    collection: 'zasoby',
    id: zasobId,
    depth: 0,
  })

  const stock = Math.max(0, Number((zasob as any)?.iloscSztuk ?? 1))
  if (stock <= 0) throw new Error('Ten zasób ma stan 0 — nie da się na niego tworzyć blokad/rezerwacji.')

  const occupyingStatuses = ['pending_payment', 'deposit_paid', 'paid', 'confirmed'] as const

  // Rezerwacje
  const bookingsRes = await req.payload.find({
    collection: 'rezerwacje',
    depth: 0,
    limit: 2000,
    where: {
      and: [
        { zasob: { equals: zasobId } },
        { status: { in: occupyingStatuses as unknown as string[] } },
      ],
    },
  })

  let bookingsOccupancy = 0
  for (const b of bookingsRes.docs as any[]) {
    const bs = toDate(b?.startDate)
    const be = toDate(b?.endDate)
    if (!bs || !be) continue
    if (overlaps(start, end, bs, be)) {
      bookingsOccupancy += Math.max(1, Number(b?.ilosc ?? 1)) // ✅ ilość z rezerwacji
    }
  }

  // Inne blokady
  const currentId = (originalDoc as any)?.id

  const blocksRes = await req.payload.find({
    collection: 'blokady',
    depth: 0,
    limit: 2000,
    where: {
      and: [
        { zasob: { equals: zasobId } },
        { active: { equals: true } },
        ...(currentId ? [{ id: { not_equals: currentId } }] : []),
      ],
    },
  })

  let blocksOccupancy = 0
  for (const bl of blocksRes.docs as any[]) {
    const bs = toDate(bl?.dateFrom)
    const be = toDate(bl?.dateTo)
    if (!bs || !be) continue
    if (!overlaps(start, end, bs, be)) continue
    blocksOccupancy += Math.max(1, Number(bl?.ilosc ?? 1))
  }

  const totalWouldBe = bookingsOccupancy + blocksOccupancy + qtyThisBlock

  if (totalWouldBe > stock) {
    throw new Error(
      `Brak dostępności: stan zasobu to ${stock}, a w tym terminie zajęto już ${bookingsOccupancy + blocksOccupancy}. ` +
        `Ta blokada próbuje zablokować ${qtyThisBlock} szt. (razem byłoby ${totalWouldBe}).`
    )
  }

  return data
}

export const Blokady: CollectionConfig = {
  slug: 'blokady',
  labels: { singular: 'Blokada', plural: 'Blokady' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['zasob', 'dateFrom', 'dateTo', 'ilosc', 'active', 'updatedAt'],
    group: 'Rezerwacje',
  },
  access: { read: () => true },
  hooks: { beforeValidate: [beforeValidate], beforeChange: [beforeChange] },
  fields: [
    {
      name: 'zasob',
      label: 'Zasób',
      type: 'relationship',
      relationTo: 'zasoby',
      required: true,
      index: true,
    },
    { name: 'dateFrom', label: 'Od (data)', type: 'date', required: true, index: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
    { name: 'dateTo', label: 'Do (data)', type: 'date', required: true, index: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
    { name: 'ilosc', label: 'Ilość blokowanych sztuk', type: 'number', required: true, defaultValue: 1, min: 1 },
    { name: 'komunikat', label: 'Komunikat (opcjonalnie)', type: 'textarea' },
    { name: 'active', label: 'Aktywna', type: 'checkbox', required: true, defaultValue: true, index: true },
  ],
}
