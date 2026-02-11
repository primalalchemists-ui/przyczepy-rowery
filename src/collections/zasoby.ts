import type { CollectionConfig, FieldHook } from 'payload'

const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/(^-|-$)/g, '')

const formatSlugHook: FieldHook = ({ value, data, originalDoc }) => {
  const fromName = typeof (data as any)?.nazwa === 'string' ? (data as any).nazwa : undefined
  const base = (typeof value === 'string' && value.length ? value : fromName) ?? (originalDoc as any)?.slug
  if (!base || typeof base !== 'string') return value
  return slugify(base)
}

export const Zasoby: CollectionConfig = {
  slug: 'zasoby',
  labels: {
    singular: 'Zasób',
    plural: 'Zasoby',
  },
  admin: {
    useAsTitle: 'nazwa',
    defaultColumns: ['nazwa', 'typZasobu', 'active', 'iloscSztuk', 'updatedAt'],
    group: 'Katalog',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'typZasobu',
      label: 'Typ zasobu',
      type: 'select',
      required: true,
      index: true,
      defaultValue: 'przyczepa',
      options: [
        { label: 'Przyczepa', value: 'przyczepa' },
        { label: 'Rower elektryczny (E-bike)', value: 'ebike' },
      ],
    },
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
      admin: { hidden: true },
      hooks: { beforeValidate: [formatSlugHook] },
    },
    {
      name: 'active',
      label: 'Aktywny',
      type: 'checkbox',
      required: true,
      defaultValue: true,
      index: true,
      admin: {
        description: 'Jeśli wyłączone — nie pokazuj w ofercie / rezerwacjach.',
      },
    },

    {
      name: 'featured',
      label: 'Polecane',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: {
        description: 'Jeśli zaznaczone, zasób może pojawić się w sekcji Polecane na stronie głównej (max 3).',
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
        description: 'Ile egzemplarzy tego zasobu faktycznie posiadasz.',
      },
    },

    {
      name: 'opisKrotki',
      label: 'Opis krótki',
      type: 'textarea',
      required: false,
      maxLength: 400,
    },
    {
      name: 'opisDlugi',
      label: 'Opis długi',
      type: 'richText',
      required: false,
    },

    {
      name: 'heroMedia',
      label: 'Media główne (zdjęcie lub film)',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'gallery',
      label: 'Galeria (zdjęcia/filmy)',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'media',
          label: 'Plik',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },

    // ✅ Specyfikacja wspólna (może być użyta w obu typach)
    {
      name: 'specyfikacja',
      label: 'Specyfikacja',
      type: 'array',
      required: false,
      fields: [
        { name: 'label', label: 'Etykieta', type: 'text', required: true },
        { name: 'value', label: 'Wartość', type: 'text', required: true },
      ],
    },

    // // ✅ Pola specyficzne per typ (tylko w adminie warunkowo)
    // {
    //   name: 'przyczepa',
    //   label: 'Dane przyczepy',
    //   type: 'group',
    //   admin: { condition: (data) => (data as any)?.typZasobu === 'przyczepa' },
    //   fields: [
    //     { name: 'dmc', label: 'DMC', type: 'text', required: false },
    //     { name: 'iloscOsob', label: 'Ilość osób', type: 'number', required: false, min: 1 },
    //   ],
    // },
    // {
    //   name: 'ebike',
    //   label: 'Dane e-bike',
    //   type: 'group',
    //   admin: { condition: (data) => (data as any)?.typZasobu === 'ebike' },
    //   fields: [
    //     { name: 'marka', label: 'Marka', type: 'text', required: false },
    //     { name: 'model', label: 'Model', type: 'text', required: false },
    //     { name: 'rozmiarRamy', label: 'Rozmiar ramy', type: 'text', required: false },
    //     { name: 'bateriaWh', label: 'Bateria (Wh)', type: 'number', required: false, min: 0 },
    //     { name: 'zasiegKm', label: 'Zasięg (km)', type: 'number', required: false, min: 0 },
    //     {
    //       name: 'typ',
    //       label: 'Typ roweru',
    //       type: 'select',
    //       required: false,
    //       options: [
    //         { label: 'MTB', value: 'mtb' },
    //         { label: 'City', value: 'city' },
    //         { label: 'Trekking', value: 'trekking' },
    //         { label: 'Gravel', value: 'gravel' },
    //       ],
    //     },
    //   ],
    // },

    // ✅ Cennik: wspólny, ale z jednostką (noc/dzień)
    {
      name: 'cena',
      label: 'Cennik',
      type: 'group',
      fields: [
        {
          name: 'jednostka',
          label: 'Jednostka naliczania',
          type: 'select',
          required: true,
          defaultValue: 'noc',
          options: [
            { label: 'Za noc', value: 'noc' },
            { label: 'Za dzień', value: 'dzien' },
          ],
          admin: {
            description: 'Przyczepy zwykle: noc. Rower: dzień.',
          },
        },
        {
          name: 'basePrice',
          label: 'Cena bazowa (PLN)',
          type: 'number',
          required: true,
          min: 0,
          admin: { step: 0.01, description: 'Cena za jednostkę (noc/dzień).'},
        },
        {
          name: 'seasonalPricing',
          label: 'Ceny sezonowe',
          type: 'array',
          required: false,
          fields: [
            { name: 'name', label: 'Nazwa sezonu', type: 'text', required: true },
            { name: 'dateFrom', label: 'Od', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
            { name: 'dateTo', label: 'Do', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
            { name: 'price', label: 'Cena w sezonie (PLN)', type: 'number', required: true, min: 0, admin: { step: 0.01 } },
            {
              name: 'minUnits',
              label: 'Min. liczba jednostek (opcjonalnie)',
              type: 'number',
              required: false,
              min: 1,
              admin: { description: 'Minimum nocy/dni w tym sezonie.' },
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
        description: 'Dodatki, które można wybrać przy rezerwacji tego zasobu.',
      },
      filterOptions: ({ data }) => {
        const typ = (data as any)?.typZasobu
        if (!typ) return { active: { equals: true } }
        return {
          and: [
            { active: { equals: true } },
            { dostepneDla: { contains: typ } },
          ],
        }
      },
    },

  ],
}
