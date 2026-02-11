'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'

type Props = {
  side: 'left' | 'right'
  src: string
  alt: string
  className?: string
}

export function HeroArt({ side, src, alt, className }: Props) {
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
