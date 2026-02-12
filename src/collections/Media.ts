import type { CollectionConfig } from 'payload'
import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Plik',
    plural: 'Media',
  },
  admin: {
    group: 'Zasoby',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  fields: [
    {
      name: 'alt',
      label: 'Tekst alternatywny (ALT)',
      type: 'text',
    },
    {
      name: 'caption',
      label: 'Podpis',
      type: 'richText',
    },
    // Opcjonalnie: informacyjnie w adminie
    {
      name: 'typPliku',
      label: 'Typ pliku',
      type: 'text',
      admin: { readOnly: true, position: 'sidebar' },
      hooks: {
        beforeChange: [
          ({ data, originalDoc }) => {
            // Payload trzyma mimeType w upload metadata, ale nie zawsze od razu w data
            // To pole jest tylko “nice to have”
            return (data as any)?.mimeType ?? (originalDoc as any)?.mimeType ?? (data as any)?.typPliku
          },
        ],
      },
    },
  ],
  upload: {
    // ✅ DODANE VIDEO
    mimeTypes: ['image/*', 'video/*', 'application/pdf'],
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    imageSizes: [
      { name: 'thumbnail', width: 300 },
      { name: 'medium', width: 900 },
      { name: 'large', width: 1400 },
    ]
  },
}
