// src/payload/collections/dodatki.ts
import type { CollectionConfig } from 'payload'

export const Dodatki: CollectionConfig = {
  slug: 'dodatki',
  labels: {
    singular: 'Dodatek',
    plural: 'Dodatki',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'pricingType', 'price', 'active', 'updatedAt'],
    group: 'Rezerwacje',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      label: 'Nazwa dodatku',
      type: 'text',
      required: true,
      index: true,
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
        { label: 'Za dobę (per dzień)', value: 'perDay' },
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
