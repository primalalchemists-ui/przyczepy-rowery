'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type Props = ImageProps & {
  fadeDurationMs?: number
}

export function FadeImage({ className, fadeDurationMs = 260, ...props }: Props) {
  const [loaded, setLoaded] = useState(false)

  return (
    <Image
      {...props}
      className={cn(
        'transition-opacity',
        loaded ? 'opacity-100' : 'opacity-0',
        className,
      )}
      style={{
        ...(props.style ?? {}),
        transitionDuration: `${fadeDurationMs}ms`,
      }}
      onLoad={(e) => {
        setLoaded(true)
        props.onLoad?.(e)
      }}
    />
  )
}
