// src/payload/globals/ustawienia-strony.ts
import type { GlobalConfig } from 'payload'

export const UstawieniaStrony: GlobalConfig = {
  slug: 'ustawienia-strony',
  label: 'Ustawienia strony',
  admin: {
    group: 'Ustawienia',
  },
  hooks: {
  afterChange: [
    async () => {
      await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/revalidate`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-revalidate-secret': process.env.REVALIDATE_SECRET!,
        },
        body: JSON.stringify({
          tags: ['global:ustawienia-strony'], // albo rezerwacji
        }),
      })
    },
  ],
},

  access: {
    read: () => true,
  },
  fields: [
    { name: 'siteName', label: 'Nazwa strony', type: 'text', required: true },
    { name: 'phone', label: 'Telefon', type: 'text', required: false },
    { name: 'email', label: 'E-mail', type: 'email', required: false },
    { name: 'address', label: 'Adres', type: 'textarea', required: false },

    {
      name: 'seoTitle',
      label: 'SEO: tytuł domyślny',
      type: 'text',
      required: false,
      // admin: { description: 'Domyślny tytuł SEO (fallback).' },
    },
    {
      name: 'seoDescription',
      label: 'SEO: opis domyślny',
      type: 'textarea',
      required: false,
      maxLength: 200,
      // admin: { description: 'Domyślny opis SEO (fallback). Max 200 znaków.' },
    },
  ],
}
