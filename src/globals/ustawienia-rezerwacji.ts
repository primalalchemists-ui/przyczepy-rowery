// src/payload/globals/ustawienia-rezerwacji.ts
import type { GlobalConfig } from 'payload'

export const UstawieniaRezerwacji: GlobalConfig = {
  slug: 'ustawienia-rezerwacji',
  label: 'Ustawienia rezerwacji',
  admin: {
    group: 'Ustawienia',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'bookingEnabled',
      label: 'Rezerwacje włączone',
      type: 'checkbox',
      required: true,
      defaultValue: true,
      admin: {
        description: 'Wyłącza globalnie możliwość tworzenia rezerwacji (poza blokadami terminów).',
      },
    },
    {
      name: 'minNightsDefault',
      label: 'Minimalna liczba nocy (domyślnie)',
      type: 'number',
      required: true,
      min: 1,
      defaultValue: 1,
      admin: {
        description: 'Minimalna liczba nocy dla rezerwacji (o ile sezon nie narzuca innej).',
      },
    },
    {
      name: 'serviceFee',
      label: 'Opłata serwisowa',
      type: 'number',
      required: true,
      min: 0,
      defaultValue: 0,
      admin: { step: 0.01, description: 'Kwota doliczana do każdej rezerwacji.' },
    },
    {
      name: 'paymentMode',
      label: 'Tryb płatności',
      type: 'select',
      required: true,
      defaultValue: 'full',
      options: [
        { label: 'Całość', value: 'full' },
        { label: 'Zaliczka', value: 'deposit' },
      ],
    },
    {
      name: 'depositType',
      label: 'Rodzaj zaliczki',
      type: 'select',
      required: true,
      defaultValue: 'percent',
      options: [
        { label: 'Procent', value: 'percent' },
        { label: 'Kwota stała', value: 'fixed' },
      ],
      admin: {
        condition: (_, siblingData) => siblingData?.paymentMode === 'deposit',
      },
    },
    {
      name: 'depositValue',
      label: 'Wartość zaliczki',
      type: 'number',
      required: false,
      min: 0,
      admin: {
        step: 0.01,
        condition: (_, siblingData) => siblingData?.paymentMode === 'deposit',
        description: 'Jeśli procent: np. 30 = 30%. Jeśli kwota: wartość w PLN.',
      },
    },

    {
      name: 'regulaminPdf',
      label: 'Regulamin (PDF)',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: { description: 'PDF regulaminu (upload do Media).' },
      filterOptions: { mimeType: { equals: 'application/pdf' } },
    },
    {
      name: 'politykaPrywatnosciPdf',
      label: 'Polityka prywatności (PDF)',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: { description: 'PDF polityki prywatności (upload do Media).' },
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
