import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().min(2, 'Podaj imię i nazwisko.').max(80, 'Za długie.'),
  email: z.string().email('Podaj poprawny e-mail.').max(120, 'Za długi.'),
  message: z.string().min(10, 'Wiadomość jest za krótka.').max(2000, 'Wiadomość jest za długa.'),
})

export type ContactFormValues = z.infer<typeof contactSchema>
