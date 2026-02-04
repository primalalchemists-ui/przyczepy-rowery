// src/payload/collections/blokady.ts
import type { CollectionConfig, CollectionBeforeValidateHook, CollectionBeforeChangeHook } from 'payload'

const toDate = (v: unknown): Date | null => {
  if (!v) return null
  const d = v instanceof Date ? v : new Date(String(v))
  return Number.isNaN(d.getTime()) ? null : d
}

// U Ciebie endDate to "data zwrotu/checkout" (exclusive) => overlap: start < otherEnd && end > otherStart
const overlaps = (startA: Date, endA: Date, startB: Date, endB: Date) =>
  startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime()

const diffNights = (start: Date, end: Date) => {
  const s = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  const e = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
  return Math.round((e - s) / (1000 * 60 * 60 * 24))
}

const beforeValidate: CollectionBeforeValidateHook = async ({ data }) => {
  const start = toDate(data?.dateFrom)
  const end = toDate(data?.dateTo)
  if (!start || !end) return data

  const nights = diffNights(start, end)
  if (nights <= 0) {
    throw new Error('Data zakończenia musi być później niż data rozpoczęcia (minimum 1 noc).')
  }

  return data
}

const beforeChange: CollectionBeforeChangeHook = async ({ data, req, originalDoc }) => {
  const start = toDate(data?.dateFrom)
  const end = toDate(data?.dateTo)
  if (!start || !end) return data

  const nights = diffNights(start, end)
  if (nights <= 0) throw new Error('Data zakończenia musi być później niż data rozpoczęcia (minimum 1 noc).')

  const caravanId = data?.przyczepa
  if (!caravanId) throw new Error('Pole „Przyczepa” jest wymagane.')

  const active = data?.active ?? true
  // Jeśli blokada jest nieaktywna, nie liczymy limitów
  if (!active) return data

  // ile sztuk blokujesz (domyślnie 1)
  const qtyThisBlock = Math.max(1, Number(data?.ilosc ?? 1))

  // Pobierz stan magazynowy z przyczepy
  const caravan = await req.payload.findByID({
    collection: 'przyczepy',
    id: caravanId,
    depth: 0,
  })

  const stock = Math.max(0, Number((caravan as any)?.iloscSztuk ?? 1))
  if (stock <= 0) throw new Error('Ta przyczepa ma stan 0 — nie da się na nią tworzyć blokad/rezerwacji.')

  // --- Zlicz zajętość z REZERWACJI (tylko statusy "zajmujące") ---
  // Możesz dopasować statusy jeśli chcesz inaczej.
  const occupyingStatuses = ['pending_payment', 'paid', 'confirmed'] as const

  const bookingsRes = await req.payload.find({
    collection: 'rezerwacje',
    depth: 0,
    limit: 500,
    where: {
      and: [
        { przyczepa: { equals: caravanId } },
        { status: { in: occupyingStatuses as unknown as string[] } },
      ],
    },
  })

  let bookingsOccupancy = 0
  for (const b of bookingsRes.docs as any[]) {
    const bs = toDate(b?.startDate)
    const be = toDate(b?.endDate)
    if (!bs || !be) continue
    if (overlaps(start, end, bs, be)) bookingsOccupancy += 1 // 1 rezerwacja = 1 sztuka
  }

  // --- Zlicz zajętość z INNYCH BLOKAD ---
  const currentId = (originalDoc as any)?.id

  const blocksRes = await req.payload.find({
    collection: 'blokady',
    depth: 0,
    limit: 500,
    where: {
      and: [
        { przyczepa: { equals: caravanId } },
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
      `Brak dostępności: stan tej przyczepy to ${stock}, a w tym terminie zajęto już ${bookingsOccupancy + blocksOccupancy}. ` +
        `Ta blokada próbuje zablokować ${qtyThisBlock} szt. (razem byłoby ${totalWouldBe}).`
    )
  }

  return data
}

export const Blokady: CollectionConfig = {
  slug: 'blokady',
  labels: {
    singular: 'Blokada',
    plural: 'Blokady',
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['przyczepa', 'dateFrom', 'dateTo', 'ilosc', 'active', 'updatedAt'],
    group: 'Rezerwacje',
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeValidate: [beforeValidate],
    beforeChange: [beforeChange],
  },
  fields: [
    {
      name: 'przyczepa',
      label: 'Przyczepa',
      type: 'relationship',
      relationTo: 'przyczepy',
      required: true,
      index: true,
    },
    {
      name: 'dateFrom',
      label: 'Od (data)',
      type: 'date',
      required: true,
      index: true,
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'dateTo',
      label: 'Do (data)',
      type: 'date',
      required: true,
      index: true,
      admin: {
        date: { pickerAppearance: 'dayOnly' },
      },
    },
    {
      name: 'ilosc',
      label: 'Ilość blokowanych sztuk',
      type: 'number',
      required: true,
      defaultValue: 1,
      min: 1,
      admin: {
        description:
          'Jeśli masz kilka sztuk tej samej przyczepy, możesz blokować np. 1/2/3 szt. Zależne od pola „ilośćSztuk” w Przyczepach.',
      },
    },
    {
      name: 'komunikat',
      label: 'Komunikat (opcjonalnie)',
      type: 'textarea',
      required: false,
      admin: {
        description:
          'Tekst do pokazania w UI (np. „Serwis”, „Wyjazd firmowy”, „Naprawa po kolizji”).',
      },
    },
    {
      name: 'active',
      label: 'Aktywna',
      type: 'checkbox',
      required: true,
      defaultValue: true,
      index: true,
    },
  ],
}
