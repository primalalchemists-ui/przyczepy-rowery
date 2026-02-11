// src/payload/collections/dodatki.ts
import type { CollectionConfig } from 'payload'

export const Dodatki: CollectionConfig = {
  slug: 'dodatki',
  labels: { singular: 'Dodatek', plural: 'Dodatki' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'dostepneDla', 'pricingType', 'price', 'active', 'updatedAt'],
    group: 'Rezerwacje',
  },
  access: { read: () => true },
  fields: [
    {
      name: 'name',
      label: 'Nazwa dodatku',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'dostepneDla',
      label: 'Dostępne dla',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['przyczepa'],
      options: [
        { label: 'Przyczepa', value: 'przyczepa' },
        { label: 'Rower elektryczny (E-bike)', value: 'ebike' },
      ],
      admin: {
        description: 'Wybierz, dla jakiego typu zasobu ten dodatek ma być dostępny.',
      },
    },
    {
      name: 'price',
      label: 'Cena',
      type: 'number',
      required: true,
      min: 0,
      admin: { step: 0.01, description: 'Kwota w PLN (np. 50.00).' },
    },
    {
      name: 'pricingType',
      label: 'Sposób naliczania',
      type: 'select',
      required: true,
      options: [
        { label: 'Za rezerwację (jednorazowo)', value: 'perBooking' },
        { label: 'Za dobę / dzień (per day)', value: 'perDay' },
      ],
      defaultValue: 'perBooking',
    },
    {
      name: 'maxQuantity',
      label: 'Maks. ilość na rezerwację',
      type: 'number',
      required: true,
      defaultValue: 1,
      min: 1,
    },
    {
      name: 'active',
      label: 'Aktywny',
      type: 'checkbox',
      required: true,
      defaultValue: true,
    },
  ],
}
