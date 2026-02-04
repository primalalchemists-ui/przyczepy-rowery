'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import type { TrailerDoc } from '@/lib/payload'
import { getTrailerImageUrl } from '@/lib/booking/utils'

export function TrailerCard(props: {
  trailer: TrailerDoc
  selected: boolean
  onSelect: () => void
}) {
  const img = getTrailerImageUrl(props.trailer)
  const price = Number((props.trailer as any)?.cena?.basePricePerNight ?? 0)

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Wybierz przyczepę: ${props.trailer.nazwa}`}

      aria-pressed={props.selected}
      onClick={(e) => {
        const el = e.target as HTMLElement
        if (el.closest('a,button')) return
        props.onSelect()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          props.onSelect()
        }
      }}
      className={[
        'rounded-xl border bg-card cursor-pointer',
        'transition-transform duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        props.selected ? '-translate-y-1 ring-1 ring-foreground/20 border-foreground/30' : 'hover:-translate-y-0.5',
      ].join(' ')}

    >
      <div className="overflow-hidden rounded-xl">
        <div className="aspect-[16/9] w-full bg-muted">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={props.trailer.nazwa} className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="grid gap-3 p-4">
          <div className="grid gap-1">
            <div className="text-base font-semibold leading-tight">{props.trailer.nazwa}</div>
            <div className="text-sm text-muted-foreground">
              {price > 0 ? `${price.toFixed(0)} zł / doba` : 'Cena ustalana indywidualnie'}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={props.onSelect}
              className={[
                'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs transition-colors',
                props.selected ? 'bg-foreground text-background' : 'bg-muted text-foreground hover:bg-muted/80',
              ].join(' ')}
              aria-label={props.selected ? 'Przyczepa wybrana' : 'Wybierz przyczepę'}
            >
              {props.selected ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Wybrano
                </>
              ) : (
                'Wybierz'
              )}
            </button>

            <Link className="text-sm font-medium underline underline-offset-4" href={`/przyczepy/${props.trailer.slug}`}>
              Szczegóły
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
