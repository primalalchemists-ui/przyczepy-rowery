'use client'

import Image from 'next/image'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

type HeroArtProps = {
  side: 'left' | 'right'
  src: string
  alt: string
  className?: string
}

export function HeroArt({ side, src, alt, className }: HeroArtProps) {
  const reduceMotion = useReducedMotion()
  const fromX = side === 'left' ? -40 : 40

  const motionProps = reduceMotion
    ? {}
    : {
        initial: { x: fromX, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        transition: { duration: 0.6, ease: 'easeOut' as const },
      }

  return (
    <motion.div aria-hidden={alt === '' ? 'true' : undefined} className={className} {...(motionProps as any)}>
      <Image
        src={src}
        alt={alt}
        width={900}
        height={600}
        priority
        className="h-auto w-full drop-shadow-[0_24px_34px_rgba(0,0,0,0.18)]"
      />
    </motion.div>
  )
}

type HeroCarouselArtProps = {
  side: 'left' | 'right'
  images: string[]
  alt: string
  className?: string
  intervalMs?: number

  /** 'cover' -> jak przyczepy (kadr), 'contain' -> jak produkt (rower) */
  fit?: 'cover' | 'contain'

  /** wysokość wrappera (żeby nie skakało). dla ebike daj mniejszą */
  heightClassName?: string

  /** czy dawać tło pod obrazem (przyczepy tak, rowery nie) */
  withBg?: boolean
}

export function HeroCarouselArt({
  side,
  images,
  alt,
  className,
  intervalMs = 2000,
  fit = 'cover',
  heightClassName,
  withBg = true,
}: HeroCarouselArtProps) {
  const reduceMotion = useReducedMotion()

  const safeImages = useMemo(() => images.filter(Boolean), [images])
  const [index, setIndex] = useState(0)

  // preload
  useEffect(() => {
    if (typeof window === 'undefined') return
    safeImages.forEach((src) => {
      const img = new window.Image()
      img.src = src
    })
  }, [safeImages])

  // autoplay
  useEffect(() => {
    if (safeImages.length <= 1) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % safeImages.length)
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [safeImages.length, intervalMs])

  const currentSrc = safeImages[index] ?? safeImages[0]

  const wrapperHeight =
    heightClassName ?? (fit === 'cover' ? 'h-[220px] md:h-[320px]' : 'h-[240px] md:h-[260px]')

  return (
    <div
      aria-hidden={alt === '' ? 'true' : undefined}
      className={[
        'relative w-full overflow-hidden',
        withBg ? 'bg-[oklch(97%_0_0)]' : 'bg-transparent',
        wrapperHeight,
        className ?? '',
      ].join(' ')}
    >
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={currentSrc}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduceMotion ? undefined : { duration: 0.22, ease: 'easeOut' }}
        >
          <Image
            src={currentSrc}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 560px"
            priority={index === 0}
            className={fit === 'cover' ? 'object-cover' : 'object-contain'}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
