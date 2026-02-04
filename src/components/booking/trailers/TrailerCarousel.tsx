'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { TrailerDoc } from '@/lib/payload'
import { Button } from '@/components/ui/button'
import { toId } from '@/lib/booking/utils'
import { TrailerCard } from './TrailerCard'

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function TrailerCarousel(props: {
  trailers: TrailerDoc[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  const frameRef = useRef<HTMLDivElement | null>(null)
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [cardWidth, setCardWidth] = useState<number>(340)

  const GAP = 16 // gap-4
  const PEEK_MOBILE = 18 // ustaw 0 jeśli nie chcesz podglądu kolejnej karty
  const MIN_CARD = 280
  const MAX_CARD = 380

  const selectedIndex = useMemo(() => {
    const idx = props.trailers.findIndex((t) => toId(t.id) === props.selectedId)
    return Math.max(0, idx)
  }, [props.trailers, props.selectedId])

  function updateEdges() {
    const el = scrollerRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setIsOverflowing(max > 2)
    setCanLeft(el.scrollLeft > 2)
    setCanRight(el.scrollLeft < max - 2)
  }

  function scrollByCard(dir: 'left' | 'right') {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -(cardWidth + GAP) : cardWidth + GAP, behavior: 'smooth' })
  }

  // ✅ szerokość kart liczona z szerokości KOLUMNy (czyli dokładnie jak kalendarz)
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const ro = new ResizeObserver(() => {
      const w = frame.clientWidth
      const isMdUp = window.matchMedia('(min-width: 768px)').matches

      // w desktop/tablet chcemy 3/2/1 karty, ale UWAGA:
      // NIE odejmujemy strzałek, bo strzałki są NAD karuzelą, nie obok.
      const available = w

      let cardsPerView = 1
      if (available >= 980) cardsPerView = 3
      else if (available >= 640) cardsPerView = 2

      if (!isMdUp) {
        const target = available - PEEK_MOBILE
        setCardWidth(clamp(Math.floor(target), MIN_CARD, MAX_CARD))
        return
      }

      const computed = (available - GAP * (cardsPerView - 1)) / cardsPerView
      setCardWidth(clamp(Math.floor(computed), MIN_CARD, MAX_CARD))
    })

    ro.observe(frame)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    updateEdges()

    const onScroll = () => updateEdges()
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [cardWidth])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const child = el.children.item(selectedIndex) as HTMLElement | null
    if (!child) return
    child.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    setTimeout(updateEdges, 120)
  }, [selectedIndex])

  return (
    <section aria-label="Wybór przyczepy" className="grid gap-3">
      {/* ✅ KLUCZ: żadnego mx-auto i żadnego max-w[1100] -> bierze szerokość kolumny (jak kalendarz) */}
      <div ref={frameRef} className="w-full min-w-0">
        {/* ✅ STRZAŁKI NA GÓRZE */}
        <div className="flex items-center justify-between gap-3">
          {/* <h3 className="text-sm font-medium opacity-0">Wybierz przyczepę</h3> */}

          <div className="flex items-center gap-2 mb-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 cursor-pointer"
              onClick={() => scrollByCard('left')}
              aria-label="Przewiń listę przyczep w lewo"
              disabled={!isOverflowing || !canLeft}
            >
              <ChevronLeft className="h-4 w-4 cursor-pointer" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 cursor-pointer"
              onClick={() => scrollByCard('right')}
              aria-label="Przewiń listę przyczep w prawo"
              disabled={!isOverflowing || !canRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ✅ KARTY ZACZYNAJĄ OD LEWEJ i NIE WYCHODZĄ POZA KALENDARZ */}
        <div
          ref={scrollerRef}
          role="list"
          aria-label="Lista przyczep"
          className={[
            'no-scrollbar flex gap-4 overflow-x-auto overflow-y-visible py-2',
            'min-w-0 touch-pan-x overscroll-x-contain scroll-smooth',
            // żadnego centrowania – zawsze lewa krawędź
            'justify-start',
            // żeby pierwszy card nie przyklejał się do krawędzi na mobile:
            'px-1 sm:px-0',
          ].join(' ')}
          style={{
            scrollSnapType: 'x mandatory',
            scrollPaddingLeft: '12px',
            scrollPaddingRight: '12px',
          }}
        >
          {props.trailers.map((t) => {
            const id = toId(t.id)
            const selected = id === props.selectedId

            return (
              <div
                key={id}
                data-card
                role="listitem"
                className="shrink-0"
                style={{
                  width: `${cardWidth}px`,
                  scrollSnapAlign: 'start',
                }}
              >
                <TrailerCard trailer={t} selected={selected} onSelect={() => props.onSelect(id)} />
              </div>
            )
          })}
        </div>

        <style jsx>{`
          .no-scrollbar {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </section>
  )
}
