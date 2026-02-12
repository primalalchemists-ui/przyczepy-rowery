'use client'

import { motion, type MotionProps, useReducedMotion } from 'framer-motion'
import * as React from 'react'

export function MotionDiv(props: React.PropsWithChildren<MotionProps>) {
  return <motion.div {...props} />
}

export function useMotionSafe() {
  const reduce = useReducedMotion()
  return {
    reduce,
    // “bezpieczne” varianty (działają nawet przy reduced motion)
    fadeUp: (i = 0) => ({
      initial: reduce ? { opacity: 1 } : { opacity: 0, y: 10 },
      animate: reduce ? { opacity: 1 } : { opacity: 1, y: 0 },
      exit: reduce ? { opacity: 1 } : { opacity: 0, y: 6 },
      transition: { duration: 0.22, ease: 'easeOut', delay: reduce ? 0 : i * 0.03 },
    }),
  }
}
