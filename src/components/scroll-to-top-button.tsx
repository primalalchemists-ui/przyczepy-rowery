'use client'

import { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'

type Props = {
  className?: string
}

export function ScrollToTopButton({ className }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const compute = () => {
      const y = window.scrollY || 0
      const doc = document.documentElement
      const canScroll = doc.scrollHeight - doc.clientHeight > 40 // jest realny scroll
      setVisible(canScroll && y > 120)
    }

    compute()
    window.addEventListener('scroll', compute, { passive: true })
    window.addEventListener('resize', compute)
    return () => {
      window.removeEventListener('scroll', compute)
      window.removeEventListener('resize', compute)
    }
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      aria-label="Przewiń do góry"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={
        className ??
        'cursor-pointer inline-flex h-10 w-10 items-center justify-center rounded-md transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
      }
    >
      <ChevronUp className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}
