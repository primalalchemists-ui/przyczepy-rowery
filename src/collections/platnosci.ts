import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'

const setPaidAt: CollectionBeforeChangeHook = async ({ data, originalDoc }) => {
  const nextStatus = data?.status
  const prevStatus = (originalDoc as any)?.status

  if (nextStatus === 'succeeded' && prevStatus !== 'succeeded') {
    return {
      ...data,
      paidAt: data?.paidAt ?? new Date().toISOString(),
    }
  }

  return data
}

export const Platnosci: CollectionConfig = {
  slug: 'platnosci',
  labels: { singular: 'Płatność', plural: 'Płatności' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['booking', 'provider', 'status', 'amount', 'currency', 'paidAt', 'updatedAt'],
    group: 'Rezerwacje',
  },
  access: { read: () => true },
  hooks: { beforeChange: [setPaidAt] },
  fields: [
    {
      name: 'booking',
      label: 'Rezerwacja',
      type: 'relationship',
      relationTo: 'rezerwacje',
      required: true,
      index: true,
    },
    {
      name: 'provider',
      label: 'Operator płatności',
      type: 'select',
      required: true,
      options: [
        { label: 'Stripe', value: 'stripe' },
        { label: 'Przelewy24', value: 'p24' },
      ],
    },
    { name: 'providerSessionId', label: 'ID sesji (operator)', type: 'text' },
    { name: 'transactionId', label: 'ID transakcji (operator)', type: 'text' },
    { name: 'amount', label: 'Kwota', type: 'number', required: true, min: 0, admin: { step: 0.01 } },
    {
      name: 'currency',
      label: 'Waluta',
      type: 'text',
      required: true,
      defaultValue: 'PLN',
      maxLength: 3,
    },
    {
      name: 'status',
      label: 'Status płatności',
      type: 'select',
      required: true,
      index: true,
      defaultValue: 'created',
      options: [
        { label: 'Utworzona', value: 'created' },
        { label: 'W toku', value: 'pending' },
        { label: 'Zakończona sukcesem', value: 'succeeded' },
        { label: 'Nieudana', value: 'failed' },
        { label: 'Zwrócona', value: 'refunded' },
      ],
    },
    { name: 'paidAt', label: 'Opłacono dnia', type: 'date' },
  ],
}
