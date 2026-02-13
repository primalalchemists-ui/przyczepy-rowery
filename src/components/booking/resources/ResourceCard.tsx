'use client'

import * as React from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import type { ResourceDoc } from '@/lib/payload'
import { getResourceImageUrl } from '@/lib/booking/utils'
import { formatPLN } from '@/lib/utils'
import { MotionDiv, useMotionSafe } from '@/components/motion/MotionSafe'
import { MotionImage } from '@/components/motion/MotionImage'

function unitLabel(u?: string) {
  if (u === 'dzien') return 'dzień'
  return 'noc'
}

export function ResourceCard(props: {
  zasob: ResourceDoc
  selected: boolean
  onSelect: () => void
  index?: number
}) {
  const { fadeUp } = useMotionSafe()
  const idx = props.index ?? 0

  const img = getResourceImageUrl(props.zasob)
  const basePrice = Number((props.zasob as any)?.cena?.basePrice ?? 0)
  const jednostka = String((props.zasob as any)?.cena?.jednostka ?? 'noc')
  const unit = unitLabel(jednostka)

  return (
    <MotionDiv {...fadeUp(idx)}>
      <div
        role="button"
        tabIndex={0}
        aria-label={`Wybierz: ${props.zasob.nazwa}`}
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
          // ✅ group => tooltip na hover i focus-within
          'group rounded-xl border bg-card cursor-pointer',
          'transition-transform duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          props.selected
            ? '-translate-y-1 ring-1 ring-foreground/20 border-foreground/30'
            : 'hover:-translate-y-0.5',
        ].join(' ')}
      >
        <div className="overflow-hidden rounded-xl">
          <div className="relative aspect-[16/9] w-full bg-muted">
            {img ? (
              <MotionImage
                src={img}
                alt={props.zasob.nazwa}
                fill
                sizes="(max-width: 768px) 100vw, 420px"
                className="object-cover"
                priority={idx < 2}
              />
            ) : null}
          </div>

          <div className="grid gap-3 p-4">
            <div className="grid gap-1">
              {/* ✅ stała wysokość tytułu (2 linie) + tooltip gdy ucięte */}
              <TitleWithTooltip text={props.zasob.nazwa} />

              <div className="text-sm text-muted-foreground">
                {basePrice > 0 ? `${formatPLN(basePrice)} / ${unit}` : 'Cena ustalana indywidualnie'}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={props.onSelect}
                className={[
                  'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs transition-colors',
                  props.selected
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-foreground hover:bg-muted/80',
                ].join(' ')}
                aria-label={props.selected ? 'Wybrano' : 'Wybierz'}
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

              <Link
                className="text-sm font-medium underline underline-offset-4"
                href={`/oferta/${props.zasob.slug}`}
              >
                Szczegóły
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MotionDiv>
  )
}

function TitleWithTooltip({ text }: { text: string }) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [truncated, setTruncated] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    const check = () => {
      setTruncated(el.scrollHeight > el.clientHeight + 1)
    }

    check()

    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [text])

  return (
    <div className="relative">
      <div
        ref={ref}
        className={[
          // ✅ 2 linie max + stała wysokość, żeby karty były równe
          'text-base font-semibold leading-tight',
          'line-clamp-2',
          'min-h-[2.5rem]',
        ].join(' ')}
        // pomocniczo dla czytników, jeśli ucięte
        aria-label={truncated ? text : undefined}
      >
        {text}
      </div>

      {truncated ? (
        <div
          role="tooltip"
          className={[
            'pointer-events-none',
            'absolute left-0 top-full z-20 mt-2',
            'w-max max-w-[min(520px,calc(100vw-2rem))]',
            'rounded-md border bg-background px-3 py-2 text-xs text-foreground shadow',
            'opacity-0 translate-y-1',
            // ✅ hover i klawiatura (focus w obrębie karty)
            'group-hover:opacity-100 group-hover:translate-y-0',
            'group-focus-within:opacity-100 group-focus-within:translate-y-0',
          ].join(' ')}
        >
          {text}
        </div>
      ) : null}
    </div>
  )
}
