'use client'

import * as React from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from 'lexical'

export type SpecRow = {
  label: string
  value: SerializedEditorState | unknown
}

type Props = {
  items?: SpecRow[] | null
}

const p = (text: string) =>
  ({
    root: {
      type: 'root',
      version: 1,
      children: [
        {
          type: 'paragraph',
          version: 1,
          children: [
            {
              type: 'text',
              version: 1,
              text,
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
    },
  }) as any

const PLACEHOLDER: SpecRow[] = [
  { label: 'Wymiary', value: p('Długość całkowita: 7.568 m • Wysokość: 2.641 m • Szerokość: 2.500 m') },
  { label: 'DMC', value: p('1600 kg') },
  { label: 'Miejsca', value: p('Miejsca do spania (dorośli/dzieci): min. 4') },
]

function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(' ')
}

export function ResourceSpecAccordion({ items }: Props) {
  const reduce = useReducedMotion()
  const list = items?.length ? items : PLACEHOLDER

  return (
    <section aria-labelledby="spec-heading" className="relative">
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-[oklch(95%_0.03_152deg)] blur-3xl opacity-45" />
        <div className="absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-[oklch(96.5%_0.006_250deg)] blur-3xl opacity-45" />
      </div>

      <div className="grid gap-4">
        <div className="grid gap-3">
          {list.map((it, idx) => (
            <SpecRowAccordion key={`${idx}-${it.label}`} item={it} index={idx} reduceMotion={reduce} />
          ))}
        </div>

        <p className="sr-only" aria-live="polite">
          Sekcja specyfikacji. Użyj klawisza Tab, aby przejść między pozycjami. Enter lub Spacja rozwija wartość.
        </p>
      </div>
    </section>
  )
}

function SpecRowAccordion({
  item,
  index,
  reduceMotion,
}: {
  item: SpecRow
  index: number
  reduceMotion: boolean
}) {
  const [open, setOpen] = React.useState(index === 0)
  const buttonId = `spec-q-${index}`
  const panelId = `spec-a-${index}`

  return (
    <div className={cx('relative overflow-hidden rounded-xl border', 'bg-white/70 shadow-sm backdrop-blur')}>
      <button
        id={buttonId}
        type="button"
        className={cx(
          'w-full',
          'min-h-[56px]',
          'px-4 py-3',
          'cursor-pointer',
          'flex items-center justify-between gap-3',
          'text-left',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex-1 text-left text-sm font-semibold tracking-tight">{item.label}</span>

        <motion.span
          aria-hidden="true"
          className="shrink-0 rounded-md p-2 text-foreground/70"
          animate={reduceMotion ? undefined : { rotate: open ? 45 : 0 }}
          transition={reduceMotion ? undefined : { duration: 0.18, ease: 'easeOut' }}
        >
          <Plus className="h-5 w-5" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="panel"
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={reduceMotion ? { opacity: 1 } : { height: 0, opacity: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={reduceMotion ? { duration: 0.01 } : { duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">
              <div className="text-sm leading-relaxed text-muted-foreground">
                <RichText data={item.value as SerializedEditorState} />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
