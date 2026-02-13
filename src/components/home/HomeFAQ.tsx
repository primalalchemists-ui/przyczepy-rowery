'use client'

import * as React from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Plus } from 'lucide-react'
import type { FaqItem } from '@/lib/payload'

type Props = {
  items?: FaqItem[] | null
}

const PLACEHOLDER: FaqItem[] = [
  {
    question: 'Jak wygląda proces rezerwacji?',
    answer: 'Wybierz ofertę, podaj termin, opłać rezerwację i dostaniesz potwierdzenie e-mail.',
    order: 1,
  },
  {
    question: 'Czy potrzebuję kaucji lub zaliczki?',
    answer: 'To zależy od ustawień rezerwacji. Szczegóły zobaczysz w podsumowaniu przed płatnością.',
    order: 2,
  },
  {
    question: 'Czy mogę anulować rezerwację?',
    answer: 'Tak. Warunki anulacji zależą od regulaminu — możesz pobrać dokument w sekcji rezerwacji.',
    order: 3,
  },
]

function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(' ')
}

export function HomeFAQ({ items }: Props) {
  const reduce = useReducedMotion()
  const list = (items?.length ? items : PLACEHOLDER)
    .slice()
    .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))

  return (
    <section aria-labelledby="faq-heading">
      <div className="relative overflow-hidden  bg-white/70  backdrop-blur">
        {/* delikatne tło jak reszta strony */}
        <div aria-hidden="true" className="absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-[oklch(95%_0.03_152deg)] blur-3xl opacity-45" />
          <div className="absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-[oklch(96.5%_0.006_250deg)] blur-3xl opacity-45" />
        </div>

        <div className="relative z-10 p-5 md:p-6">
          <header className="mx-auto max-w-3xl text-center">
            <h2 id="faq-heading" className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
              FAQ
            </h2>
            <p className="mt-2 text-sm text-foreground/70 md:text-base">
              Najczęstsze pytania — krótko i jasno.
            </p>
          </header>

          <div className="mx-auto mt-6 max-w-3xl">
            <div className="divide-y divide-border/60 rounded-xl border bg-white/60">
              {list.map((it, idx) => (
                <FaqRow key={`${idx}-${it.question}`} item={it} index={idx} reduceMotion={reduce} />
              ))}
            </div>

            {/* SR-only info dla screen readerów */}
            <p className="sr-only" aria-live="polite">
              Sekcja FAQ. Użyj klawisza Tab, aby przejść między pytaniami. Enter lub Spacja rozwija odpowiedź.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function FaqRow({
  item,
  index,
  reduceMotion,
}: {
  item: FaqItem
  index: number
  reduceMotion: boolean
}) {
  const [open, setOpen] = React.useState(false)

  const buttonId = `faq-q-${index}`
  const panelId = `faq-a-${index}`

  return (
    <div className="px-3 md:px-4">
      <button
        id={buttonId}
        type="button"
        className={cx(
          'w-full',
          'min-h-[56px]',
          'py-3',
          'cursor-pointer',
          'flex items-center justify-between gap-3',
          'text-left',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {/* ✅ pytanie na środku */}
        <span className="flex-1 text-left text-sm font-semibold tracking-tight md:text-base">
          {item.question}
        </span>

        {/* ✅ plusik po prawej, obrót przy otwarciu */}
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
            <div className="pb-4 pt-1">
              <p className="text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
