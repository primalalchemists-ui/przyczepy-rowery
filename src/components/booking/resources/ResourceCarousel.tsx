'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import type { ResourceDoc } from '@/lib/payload'
import { Button } from '@/components/ui/button'
import { toId } from '@/lib/booking/utils'
import { ResourceCard } from './ResourceCard'

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function ResourceCarousel(props: {
  resources: ResourceDoc[]
  selectedId: string
  onSelect: (id: string) => void
  ariaLabel?: string
}) {
  const resources = Array.isArray(props.resources) ? props.resources : []

  const frameRef = useRef<HTMLDivElement | null>(null)
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [cardWidth, setCardWidth] = useState<number>(340)

  const GAP = 16
  const PEEK_MOBILE = 18
  const MIN_CARD = 280
  const MAX_CARD = 380

  const selectedIndex = useMemo(() => {
    if (!resources.length) return 0
    const idx = resources.findIndex((r) => toId((r as any).id) === props.selectedId)
    return idx >= 0 ? idx : 0
  }, [resources, props.selectedId])

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

  // Responsywna szerokość karty
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const ro = new ResizeObserver(() => {
      const w = frame.clientWidth
      const isMdUp = window.matchMedia('(min-width: 768px)').matches
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

  // Edges / scroll state
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

  // Scroll do wybranego elementu
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const child = el.children.item(selectedIndex) as HTMLElement | null
    if (!child) return
    child.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    setTimeout(updateEdges, 120)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex])

  if (!resources.length) return null

  return (
    <section aria-label={props.ariaLabel ?? 'Wybór zasobu'} className="grid gap-3">
      <div ref={frameRef} className="w-full min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 mb-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 cursor-pointer"
              onClick={() => scrollByCard('left')}
              aria-label="Przewiń listę w lewo"
              disabled={!isOverflowing || !canLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 cursor-pointer"
              onClick={() => scrollByCard('right')}
              aria-label="Przewiń listę w prawo"
              disabled={!isOverflowing || !canRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          role="list"
          aria-label="Lista zasobów"
          className={[
            'no-scrollbar flex gap-4 overflow-x-auto overflow-y-visible py-2',
            'min-w-0 touch-pan-x overscroll-x-contain scroll-smooth',
            'justify-start px-1 sm:px-0',
          ].join(' ')}
          style={{
            scrollSnapType: 'x mandatory',
            scrollPaddingLeft: '12px',
            scrollPaddingRight: '12px',
          }}
        >
          {resources.map((r) => {
            const id = toId((r as any).id)
            const selected = id === props.selectedId

            return (
              <div
                key={id}
                role="listitem"
                className="shrink-0"
                style={{ width: `${cardWidth}px`, scrollSnapAlign: 'start' }}
              >
                <ResourceCard zasob={r} selected={selected} onSelect={() => props.onSelect(id)} />
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
