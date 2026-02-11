// src/lib/booking/payable.ts

const round2 = (n: number) => Math.round(n * 100) / 100

export function calcPayableNow(
  total: number,
  settings: {
    paymentMode?: 'full' | 'deposit'
    depositType?: 'percent' | 'fixed'
    depositValue?: number
  },
) {
  const paymentMode = String(settings?.paymentMode ?? 'full') as 'full' | 'deposit'
  if (paymentMode === 'full') return Math.max(0, round2(total))

  const depositType = String(settings?.depositType ?? 'percent') as 'percent' | 'fixed'
  const depositValueRaw = Number(settings?.depositValue ?? 0)
  const depositValue = Number.isFinite(depositValueRaw) ? Math.max(0, depositValueRaw) : 0

  if (depositType === 'fixed') return Math.max(0, round2(Math.min(total, depositValue)))

  const pct = Math.max(0, Math.min(100, depositValue))
  return Math.max(0, round2(total * (pct / 100)))
}
