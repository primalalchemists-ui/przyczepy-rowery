// src/payload/globals/ustawienia-rezerwacji.ts
import type { GlobalConfig } from 'payload'

const paymentFields = (labelPrefix: string) => [
  {
    name: 'paymentMode',
    label: `${labelPrefix}: Tryb płatności`,
    type: 'select' as const,
    required: true,
    defaultValue: 'full',
    options: [
      { label: 'Całość', value: 'full' },
      { label: 'Zaliczka', value: 'deposit' },
    ],
  },
  {
    name: 'depositType',
    label: `${labelPrefix}: Rodzaj zaliczki`,
    type: 'select' as const,
    required: true,
    defaultValue: 'percent',
    options: [
      { label: 'Procent', value: 'percent' },
      { label: 'Kwota stała', value: 'fixed' },
    ],
    admin: { condition: (_: any, s: any) => s?.paymentMode === 'deposit' },
  },
  {
    name: 'depositValue',
    label: `${labelPrefix}: Wartość zaliczki`,
    type: 'number' as const,
    required: false,
    min: 0,
    admin: {
      step: 0.01,
      condition: (_: any, s: any) => s?.paymentMode === 'deposit',
      description: 'Jeśli procent: np. 30 = 30%. Jeśli kwota: wartość w PLN.',
    },
  },
]

export const UstawieniaRezerwacji: GlobalConfig = {
  slug: 'ustawienia-rezerwacji',
  label: 'Ustawienia rezerwacji',
  admin: { group: 'Ustawienia' },
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

  access: { read: () => true },
  fields: [
    {
      name: 'dlaPrzyczep',
      label: 'Ustawienia dla przyczep',
      type: 'group',
      fields: [
        {
          name: 'enabled',
          label: 'Rezerwacje dla przyczep włączone',
          type: 'checkbox',
          required: true,
          defaultValue: true,
        },
        {
          name: 'minUnits',
          label: 'Minimalna liczba nocy',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 1,
          admin: { condition: (_: any, s: any) => s?.enabled !== false },
        },
        {
          name: 'serviceFee',
          label: 'Opłata serwisowa (przyczepy)',
          type: 'number',
          required: true,
          min: 0,
          defaultValue: 0,
          admin: {
            step: 0.01,
            condition: (_: any, s: any) => s?.enabled !== false,
          },
        },
        ...paymentFields('Przyczepy').map((f) => ({
          ...f,
          admin: {
            ...(f as any).admin,
            condition: (_: any, s: any) =>
              s?.enabled !== false && (f as any)?.admin?.condition?.(_, s) !== false,
          },
        })),
      ],
    },

    {
      name: 'dlaRowerow',
      label: 'Ustawienia dla e-bike',
      type: 'group',
      fields: [
        {
          name: 'enabled',
          label: 'Rezerwacje dla e-bike włączone',
          type: 'checkbox',
          required: true,
          defaultValue: true,
        },
        {
          name: 'minUnits',
          label: 'Minimalna liczba dni',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 1,
          admin: { condition: (_: any, s: any) => s?.enabled !== false },
        },
        {
          name: 'serviceFee',
          label: 'Opłata serwisowa (e-bike)',
          type: 'number',
          required: true,
          min: 0,
          defaultValue: 0,
          admin: {
            step: 0.01,
            condition: (_: any, s: any) => s?.enabled !== false,
          },
        },
        ...paymentFields('E-bike').map((f) => ({
          ...f,
          admin: {
            ...(f as any).admin,
            condition: (_: any, s: any) =>
              s?.enabled !== false && (f as any)?.admin?.condition?.(_, s) !== false,
          },
        })),
      ],
    },

    {
      name: 'regulaminPdf',
      label: 'Regulamin (PDF)',
      type: 'upload',
      relationTo: 'media',
      required: false,
      filterOptions: { mimeType: { equals: 'application/pdf' } },
    },
    {
      name: 'politykaPrywatnosciPdf',
      label: 'Polityka prywatności (PDF)',
      type: 'upload',
      relationTo: 'media',
      required: false,
      filterOptions: { mimeType: { equals: 'application/pdf' } },
    },

    {
      name: 'paymentProviderDefault',
      label: 'Domyślny operator płatności',
      type: 'select',
      required: true,
      defaultValue: 'stripe',
      options: [
        { label: 'Stripe', value: 'stripe' },
        { label: 'Przelewy24', value: 'p24' },
      ],
    },
  ],
}
