'use client'

import { motion, useReducedMotion } from 'framer-motion'

export function OfertaGridLoader(props: { count?: number }) {
  const reduce = useReducedMotion()
  const count = props.count ?? 6

  return (
    <div
      className="grid gap-4 md:grid-cols-3"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Sprawdzanie dostępności"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card overflow-hidden">
          {/* obrazek */}
          <div className="relative aspect-[16/9] bg-muted">
            <motion.div
              aria-hidden="true"
              className="absolute inset-0"
              initial={{ opacity: 0.5 }}
              animate={reduce ? { opacity: 0.5 } : { opacity: [0.35, 0.7, 0.35] }}
              transition={reduce ? undefined : { duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.03 }}
              style={{
                background:
                  'linear-gradient(90deg, rgba(0,0,0,0.04), rgba(0,0,0,0.10), rgba(0,0,0,0.04))',
              }}
            />
          </div>

          {/* treść */}
          <div className="p-4 grid gap-3">
            <div className="grid gap-2">
              <div className="h-4 w-4/5 rounded bg-muted" />
              <div className="h-3 w-2/5 rounded bg-muted" />
            </div>

            <div className="h-10 rounded bg-muted" />

            <div className="flex gap-2">
              <div className="h-9 w-1/2 rounded-md bg-muted" />
              <div className="h-9 w-1/2 rounded-md bg-muted" />
            </div>
          </div>
        </div>
      ))}

      <span className="sr-only">Sprawdzanie dostępności…</span>
    </div>
  )
}
