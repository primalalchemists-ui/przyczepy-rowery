// src/payload/collections/przyczepy.ts
import type { CollectionConfig, FieldHook } from 'payload'

const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/(^-|-$)/g, '')

const formatSlugHook: FieldHook = ({ value, data, originalDoc }) => {
  const fromName = typeof data?.nazwa === 'string' ? data.nazwa : undefined
  const base = (typeof value === 'string' && value.length ? value : fromName) ?? originalDoc?.slug
  if (!base || typeof base !== 'string') return value
  return slugify(base)
}

export const Przyczepy: CollectionConfig = {
  slug: 'przyczepy',
  labels: {
    singular: 'Przyczepa',
    plural: 'Przyczepy',
  },
  admin: {
    useAsTitle: 'nazwa',
    defaultColumns: ['nazwa', 'slug', 'active', 'updatedAt'],
    group: 'Katalog',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'nazwa',
      label: 'Nazwa',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        hidden: true, // <- nie pokazuj w adminie
      },
      hooks: {
        beforeValidate: [formatSlugHook],
      },
    },

    {
      name: 'active',
      label: 'Aktywna',
      type: 'checkbox',
      required: true,
      defaultValue: true,
      index: true,
      admin: {
        description: 'Jeśli wyłączone — nie pokazuj w ofercie / rezerwacjach.',
      },
    },

    {
      name: 'iloscSztuk',
      label: 'Ilość sztuk na stanie',
      type: 'number',
      required: true,
      defaultValue: 1,
      min: 0,
      index: true,
      admin: {
        description: 'Ile egzemplarzy tej przyczepy faktycznie posiadasz',
    },
},


    {
      name: 'opisKrotki',
      label: 'Opis krótki',
      type: 'textarea',
      required: false,
      maxLength: 400,
      admin: {
        description: 'Krótki opis. Max 400 znaków.',
      },
    },
    {
      name: 'opisDlugi',
      label: 'Opis długi',
      type: 'richText',
      required: false,
      admin: {
        description: 'Pełny opis na stronie przyczepy.',
      },
    },

    {
      name: 'heroImage',
      label: 'Zdjęcie główne (hero)',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'gallery',
      label: 'Galeria zdjęć',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'image',
          label: 'Zdjęcie',
          type: 'upload',
          relationTo: 'media',
          required: false,
        },
      ],
    },

    {
      name: 'specyfikacja',
      label: 'Specyfikacja techniczna',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'title',
          label: 'Tytuł sekcji',
          type: 'text',
          required: true,
        },
        {
          name: 'items',
          label: 'Pozycje',
          type: 'array',
          required: true,
          fields: [
            { name: 'label', label: 'Etykieta', type: 'text', required: true },
            { name: 'value', label: 'Wartość', type: 'text', required: true },
          ],
        },
      ],
    },

    {
      name: 'cena',
      label: 'Cennik',
      type: 'group',
      fields: [
        {
          name: 'basePricePerNight',
          label: 'Cena bazowa za noc',
          type: 'number',
          required: true,
          min: 0,
          admin: { step: 0.01, description: 'Domyślna cena za noc (PLN).' },
        },
        {
          name: 'seasonalPricing',
          label: 'Ceny sezonowe',
          type: 'array',
          required: false,
          fields: [
            { name: 'name', label: 'Nazwa sezonu', type: 'text', required: true },
            {
              name: 'dateFrom',
              label: 'Od (data)',
              type: 'date',
              required: true,
              admin: { date: { pickerAppearance: 'dayOnly' } },
            },
            {
              name: 'dateTo',
              label: 'Do (data)',
              type: 'date',
              required: true,
              admin: { date: { pickerAppearance: 'dayOnly' } },
            },
            {
              name: 'pricePerNight',
              label: 'Cena za noc (sezon)',
              type: 'number',
              required: true,
              min: 0,
              admin: { step: 0.01 },
            },
            {
              name: 'minNights',
              label: 'Min. liczba nocy (opcjonalnie)',
              type: 'number',
              required: false,
              min: 1,
              admin: {
                description: 'Jeśli ustawisz — sezon wymusi minimum nocy.',
              },
            },
          ],
        },
      ],
    },

    {
      name: 'dodatki',
      label: 'Dostępne dodatki',
      type: 'relationship',
      relationTo: 'dodatki',
      hasMany: true,
      required: false,
      admin: {
        description: 'Dodatki, które można wybrać przy rezerwacji tej przyczepy.',
      },
    },
  ],
}
