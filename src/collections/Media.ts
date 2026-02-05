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
  ],

  upload: {
    mimeTypes: ['image/*', 'application/pdf'],
    adminThumbnail: 'thumbnail',
    focalPoint: true,

    /**
     * ✅ Każdy media record ma swój folder w bucket.
     * Dzięki temu Payload kasuje spójnie wszystkie warianty.
     *
     * Uwaga: `doc.id` będzie dostępne po utworzeniu rekordu.
     * Dla pierwszego uploadu Payload tworzy rekord i dopiero potem zapisuje plik.
     */
    prefix: ({ doc }) => `media/${doc.id}`,

    imageSizes: [
      { name: 'thumbnail', width: 300 },
      { name: 'square', width: 500, height: 500 },
      { name: 'small', width: 600 },
      { name: 'medium', width: 900 },
      { name: 'large', width: 1400 },
      { name: 'xlarge', width: 1920 },
      { name: 'og', width: 1200, height: 630, crop: 'center' },
    ],
  },
}
