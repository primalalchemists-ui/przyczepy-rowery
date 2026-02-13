'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

type MediaItem = {
  src: string
  type: 'image' | 'video'
  alt?: string
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

/**
 * VIRTUALIZED DESKTOP THUMBS
 * - fixed item height
 * - only render items in view (+overscan)
 */
function useVirtualList(opts: {
  count: number
  itemHeight: number
  overscan?: number
  ref: React.RefObject<HTMLElement | null>
}) {
  const { count, itemHeight, ref, overscan = 6 } = opts
  const [viewportH, setViewportH] = React.useState(0)
  const [scrollTop, setScrollTop] = React.useState(0)


  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    const onScroll = () => setScrollTop(el.scrollTop)
    el.addEventListener('scroll', onScroll, { passive: true })

    const ro = new ResizeObserver(() => setViewportH(el.clientHeight))
    ro.observe(el)

    setViewportH(el.clientHeight)
    setScrollTop(el.scrollTop)

    return () => {
      el.removeEventListener('scroll', onScroll)
      ro.disconnect()
    }
  }, [ref])

  const startIndex = clamp(Math.floor(scrollTop / itemHeight) - overscan, 0, Math.max(0, count - 1))
  const visibleCount = Math.ceil(viewportH / itemHeight) + overscan * 2
  const endIndex = clamp(startIndex + visibleCount, 0, count)

  const paddingTop = startIndex * itemHeight
  const paddingBottom = (count - endIndex) * itemHeight

  return { startIndex, endIndex, paddingTop, paddingBottom }
}

export function FullscreenGallery({
  items,
  startIndex,
  open,
  onOpenChange,
}: {
  items: MediaItem[]
  startIndex: number
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  /**
   * DEV HELPERS — simulate more thumbnails without adding media
   */
  let list = items
  const DEV_DUPLICATE_TIMES = 12
  if (process.env.NODE_ENV === 'development') {
    list = Array.from({ length: DEV_DUPLICATE_TIMES }).flatMap(() => items)
  }

  const safeStartIndex = React.useMemo(() => {
    if (!list.length) return 0
    return clamp(startIndex, 0, list.length - 1)
  }, [startIndex, list.length])

  const [index, setIndex] = React.useState(safeStartIndex)
  const [videoReady, setVideoReady] = React.useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = React.useState(false)
  const [isNarrow, setIsNarrow] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 409px)')
    const onChange = () => setIsNarrow(mq.matches)

    onChange()
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  const touchStartX = React.useRef<number | null>(null)
  const mainVideoRef = React.useRef<HTMLVideoElement | null>(null)

  // Desktop virtualization + keep active visible
  const desktopScrollRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    setIndex(safeStartIndex)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeStartIndex])

  React.useEffect(() => {
    setVideoReady(false)
    setIsVideoPlaying(false)
    if (mainVideoRef.current) {
      try {
        mainVideoRef.current.pause()
        mainVideoRef.current.currentTime = 0
      } catch {}
    }
  }, [index, open])

  const prev = React.useCallback(() => {
    setIndex((i) => (i - 1 + list.length) % list.length)
  }, [list.length])

  const next = React.useCallback(() => {
    setIndex((i) => (i + 1) % list.length)
  }, [list.length])

  const openAt = (i: number) => setIndex(i)

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev()
    touchStartX.current = null
  }

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, next, prev, onOpenChange])

  // Keep active thumb visible on desktop
  React.useEffect(() => {
    const el = desktopScrollRef.current
    if (!el) return
    const itemH = 92 // must match desktopItemHeight below
    const top = index * itemH
    const bottom = top + itemH
    if (top < el.scrollTop) el.scrollTop = top
    else if (bottom > el.scrollTop + el.clientHeight) el.scrollTop = bottom - el.clientHeight
  }, [index])

  if (!list.length) return null
  const current = list[index]

  const playVideo = async () => {
    const v = mainVideoRef.current
    if (!v) return
    try {
      await v.play()
      setIsVideoPlaying(true)
    } catch {
      setIsVideoPlaying(false)
    }
  }

  /**
   * Mobile/tablet thumbnails: max 4 (no scroll)
   */
  const mobileWindowSize = isNarrow ? 3 : 4

  const mobileStart = (() => {
    if (list.length <= mobileWindowSize) return 0
    const half = Math.floor(mobileWindowSize / 2)
    return clamp(index - half, 0, list.length - mobileWindowSize)
  })()
  const mobileSlice = list.slice(mobileStart, mobileStart + mobileWindowSize)

  /**
   * Desktop virtual list settings
   */
  const desktopItemHeight = 92 // px (button height + gap baked in via padding container)
  const v = useVirtualList({
    count: list.length,
    itemHeight: desktopItemHeight,
    overscan: 8,
    ref: desktopScrollRef,
  })

  // For motion: direction-aware slide (optional)
  const lastIndexRef = React.useRef(index)
  const direction = index >= lastIndexRef.current ? 1 : -1
  React.useEffect(() => {
    lastIndexRef.current = index
  }, [index])

  const mediaKey = `${current.type}:${current.src}:${index}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-screen p-0 bg-black text-white">
        <DialogTitle className="sr-only">Podgląd pełnoekranowy galerii</DialogTitle>
        <DialogDescription className="sr-only">
          Użyj strzałek klawiatury lub gestu przesunięcia, aby zmienić media. Escape zamyka.
        </DialogDescription>

        <div className="flex h-full w-full overflow-hidden">
          {/* DESKTOP thumbnails (left) — only on lg+ */}
          <div className="hidden lg:flex h-full w-44 shrink-0 border-r border-white/10 bg-black/30">
            <div
              ref={desktopScrollRef}
              className="h-full w-full overflow-y-auto p-3 gallery-scroll"
              aria-label="Miniatury"
            >

              <div style={{ paddingTop: v.paddingTop, paddingBottom: v.paddingBottom }}>
                <div className="flex flex-col gap-3">
                  {list.slice(v.startIndex, v.endIndex).map((item, localIdx) => {
                    const realIndex = v.startIndex + localIdx
                    const active = realIndex === index

                    return (
                      <motion.button
                        key={`${item.src}-${realIndex}`}
                        onClick={() => openAt(realIndex)}
                        className={cn(
                          'relative h-[80px] w-full overflow-hidden rounded-md border border-white/15 bg-black/40',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                          active && 'ring-2 ring-white'
                        )}
                        aria-label={`Otwórz media ${realIndex + 1}`}
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.12 }}
                      >
                        {item.type === 'image' ? (
                          <img
                            src={item.src}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <>
                            <video
                              src={item.src}
                              className="h-full w-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                            />
                            <span className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
                              <span className="rounded-full bg-black/55 p-2 ring-1 ring-white/20">
                                <Play className="h-4 w-4 fill-white" />
                              </span>
                            </span>
                          </>
                        )}

                        {/* Subtle active indicator */}
                        {active ? (
                          <motion.span
                            layoutId="activeThumb"
                            className="pointer-events-none absolute inset-0 ring-2 ring-white"
                            aria-hidden="true"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        ) : null}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Main stage */}
          <div className="relative flex-1 flex flex-col">
            <div
              className="relative flex-1 flex items-center justify-center"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {/* Animated media swap */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={mediaKey}
                  className="relative"
                  initial={{ opacity: 0, x: direction * 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -12 }}
                  transition={{ duration: 0.16 }}
                >
                  {current.type === 'image' ? (
                    <img
                      src={current.src}
                      alt={current.alt ?? ''}
                      className="max-h-[90vh] max-w-[100vw] lg:max-w-[95vw] object-contain"
                    />
                  ) : (
                    <div className="relative">
                      <video
                        ref={mainVideoRef}
                        src={current.src}
                        controls={isVideoPlaying}
                        className="max-h-[90vh] max-w-[100vw] lg:max-w-[95vw] object-contain"
                        playsInline
                        preload="metadata"
                        onLoadedMetadata={() => setVideoReady(true)}
                        onPlay={() => setIsVideoPlaying(true)}
                        onPause={() => setIsVideoPlaying(false)}
                      />

                      {!isVideoPlaying && (
                        <button
                          type="button"
                          onClick={playVideo}
                          className="absolute inset-0 grid place-items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                          aria-label="Odtwórz wideo"
                        >
                          <span className="rounded-full bg-black/55 p-4 ring-1 ring-white/25 backdrop-blur">
                            <Play className="h-8 w-8 fill-white" />
                          </span>
                          {!videoReady ? <span className="sr-only">Ładowanie wideo</span> : null}
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Desktop arrows — only lg+ (keep them stable, no layout shift) */}
              {list.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    className={cn(
                      'absolute top-1/2 -translate-y-1/2 hidden lg:flex',
                      'h-12 w-12 items-center justify-center rounded-full',
                      'bg-black/40 backdrop-blur ring-1 ring-white/15',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                      // keep away from edge a bit more
                      'left-10'
                    )}
                    aria-label="Poprzednie media"
                  >
                    <ChevronLeft size={32} />
                  </button>

                  <button
                    onClick={next}
                    className={cn(
                      'absolute top-1/2 -translate-y-1/2 hidden lg:flex',
                      'h-12 w-12 items-center justify-center rounded-full',
                      'bg-black/40 backdrop-blur ring-1 ring-white/15',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                      'right-10'
                    )}
                    aria-label="Następne media"
                  >
                    <ChevronRight size={32} />
                  </button>
                </>
              )}
            </div>

            {/* Mobile + tablet bottom bar — show up to lg */}
            {list.length > 1 ? (
              <div className="relative lg:hidden border-t border-white/10 bg-black/70 backdrop-blur">
                <div className="relative px-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] py-3">
                  {/* Controls pulled inward + fixed size (no shifting) */}
                  <button
                    onClick={prev}
                    className={cn(
                      'absolute top-1/2 -translate-y-1/2 z-10',
                      'h-11 w-11 rounded-full',
                      'bg-black/80 ring-1 ring-white/20',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                      // inward spacing
                      'left-3'
                    )}
                    aria-label="Poprzednie media"
                  >
                    <span className="grid place-items-center">
                      <ChevronLeft size={22} />
                    </span>
                  </button>

                  <div className="mx-14 flex items-center justify-center gap-2" aria-label="Miniatury">
                    {mobileSlice.map((item, localIdx) => {
                      const realIndex = mobileStart + localIdx
                      const active = realIndex === index
                      return (
                        <button
                          key={`${item.src}-${realIndex}`}
                          type="button"
                          onClick={() => openAt(realIndex)}
                          className={cn(
                            'relative h-14 w-16 shrink-0 overflow-hidden rounded border border-white/15',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                            active && 'ring-2 ring-white'
                          )}
                          aria-label={`Otwórz media ${realIndex + 1}`}
                        >
                          {item.type === 'image' ? (
                            <img
                              src={item.src}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <>
                              <video
                                src={item.src}
                                className="h-full w-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
                              />
                              <span className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
                                <span className="rounded-full bg-black/55 p-1.5 ring-1 ring-white/20">
                                  <Play className="h-3.5 w-3.5 fill-white" />
                                </span>
                              </span>
                            </>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={next}
                    className={cn(
                      'absolute top-1/2 -translate-y-1/2 z-10',
                      'h-11 w-11 rounded-full',
                      'bg-black/80 ring-1 ring-white/20',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                      'right-3'
                    )}
                    aria-label="Następne media"
                  >
                    <span className="grid place-items-center">
                      <ChevronRight size={22} />
                    </span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Nie dodajemy własnego X — DialogContent ma swój */}
      </DialogContent>
    </Dialog>
  )
}
