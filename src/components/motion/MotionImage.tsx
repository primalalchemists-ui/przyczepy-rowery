'use client'

import Image, { type ImageProps } from 'next/image'
import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

type Props = Omit<ImageProps, 'onLoad'> & {
  className?: string
}

export function MotionImage(props: Props) {
  const reduce = useReducedMotion()
  const [loaded, setLoaded] = React.useState(false)

  return (
    <div className="relative h-full w-full">
      {/* Skeleton overlay */}
      <div
        aria-hidden="true"
        className={[
          'absolute inset-0 bg-muted',
          'transition-opacity duration-300',
          loaded ? 'opacity-0' : 'opacity-100',
        ].join(' ')}
      />

      <motion.div
        initial={reduce ? { opacity: 1 } : { opacity: 0 }}
        animate={reduce ? { opacity: 1 } : { opacity: loaded ? 1 : 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="absolute inset-0"
      >
        <Image
          {...props}
          className={props.className}
          onLoad={() => setLoaded(true)}
        />
      </motion.div>
    </div>
  )
}
