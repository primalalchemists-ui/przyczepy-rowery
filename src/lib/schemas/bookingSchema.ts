import { z } from 'zod'

// prosta walidacja NIP (PL): 10 cyfr; checksum można dodać później
function isValidNipFormat(v: string) {
  const s = (v ?? '').replace(/\D/g, '')
  return /^\d{10}$/.test(s)
}

export const bookingSchema = z
  .object({
    trailerId: z.string().min(1, 'Wybierz zasób.'),
    startDate: z.string().min(1, 'Wybierz datę rozpoczęcia.'),
    endDate: z.string().min(1, 'Wybierz datę zakończenia.'),

    // ✅ NOWE: ilość sztuk (dla e-bike w UI, dla przyczepy zawsze 1)
    ilosc: z.coerce.number().int().min(1).default(1),

    fullName: z.string().min(2, 'Podaj imię i nazwisko.'),
    email: z.string().email('Podaj poprawny e-mail.'),
    phone: z.string().min(6, 'Podaj poprawny numer telefonu.'),

    wantsInvoice: z.boolean().default(false),
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
    if (data.wantsInvoice) {
      const nip = (data.nip ?? '').trim()
      if (!nip) {
        ctx.addIssue({
          code: 'custom',
          path: ['nip'],
          message: 'Podaj NIP do faktury.',
        })
        return
      }
      if (!isValidNipFormat(nip)) {
        ctx.addIssue({
          code: 'custom',
          path: ['nip'],
          message: 'Podaj poprawny NIP (10 cyfr).',
        })
      }
    }
  })

export type BookingFormValues = z.infer<typeof bookingSchema>
