'use client'

import { useMemo } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AddonDoc } from '@/lib/payload'
import { formatPLN } from '@/lib/utils'

export type SelectedExtra = {
  addonId: string
  quantity: number
}

function toId(v: unknown) {
  return typeof v === 'string' ? v : String(v)
}

export function ExtrasPicker(props: {
  availableAddons: AddonDoc[]
  selected: SelectedExtra[]
  onChange: (next: SelectedExtra[]) => void
}) {
  const selectedMap = useMemo(() => {
    const m = new Map<string, SelectedExtra>()
    for (const s of props.selected) m.set(s.addonId, s)
    return m
  }, [props.selected])

  function setQty(addon: AddonDoc, nextQty: number) {
    const id = toId(addon.id)
    const max = Math.max(1, Number(addon.maxQuantity ?? 1))
    const qty = Math.max(0, Math.min(nextQty, max))

    const next = [...props.selected]
    const idx = next.findIndex((x) => x.addonId === id)

    if (qty === 0) {
      if (idx !== -1) next.splice(idx, 1)
      props.onChange(next)
      return
    }

    if (idx === -1) next.push({ addonId: id, quantity: qty })
    else next[idx] = { addonId: id, quantity: qty }

    props.onChange(next)
  }

  if (!props.availableAddons.length) return null

  return (
    <section aria-label="Dodatki" className="grid gap-2">
      <h3 className="text-sm font-medium">Dodatki</h3>

      <div className="grid gap-2">
        {props.availableAddons.map((a) => {
          const id = toId(a.id)
          const current = selectedMap.get(id)?.quantity ?? 0
          const max = Math.max(1, Number((a as any).maxQuantity ?? 1))

          return (
            <div key={id} className="flex items-center justify-between rounded-xl border bg-card px-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{a.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPLN(a.price)} {a.pricingType === 'perDay' ? '/ doba' : '/ rezerwacja'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => setQty(a, current - 1)}
                  disabled={current <= 0}
                  aria-label={`Zmniejsz ilość: ${a.name}`}
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <span className="w-6 text-center text-sm font-semibold tabular-nums">{current}</span>

                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => setQty(a, current + 1)}
                  disabled={current >= max}
                  aria-label={`Zwiększ ilość: ${a.name}`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
