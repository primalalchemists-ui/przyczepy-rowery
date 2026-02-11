'use client'

import { useEffect, useRef, useState } from 'react'
import type { Availability, IsoRange } from './types'

export function useAvailability(params: {
  resourceId?: string
  range: IsoRange
  enabled?: boolean
  forceKey?: number
}) {
  const [data, setData] = useState<Availability>({ booked: [], unavailable: [], remainingByDay: {}, stock: 0 })
  const [loading, setLoading] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const lastKeyRef = useRef('')

  useEffect(() => {
    const id = params.resourceId

    if (!params.enabled || !id) {
      abortRef.current?.abort()
      abortRef.current = null
      lastKeyRef.current = ''
      setData({ booked: [], unavailable: [], remainingByDay: {}, stock: 0 })
      setLoading(false)
      return
    }

    const reqKey = `${id}|${params.range.from}|${params.range.to}|${params.forceKey ?? 0}`
    lastKeyRef.current = reqKey

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    let alive = true

    ;(async () => {
      try {
        setLoading(true)

        const url = new URL('/api/availability', window.location.origin)
        url.searchParams.set('resourceId', id)
        url.searchParams.set('from', params.range.from)
        url.searchParams.set('to', params.range.to)

        const res = await fetch(url.toString(), {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-store',
        })

        if (!res.ok) return
        const json = (await res.json()) as Availability

        if (!alive) return
        if (lastKeyRef.current !== reqKey) return

        setData({
          booked: json?.booked ?? [],
          unavailable: json?.unavailable ?? [],
          remainingByDay: json?.remainingByDay ?? {},
          stock: Number(json?.stock ?? 0),
        })
      } catch (e: any) {
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
  }, [params.enabled, params.resourceId, params.range.from, params.range.to, params.forceKey])

  return { availability: data, loading }
}
