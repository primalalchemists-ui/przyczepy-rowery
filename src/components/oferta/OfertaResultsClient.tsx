'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ResourceTileCard } from '@/components/resource-tile-card'
import { OfertaGridLoader } from '@/components/oferta/OfertaGridLoader'

type Props = {
  resources: any[]
  from?: string
  to?: string
  hasDateFilter: boolean
}

export function OfertaResultsClient({ resources, from, to, hasDateFilter }: Props) {
  const reduce = useReducedMotion()

  // ✅ cache dla AKTUALNEGO range
  const [availableIds, setAvailableIds] = React.useState<Set<string>>(new Set())
  const [knownIds, setKnownIds] = React.useState<Set<string>>(new Set())

  // loader tylko dla zmiany DAT
  const [loadingDates, setLoadingDates] = React.useState(false)
  // silent fetch przy type/sort
  const [loadingSilent, setLoadingSilent] = React.useState(false)

  const [error, setError] = React.useState<string | null>(null)

  const resourceIds = React.useMemo(() => {
    return resources.map((r) => String(r?.id)).filter(Boolean)
  }, [resources])

  const rangeKey = hasDateFilter && from && to ? `${from}|${to}` : ''
  const prevRangeRef = React.useRef<string>('')

  React.useEffect(() => {
    // reset jak nie ma dat
    if (!hasDateFilter || !from || !to) {
      prevRangeRef.current = ''
      setError(null)
      setLoadingDates(false)
      setLoadingSilent(false)
      setAvailableIds(new Set())
      setKnownIds(new Set())
      return
    }

    const rangeChanged = prevRangeRef.current !== rangeKey
    prevRangeRef.current = rangeKey

    const controller = new AbortController()
    let alive = true

    // ✅ przy zmianie dat: czyścimy cache i pokazujemy loader
    if (rangeChanged) {
      setError(null)
      setAvailableIds(new Set())
      setKnownIds(new Set())
      setLoadingDates(true)
      setLoadingSilent(false)
    } else {
      // ✅ przy type/sort: żadnego dużego loadera
      setLoadingSilent(true)
    }

    // liczymy tylko brakujące id dla tego range
    const currentKnown = rangeChanged ? new Set<string>() : new Set(knownIds)
    const missing = resourceIds.filter((id) => !currentKnown.has(id))

    // nic nowego do sprawdzenia
    if (missing.length === 0) {
      setLoadingDates(false)
      setLoadingSilent(false)
      return () => controller.abort()
    }

    const t = window.setTimeout(async () => {
      try {
        const res = await fetch('/api/availability/batch', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            resourceIds: missing,
            from,
            to,
          }),
          cache: 'no-store',
          signal: controller.signal,
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json().catch(() => null)
        const avail = new Set<string>(
          Array.isArray(data?.availableIds) ? data.availableIds.map(String) : [],
        )

        if (!alive) return

        // ✅ aktualizujemy known + available (merge)
        setKnownIds((prev) => {
          const next = new Set(prev)
          for (const id of missing) next.add(id)
          return next
        })

        setAvailableIds((prev) => {
          const next = new Set(prev)
          for (const id of avail) next.add(id)
          return next
        })
      } catch (e: any) {
        if (e?.name === 'AbortError') return
        if (!alive) return
        setError(String(e?.message ?? e))
        // ważne: nie oznaczamy missing jako known -> zostaną ukryte (bez flashowania)
      } finally {
        if (!alive) return
        setLoadingDates(false)
        setLoadingSilent(false)
      }
    }, 120)

    return () => {
      alive = false
      controller.abort()
      window.clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey, hasDateFilter, from, to, resourceIds.join(',')])

  const filtered = React.useMemo(() => {
    // bez dat -> pokazujemy wszystko
    if (!hasDateFilter || !from || !to) return resources

    // z datami -> pokazujemy TYLKO te, które:
    // 1) są już sprawdzone (known)
    // 2) i są dostępne (available)
    return resources.filter((r) => {
      const id = String(r?.id)
      return knownIds.has(id) && availableIds.has(id)
    })
  }, [resources, hasDateFilter, from, to, knownIds, availableIds])

  // ✅ UI
  if (!filtered.length) {
    // jeśli są daty i coś się jeszcze “dociąga” silent -> nie pokazuj “brak”, bo to mylące
    if (hasDateFilter && (loadingDates || loadingSilent)) {
      return <OfertaGridLoader count={6} />
    }

    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground" role="status" aria-live="polite">
          {hasDateFilter ? 'Brak dostępnych zasobów w wybranym terminie.' : 'Brak aktywnych zasobów w systemie.'}
        </CardContent>
      </Card>
    )
  }

  const listVariants = {
    hidden: {},
    show: { transition: reduce ? undefined : { staggerChildren: 0.05, delayChildren: 0.02 } },
  }

  return (
    <div className="space-y-3">
      {error ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Nie udało się sprawdzić dostępności dla części zasobów. ({error})
          </CardContent>
        </Card>
      ) : null}

      {/* ✅ loader tylko przy zmianie DAT */}
      {loadingDates ? <OfertaGridLoader count={6} /> : null}

      <motion.div
        variants={listVariants}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-3"
        role="list"
        aria-label="Lista zasobów"
      >
        <AnimatePresence initial={false}>
          {filtered.map((z: any, idx: number) => (
            <motion.div key={z.slug} role="listitem" layout>
              <ResourceTileCard zasob={z} index={idx} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
