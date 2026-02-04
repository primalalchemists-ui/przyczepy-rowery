'use client'

import { useEffect, useRef, useState } from 'react'
import type { Availability, IsoRange } from './types'

export function useAvailability(params: {
  trailerId?: string
  range: IsoRange
  enabled?: boolean
  forceKey?: number
}) {
  const [data, setData] = useState<Availability>({ booked: [], unavailable: [] })
  const [loading, setLoading] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const lastKeyRef = useRef('')

  useEffect(() => {
    if (!params.enabled || !params.trailerId) {
      abortRef.current?.abort()
      abortRef.current = null
      lastKeyRef.current = ''
      setData({ booked: [], unavailable: [] })
      setLoading(false)
      return
    }

    // key do kontroli “starych” odpowiedzi (np. szybkie next/prev)
    const reqKey = `${params.trailerId}|${params.range.from}|${params.range.to}|${params.forceKey ?? 0}`
    lastKeyRef.current = reqKey

    // abort poprzedniego requestu
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    let alive = true

    ;(async () => {
      try {
        setLoading(true)

        const url = new URL('/api/availability', window.location.origin)
        url.searchParams.set('trailerId', params.trailerId!)
        url.searchParams.set('from', params.range.from)
        url.searchParams.set('to', params.range.to)

        const res = await fetch(url.toString(), {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-store',
        })

        if (!res.ok) return
        const json = (await res.json()) as Availability

        // jeśli w międzyczasie zmienił się key, ignorujemy
        if (!alive) return
        if (lastKeyRef.current !== reqKey) return

        setData({
          booked: json?.booked ?? [],
          unavailable: json?.unavailable ?? [],
        })
      } catch (e: any) {
        // abort = normalne, nie traktuj jako error
        if (e?.name === 'AbortError') return
      } finally {
        if (!alive) return
        if (lastKeyRef.current === reqKey) setLoading(false)
      }
    })()

    return () => {
      alive = false
      controller.abort()
    }
  }, [params.enabled, params.trailerId, params.range.from, params.range.to, params.forceKey])

  return { availability: data, loading }
}
