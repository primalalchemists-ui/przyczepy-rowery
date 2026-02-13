// src/payload/collections/rezerwacje.ts
import type { CollectionConfig, CollectionBeforeChangeHook, CollectionBeforeValidateHook } from 'payload'

type BookingStatus = 'pending_payment' | 'deposit_paid' | 'paid' | 'confirmed' | 'cancelled'
type ResourceType = 'przyczepa' | 'ebike'

type InvoiceType = 'none' | 'personal' | 'company'

const toDate = (v: unknown): Date | null => {
  if (!v) return null
  const d = v instanceof Date ? v : new Date(String(v))
  return Number.isNaN(d.getTime()) ? null : d
}

// units = liczba dni/nocy między start a end (end-exclusive)
const diffUnits = (start: Date, end: Date) => {
  const s = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  const e = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
  return Math.round((e - s) / (1000 * 60 * 60 * 24))
}

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

// ====== ✅ helpery UTC do capacity-check ======
const startOfDayUTC = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

const addDaysUTC = (date: Date, days: number) => {
  const d = startOfDayUTC(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

const isoUTC = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`

// start inclusive, end exclusive
const expandDays = (start: Date, end: Date): string[] => {
  const s = startOfDayUTC(start)
  const e = startOfDayUTC(end)
  const out: string[] = []
  for (let cur = s; cur.getTime() < e.getTime(); cur = addDaysUTC(cur, 1)) out.push(isoUTC(cur))
  return out
}

const overlaps = (startA: Date, endA: Date, startB: Date, endB: Date) =>
  startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime()

type DayCounts = Map<string, number>
const inc = (m: DayCounts, day: string, qty: number) => m.set(day, (m.get(day) ?? 0) + qty)

const normInvoiceType = (v: unknown): InvoiceType => {
  const s = String(v ?? '').trim()
  if (s === 'personal' || s === 'company' || s === 'none') return s
  return 'none'
}

const clean = (v: unknown) => String(v ?? '').trim()

const beforeValidate: CollectionBeforeValidateHook = async ({ data }) => {
  const start = toDate((data as any)?.startDate)
  const end = toDate((data as any)?.endDate)
  if (!start || !end) return data

  const units = diffUnits(start, end)
  if (units <= 0) throw new Error('Data zakończenia musi być później niż data rozpoczęcia (minimum 1 dzień).')

  const qty = Math.max(1, Number((data as any)?.ilosc ?? 1))
  if (!Number.isFinite(qty) || qty < 1) throw new Error('Pole „Ilość” musi być >= 1.')

  return data
}

const beforeChange: CollectionBeforeChangeHook = async ({ data, req, operation, originalDoc }) => {
  const status = (((data as any)?.status as BookingStatus | undefined) ?? 'pending_payment') as BookingStatus

  // ====== DATY + ILOŚĆ ======
  const start = toDate((data as any)?.startDate)
  const end = toDate((data as any)?.endDate)
  if (!start || !end) return data

  const units = diffUnits(start, end)
  if (units <= 0) throw new Error('Data zakończenia musi być później niż data rozpoczęcia (minimum 1 dzień).')

  const qty = Math.max(1, Number((data as any)?.ilosc ?? 1))
  if (!Number.isFinite(qty) || qty < 1) throw new Error('Pole „Ilość” musi być >= 1.')

  // ====== GLOBAL: USTAWIENIA REZERWACJI ======
  const bookingSettings = await req.payload.findGlobal({ slug: 'ustawienia-rezerwacji' })

  const bookingEnabled = Boolean((bookingSettings as any)?.bookingEnabled ?? true)
  if (!bookingEnabled) throw new Error('Rezerwacje są aktualnie wyłączone (bookingEnabled = false).')

  // ====== ZASÓB ======
  const zasobId = normalizeRelId((data as any)?.zasob)
  if (!zasobId) throw new Error('Pole „Zasób” jest wymagane.')

  const zasob = await req.payload.findByID({
    collection: 'zasoby',
    id: zasobId,
    depth: 2,
  })

  // ====== TYP ZASOBU + PER-TYP SETTINGS ======
  const resourceType = String((zasob as any)?.typZasobu ?? 'przyczepa') as ResourceType

  const perTypeSettings =
    resourceType === 'ebike' ? (bookingSettings as any)?.dlaRowerow : (bookingSettings as any)?.dlaPrzyczep

  const enabledForType = perTypeSettings?.enabled !== false
  if (!enabledForType) {
    throw new Error(
      resourceType === 'ebike'
        ? 'Rezerwacje dla e-bike są aktualnie wyłączone.'
        : 'Rezerwacje dla przyczep są aktualnie wyłączone.',
    )
  }

  const minUnitsDefault = Number(perTypeSettings?.minUnits ?? 1)
  const serviceFee = Number(perTypeSettings?.serviceFee ?? 0)

  if (units < minUnitsDefault) {
    throw new Error(`Minimalna liczba ${resourceType === 'ebike' ? 'dni' : 'nocy'}: ${minUnitsDefault}.`)
  }

  // ====== ✅ DANE KLIENTA: FAKTURA (NOWE) ======
  const klient = (data as any)?.klient ?? {}

  // Zachowujemy wantsInvoice dla kompatybilności, ale source of truth = invoiceType
  const wantsInvoice = Boolean(klient?.wantsInvoice)

  const invoiceType: InvoiceType = (() => {
    const fromData = normInvoiceType(klient?.invoiceType)
    if (fromData !== 'none') return fromData
    return wantsInvoice ? 'personal' : 'none'
  })()

  const companyName = clean(klient?.companyName)
  const companyAddress = clean(klient?.companyAddress)
  const nipRaw = clean(klient?.nip)

  // Walidacja:
  // - invoiceType=none => nic nie wymagamy
  // - invoiceType=personal => nic nie wymagamy
  // - invoiceType=company => wymagamy 3 pól
  if (invoiceType === 'company') {
    if (!companyName) throw new Error('Podaj nazwę firmy do faktury.')
    if (!companyAddress) throw new Error('Podaj adres siedziby do faktury.')
    if (!nipRaw) throw new Error('Podaj NIP do faktury.')
  }

  const nextInvoiceType = invoiceType
  const nextWantsInvoice = invoiceType !== 'none'

  // jeśli nie company → czyścimy pola firmy, żeby nie wisiały stare wartości
  const nextCompanyName = invoiceType === 'company' ? companyName : undefined
  const nextCompanyAddress = invoiceType === 'company' ? companyAddress : undefined
  const nextNip = invoiceType === 'company' ? nipRaw : undefined

  // ====== STOCK CHECK (BASIC) ======
  const stock = Math.max(0, Number((zasob as any)?.iloscSztuk ?? 1))
  if (stock <= 0) throw new Error('Ten zasób ma stan 0 — nie można tworzyć rezerwacji.')
  if (qty > stock) throw new Error(`Ilość przekracza stan magazynowy: ${stock}.`)

  // ====== CENNIK + SEZONY ======
  const unitType = String((zasob as any)?.cena?.jednostka ?? 'noc') as 'noc' | 'dzien'
  const basePrice = Number((zasob as any)?.cena?.basePrice ?? 0)

  const returnDate = unitType === 'dzien' ? addDaysUTC(end, -1) : startOfDayUTC(end)

  // ====== CAPACITY CHECK PER DAY ======
  const shouldBlockReturnDay = unitType === 'noc'
  const endToCount = shouldBlockReturnDay ? addDaysUTC(end, 1) : end
  const requestedDays = expandDays(start, endToCount)

  const occupyingStatuses: BookingStatus[] = ['pending_payment', 'deposit_paid', 'paid', 'confirmed']

  const whereBookings: any = {
    and: [
      { zasob: { equals: zasobId } },
      { status: { in: occupyingStatuses as any } },
      { startDate: { less_than: endToCount.toISOString() } },
      { endDate: { greater_than: start.toISOString() } },
    ],
  }

  const currentId = (originalDoc as any)?.id
  if (operation === 'update' && currentId) {
    whereBookings.and.push({ id: { not_equals: currentId } })
  }

  const bookedCountByDay = new Map<string, number>()
  const blockedCountByDay = new Map<string, number>()

  const bookingsRes = await req.payload.find({
    collection: 'rezerwacje',
    depth: 0,
    limit: 5000,
    overrideAccess: true,
    where: whereBookings,
  })

  for (const b of bookingsRes.docs as any[]) {
    const s = toDate(b?.startDate)
    const e = toDate(b?.endDate)
    if (!s || !e) continue

    const bQty = Math.max(1, Number(b?.ilosc ?? 1))
    const bEndToCount = shouldBlockReturnDay ? addDaysUTC(e, 1) : e

    if (!overlaps(s, bEndToCount, start, endToCount)) continue
    const days = expandDays(s, bEndToCount)
    for (const day of days) inc(bookedCountByDay, day, bQty)
  }

  const blocksRes = await req.payload.find({
    collection: 'blokady',
    depth: 0,
    limit: 5000,
    overrideAccess: true,
    where: {
      and: [
        { zasob: { equals: zasobId } },
        { active: { equals: true } },
        { dateFrom: { less_than: endToCount.toISOString() } },
        { dateTo: { greater_than: start.toISOString() } },
      ],
    },
  })

  for (const bl of blocksRes.docs as any[]) {
    const s = toDate(bl?.dateFrom)
    const e = toDate(bl?.dateTo)
    if (!s || !e) continue

    const blQty = Math.max(1, Number(bl?.ilosc ?? 1))
    const blEndToCount = shouldBlockReturnDay ? addDaysUTC(e, 1) : e

    if (!overlaps(s, blEndToCount, start, endToCount)) continue
    const days = expandDays(s, blEndToCount)
    for (const day of days) inc(blockedCountByDay, day, blQty)
  }

  for (const day of requestedDays) {
    const already = (bookedCountByDay.get(day) ?? 0) + (blockedCountByDay.get(day) ?? 0)
    const left = stock - already
    if (qty > left) {
      throw new Error(`Brak dostępnej ilości w dniu ${day}. Dostępne: ${Math.max(0, left)} / ${stock}.`)
    }
  }

  const seasonal = Array.isArray((zasob as any)?.cena?.seasonalPricing) ? ((zasob as any).cena.seasonalPricing as any[]) : []

  const seasonalSorted = [...seasonal].sort((a, b) => {
    const af = String(a?.dateFrom ?? '')
    const bf = String(b?.dateFrom ?? '')
    return af < bf ? -1 : 1
  })

  const toISODateUTC = (d: Date) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10)

  const pickSeasonForISO = (iso: string) => {
    for (const s of seasonalSorted) {
      const df = toDate(s?.dateFrom)
      const dt = toDate(s?.dateTo)
      if (!df || !dt) continue
      const dfISO = toISODateUTC(df)
      const dtISO = toISODateUTC(dt)
      if (iso >= dfISO && iso <= dtISO) return s
    }
    return null
  }

  type BreakdownRow = { label: string; units: number; pricePerUnit: number; total: number }
  const breakdown: BreakdownRow[] = []

  const pushOrInc = (row: BreakdownRow) => {
    const last = breakdown[breakdown.length - 1]
    const sameLabel = last?.label === row.label
    const samePrice = last?.pricePerUnit === row.pricePerUnit
    if (last && sameLabel && samePrice) {
      last.units += row.units
      last.total = round2(last.total + row.total)
    } else breakdown.push(row)
  }

  let lodgingTotal = 0
  let requiredSeasonMinUnits = 0

  {
    const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()))
    const endUTC = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()))

    while (cur.getTime() < endUTC.getTime()) {
      const iso = cur.toISOString().slice(0, 10)
      const season = pickSeasonForISO(iso)

      if (season) {
        const seasonName = String(season?.name ?? 'Sezon')
        const seasonPrice = Number(season?.price ?? basePrice)
        lodgingTotal += seasonPrice

        const mn = season?.minUnits != null ? Number(season.minUnits) : 0
        if (Number.isFinite(mn) && mn > 0) requiredSeasonMinUnits = Math.max(requiredSeasonMinUnits, mn)

        pushOrInc({
          label: `Cena sezonowa (${seasonName})`,
          units: 1,
          pricePerUnit: seasonPrice,
          total: round2(seasonPrice),
        })
      } else {
        lodgingTotal += basePrice
        pushOrInc({
          label: 'Cena standardowa',
          units: 1,
          pricePerUnit: basePrice,
          total: round2(basePrice),
        })
      }

      cur.setUTCDate(cur.getUTCDate() + 1)
    }
  }

  lodgingTotal = round2(lodgingTotal * qty)

  const requiredMinUnits = Math.max(minUnitsDefault, requiredSeasonMinUnits)
  if (units < requiredMinUnits) {
    throw new Error(`Minimalna liczba ${unitType === 'noc' ? 'nocy' : 'dni'}: ${requiredMinUnits}.`)
  }

  // ====== DODATKI ======
  const extrasInput = Array.isArray((data as any)?.extras) ? ((data as any).extras as any[]) : []

  const extrasSnapshot: any[] = []
  let extrasTotal = 0

  for (const row of extrasInput) {
    const addonId = normalizeRelId(row?.dodatek)
    if (!addonId) continue

    const addonQty = Math.max(1, Number(row?.quantity ?? 1))

    const addon = await req.payload.findByID({
      collection: 'dodatki',
      id: addonId,
      depth: 0,
    })

    if (!(addon as any)?.active) continue

    const name = String((addon as any)?.name ?? 'Dodatek')
    const pricingType = ((addon as any)?.pricingType ?? 'perBooking') as 'perBooking' | 'perDay'
    const unitPrice = Number((addon as any)?.price ?? 0)

    const maxQ = Math.max(1, Number((addon as any)?.maxQuantity ?? 1))
    if (addonQty > maxQ) {
      throw new Error(`Dodatek „${name}”: maksymalna ilość na rezerwację to ${maxQ}.`)
    }

    const allowed = Array.isArray((addon as any)?.dostepneDla) ? (addon as any).dostepneDla : []
    if (resourceType && allowed.length > 0 && !allowed.includes(resourceType)) {
      throw new Error(`Dodatek „${name}” nie jest dostępny dla tego typu zasobu.`)
    }

    const rowTotal = pricingType === 'perDay' ? unitPrice * addonQty * units * qty : unitPrice * addonQty

    extrasTotal += rowTotal

    extrasSnapshot.push({
      name,
      pricingType,
      unitPrice,
      quantity: addonQty,
      total: rowTotal,
    })
  }

  // ====== SUMA ======
  const total = round2(lodgingTotal + extrasTotal + serviceFee)
  const payableNow = round2(calcPayableNow(total, perTypeSettings))

  const paidAmountInput = Number((data as any)?.payment?.paidAmount ?? (originalDoc as any)?.payment?.paidAmount ?? 0)
  const paidAmount = Number.isFinite(paidAmountInput) ? Math.max(0, round2(paidAmountInput)) : 0

  const dueAmount = round2(Math.max(0, total - paidAmount))
  const paidInFull = dueAmount <= 0.00001
  const depositPaid = paidAmount > 0 && !paidInFull

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

    zasob: zasobId,
    ilosc: qty,

    returnDate,

    klient: {
      ...klient,
      wantsInvoice: nextWantsInvoice, // kompatybilność
      invoiceType: nextInvoiceType,   // nowe
      companyName: nextCompanyName,
      companyAddress: nextCompanyAddress,
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
      ...(data as any)?.snapshot,
      units,
      unitType,
      basePrice,

      breakdown,
      extrasSnapshot,
      serviceFee,
      total,
    },
  }
}

export const Rezerwacje: CollectionConfig = {
  slug: 'rezerwacje',
  labels: { singular: 'Rezerwacja', plural: 'Rezerwacje' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: [
      'zasob',
      'ilosc',
      'startDate',
      'endDate',
      'returnDate',
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
      name: 'zasob',
      label: 'Zasób',
      type: 'relationship',
      relationTo: 'zasoby',
      required: true,
      index: true,
    },
    {
      name: 'ilosc',
      label: 'Ilość sztuk',
      type: 'number',
      required: true,
      defaultValue: 1,
      min: 1,
      admin: { description: 'Ile sztuk zasobu jest rezerwowanych (np. 2 rowery). Dla przyczepy zwykle 1.' },
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
      name: 'returnDate',
      label: 'Zwrot (data)',
      type: 'date',
      required: false,
      index: true,
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayOnly' },
        description: 'Wyliczane automatycznie. Dla e-bike: endDate - 1.',
      },
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
      fields: [
        { name: 'dodatek', label: 'Dodatek', type: 'relationship', relationTo: 'dodatki', required: true },
        { name: 'quantity', label: 'Ilość', type: 'number', required: true, min: 1, defaultValue: 1 },
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

        // ✅ zostaje (żeby UI/legacy nie padło)
        { name: 'wantsInvoice', label: 'Faktura', type: 'checkbox', required: false, defaultValue: false },

        // ✅ nowe: typ faktury
        {
          name: 'invoiceType',
          label: 'Typ faktury',
          type: 'select',
          required: false,
          defaultValue: 'none',
          options: [
            { label: 'Brak', value: 'none' },
            { label: 'Imienna', value: 'personal' },
            { label: 'Na firmę', value: 'company' },
          ],
          admin: {
            condition: (_, siblingData) => Boolean((siblingData as any)?.wantsInvoice),
            description: 'Wybierz typ faktury, jeśli zaznaczono „Faktura”.',
          },
        },

        // ✅ pola firmy (tylko invoiceType=company)
        {
          name: 'companyName',
          label: 'Nazwa firmy',
          type: 'text',
          required: false,
          admin: {
            condition: (_, siblingData) => (siblingData as any)?.invoiceType === 'company',
          },
          validate: (value, { siblingData }) => {
            if ((siblingData as any)?.invoiceType !== 'company') return true
            const v = String(value ?? '').trim()
            if (!v) return 'Podaj nazwę firmy.'
            return true
          },
        },
        {
          name: 'companyAddress',
          label: 'Adres siedziby',
          type: 'text',
          required: false,
          admin: {
            condition: (_, siblingData) => (siblingData as any)?.invoiceType === 'company',
          },
          validate: (value, { siblingData }) => {
            if ((siblingData as any)?.invoiceType !== 'company') return true
            const v = String(value ?? '').trim()
            if (!v) return 'Podaj adres siedziby.'
            return true
          },
        },
        {
          name: 'nip',
          label: 'NIP',
          type: 'text',
          required: false,
          admin: {
            condition: (_, siblingData) => (siblingData as any)?.invoiceType === 'company',
            description: 'Wymagany, jeśli faktura jest na firmę.',
          },
          validate: (value, { siblingData }) => {
            if ((siblingData as any)?.invoiceType !== 'company') return true
            const v = String(value ?? '').trim()
            if (!v) return 'Podaj NIP.'
            return true
          },
        },

        { name: 'notes', label: 'Uwagi (opcjonalnie)', type: 'textarea', required: false },
        { name: 'disability', label: 'Niepełnosprawność', type: 'checkbox', required: false, defaultValue: false },
      ],
    },
    {
      name: 'payment',
      label: 'Płatność',
      type: 'group',
      fields: [
        { name: 'payableNow', label: 'Sugestia: do zapłaty teraz (z ustawień)', type: 'number', admin: { readOnly: true, step: 0.01 } },
        { name: 'paidAmount', label: 'Zapłacone (PLN)', type: 'number', required: false, min: 0, admin: { step: 0.01 } },
        { name: 'dueAmount', label: 'Pozostało do zapłaty (PLN)', type: 'number', admin: { readOnly: true, step: 0.01 } },
        { name: 'paidInFull', label: 'Opłacone w całości', type: 'checkbox', admin: { readOnly: true } },
      ],
    },
    {
      name: 'snapshot',
      label: 'Snapshot ceny (auto)',
      type: 'group',
      admin: { description: 'Pola wyliczane automatycznie' },
      fields: [
        { name: 'units', label: 'Liczba dni/nocy', type: 'number', admin: { readOnly: true } },
        { name: 'unitType', label: 'Jednostka', type: 'text', admin: { readOnly: true } },
        { name: 'basePrice', label: 'Cena bazowa (PLN)', type: 'number', admin: { readOnly: true, step: 0.01 } },
        {
          name: 'breakdown',
          label: 'Rozbicie (auto)',
          type: 'array',
          admin: { readOnly: true },
          fields: [
            { name: 'label', label: 'Typ', type: 'text', required: true },
            { name: 'units', label: 'Ilość', type: 'number', required: true, min: 0 },
            { name: 'pricePerUnit', label: 'Cena / jednostkę', type: 'number', required: true, min: 0, admin: { step: 0.01 } },
            { name: 'total', label: 'Suma', type: 'number', required: true, min: 0, admin: { step: 0.01 } },
          ],
        },
        {
          name: 'extrasSnapshot',
          label: 'Dodatki (snapshot)',
          type: 'array',
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
                { label: 'Za dzień', value: 'perDay' },
              ],
            },
            { name: 'unitPrice', label: 'Cena jednostkowa', type: 'number', required: true, admin: { step: 0.01 } },
            { name: 'quantity', label: 'Ilość', type: 'number', required: true, min: 1 },
            { name: 'total', label: 'Suma', type: 'number', required: true, admin: { step: 0.01 } },
          ],
        },
        { name: 'serviceFee', label: 'Opłata serwisowa', type: 'number', admin: { readOnly: true, step: 0.01 } },
        { name: 'total', label: 'Razem', type: 'number', admin: { readOnly: true, step: 0.01 } },
      ],
    },
  ],
}
