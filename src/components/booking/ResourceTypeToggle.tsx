'use client'

import type { ResourceType } from '@/lib/payload'
import { Button } from '@/components/ui/button'

export function ResourceTypeToggle(props: {
  value: ResourceType
  onChange: (v: ResourceType) => void
  disabledPrzyczepa?: boolean
  disabledEbike?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={props.value === 'przyczepa' ? 'default' : 'outline'}
        className="h-9"
        onClick={() => props.onChange('przyczepa')}
        disabled={props.disabledPrzyczepa}
      >
        Przyczepy
      </Button>

      <Button
        type="button"
        variant={props.value === 'ebike' ? 'default' : 'outline'}
        className="h-9"
        onClick={() => props.onChange('ebike')}
        disabled={props.disabledEbike}
      >
        E-bike
      </Button>
    </div>
  )
}
