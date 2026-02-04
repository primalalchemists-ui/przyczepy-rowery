// src/lib/booking/payable.ts
export function calcPayableNow(total: number, settings: { paymentMode?: 'full' | 'deposit'; depositType?: 'percent' | 'fixed'; depositValue?: number }) {
  const mode = settings.paymentMode ?? 'full'
  if (mode === 'full') return total

  const type = settings.depositType ?? 'percent'
  const val = Number(settings.depositValue ?? 0)

  if (type === 'fixed') return Math.max(0, Math.min(total, val))
  // percent
  return Math.max(0, Math.min(total, (total * val) / 100))
}
