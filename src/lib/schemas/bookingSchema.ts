import { z } from 'zod'

function isValidNipFormat(v: string) {
  const s = (v ?? '').replace(/\D/g, '')
  return /^\d{10}$/.test(s)
}

export const bookingSchema = z
  .object({
    trailerId: z.string().min(1, 'Wybierz zasób.'),
    startDate: z.string().min(1, 'Wybierz datę rozpoczęcia.'),
    endDate: z.string().min(1, 'Wybierz datę zakończenia.'),

    ilosc: z.coerce.number().int().min(1).default(1),

    // ✅ NOWE: typ zasobu, żeby Zod mógł wymagać adresu tylko dla przyczepy
    resourceType: z.enum(['przyczepa', 'ebike']),

    fullName: z.string().min(2, 'Podaj imię i nazwisko.'),
    email: z.string().email('Podaj poprawny e-mail.'),
    phone: z.string().min(6, 'Podaj poprawny numer telefonu.'),

    // ✅ NOWE: adres podstawienia (dla przyczepy)
    deliveryAddress: z.string().optional(),
    deliveryDetails: z.string().optional(),
    deliveryGps: z.string().optional(),

    wantsInvoice: z.boolean().default(false),

    invoiceType: z.enum(['personal', 'company']).optional(),

    companyName: z.string().optional(),
    companyAddress: z.string().optional(),
    nip: z.string().optional(),

    notes: z.string().optional(),
    disability: z.boolean().default(false),

    acceptRegulamin: z.boolean().refine((v) => v === true, {
      message: 'Musisz zaakceptować regulamin.',
    }),
    acceptPolityka: z.boolean().refine((v) => v === true, {
      message: 'Musisz zaakceptować politykę prywatności.',
    }),
  })
  .superRefine((data, ctx) => {
    // ✅ adres wymagany tylko dla przyczepy
    if (data.resourceType === 'przyczepa') {
      const addr = (data.deliveryAddress ?? '').trim()
      if (!addr) {
        ctx.addIssue({
          code: 'custom',
          path: ['deliveryAddress'],
          message: 'Podaj adres podstawienia przyczepy.',
        })
      }
    }

    // faktura jak miałeś
    if (!data.wantsInvoice) return

    const invoiceType = data.invoiceType
    if (!invoiceType) {
      ctx.addIssue({
        code: 'custom',
        path: ['invoiceType'],
        message: 'Wybierz typ faktury.',
      })
      return
    }

    if (invoiceType === 'company') {
      const companyName = (data.companyName ?? '').trim()
      const companyAddress = (data.companyAddress ?? '').trim()
      const nip = (data.nip ?? '').trim()

      if (!companyName) ctx.addIssue({ code: 'custom', path: ['companyName'], message: 'Podaj nazwę firmy.' })
      if (!companyAddress) ctx.addIssue({ code: 'custom', path: ['companyAddress'], message: 'Podaj adres siedziby.' })
      if (!nip) {
        ctx.addIssue({ code: 'custom', path: ['nip'], message: 'Podaj NIP.' })
        return
      }
      if (!isValidNipFormat(nip)) {
        ctx.addIssue({ code: 'custom', path: ['nip'], message: 'Podaj poprawny NIP (10 cyfr).' })
      }
    }
  })

export type BookingFormValues = z.infer<typeof bookingSchema>
