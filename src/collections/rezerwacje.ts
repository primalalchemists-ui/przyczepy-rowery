// src/payload/collections/rezerwacje.ts
import type { CollectionConfig, CollectionBeforeChangeHook, CollectionBeforeValidateHook } from 'payload'

type BookingStatus = 'pending_payment' | 'deposit_paid' | 'paid' | 'confirmed' | 'cancelled'

const toDate = (v: unknown): Date | null => {
  if (!v) return null
  const d = v instanceof Date ? v : new Date(String(v))
  return Number.isNaN(d.getTime()) ? null : d
}

const diffNights = (start: Date, end: Date) => {
  const s = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  const e = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
  return Math.round((e - s) / (1000 * 60 * 60 * 24))
}

/**
 * ✅ Normalizacja ID relacji:
 * - jeśli id jest stringiem typu "123" → zamienia na number 123
 * - jeśli jest normalnym stringiem uuid → zostawia
 */
const normalizeRelId = (v: unknown) => {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const s = v.trim()
    if (/^\d+$/.test(s)) return Number(s)
    return s
  }
  return v as any
}

const round2 = (n: number) => Math.round(n * 100) / 100

// tylko do wyświetlania w UI (zaliczka/całość) — NIE steruje panelem
const calcPayableNow = (total: number, settings: any) => {
  const paymentMode = String(settings?.paymentMode ?? 'full') as 'full' | 'deposit'
  if (paymentMode === 'full') return Math.max(0, total)

  const depositType = String(settings?.depositType ?? 'percent') as 'percent' | 'fixed'
  const depositValueRaw = Number(settings?.depositValue ?? 0)
  const depositValue = Number.isFinite(depositValueRaw) ? Math.max(0, depositValueRaw) : 0

  if (depositType === 'fixed') return Math.max(0, Math.min(total, depositValue))

  const pct = Math.max(0, Math.min(100, depositValue))
  return Math.max(0, round2(total * (pct / 100)))
}

const beforeValidate: CollectionBeforeValidateHook = async ({ data }) => {
  const start = toDate(data?.startDate)
  const end = toDate(data?.endDate)
  if (!start || !end) return data

  const nights = diffNights(start, end)
  if (nights <= 0) throw new Error('Data zakończenia musi być później niż data rozpoczęcia (minimum 1 noc).')

  return data
}

const beforeChange: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  const status = ((data?.status as BookingStatus | undefined) ?? 'pending_payment') as BookingStatus

  const start = toDate(data?.startDate)
  const end = toDate(data?.endDate)
  if (!start || !end) return data

  const nights = diffNights(start, end)
  if (nights <= 0) throw new Error('Data zakończenia musi być później niż data rozpoczęcia (minimum 1 noc).')

  const bookingSettings = await req.payload.findGlobal({ slug: 'ustawienia-rezerwacji' })

  const bookingEnabled = Boolean((bookingSettings as any)?.bookingEnabled)
  if (!bookingEnabled) {
    throw new Error('Rezerwacje są aktualnie wyłączone (bookingEnabled = false).')
  }

  const minNightsDefault = Number((bookingSettings as any)?.minNightsDefault ?? 1)
  const serviceFee = Number((bookingSettings as any)?.serviceFee ?? 0)

  if (nights < minNightsDefault) {
    throw new Error(`Minimalna liczba nocy: ${minNightsDefault}.`)
  }

  const caravanId = normalizeRelId(data?.przyczepa)
  if (!caravanId) throw new Error('Pole „Przyczepa” jest wymagane.')

  const caravan = await req.payload.findByID({
    collection: 'przyczepy',
    id: caravanId,
    depth: 2,
  })

  // ====== DANE KLIENTA: FAKTURA + NIP (WARUNKOWO) ======
  const klient = (data as any)?.klient ?? {}
  const wantsInvoice = Boolean(klient?.wantsInvoice)
  const nipRaw = typeof klient?.nip === 'string' ? klient.nip.trim() : ''

  if (wantsInvoice) {
    if (!nipRaw) {
      throw new Error('Podaj NIP, jeśli zaznaczono fakturę.')
    }
  }

  // jeśli faktury nie chcą — czyścimy NIP (żeby CMS był spójny)
  const nextNip = wantsInvoice ? nipRaw : undefined

  // ====== CENA BAZOWA + SEZONY (po nocach) ======
  const basePricePerNight = Number((caravan as any)?.cena?.basePricePerNight ?? 0)
  const seasonal = Array.isArray((caravan as any)?.cena?.seasonalPricing)
    ? ((caravan as any).cena.seasonalPricing as any[])
    : []

  const seasonalSorted = [...seasonal].sort((a, b) => {
    const af = String(a?.dateFrom ?? '')
    const bf = String(b?.dateFrom ?? '')
    return af < bf ? -1 : 1
  })

  const toISODateUTC = (d: Date) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
      .toISOString()
      .slice(0, 10)

  const pickSeasonForNightISO = (nightISO: string) => {
    for (const s of seasonalSorted) {
      const df = toDate(s?.dateFrom)
      const dt = toDate(s?.dateTo)
      if (!df || !dt) continue

      const dfISO = toISODateUTC(df)
      const dtISO = toISODateUTC(dt)

      if (nightISO >= dfISO && nightISO <= dtISO) return s
    }
    return null
  }

  type LodgingBreakdownRow = {
    label: string
    nights: number
    pricePerNight: number
    total: number
  }

  const lodgingBreakdown: LodgingBreakdownRow[] = []

  const pushOrInc = (row: LodgingBreakdownRow) => {
    const last = lodgingBreakdown[lodgingBreakdown.length - 1]
    const sameLabel = last?.label === row.label
    const samePrice = last?.pricePerNight === row.pricePerNight
    if (last && sameLabel && samePrice) {
      last.nights += row.nights
      last.total = round2(last.total + row.total)
    } else {
      lodgingBreakdown.push(row)
    }
  }

  let lodgingTotal = 0
  let requiredSeasonMinNights = 0

  {
    const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()))
    const endUTC = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()))

    while (cur.getTime() < endUTC.getTime()) {
      const nightISO = cur.toISOString().slice(0, 10)
      const season = pickSeasonForNightISO(nightISO)

      if (season) {
        const seasonName = String(season?.name ?? 'Sezon')
        const seasonPrice = Number(season?.pricePerNight ?? basePricePerNight)

        lodgingTotal += seasonPrice

        const mn = season?.minNights != null ? Number(season.minNights) : 0
        if (Number.isFinite(mn) && mn > 0) requiredSeasonMinNights = Math.max(requiredSeasonMinNights, mn)

        pushOrInc({
          label: `Cena sezonowa (${seasonName})`,
          nights: 1,
          pricePerNight: seasonPrice,
          total: round2(seasonPrice),
        })
      } else {
        lodgingTotal += basePricePerNight
        pushOrInc({
          label: 'Cena standardowa',
          nights: 1,
          pricePerNight: basePricePerNight,
          total: round2(basePricePerNight),
        })
      }

      cur.setUTCDate(cur.getUTCDate() + 1)
    }
  }

  lodgingTotal = round2(lodgingTotal)

  const standardNights = lodgingBreakdown
    .filter((r) => r.label === 'Cena standardowa')
    .reduce((sum, r) => sum + r.nights, 0)

  const seasonalNights = lodgingBreakdown
    .filter((r) => r.label !== 'Cena standardowa')
    .reduce((sum, r) => sum + r.nights, 0)

  const requiredMinNights = Math.max(minNightsDefault, requiredSeasonMinNights)

  if (nights < requiredMinNights) {
    if (requiredSeasonMinNights > minNightsDefault) {
      throw new Error(`Ten sezon wymaga minimum ${requiredSeasonMinNights} nocy.`)
    }
    throw new Error(`Minimalna liczba nocy: ${minNightsDefault}.`)
  }

  // ====== DODATKI ======
  const extrasInput = Array.isArray(data?.extras) ? (data?.extras as any[]) : []

  const extrasSnapshot: any[] = []
  let extrasTotal = 0

  for (const row of extrasInput) {
    const addonId = normalizeRelId(row?.dodatek)
    if (!addonId) continue

    const qty = Math.max(1, Number(row?.quantity ?? 1))

    const addon = await req.payload.findByID({
      collection: 'dodatki',
      id: addonId,
      depth: 0,
    })

    if (!(addon as any)?.active) continue

    const name = String((addon as any)?.name ?? '')
    const pricingType = ((addon as any)?.pricingType ?? 'perBooking') as 'perBooking' | 'perDay'
    const unitPrice = Number((addon as any)?.price ?? 0)

    const rowTotal = pricingType === 'perDay' ? unitPrice * qty * nights : unitPrice * qty
    extrasTotal += rowTotal

    extrasSnapshot.push({
      name,
      pricingType,
      unitPrice,
      quantity: qty,
      total: rowTotal,
    })
  }

  // ====== SUMA ======
  const total = round2(lodgingTotal + extrasTotal + serviceFee)

  // (frontend info) ile “powinno” być teraz wg global settings
  const payableNow = round2(calcPayableNow(total, bookingSettings as any))

  // PANEL: wpisujesz ile klient realnie zapłacił
  const paidAmountInput = Number((data as any)?.payment?.paidAmount ?? 0)
  const paidAmount = Number.isFinite(paidAmountInput) ? Math.max(0, round2(paidAmountInput)) : 0

  const dueAmount = round2(Math.max(0, total - paidAmount))
  const paidInFull = dueAmount <= 0.00001

  // jeśli coś wpłacone, to uznajemy że to zaliczka (dopóki nie pokryje całości)
  const depositPaid = paidAmount > 0 && !paidInFull

  // ✅ miękka automatyka statusu:
  // - nie dotykamy: confirmed/cancelled
  // - dotykamy tylko: pending_payment/deposit_paid/paid
  let nextStatus = status
  const statusIsPaymentLike = status === 'pending_payment' || status === 'deposit_paid' || status === 'paid'

  if (statusIsPaymentLike || operation === 'create') {
    if (paidInFull) nextStatus = 'paid'
    else if (depositPaid) nextStatus = 'deposit_paid'
    else nextStatus = 'pending_payment'
  }

  return {
    ...data,
    status: nextStatus,

    // fix: payload czasem wali string/number mismatch
    przyczepa: caravanId,

    // ✅ klient: zapis wantsInvoice + NIP warunkowo
    klient: {
      ...klient,
      wantsInvoice,
      nip: nextNip,
    },

    payment: {
      ...(data as any)?.payment,
      payableNow,
      paidAmount,
      dueAmount,
      paidInFull,
    },

    snapshot: {
      ...(data?.snapshot ?? {}),
      nights,

      // ✅ baza zawsze stała w CMS (żeby nie mieszało, że "użyta" to sezon)
      pricePerNight: basePricePerNight,

      // ✅ breakdown standard vs sezon
      lodgingBreakdown,
      standardNights,
      seasonalNights,

      extrasSnapshot,
      serviceFee,
      total,
    },
  }
}

export const Rezerwacje: CollectionConfig = {
  slug: 'rezerwacje',
  labels: {
    singular: 'Rezerwacja',
    plural: 'Rezerwacje',
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: [
      'przyczepa',
      'startDate',
      'endDate',
      'status',
      'payment.paidAmount',
      'payment.dueAmount',
      'updatedAt',
    ],
    group: 'Rezerwacje',
  },
  access: {
    create: () => true,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
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
      name: 'startDate',
      label: 'Data rozpoczęcia',
      type: 'date',
      required: true,
      index: true,
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'endDate',
      label: 'Data zakończenia',
      type: 'date',
      required: true,
      index: true,
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      index: true,
      defaultValue: 'pending_payment',
      options: [
        { label: 'Oczekuje na płatność', value: 'pending_payment' },
        { label: 'Zaliczka wpłacona', value: 'deposit_paid' },
        { label: 'Opłacona', value: 'paid' },
        { label: 'Potwierdzona', value: 'confirmed' },
        { label: 'Anulowana', value: 'cancelled' },
      ],
    },

    {
      name: 'extras',
      label: 'Wybrane dodatki',
      type: 'array',
      required: false,
      // admin: {
      //   description: 'Dodatki do tej rezerwacji (ilość = quantity).',
      // },
      fields: [
        {
          name: 'dodatek',
          label: 'Dodatek',
          type: 'relationship',
          relationTo: 'dodatki',
          required: true,
        },
        {
          name: 'quantity',
          label: 'Ilość',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 1,
        },
      ],
    },

    {
  name: 'klient',
  label: 'Dane klienta',
  type: 'group',
  fields: [
    { name: 'fullName', label: 'Imię i nazwisko', type: 'text', required: true },
    { name: 'email', label: 'E-mail', type: 'email', required: true },
    { name: 'phone', label: 'Telefon', type: 'text', required: true },

    // ✅ Faktura NIE required (żeby nie było "Faktura *")
    {
      name: 'wantsInvoice',
      label: 'Faktura',
      type: 'checkbox',
      required: false,
      defaultValue: false,
    },

    // ✅ NIP pokazuje się tylko gdy wantsInvoice = true + walidacja warunkowa
    {
      name: 'nip',
      label: 'NIP',
      type: 'text',
      required: false,
      admin: {
        condition: (_, siblingData) => Boolean((siblingData as any)?.wantsInvoice),
        description: 'Wymagany, jeśli zaznaczono „Faktura”.',
      },
      validate: (value, { siblingData }) => {
        const wants = Boolean((siblingData as any)?.wantsInvoice)
        if (!wants) return true

        const v = String(value ?? '').trim()
        if (!v) return 'Podaj NIP, jeśli chcesz fakturę.'
        return true
      },
    },

    { name: 'notes', label: 'Uwagi (opcjonalnie)', type: 'textarea', required: false },
    {
      name: 'disability',
      label: 'Niepełnosprawność',
      type: 'checkbox',
      required: false,
      defaultValue: false,
    },
  ],
},


    // ✅ PŁATNOŚĆ (panel = wolność)
    {
      name: 'payment',
      label: 'Płatność',
      type: 'group',
      fields: [
        {
          name: 'payableNow',
          label: 'Sugestia: do zapłaty teraz (z ustawień)',
          type: 'number',
          required: false,
          min: 0,
          admin: {
            readOnly: true,
            step: 0.01,
          },
        },
        {
          name: 'paidAmount',
          label: 'Zapłacone (PLN)',
          type: 'number',
          required: false,
          min: 0,
          admin: { step: 0.01, description: 'Wpisz ile klient realnie zapłacił' },
        },
        {
          name: 'dueAmount',
          label: 'Pozostało do zapłaty (PLN)',
          type: 'number',
          required: false,
          min: 0,
          admin: { readOnly: true, step: 0.01 },
        },
        {
          name: 'paidInFull',
          label: 'Opłacone w całości',
          type: 'checkbox',
          required: false,
          admin: { readOnly: true },
        },
      ],
    },

    {
      name: 'snapshot',
      label: 'Snapshot ceny (auto)',
      type: 'group',
      admin: { description: 'Pola wyliczane automatycznie' },
      fields: [
        { name: 'nights', label: 'Liczba nocy', type: 'number', required: false, min: 0, admin: { readOnly: true } },
        {
          name: 'pricePerNight',
          label: 'Cena standardowa / noc',
          type: 'number',
          required: false,
          min: 0,
          admin: { readOnly: true, step: 0.01 },
        },

        {
          name: 'lodgingBreakdown',
          label: 'Noclegi (rozbicie)',
          type: 'array',
          required: false,
          admin: { readOnly: true },
          fields: [
            { name: 'label', label: 'Typ', type: 'text', required: true },
            { name: 'nights', label: 'Liczba nocy', type: 'number', required: true, min: 0 },
            { name: 'pricePerNight', label: 'Cena / noc', type: 'number', required: true, min: 0, admin: { step: 0.01 } },
            { name: 'total', label: 'Suma', type: 'number', required: true, min: 0, admin: { step: 0.01 } },
          ],
        },
        {
          name: 'standardNights',
          label: 'Nocy standard',
          type: 'number',
          required: false,
          min: 0,
          admin: { readOnly: true },
        },
        {
          name: 'seasonalNights',
          label: 'Nocy sezon',
          type: 'number',
          required: false,
          min: 0,
          admin: { readOnly: true },
        },

        {
          name: 'extrasSnapshot',
          label: 'Dodatki (snapshot)',
          type: 'array',
          required: false,
          admin: { readOnly: true },
          fields: [
            { name: 'name', label: 'Nazwa', type: 'text', required: true },
            {
              name: 'pricingType',
              label: 'Sposób naliczania',
              type: 'select',
              required: true,
              options: [
                { label: 'Za rezerwację', value: 'perBooking' },
                { label: 'Za dobę', value: 'perDay' },
              ],
            },
            { name: 'unitPrice', label: 'Cena jednostkowa', type: 'number', required: true, admin: { step: 0.01 } },
            { name: 'quantity', label: 'Ilość', type: 'number', required: true, min: 1 },
            { name: 'total', label: 'Suma', type: 'number', required: true, admin: { step: 0.01 } },
          ],
        },
        {
          name: 'serviceFee',
          label: 'Opłata serwisowa',
          type: 'number',
          required: false,
          admin: { readOnly: true, step: 0.01 },
        },
        { name: 'total', label: 'Razem', type: 'number', required: false, admin: { readOnly: true, step: 0.01 } },
      ],
    },
  ],
}
