'use client'

import { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'

type Props = {
  className?: string
}

export function ScrollToTopButton({ className }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      aria-label="Przewiń do góry"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={
        className ??
        'cursor-pointer inline-flex h-10 w-10 items-center justify-center rounded-md  transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
      }
    >
      <ChevronUp className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}
